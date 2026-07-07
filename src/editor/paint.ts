// A "paint" is any fill a color picker can produce: a flat color (the historical model), a multi-stop
// gradient, or a named animated effect. It is stored as a single opaque token string in the same
// columns that used to hold a hex / `bg-*` value — deck.background, slide.background,
// deck.heading_color / body_color, component.fill, and a text component's color — so it round-trips
// through the DB, JSON export, and HTML export with no schema change.
//
// Tokens are resolved to CSS *inline* at render time; they are never used as CSS class names (Strut
// already resolves `bg-custom-<hex>` inline rather than as a class), which is why the vocabulary can
// be far richer than a class name would allow. Callers that only understand flat colors keep working:
// a gradient / effect token is not a valid hex, so `isPaintToken` lets a call site branch to the paint
// path, and anything unrecognised falls back to a solid default.
//
// Token grammar (hex is bare — no leading '#', 3 or 6 digits):
//   solid     '6741d9'                              — bare hex (legacy `bg-*` tokens handled by callers)
//   gradient  'grad:<type>/<angle>/<stops>'         — type = linear | radial | conic; angle in deg
//                                                     (used by linear/conic); stops = comma list of
//                                                     'RRGGBB' or 'RRGGBB@<pos 0-100>'
//             e.g. 'grad:linear/135/6741d9,3b5bdb'  'grad:radial/0/ffffff@0,000000@100'
//   effect    'fx:<name>/<stops>[/<speed>]'         — name = shimmer | flow | holo | pulse;
//                                                     speed in seconds (optional)
//             e.g. 'fx:shimmer/c0a062,fff4d6'       'fx:holo/ff0080,7928ca,0070f3/6'
//
// Animated effects reference keyframes defined once, statically, in src/strut.css (and mirrored into
// the impress export's <style>) — the token only carries the animation *shorthand* that names them.

import type { CSSProperties } from 'react'

// ---- model ----------------------------------------------------------------------------------------

export type GradientType = 'linear' | 'radial' | 'conic'
export type EffectName = 'shimmer' | 'flow' | 'holo' | 'pulse'

export interface Stop {
  color: string // bare hex
  pos: number | null // 0-100, or null = auto-distributed by the browser
}
export interface SolidPaint {
  kind: 'solid'
  color: string // bare hex
}
export interface GradientPaint {
  kind: 'gradient'
  type: GradientType
  angle: number // deg
  stops: Stop[]
}
export interface EffectPaint {
  kind: 'effect'
  name: EffectName
  colors: string[] // bare hex
  speed: number // seconds
}
export type Paint = SolidPaint | GradientPaint | EffectPaint

export const EFFECT_NAMES: EffectName[] = ['shimmer', 'flow', 'holo', 'pulse']
const GRADIENT_TYPES: GradientType[] = ['linear', 'radial', 'conic']

// ---- parse / serialize ----------------------------------------------------------------------------

const HEX = /^[0-9a-f]{3}([0-9a-f]{3})?$/i

/** True for a gradient/effect token — the signal a call site uses to switch to the paint render path
 *  instead of its historical flat-color handling. */
export function isPaintToken(token: string | null | undefined): boolean {
  return !!token && (token.startsWith('grad:') || token.startsWith('fx:'))
}

/** The kind of a stored value: gradient / effect for a paint token, else 'solid' (a flat hex or a
 *  `bg-*` token). Drives which builder tab a picker opens on. */
export function paintKind(
  token: string | null | undefined,
): 'solid' | 'gradient' | 'effect' {
  if (token?.startsWith('grad:')) return 'gradient'
  if (token?.startsWith('fx:')) return 'effect'
  return 'solid'
}

function parseStops(csv: string): Stop[] {
  const stops: Stop[] = []
  for (const raw of csv.split(',')) {
    const [c, p] = raw.split('@')
    const color = (c || '').trim().toLowerCase()
    if (!HEX.test(color)) continue
    const pos = p ? clampPos(Number(p)) : null
    stops.push({ color, pos: pos != null && Number.isFinite(pos) ? pos : null })
  }
  return stops
}

function clampPos(n: number): number {
  return n < 0 ? 0 : n > 100 ? 100 : n
}

/** Parse a gradient/effect token into a `Paint`, or `null` if the token isn't one (a flat color, a
 *  `bg-*` token, or malformed). Never throws. */
export function parsePaint(token: string | null | undefined): Paint | null {
  if (!token) return null
  if (token.startsWith('grad:')) {
    const [type, angleStr, stopStr] = token.slice(5).split('/')
    const t = (type || 'linear') as GradientType
    if (!GRADIENT_TYPES.includes(t)) return null
    const stops = parseStops(stopStr || '')
    if (stops.length < 2) return null
    const angle = Number(angleStr)
    return {
      kind: 'gradient',
      type: t,
      angle: Number.isFinite(angle) ? angle : 0,
      stops,
    }
  }
  if (token.startsWith('fx:')) {
    const [name, stopStr, speedStr] = token.slice(3).split('/')
    const n = name as EffectName
    if (!EFFECT_NAMES.includes(n)) return null
    const colors = parseStops(stopStr || '').map((s) => s.color)
    if (!colors.length) return null
    const speed = Number(speedStr)
    return {
      kind: 'effect',
      name: n,
      colors,
      speed: Number.isFinite(speed) && speed > 0 ? speed : EFFECTS[n].speed,
    }
  }
  return null
}

