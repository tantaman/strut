// True once the web fonts requested in <head> (Poppins + the slide typefaces from config.ts) have
// finished loading. A slide surface holds its first paint until this flips so its text doesn't first
// render in a fallback face and then reflow when the real font arrives (FOUT) — the second layer of the
// refresh flash, on top of the fit-scale pop.
//
// Only the FIRST mount of the session waits: a full page load / refresh is where the fallback→web-font
// swap is actually visible. Later client-side navigations return true immediately (the fonts are already
// cached), so opening a deck in-app stays instant — no per-navigation fade. A `timeoutMs` fallback
// guarantees a slow or blocked font can never keep a surface hidden, and environments without the Font
// Loading API (or the server) just resolve true.

import { useEffect, useState } from 'react'

// Module scope: flips true once the first load's fonts resolve, so every later mount starts ready.
let fontsSettled = false

export function useFontsReady(timeoutMs = 700): boolean {
  const [ready, setReady] = useState<boolean>(fontsSettled)
  useEffect(() => {
    if (ready) return
    // Cast to a shape where `fonts` is optional so the runtime guard survives (the DOM lib types
    // Document.fonts as always-present, but older/edge runtimes may lack the Font Loading API).
    const fonts = (document as { fonts?: FontFaceSet }).fonts
    if (!fonts) {
      fontsSettled = true
      setReady(true)
      return
    }
    let live = true
    const done = () => {
      fontsSettled = true
      if (live) setReady(true)
    }
    void fonts.ready.then(done)
    const t = setTimeout(done, timeoutMs)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [ready, timeoutMs])
  return ready
}
