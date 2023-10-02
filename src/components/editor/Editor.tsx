"use strict";

import SlideEditor from "./SlideEditor";
import AppState from "../../domain/ephemeral/AppState";
import { useBind } from "../../modelHooks";
import LayoutEditor from "./layout/LayoutEditor";
import { useParams } from "react-router-dom";
import { StrutSchema, StrutSchemaName } from "../../schemas/StrutSchema.js";
import { useState } from "react";
import { DBProvider, useDB, useSync } from "@vlcn.io/react";
import { IID_of } from "../../id.js";
import { Deck } from "../../domain/schema.js";
import EphemeralTheme from "../../domain/ephemeral/EphemeralTheme.js";
import AuthoringState from "../../domain/ephemeral/AuthoringState.js";
import DrawingInteractionState from "../../domain/ephemeral/DrawingInteractionState.js";
import DeckIndex from "../../domain/ephemeral/DeckIndex.js";
import ErrorState from "../../domain/ephemeral/ErrorState.js";
import hotkeys from "../hotkeys/hotkeys.js";
import OpenType from "../open-type/OpenType.js";
import EmbedModal from "./embed/EmbedModal.js";
import SyncWorker from "../../sync/worker.js?worker";

/**
 * Start authoring a presentation.
 */
const worker = new SyncWorker();
export default function Editor() {
  const { dbid, deckid } = useParams();

  return (
    <DBProvider
      dbname={dbid!}
      schema={{
        name: StrutSchemaName,
        content: StrutSchema.__content,
      }}
      Render={() => (
        <DBProvided dbid={dbid!} deckid={BigInt(deckid!) as IID_of<Deck>} />
      )}
    ></DBProvider>
  );
}

function DBProvided({ dbid, deckid }: { dbid: string; deckid: IID_of<Deck> }) {
  const ctx = useDB(dbid);
  (window as any).db = ctx.db;
  useSync({
    dbname: dbid,
    endpoint: "ws://localhost:8080/sync",
    room: dbid,
    worker,
  });
  const [appState, _setAppState] = useState<AppState>(() => {
    const appState = new AppState({
      ctx,
      editor_mode: "slide",
      modal: "none",
      current_deck_id: deckid,
      authoringState: new AuthoringState({}),
      // TODO: figure me out
      previewTheme: new EphemeralTheme({
        id: EphemeralTheme.defaultThemeId,
        bg_colorset: "default",
      } as any),
      drawingInteractionState: new DrawingInteractionState({
        currentTool: "arrow",
      }),
      deckIndex: new DeckIndex(),
      errorState: new ErrorState(),
    });
    hotkeys.install(appState);
    return appState;
  });

  useBind(appState, ["modal"]);

  return (
    <>
      {appState.open_type ? <OpenType appState={appState} /> : null}
      {appState.add_embed ? <EmbedModal appState={appState} /> : null}
      <EditorInernal appState={appState} />
    </>
  );
}

function EditorInernal(props: { appState: AppState }) {
  useBind(props.appState, ["editor_mode"]);
  const editorMode = props.appState.editor_mode;
  return (
    <div className="strt-editor">
      {editorMode === "layout" ? (
        <LayoutEditor appState={props.appState} />
      ) : (
        <SlideEditor appState={props.appState} />
      )}
    </div>
  );
}