/** Serialize a `Paint` back to its token string. Solid paints serialize to bare hex (their storage
 *  form everywhere a flat color was already stored). */
export function paintToken(p: Paint): string {
  if (p.kind === 'solid') return p.color
  if (p.kind === 'gradient') {
    const stops = p.stops
      .map((s) => (s.pos == null ? s.color : `${s.color}@${Math.round(s.pos)}`))
      .join(',')
    return `grad:${p.type}/${Math.round(p.angle)}/${stops}`
  }
  const tail = p.speed === EFFECTS[p.name].speed ? '' : `/${p.speed}`
  return `fx:${p.name}/${p.colors.join(',')}${tail}`
}

// ---- CSS emission ---------------------------------------------------------------------------------

/** A resolved paint as a small set of CSS intentions, adapted to React props or an inline HTML style
 *  string by the two helpers below. `clip` means "paint the text, not the box" (background-clip:text). */
export interface PaintStyle {
  background?: string
  color?: string
  animation?: string
  clip?: boolean
}

function stopsCss(stops: Stop[]): string {
  return stops
    .map((s) => `#${s.color}${s.pos == null ? '' : ` ${s.pos}%`}`)
    .join(', ')
}

/** The plain CSS `background` value for a gradient (no animation, no oversizing). */
export function gradientCss(p: GradientPaint): string {
  const s = stopsCss(p.stops)
  if (p.type === 'radial') return `radial-gradient(circle at 50% 50%, ${s})`
  if (p.type === 'conic')
    return `conic-gradient(from ${p.angle}deg at 50% 50%, ${s})`
  return `linear-gradient(${p.angle}deg, ${s})`
}

/** At least two colors — effects that read `[a, b]` stay defined when the user picked a single color. */
function pair(colors: string[]): [string, string] {
  const a = colors[0] ?? '6741d9'
  return [a, colors[1] ?? a]
}

// Each effect names a keyframes rule (defined in src/strut.css) and supplies the matching `background`
// (sized where the animation slides `background-position`). Keep in sync with the @keyframes there.
const EFFECTS: Record<
  EffectName,
  {
    label: string
    speed: number
    defaults: string[]
    build: (
      c: string[],
      speed: number,
    ) => { background: string; animation: string }
  }
> = {
  shimmer: {
    label: 'Shimmer',
    speed: 3,
    defaults: ['c0a062', 'fff4d6'],
    build(colors, speed) {
      const [a, b] = pair(colors)
      // a..b..a wraps, so panning exactly one 220% tile (see @keyframes strut-shimmer) loops seamlessly.
      return {
        background: `linear-gradient(100deg, #${a} 25%, #${b} 50%, #${a} 75%) 0 0 / 220% 100%`,
        animation: `strut-shimmer ${speed}s linear infinite`,
      }
    },
  },
  flow: {
    label: 'Flow',
    speed: 8,
    defaults: ['ff0080', '7928ca', '0070f3'],
    build(colors, speed) {
      const list = colors.length ? colors : ['6741d9', '3b5bdb']
      // Wrap the first color to the end so a full 200% pan loops seamlessly (see @keyframes strut-flow).
      const css = [...list, list[0]].map((c) => `#${c}`).join(', ')
      return {
        background: `linear-gradient(90deg, ${css}) 0 50% / 200% 100%`,
        animation: `strut-flow ${speed}s linear infinite`,
      }
    },
  },
  holo: {
    label: 'Holographic',
    speed: 6,
    defaults: ['ff0080', '7928ca', '0070f3', '00dfd8'],
    build(colors, speed) {
      const list = colors.length
        ? colors
        : ['ff0080', '7928ca', '0070f3', '00dfd8']
      const css = [...list, list[0]].map((c) => `#${c}`).join(', ')
      return {
        background: `conic-gradient(from 0deg at 50% 50%, ${css})`,
        animation: `strut-holo ${speed}s linear infinite`,
      }
    },
  },
  pulse: {
    label: 'Pulse',
    speed: 4,
    defaults: ['e03131', 'ff8787'],
    build(colors, speed) {
      const [a, b] = pair(colors)
      return {
        background: `linear-gradient(135deg, #${a}, #${b})`,
        animation: `strut-pulse ${speed}s ease-in-out infinite`,
      }
    },
  },
}

/** The default color palette + speed for an effect, for seeding the builder when the user first
 *  switches to it. */
