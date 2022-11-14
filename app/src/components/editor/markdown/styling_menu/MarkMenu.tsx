import { Editor } from "@tiptap/core";
import React from "react";
import AuthoringState from "../../../../domain/ephemeral/AuthoringState";
import headerStyles from "../../../header/HeaderButton.module.css";

const marks = [
  {
    type: "bold",
    iconClass: "bi-type-bold",
    cmd: (editor: Editor | undefined) =>
      editor?.chain().focus().toggleBold().run(),
  },
  {
    type: "italic",
    iconClass: "bi-type-italic",
    cmd: (editor: Editor | undefined) =>
      editor?.chain().focus().toggleItalic().run(),
  },
  {
    type: "underline",
    iconClass: "bi-type-underline",
    cmd: (editor: Editor | undefined) =>
      editor?.chain().focus().toggleUnderline().run(),
  },
  {
    type: "strike",
    iconClass: "bi-type-strikethrough",
    cmd: (editor: Editor | undefined) =>
      editor?.chain().focus().toggleStrike().run(),
  },
  {
    type: "code",
    iconClass: "bi-code-slash",
    cmd: (editor: Editor | undefined) =>
      editor?.chain().focus().toggleCode().run(),
  },
];

function MarkItem({
  type,
  iconClass,
  editor,
  cmd,
}: {
  type: string;
  iconClass: string;
  editor: Editor | undefined;
  cmd: (e: Editor | undefined) => void;
}) {
  return (
    <button
      className={
        "btn btn-outline-warning " + (editor?.isActive(type) ? "active" : "")
      }
      type="button"
      aria-expanded="false"
      onClick={(e) => {
        cmd(editor);
        e.preventDefault();
        return false;
      }}
    >
      <i className={"bi " + iconClass + " " + headerStyles.icon}></i>
    </button>
  );
}

export default function MarkMenu({ state }: { state: AuthoringState }) {
  // useQuery(["transaction"], state);
  // useBind
  return (
    <>
      {marks.map((m, i) => (
        <MarkItem
          editor={state.editor}
          type={m.type}
          iconClass={m.iconClass}
          cmd={m.cmd}
          key={i}
        />
      ))}
    </>
  );
}
