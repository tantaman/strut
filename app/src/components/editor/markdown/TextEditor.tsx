import {
  $getRoot,
  $getSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  EditorState,
  FOCUS_COMMAND,
} from "lexical";
import { memo, useCallback, useEffect, useState } from "react";
import React from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
// import ListMaxIndentLevelPlugin from "./plugins/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import ExampleTheme from "./themes/ExampleTheme";
import styles from "./TextEditor.module.css";
import { throttle } from "throttle-debounce";
import { TextComponent } from "../../../domain/schema";
import { ID_of } from "@vlcn.io/id";
import mutations from "../../../domain/mutations";
import { Ctx } from "../../../hooks";

const persitText = throttle(
  100,
  (ctx: Ctx, markdown: string, componentId: ID_of<TextComponent>) => {
    return mutations.saveText(ctx, markdown, componentId);
  },
  {
    noLeading: true,
  }
);

const persistDrag = throttle(
  100,
  (ctx: Ctx, x: number, y: number, componentId: ID_of<TextComponent>) => {
    return mutations.saveDrag(ctx, "text_component", componentId, x, y);
  },
  {
    noLeading: true,
  }
);

function onError(error: any) {
  throw error;
}

// function UnfocusPlugin() {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Focus the editor when the effect fires!
//     editor.blur();
//   }, [editor]);

//   return null;
// }

const useEditorHasFocus = () => {
  const [editor] = useLexicalComposerContext();
  // Possibly use useRef for synchronous updates but no re-rendering effect
  const [hasFocus, setFocus] = useState(false);

  useEffect(
    () =>
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setFocus(false);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    []
  );

  useEffect(
    () =>
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setFocus(true);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    []
  );

  return hasFocus;
};

function TextEditorBase({
  id,
  text,
  x,
  y,
  scale,
  ctx,
}: {
  id: ID_of<TextComponent>;
  text: string;
  x: number;
  y: number;
  scale: number;
  ctx: Ctx;
}) {
  const [config, setConfig] = useState(
    () =>
      ({
        namespace: "TextComponentEditor",
        theme: ExampleTheme,
        onError,
        editorState: () => $convertFromMarkdownString(text, TRANSFORMERS),
        nodes: [
          HeadingNode,
          ListNode,
          ListItemNode,
          QuoteNode,
          CodeNode,
          CodeHighlightNode,
          TableNode,
          TableCellNode,
          TableRowNode,
          AutoLinkNode,
          LinkNode,
        ],
      } as const)
  );

  return (
    <LexicalComposer initialConfig={config}>
      <TextEditorInner ctx={ctx} id={id} x={x} y={y} scale={scale} />
    </LexicalComposer>
  );
}

function TextEditorInner({
  id,
  x,
  y,
  scale,
  ctx,
}: {
  id: ID_of<TextComponent>;
  x: number;
  y: number;
  scale: number;
  ctx: Ctx;
}) {
  const [editor] = useLexicalComposerContext();
  const hasFocus = useEditorHasFocus();
  const [editing, setEditing] = useState(hasFocus);
  const dblClicked = () => editor.focus(() => setEditing(true));

  const onChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        persitText(ctx, $convertToMarkdownString(TRANSFORMERS), id);
      });
    },
    [id]
  );

  const onDragged = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      persistDrag(ctx, data.x, data.y, id);
    },
    [id]
  );

  if (!hasFocus && editing) {
    setEditing(false);
  }
  return (
    <Draggable
      defaultPosition={{
        x,
        y,
      }}
      onDrag={onDragged}
      scale={scale}
      disabled={editing}
    >
      <div className={styles.root}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className={styles.contentEditable} />
          }
          placeholder={<div className={styles.editor_placeholder}></div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <CodeHighlightPlugin />
        <AutoLinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        {editing ? null : (
          <div className={styles.cover} onDoubleClick={dblClicked}></div>
        )}
      </div>
    </Draggable>
  );
}

// TODO: round off x,y so we can compare stably
const TextEditor = memo(TextEditorBase);
export default TextEditor;

// https://codesandbox.io/s/lexical-rich-text-example-5tncvy?file=/src/Editor.js:1381-1759