export function effectDefaults(name: EffectName): {
  colors: string[]
  speed: number
} {
  return { colors: [...EFFECTS[name].defaults], speed: EFFECTS[name].speed }
}

export function effectLabel(name: EffectName): string {
  return EFFECTS[name].label
}

/** Resolve a paint to CSS intentions for a target: `'bg'` fills the box, `'text'` paints the glyphs. */
export function paintStyleFor(p: Paint, target: 'bg' | 'text'): PaintStyle {
  if (p.kind === 'solid') {
    const c = `#${p.color.replace(/^#+/, '')}`
    return target === 'text' ? { color: c } : { background: c }
  }
  const background =
    p.kind === 'gradient'
      ? gradientCss(p)
      : EFFECTS[p.name].build(p.colors, p.speed).background
  const animation =
    p.kind === 'effect'
      ? EFFECTS[p.name].build(p.colors, p.speed).animation
      : undefined
  if (target === 'text')
    return { background, animation, clip: true, color: 'transparent' }
  return { background, animation }
}

/** PaintStyle → React inline-style props. Emits both `-webkit-` and standard background-clip so the
 *  text-paint trick works in every engine. */
export function styleToProps(s: PaintStyle): CSSProperties {
  const out: CSSProperties = {}
  if (s.background) out.background = s.background
  if (s.animation) out.animation = s.animation
  if (s.clip) {
    out.WebkitBackgroundClip = 'text'
    out.backgroundClip = 'text'
    out.WebkitTextFillColor = 'transparent'
    out.color = 'transparent'
  } else if (s.color) {
    out.color = s.color
  }
  return out
}

/** PaintStyle → an inline HTML `style="…"` declaration string (for the impress export). */
export function styleToDecls(s: PaintStyle): string {
  const d: string[] = []
  if (s.background) d.push(`background:${s.background}`)
  if (s.animation) d.push(`animation:${s.animation}`)
  if (s.clip)
    d.push(
      '-webkit-background-clip:text',
      'background-clip:text',
      '-webkit-text-fill-color:transparent',
      'color:transparent',
    )
  else if (s.color) d.push(`color:${s.color}`)
  return d.join(';')
}

/** Convenience: token → React props for a target, or `null` when the token isn't a paint token (the
 *  caller keeps its existing flat-color handling). */
export function paintPropsFromToken(
  token: string | null | undefined,
  target: 'bg' | 'text',
): CSSProperties | null {
  const p = parsePaint(token)
  return p ? styleToProps(paintStyleFor(p, target)) : null
}

/** The CSS `background` value for a token used as a box fill: a flat color, a gradient, or an effect's
 *  (oversized, animatable) base gradient. Non-paint tokens fall back to a bare hex. This is also the
 *  static swatch / trigger-chip preview (a swatch has no `animation`, so an effect previews frozen). */
export function paintBackground(token: string): string {
  const p = parsePaint(token)
  if (!p) return `#${token.replace(/^#+/, '')}`
  return paintStyleFor(p, 'bg').background ?? '#ffffff'
}

/** Back-compat alias — the picker chips call this. */
export const paintSwatchCss = paintBackground

/** The CSS `animation` shorthand for an effect token, else undefined (solid / gradient don't animate).
 *  Emitted alongside the `background` so a call site can drive the effect's keyframes. */
export function paintAnimation(
  token: string | null | undefined,
): string | undefined {
  const p = parsePaint(token)
  return p ? paintStyleFor(p, 'bg').animation : undefined
}

/** A single representative `#rrggbb` for a token — the first stop / color, or the flat hex. Used as the
 *  solid fallback (e.g. a `--strut-*-color` var) so contexts that can't render the full paint still get
 *  a sensible color. */
export function paintPrimaryColor(token: string | null | undefined): string {
  const p = parsePaint(token)
  if (!p) return `#${(token ?? '').replace(/^#+/, '') || '111111'}`
  if (p.kind === 'solid') return `#${p.color}`
  if (p.kind === 'gradient') return `#${p.stops[0].color}`
  return `#${p.colors[0]}`
}

// ---- curated presets ------------------------------------------------------------------------------

export const GRADIENT_PRESETS: string[] = [
  'grad:linear/135/6741d9,3b5bdb',
  'grad:linear/135/e8590c,f08c00',
  'grad:linear/135/e03131,d6336c',
  'grad:linear/120/0c8599,099268',
  'grad:linear/135/11998e,38ef7d',
  'grad:linear/160/232336,15151f',
  'grad:radial/0/ffd6a5,ff8fab',
  'grad:conic/0/ff0080,7928ca,0070f3,00dfd8,ff0080',
]

export const EFFECT_PRESETS: string[] = [
  'fx:shimmer/c0a062,fff4d6',
  'fx:shimmer/6741d9,c3b4ff',
  'fx:flow/ff0080,7928ca,0070f3',
  'fx:holo/ff0080,7928ca,0070f3,00dfd8',
  'fx:pulse/e03131,ff8787',
]
