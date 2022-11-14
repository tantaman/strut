import { $getRoot, $getSelection, EditorState } from "lexical";
import { memo, useEffect } from "react";
import React from "react";

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

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: EditorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    // TODO: queue events to:
    // 1. persist to text component
  });
}

function onError(error: any) {
  throw error;
}

function TextEditorBase({
  text,
  x,
  y,
}: {
  text: string;
  x: number;
  y: number;
}) {
  const editorConfig = {
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
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={styles.root} style={{ top: y, left: x }}>
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
        <div className={styles.cover}></div>
      </div>
    </LexicalComposer>
  );
}

// TODO: round off x,y so we can compare stably
const TextEditor = memo(TextEditorBase);
export default TextEditor;

// https://codesandbox.io/s/lexical-rich-text-example-5tncvy?file=/src/Editor.js:1381-1759
