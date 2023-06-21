import AppState from "../../domain/ephemeral/AppState";
import mutations from "../../domain/mutations";
// import styles from "./HeaderButton.module.css";
import styles from "./SlideComponentButtons.module.css";

export default function SlideComponentsButtons({
  appState,
}: {
  appState: AppState;
}) {
  return (
    <div className={"btn-group " + styles.root} role="group">
      <button type="button" className="btn btn-outline-warning">
        <i className={"bi bi-cursor " + styles.icon}></i>
      </button>
      <button
        type="button"
        className="btn btn-outline-warning"
        onClick={() =>
          mutations.addText(
            appState.ctx.db,
            appState.ctx.db,
            appState.current_deck_id
          )
        }
      >
        <i className={"bi bi-fonts " + styles.icon}></i>
      </button>
      {/* <button type="button" className="btn btn-outline-warning">
        <i className={"bi bi-square " + styles.icon}></i>
      </button>
      <button type="button" className="btn btn-outline-warning">
        <i className={"bi bi-arrow-up-right " + styles.icon}></i>
      </button> */}
      <button
        type="button"
        className="btn btn-outline-warning"
        onClick={() => appState.toggleModal("addEmbed")}
      >
        <i className={"bi bi-image " + styles.icon}></i>
      </button>
    </div>
  );
}
