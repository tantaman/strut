import React, { memo, useEffect, useRef } from "react";
import * as styles from "./MarkdownEditor.module.css";
import "styles/components/ProseMirror.css";
import logger from "../../../logger/Log";
import { Deck, Markdown, Slide, Theme } from "../../../domain/schema";
import { useDebounce } from "../../../widgets/Hooks";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Editor, Extension } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { AppState } from "../../../domain/schema";
import { first, useBind, useQuery } from "../../../hooks";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
// @ts-ignore - lowlight exports bad types.
import { lowlight } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import suggestions from "./slash-links/suggestions";
import SlashLinkExtension from "./slash-links/SlashLinkExtension";
import queries from "../../../domain/queries";
import config from "../../../config";
import mutations from "../../../domain/mutations";
import { Transaction } from "prosemirror-state";
import fns from "../../../domain/fns";

// TODO: should we make sure this never gets unmounted? Only ever hidden?
// TODO: should we use a portal instead? And use an element we can take offscreen
// for the editor?
function MarkdownEditor({
  slide,
  appState,
  deck,
}: {
  slide: Slide;
  appState: AppState;
  deck: Deck;
}) {
  useBind(["authoringState"], appState);
  const previewTheme = appState.previewTheme;
  const theme = first(
    useQuery<Theme>(
      ...queries.theme(appState.ctx, deck.theme_id || config.defaultThemeId)
    ).data
  );
  const markdown = first(
    useQuery<Markdown>(...queries.markdown(appState.ctx, slide.id)).data
  );

  useBind(["fg_colorset"], previewTheme);
  // TODO fallback in case theme was deleted and is thus dangling...
  useBind(["fg_colorset"], theme);

  const state = appState.authoringState;
  const slideRef = useRef<Slide>(slide);
  const persistToSlide = useDebounce((editor: Editor) => {
    logger.debug("set content debounced");
    mutations.persistMarkdownToSlide(
      appState.ctx,
      slide.id,
      editor.getHTML() || ""
    );
  }, 250);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      SlashLinkExtension.configure({
        HTMLAttributes: {
          class: "slash-link",
        },
        // TODO:
        // @ts-ignore
        suggestion: suggestions(),
      }),
      OpenOpenType.configure({
        appState,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: markdown?.content || "",
    onCreate: ({ editor }: { editor: Editor }) => state.updateEditor(editor),
    onUpdate: ({ editor }: { editor: Editor }) => {
      persistToSlide(editor);
    },
    onTransaction: ({
      editor,
      transaction,
    }: {
      editor: Editor;
      transaction: Transaction;
    }) => {
      state.updateTransaction(transaction);
    },
  });

  useEffect(() => {
    if (slideRef.current != slide) {
      slideRef.current = slide;
    } else {
      return;
    }

    console.log("Slide and thus content change");
    editor?.commands.setContent(markdown?.content || "");
  }, [slide]);

  return (
    <div className={styles.root}>
      <EditorContent
        editor={editor}
        className="markdown"
        style={getColorStyle(fns.getTextColorStyle(previewTheme, theme))}
      />
    </div>
  );
}

let cachedStyle: { color?: string } | null = null;
function getColorStyle(color: string | undefined): { color?: string } {
  if (cachedStyle && cachedStyle.color === color) {
    return cachedStyle;
  }

  cachedStyle = { color };
  return cachedStyle;
}

const OpenOpenType = Extension.create<{ appState: AppState }>({
  name: "openOpenType",

  addKeyboardShortcuts() {
    return {
      "Mod-p": () => {
        this.options.appState.toggleOpenType();
        return true;
      },
    };
  },
});

const memoized = memo(MarkdownEditor);

export default memoized;
