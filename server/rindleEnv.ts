// Where the Rindle fleet lives, resolved from env at RUNTIME (never baked into a build).
//
// Local dev: `rindle dev -- <cmd>` injects RINDLE_URL (+ RINDLE_DATABASE_TOKEN) into the app command;
// `rindle exec` injects a fuller set that also includes RINDLE_DAEMON_URL / RINDLE_FLEET_WS. Deploys
// set RINDLE_DAEMON_URL / RINDLE_DAEMON_WS explicitly (docs/DEPLOY_CLOUDFLARE.md). Accepting all of
// them means neither path needs a per-environment shim.
//
// Since Rindle 0.9 the whole local fleet sits behind ONE dev-edge ingress that serves control, reads
// and the live-query WebSocket on the SAME port — so an absent ws URL is just the http one with the
// scheme swapped, and the pre-0.9 split :7600/:7601 daemon is gone.

const LOCAL_FLEET = 'http://127.0.0.1:22050'

/** The fleet's http ingress — the daemon control plane the API server writes/reads through. */
export function daemonUrl(): string {
  return process.env.RINDLE_DAEMON_URL ?? process.env.RINDLE_URL ?? LOCAL_FLEET
}

/** The live-query WebSocket the BROWSER should open, or `''` when nothing is configured — the client
 *  then falls back to its own build-time override (see src/rindle/client.ts). Deliberately NOT
 *  defaulted to the local fleet: a production build with no ws env must keep deferring to the client,
 *  not be handed a localhost URL. */
export function daemonWsUrl(): string {
  const explicit = process.env.RINDLE_DAEMON_WS ?? process.env.RINDLE_FLEET_WS
  if (explicit) return explicit
  const http = process.env.RINDLE_DAEMON_URL ?? process.env.RINDLE_URL
  return http ? http.replace(/^http/, 'ws') : ''
}
