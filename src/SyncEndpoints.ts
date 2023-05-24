import { SyncEdnpoints } from "./components/db/DBFactory";

export const endpoints = {
  createOrMigrate: new URL("/sync/create-or-migrate", window.location.origin),
  applyChanges: new URL("/sync/changes", window.location.origin),
  startOutboundStream: new URL(
    "/sync/start-outbound-stream",
    window.location.origin
  ),
} as SyncEdnpoints;
