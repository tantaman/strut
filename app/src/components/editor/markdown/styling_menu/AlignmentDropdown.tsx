import React from "react";
import Button from "../../../../widgets/Button";
import DropdownButton from "../../../../widgets/DropdownButton";
import AuthoringState from "../../../../domain/ephemeral/AuthoringState";
const Options = DropdownButton.Options;
import * as headerStyles from "../../../header/HeaderButton.module.css";
import DropdownItem from "./DropdownItem";
import shorten from "./shorten";

const alignments = {
  left: {
    children: (
      <>
        <i className={"bi bi-text-left"}></i> Left
      </>
    ),
    shortName: <i className={"bi bi-text-left"}></i>,
    apply: (editor: null) => {},
  },
  "": {
    children: (
      <>
        <i className={"bi bi-text-left"}></i> Left
      </>
    ),
    shortName: <i className={"bi bi-text-left"}></i>,
    apply: (editor: null) => {},
    // editor?.chain().focus().setTextAlign("left").run(),
    // unApply: updateBlockClass(""),
  },
  center: {
    children: (
      <>
        <i className={"bi bi-text-center"}></i>
        Center
      </>
    ),
    shortName: <i className={"bi bi-text-center"}></i>,
    apply: (editor: null) => {},
    // editor?.chain().focus().setTextAlign("center").run(),
    // unApply: updateBlockClass(""),
  },
  right: {
    children: (
      <>
        <i className={"bi bi-text-right"}></i> Right
      </>
    ),
    shortName: <i className={"bi bi-text-right"}></i>,
    apply: (editor: null) => {},
    // editor?.chain().focus().setTextAlign("right").run(),
    // unApply: updateBlockClass(""),
  },
};

export default function AlignmentDropdown({
  state,
}: {
  state: AuthoringState;
}) {
  // useQuery(["transaction"], state);
  // const proseState = state.editor?.view.state;
  const proseState: any = null;
  let node;
  if (proseState?.selection.constructor.name === "AllSelection") {
    node = proseState?.selection.$anchor.node(0);
  } else {
    node = proseState?.selection.$anchor.node(1);
  }

  let alignment: keyof typeof alignments = node?.attrs.textAlign;
  alignment = alignment === "left" || alignment == null ? "" : alignment;

  return (
    <DropdownButton>
      <Button
        className={
          "btn-outline-warning dropdown-toggle " + headerStyles.fixHeight
        }
      >
        <strong>
          {alignments[alignment]?.shortName || shorten(alignment)}
        </strong>
      </Button>
      <Options>
        {Object.entries(alignments).map(([name, r]) => (
          <DropdownItem
            onApply={() => {
              /*r.apply(state.editor)*/
            }}
            onUnApply={() => {}}
            name={name}
            children={r.children}
            nodeName={alignment}
            key={name}
          />
        ))}
      </Options>
    </DropdownButton>
  );
}
