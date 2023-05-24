import worker from "@vlcn.io/direct-connect-browser/shared.worker.js?url";
import wasm from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";

export const endpoints = {
  createOrMigrate: new URL("/sync/create-or-migrate", window.location.origin),
  applyChanges: new URL("/sync/changes", window.location.origin),
  startOutboundStream: new URL(
    "/sync/start-outbound-stream",
    window.location.origin
  ),
  worker: import.meta.env.DEV ? worker : undefined,
  wasm,
};
