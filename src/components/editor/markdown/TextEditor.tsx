import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  EditorState,
  FOCUS_COMMAND,
} from "lexical";
import {
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
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
import AutoLinkPlugin from "./plugins/AutolinkPlugin";
import ExampleTheme from "./themes/ExampleTheme";
import styles from "./TextEditor.module.css";
import { throttle } from "throttle-debounce";
import { AnyComponentID, Slide, TextComponent } from "../../../domain/schema";
import mutations from "../../../domain/mutations";
import { CtxAsync as Ctx } from "@vlcn.io/react";
import { IID_of } from "../../../id";
import queries from "../../../domain/queries";

const persistText = throttle(
  100,
  (ctx: Ctx, markdown: string, componentId: IID_of<TextComponent>) => {
    return mutations.saveText(ctx.db, markdown, componentId);
  },
  {
    noLeading: true,
  }
);

const persistDrag = throttle(
  100,
  (
    ctx: Ctx,
    x: number,
    y: number,
    componentId: IID_of<TextComponent>,
    ignore: Set<string>
  ) => {
    ignore.add(x.toFixed(1) + y.toFixed(1));
    return mutations.saveDrag(ctx.db, "text_component", componentId, x, y);
  },
  {
    noLeading: true,
  }
);

function onError(error: any) {
  throw error;
}

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
          editor.setEditable(false);
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
          editor.setEditable(true);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    []
  );

  return hasFocus;
};

function TextEditorOuter(props: {
  id: IID_of<TextComponent>;
  index: number;
  scale: number;
  ctx: Ctx;
  selectedComponents: Set<AnyComponentID>;
}) {
  const { id, index, scale, ctx, selectedComponents } = props;
  const c = queries.textComponent(ctx, id).data;

  if (c == null) {
    return null;
  }

  return (
    <TextEditorBase
      c={c}
      id={id}
      index={index}
      scale={scale}
      ctx={ctx}
      selectedComponents={selectedComponents}
    />
  );
}

function TextEditorBase({
  id,
  index,
  scale,
  ctx,
  c,
  selectedComponents,
}: {
  id: IID_of<TextComponent>;
  index: number;
  scale: number;
  ctx: Ctx;
  c: TextComponent;
  selectedComponents: Set<AnyComponentID>;
}) {
  const text = c.text || "Text";
  const x = c.x == null ? index * 10 : c.x;
  const y = c.y == null ? index * 10 : c.y;
  const [config, _setConfig] = useState<InitialConfigType>(
    () =>
      ({
        namespace: "TextComponentEditor",
        theme: ExampleTheme,
        onError,
        editable: false,
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
      <TextEditorInner
        ctx={ctx}
        id={id}
        x={x}
        y={y}
        slideId={c.slide_id}
        text={text}
        scale={scale}
        selectedComponents={selectedComponents}
      />
    </LexicalComposer>
  );
}

function TextEditorInner({
  id,
  scale,
  ctx,
  text,
  x,
  y,
  selectedComponents,
  slideId,
}: {
  id: IID_of<TextComponent>;
  text: string;
  x: number;
  y: number;
  scale: number;
  ctx: Ctx;
  selectedComponents: Set<AnyComponentID>;
  slideId: IID_of<Slide>;
}) {
  const [editor] = useLexicalComposerContext();
  const hasFocus = useEditorHasFocus();
  const ignore = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  // const [editing, setEditing] = useState(hasFocus);
  const dblClicked = () => {
    editor.setEditable(true);
    editor.focus();
  };
  const onSelect = () => {
    return mutations.selectComponent(ctx.db, slideId, id, "text");
  };

  const onChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        persistText(ctx, $convertToMarkdownString(TRANSFORMERS), id);
      });
    },
    [id]
  );

  const [prevX, setPrevX] = useState(x);
  const [prevY, setPrevY] = useState(y);
  const [prevText, setPrevText] = useState(text);
  const [dragging, setDragging] = useState(false);
  const [currPos, setCurrPos] = useState<{ x: number; y: number }>({
    x: ((x * 100) | 0) / 100,
    y: ((y * 100) | 0) / 100,
  });

  // TODO: abstract throttling of updates and ignoring while moving into a hook.
  if (
    (prevX != x || prevY != y) &&
    !dragging &&
    !ignore.current.has(x.toFixed(1) + y.toFixed(1))
  ) {
    setPrevX(x);
    setPrevY(y);
    setCurrPos({
      x,
      y,
    });
  }
  if (prevText != text && !hasFocus) {
    setPrevText(text);
    editor.update(() => {
      $convertFromMarkdownString(text, TRANSFORMERS);
    });

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mutations.setTextComponentSize(ctx.db, id, rect.width, rect.height);
    }
  }

  const onDragged = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      setCurrPos({
        x: data.x,
        y: data.y,
      });
      persistDrag(ctx, data.x, data.y, id, ignore.current);
    },
    [id]
  );

  const onDragStart = useCallback(() => {
    ignore.current.clear();
    setDragging(true);
  }, []);
  const onDragStop = useCallback(() => {
    setDragging(false);
  }, []);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Backspace" && !editor.isEditable()) {
      // delete the thing
      return mutations.removeSelectedComponents(ctx.db, slideId);
    }
  };

  return (
    <Draggable
      position={currPos}
      onStart={onDragStart}
      onDrag={onDragged}
      onStop={onDragStop}
      scale={scale}
      disabled={hasFocus}
    >
      <div
        className={styles.root}
        ref={containerRef}
        onKeyDown={onKeyDown}
        tabIndex={1}
      >
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
        {hasFocus ? null : (
          <div
            className={
              styles.cover +
              " " +
              (selectedComponents.has(id) ? styles.selected : "")
            }
            onMouseDown={onSelect}
            onDoubleClick={dblClicked}
          ></div>
        )}
      </div>
    </Draggable>
  );
}

// TODO: round off x,y so we can compare stably
const TextEditor = memo(TextEditorOuter);
export default TextEditor;

// https://codesandbox.io/s/lexical-rich-text-example-5tncvy?file=/src/Editor.js:1381-1759
