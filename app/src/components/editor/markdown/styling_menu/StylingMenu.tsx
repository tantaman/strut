import React from "react";
import * as styles from "./StylingMenu.module.css";
import * as headerStyles from "../../../header/HeaderButton.module.css";
import { AuthoringState } from "../../../../domain/schema";
import BlockElementDropdown from "./BlockElementDropdown";
import AlignmentDropdown from "./AlignmentDropdown";
import MarkMenu from "./MarkMenu";
import FontColorButton from "./FontColorButton";
import Theme from "~src/scripts/components/deck/Theme";
import useMatchMedia from "~src/scripts/interactions/useMatchMedia";
import mediaCuts from "~src/scripts/components/mobile/mediaCuts";

type Props = {
  state: AuthoringState;
  theme: Theme;
};

export default function StylingMenu({ state, theme }: Props) {
  const addImage = () => {
    // const url = window.prompt("URL");
    // if (url) {
    //   state.editor?.chain().focus().setImage({ src: url }).run();
    // }
  };
  const setLink = () => {
    // const previousUrl = state.editor?.getAttributes("link").href;
    // const url = window.prompt("URL", previousUrl);
    // // cancelled
    // if (url === null) {
    //   return;
    // }
    // // empty
    // if (url === "") {
    //   state.editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    //   return;
    // }
    // // update link
    // state.editor
    //   ?.chain()
    //   .focus()
    //   .extendMarkRange("link")
    //   .setLink({ href: url })
    //   .run();
  };

  return (
    <div className="btn-toolbar" role="toolbar">
      <div className={styles.root + " btn-group me-2 " + headerStyles.root}>
        <BlockElementDropdown state={state} />
      </div>
      <div className={styles.root + " btn-group me-2 " + headerStyles.root}>
        <MarkMenu state={state} />
        <FontColorButton state={state} theme={theme} />
      </div>
      <div className={styles.root + " btn-group me-2 " + headerStyles.root}>
        <AlignmentDropdown state={state} />
      </div>
      <div className={styles.root + " btn-group me-2 " + headerStyles.root}>
        <button
          className="btn btn-outline-warning"
          type="button"
          aria-expanded="false"
          onClick={addImage}
        >
          <i className={"bi bi-image " + headerStyles.icon}></i>
        </button>
        <button
          className="btn btn-outline-warning"
          type="button"
          aria-expanded="false"
          onClick={setLink}
        >
          <i className={"bi bi-link-45deg " + headerStyles.icon}></i>
        </button>
        {/* <button
          className="btn btn-outline-warning"
          type="button"
          aria-expanded="false"
          onClick={() =>
            state.editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <i className={"bi bi-table " + headerStyles.icon}></i>
        </button> */}
      </div>
    </div>
  );
}
