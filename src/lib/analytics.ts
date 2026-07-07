// Lightweight, privacy-first product analytics via Umami (https://umami.is) — cookieless, no personal
// data, no consent banner, which is the honest fit for Strut's guest-first flow.
//
// THE ONE RULE for an open-source, clone-and-run project: analytics is OFF unless the build sets
// VITE_UMAMI_SRC. `import.meta.env.VITE_*` is inlined at build time, so a fresh clone tree-shakes
// `ANALYTICS_ENABLED` to a constant `false` — the script never loads, `track()` is a no-op, and NObody's
// deck data phones home to anyone. To enable it on your own deploy, set VITE_UMAMI_SRC + VITE_UMAMI_ID
// in the build environment (see .env.example). Self-hosters point them at their own Umami instance.
//
// We record only interaction events (which features get used) — never document content, prompts, or PII.

/** The `window.umami` surface the async script installs once it loads. Absent on the server, in dev, in
 *  any build without VITE_UMAMI_SRC, and briefly at boot before the deferred script arrives. */
interface Umami {
  track: (name: string, data?: Record<string, unknown>) => void
}

declare global {
  interface Window {
    umami?: Umami
  }
}

/** Whether analytics is wired for THIS build. Inlined by Vite (VITE_-prefixed), so an unconfigured
 *  clone compiles this to `false` and drops the script + every `track()` body. */
export const ANALYTICS_ENABLED = Boolean(import.meta.env.VITE_UMAMI_SRC)

/** The Umami script URL (data-* attrs are set in __root.tsx). Empty string in an unconfigured build. */
export const UMAMI_SRC = import.meta.env.VITE_UMAMI_SRC ?? ''
/** The Umami website id for this deployment. Empty string in an unconfigured build. */
export const UMAMI_ID = import.meta.env.VITE_UMAMI_ID ?? ''

// The closed set of product events we record. Enumerating them here (rather than free-form strings at
// call sites) keeps the Umami dashboard legible and prevents typo'd, un-mergeable event names.
export type StrutEvent =
  | 'slides:generated' // ✨ AI authored N slides from a description (SlideWell)
  | 'arrange:applied' //  ✨ AI Arrange plan committed to the deck (Overview)
  | 'chat:sent' //        ✨ Chat — a user turn sent to the advisor (ChatPanel)
  | 'chat:edit' //        ✨ Chat — an Edit-lane turn (the AI drives one deck change; ChatPanel)
  | 'play:started' //     entered Play / present mode
  | 'export' //           downloaded a deck (json | html)
  | 'account:promote' //  guest chose to promote to a real account (github | google)
  | 'model:connect' //    connected a BYO OpenRouter model (ModelControl); data.model = id | 'auto'
  | 'model:disconnect' // disconnected the BYO model (ModelControl)

/** Record a product event. Safe to call anywhere, anytime: no-op on the server, in dev, in a clone
 *  without VITE_UMAMI_*, or before the deferred Umami script has loaded (window.umami still absent).
 *  Never throws — analytics must never break a user action. */
export function track(
  event: StrutEvent,
  data?: Record<string, string | number | boolean>,
): void {
  if (!ANALYTICS_ENABLED || typeof window === 'undefined') return
  try {
    window.umami?.track(event, data)
  } catch {
    // swallow — analytics is best-effort and must never surface to the user
  }
}
