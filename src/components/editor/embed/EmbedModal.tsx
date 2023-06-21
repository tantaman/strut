import { useState } from "react";
import AppState from "../../../domain/ephemeral/AppState";
import style from "./EmbedModal.module.css";
import { ChangeEvent } from "react";
import mutations from "../../../domain/mutations";

export default function EmbedModal({ appState }: { appState: AppState }) {
  const [url, setUrl] = useState("");
  const [readyToPreview, setReadyToPreview] = useState(false);
  function onCancel() {
    appState.toggleModal("addEmbed", false);
  }

  async function onOk() {
    // run the mutations to add to the deck...
    // sanity check url
    await mutations.addEmbed(
      appState.ctx.db,
      appState.ctx.db,
      appState.current_deck_id,
      url
    );
    appState.toggleModal("addEmbed", false);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value);
    try {
      new URL(e.target.value);
      setReadyToPreview(true);
    } catch (e) {
      setReadyToPreview(false);
    }
  }

  return (
    <div className={style.root}>
      <h3>Add Image</h3>
      <hr></hr>
      <div style={{ marginBottom: 12 }}>
        <label>URL: </label>
        <span className="spacer"></span>
        <input type="text" onChange={onInputChange} value={url}></input>
      </div>
      <div className={style.previewImg}>
        {readyToPreview ? <img src={url} /> : null}
      </div>
      <div className="pull-right">
        <button
          onClick={onCancel}
          type="button"
          className="btn btn-secondary"
          style={{ marginRight: 10 }}
        >
          Cancel
        </button>
        <button type="button" className="btn btn-dark" onClick={onOk}>
          Ok
        </button>
      </div>
    </div>
  );
}
