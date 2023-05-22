import * as styles from "./StylingMenu.module.css";
import * as headerStyles from "../../../header/HeaderButton.module.css";
import AppState from "../../../../domain/ephemeral/AppState";
import BlockElementDropdown from "./BlockElementDropdown";
import AlignmentDropdown from "./AlignmentDropdown";
import MarkMenu from "./MarkMenu";
import FontColorButton from "./FontColorButton";
import queries from "../../../../domain/queries";

type Props = {
  appState: AppState;
};

export default function StylingMenu({ appState }: Props) {
  const state = appState.authoringState;
  const ctx = appState.ctx;

  const theme = queries.themeFromDeck(
    appState.ctx,
    appState.current_deck_id
  ).data;

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
        <FontColorButton ctx={ctx} state={state} theme={theme} />
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
