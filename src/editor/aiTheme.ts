// One-undo deck theme edits — adopted by BOTH the AI Edit lane (aiChatActions.ts `set_theme`) and the
// manual Theme popover (Header.tsx). Like AI Arrange/Generate, the AI is just another producer of the
// ordinary `setDeckTheme` mutation, so this inherits sync + server-side permission gating.
//
// This also CLOSES A PRE-EXISTING BUG: the manual theme controls (Header.tsx setBg/setTextTheme) fired
// `mutate.setDeckTheme` with NO history.push, so theme changes were not on Cmd/Z. Routing them through
// applyThemePatch puts them on undo for both the AI and the human path.

import type { SetDeckThemeArgs } from '../../shared/app-def'
import type { History } from './history'

/** The `setDeckTheme` mutator, typed exactly like the shared mutator so the live `mutate` object (or its
 *  pre-boot deferred Proxy) is assignable — no dependency on the concrete app type. */
export interface ThemeMutate {
  setDeckTheme: (a: SetDeckThemeArgs) => unknown
}

/** The string-valued theme columns a patch may set. (Enum columns like `default_slide_mode` are handled
 *  by their own controls — this covers the colors/fonts/alignment the AI and the popover touch.) */
export interface ThemePatch {
  background?: string
  surface?: string
  heading_font?: string
  heading_color?: string
  body_font?: string
  body_color?: string
  text_align?: string
}

/** The deck row this reads before-values off (only `id` + the patched columns matter). DeckRoot and the
 *  Header's DeckRow both satisfy it. */
export interface ThemeDeck {
  id: string
  background?: string | null
  surface?: string | null
  heading_font?: string | null
  heading_color?: string | null
  body_font?: string | null
  body_color?: string | null
  text_align?: string | null
}

/** Apply a theme patch as ONE undoable step: capture the CURRENT value of each touched column, apply the
 *  patch, and push a command whose undo restores those before-values (an empty/absent column restores to
 *  '' = "inherit the built-in default"). The whole change reverts in a single Cmd/Ctrl+Z. */
export function applyThemePatch(
  patch: ThemePatch,
  ctx: { mutate: ThemeMutate; history: History; deck: ThemeDeck },
  label = 'Theme',
): void {
  const { mutate, history, deck } = ctx
  const keys = Object.keys(patch) as (keyof ThemePatch)[]
  if (keys.length === 0) return

  const before: ThemePatch = {}
  const source = deck as Record<string, unknown>
  for (const k of keys) {
    const cur = source[k]
    before[k] = typeof cur === 'string' ? cur : ''
  }

  const redo = () => mutate.setDeckTheme({ id: deck.id, ...patch, now: Date.now() })
  const undo = () => mutate.setDeckTheme({ id: deck.id, ...before, now: Date.now() })
  redo()
  history.push({ label, redo, undo })
}
