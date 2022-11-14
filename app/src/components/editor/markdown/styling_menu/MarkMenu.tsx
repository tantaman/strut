import React from "react";
import AuthoringState from "../../../../domain/ephemeral/AuthoringState";
import headerStyles from "../../../header/HeaderButton.module.css";

const marks = [
  {
    type: "bold",
    iconClass: "bi-type-bold",
    cmd: (editor: undefined) => {},
  },
  {
    type: "italic",
    iconClass: "bi-type-italic",
    cmd: (editor: undefined) => {},
  },
  {
    type: "underline",
    iconClass: "bi-type-underline",
    cmd: (editor: undefined) => {},
  },
  {
    type: "strike",
    iconClass: "bi-type-strikethrough",
    cmd: (editor: undefined) => {},
  },
  {
    type: "code",
    iconClass: "bi-code-slash",
    cmd: (editor: undefined) => {},
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
  editor: any;
  cmd: (e: undefined) => void;
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
