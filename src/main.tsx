import "styles/bootstrap.css";
import "styles/bootstrap-icons/bootstrap-icons.css";
import "styles/main.css";

import ReactDOM from "react-dom/client";
import App from "./App.tsx";

/*

// Now that we have a remote dbid, we can open our corresponding local db.
const sqlite = await initWasm(() => wasmUrl);
const db = await sqlite.open(remoteDbid);

// Automigrate our local db to the schema we want to use.
await db.automigrateTo(testSchema.name, testSchema.content);

// Install the reactivity extensions for our local db.
const rx = tblrx(db);

// Start the sync worker which will sync our local changes to the remote db.
const syncWorker = new WorkerInterface(workerUrl, wasmUrl);
syncWorker.startSync(
  remoteDbid as any,
  {
    createOrMigrate: new URL("/sync/create-or-migrate", window.location.origin),
    applyChanges: new URL("/sync/changes", window.location.origin),
    startOutboundStream: new URL(
      "/sync/start-outbound-stream",
      window.location.origin
    ),
  },
  rx
);

*/

// Launch our app.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
