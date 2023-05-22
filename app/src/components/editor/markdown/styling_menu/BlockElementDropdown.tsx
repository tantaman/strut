import "@tiptap/starter-kit";
import React from "react";
import Button from "../../../../widgets/Button";
import DropdownButton from "../../../../widgets/DropdownButton";
const Options = DropdownButton.Options;
import AuthoringState from "../../../../domain/ephemeral/AuthoringState";
import headerStyles from "../../../header/HeaderButton.module.css";
import DropdownItem from "./DropdownItem";
import shorten from "./shorten";

const readouts = {
  paragraph: {
    children: (
      <>
        <strong>Aa</strong> Normal
      </>
    ),
    shortName: "Aa",
    apply: (_editor: undefined) => {}, // editor?.chain().focus().setParagraph().run(),
    unApply: () => {},
  },
  heading1: {
    children: (
      <>
        <strong>H1</strong> Large Heading
      </>
    ),
    shortName: "H1",
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    // unApply: setBlockType(schema.nodes.paragraph),
  },
  heading2: {
    children: (
      <>
        <strong>H2</strong> Medium Heading
      </>
    ),
    shortName: "H2",
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    // unApply: setBlockType(schema.nodes.paragraph),
  },
  heading3: {
    children: (
      <>
        <strong>H3</strong> Small Heading
      </>
    ),
    shortName: "H3",
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    // unApply: setBlockType(schema.nodes.paragraph),
  },
  bulletList: {
    children: (
      <>
        <i className={"bi bi-list-ul"}></i> Bullet List
      </>
    ),
    shortName: <i className={"bi bi-list-ul"}></i>,
    apply: (editor: undefined) => {},
    // editor?.chain().focus().toggleBulletList().run(),
    // unApply: lift,
  },
  orderedList: {
    children: (
      <>
        <i className={"bi bi-list-ol"}></i> Numbered List
      </>
    ),
    shortName: <i className={"bi bi-list-ol"}></i>,
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleOrderedList().run(),
    // unApply: lift,
  },
  blockquote: {
    children: (
      <>
        <i className={"bi bi-blockquote-left"}></i> Quote
      </>
    ),
    shortName: <i className={"bi bi-blockquote-left"}></i>,
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleBlockquote().run(),
    // unApply: lift,
  },
  codeBlock: {
    children: (
      <>
        <i className={"bi bi-code-slash"}></i> Code Block
      </>
    ),
    shortName: <i className={"bi bi-code-slash"}></i>,
    apply: (_editor: undefined) => {},
    // editor?.chain().focus().toggleCodeBlock().run(),
    // unApply: setBlockType(schema.nodes.paragraph),
  },
};

export default function BlockElementDropdown({
  state,
}: {
  state: AuthoringState;
}) {
  // useBind(["transaction"], state);
  let node;
  // const proseState = state.editor?.view.state;
  const proseState: TODO = undefined;
  if (proseState?.selection.constructor.name === "AllSelection") {
    node = proseState?.selection.$anchor.node(0);
  } else {
    node = proseState?.selection.$anchor.node(1);
  }

  // TODO: put this in the spec of the nodes
  let nodeName = node?.type.name;
  if (nodeName === "heading") {
    nodeName = nodeName + node?.attrs.level;
  }

  return (
    <DropdownButton>
      <Button
        className={
          "btn-outline-warning dropdown-toggle " + headerStyles.fixHeight
        }
      >
        <strong>
          {readouts[nodeName as keyof typeof readouts]?.shortName ||
            shorten(nodeName || "")}
        </strong>
      </Button>
      <Options>
        {Object.entries(readouts).map(([name, r]) => (
          <DropdownItem
            onApply={() => r.apply(/*state.editor*/ undefined)}
            onUnApply={
              () => {}
              // r.unApply(state.proseState, state.proseView?.dispatch)
            }
            name={name}
            children={r.children}
            nodeName={nodeName || ""}
            key={name}
          />
        ))}
      </Options>
    </DropdownButton>
  );
}
