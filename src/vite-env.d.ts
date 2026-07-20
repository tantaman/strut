/// <reference types="vite/client" />

declare module 'rindle-wasm-bin?url' {
  const url: string
  export default url
}

interface ImportMetaEnv {
  /** Explicit direct-follower test/debug bypass. Normal app traffic uses VITE_FLEET_WS. */
  readonly VITE_DAEMON_WS?: string
  /** Stable fleet-edge WebSocket derived from rindle.ncl by `rindle exec`. */
  readonly VITE_FLEET_WS?: string
  /** Legacy direct WebSocket override retained for existing self-hosted environments. */
  readonly VITE_RINDLE_WS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
