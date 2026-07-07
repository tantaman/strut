// The shared color picker (spec §8.5). One presentational core — `PaintPicker` — renders the Popchip
// trigger and a sub-popover with three tabs: Solid (a swatch grid + the native "dynamic" picker),
// Gradient (presets + a stop/angle builder), and Effect (presets + an animated-effect builder). Two
// thin adapters feed it the two value models the app stores:
//
//   • ColorField      — raw hex (text font color, shape fill, deck heading/body color). Any tab may
//                       also store a `grad:` / `fx:` paint token in the same column (see ./paint).
//   • TokenColorField — a CSS-class token vocabulary (`bg-orange`, `bg-transparent`, `img:<url>`,
//                       minted `bg-custom-<hex>`) for deck background / surface. Its Gradient/Effect
//                       tabs store the paint token directly (no minted class — resolved inline like
//                       every other bg token). See resolveBackground/resolveSurface in ./types.
//
// Keeping the presentation in one place means every picker looks and behaves identically.
//
// Live drag: the native picker streams `input` events while dragging (real-time preview via a Rindle
// `.folded` mutation) and fires `change` once on dismiss (the durable write). The Gradient/Effect
// builders follow the same split through `useTokenEmitter`: continuous edits preview live and a
// trailing commit lands the durable write; discrete edits (presets, add/remove) commit immediately.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { COLOR_SWATCHES, cssHex } from './types'
import {
  EFFECT_NAMES,
  EFFECT_PRESETS,
  GRADIENT_PRESETS,
  effectDefaults,
  effectLabel,
  gradientCss,
  isPaintToken,
  paintKind,
  paintStyleFor,
  paintSwatchCss,
  paintToken,
  parsePaint,
  styleToProps,
} from './paint'
import type { EffectPaint, GradientPaint, GradientType, Stop } from './paint'
import { Popchip } from './Popchip'

// The checkerboard fill used to depict a transparent background.
const CHECKER =
  'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 8px 8px'
const HEX6 = /^#[0-9a-f]{6}$/i

/** Bare, lowercased hex (stored form) from any `#rrggbb` / `rrggbb` the picker hands back. */
function bareHex(hex: string): string {
  return hex.replace(/^#+/, '').toLowerCase()
}

/** The trigger swatch preview for a background/surface value (checker for transparent, the gradient/
 *  effect base for a paint token, else the resolved class color). */
function bgSwatch(value: string, resolve: (v: string) => string): string {
  if (value === 'bg-transparent') return CHECKER
  if (isPaintToken(value)) return paintSwatchCss(value)
  return resolve(value || 'bg-default')
}

/** A valid `#rrggbb` seed for the native custom picker: the current custom hex if the value is one,
 *  else the resolved class color when that's a plain hex (gradients/effects/transparent → white). */
function bgInputHex(
  value: string | null | undefined,
  resolve: (v: string) => string,
): string {
  if (value && value.startsWith('bg-custom-'))
    return '#' + value.slice('bg-custom-'.length)
  const r = resolve(value || 'bg-default')
  return HEX6.test(r) ? r : '#ffffff'
}

/** The native OS color picker. It fires two callbacks: `onLive` on every `input` — continuously, while
 *  the user drags inside the picker — for real-time preview, and `onCommit` once on `change` (when the
 *  picker is dismissed) for the durable write. We run the `<input>` UNCONTROLLED: a controlled value
 *  (React `onChange` === the `input` event) would fight the drag frame-by-frame. External `value`
 *  changes are synced via a ref, but only while the input is NOT focused — during a drag the picker
 *  owns its value, so echoing the (debounced-stale) live write back in would yank the cursor. The label
 *  shows the hex without a leading `#`. */
export function NativeColorInput({
  value,
  onCommit,
  onLive,
  active,
}: {
  value: string // '#rrggbb'
  onCommit: (hex: string) => void
  onLive?: (hex: string) => void
  // When the current selection is a custom color that matches no preset, the native chip *is* the
  // selected swatch — outline it so the picker always shows what's currently chosen.
  active?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // The native picker owns its value while the user is interacting with it (input focused / popup
    // open). Pushing a deck value back in mid-drag would yank the spectrum cursor to a debounced-stale
    // live frame, so only sync an external change when this input isn't the active element.
    if (document.activeElement === el) return
    if (el.value !== value) el.value = value
  }, [value])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const live = () => onLive?.(el.value)
    const commit = () => onCommit(el.value)
    el.addEventListener('input', live)
    el.addEventListener('change', commit)
    return () => {
      el.removeEventListener('input', live)
      el.removeEventListener('change', commit)
    }
  }, [onCommit, onLive])
  return (
    // stopPropagation on mousedown so a toolbar that blanket-`preventDefault`s pointer-downs to keep a
    // text selection alive (the markdown format bar) can't also swallow the click that opens this native
    // OS picker. A no-op everywhere else — no other host of this control preventDefaults its pointerdowns.
    <label
      className={'insp__custom' + (active ? ' is-active' : '')}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input ref={ref} type="color" defaultValue={value} />
      <span>{value.replace(/^#/, '')}</span>
    </label>
  )
}

/** One entry in the picker grid. `onSelect` applies it; `activeKey === key` outlines it. */
interface SwatchSpec {
  key: string
  color: string // CSS background for the swatch
  title?: string
  glyph?: string // rendered inside the swatch (the theme-default "T")
  extraClass?: string // e.g. 'swatch--theme'
  onSelect: () => void
}

/** The Solid-tab body: a swatch grid + the native custom picker. Shared by both adapters. */
function SolidTab({
  swatches,
  activeKey,
  custom,
  customActive,
}: {
  swatches: SwatchSpec[]
  activeKey: string | null
  custom: {
    value: string
    onCommit: (hex: string) => void
    onLive?: (hex: string) => void
  }
  customActive: boolean
}) {
  return (
    <>
      <div className="swatches swatches--sm">
        {swatches.map((s) => (
          <button
            key={s.key}
            className={
              'swatch' +
              (s.extraClass ? ' ' + s.extraClass : '') +
              (activeKey === s.key ? ' is-active' : '')
            }
            style={{ background: s.color }}
            title={s.title}
            onClick={s.onSelect}
          >
            {s.glyph}
          </button>
        ))}
      </div>
      <NativeColorInput
        value={custom.value}
        onCommit={custom.onCommit}
        onLive={custom.onLive}
        active={customActive}
      />
    </>
  )
}

// ---- live/commit token emitter --------------------------------------------------------------------

interface Emitter {
  change: (token: string) => void // continuous edit: preview live, commit on a trailing timer
  commit: (token: string) => void // discrete edit / settle: commit now
}

/** Split builder edits into live previews and durable commits, mirroring NativeColorInput. Continuous
 *  edits (color drag, angle slider) fire `onLive` immediately (if provided) and schedule one trailing
 *  `onCommit`; discrete edits commit at once. The trailing commit also flushes on unmount so a value is
 *  never lost when the popover closes. */
function useTokenEmitter(
  onCommit: (t: string) => void,
  onLive?: (t: string) => void,
): Emitter {
  const cbs = useRef({ onCommit, onLive })
  cbs.current = { onCommit, onLive }
  const timer = useRef<number | null>(null)
  const pending = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (timer.current != null) {
        clearTimeout(timer.current)
        if (pending.current != null) cbs.current.onCommit(pending.current)
      }
    },
    [],
  )
  return {
    change(token) {
      cbs.current.onLive?.(token)
      pending.current = token
      if (timer.current != null) clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        timer.current = null
        pending.current = null
        cbs.current.onCommit(token)
      }, 300)
    },
    commit(token) {
      if (timer.current != null) {
        clearTimeout(timer.current)
        timer.current = null
      }
      pending.current = null
      cbs.current.onLive?.(token)
      cbs.current.onCommit(token)
    },
  }
}

// ---- gradient builder -----------------------------------------------------------------------------

const GRAD_TYPES: GradientType[] = ['linear', 'radial', 'conic']
const GRAD_TYPE_LABEL: Record<GradientType, string> = {
  linear: 'Linear',
  radial: 'Radial',
  conic: 'Conic',
}

/** Seed the gradient builder from the current value: reuse it if it's already a gradient, else start
 *  from a sensible default whose first stop is the current flat color when there is one. */
function seedGradient(value: string): GradientPaint {
  const p = parsePaint(value)
  if (p && p.kind === 'gradient') return p
  let base = '6741d9'
  if (value && HEX6.test('#' + bareHex(value))) base = bareHex(value)
  else if (value.startsWith('bg-custom-'))
    base = value.slice('bg-custom-'.length)
  return {
    kind: 'gradient',
    type: 'linear',
    angle: 135,
    stops: [
      { color: base, pos: null },
      { color: '3b5bdb', pos: null },
    ],
  }
}

function GradientBuilder({ value, emit }: { value: string; emit: Emitter }) {
  const [g, setG] = useState<GradientPaint>(() => seedGradient(value))
  const apply = (next: GradientPaint, commit: boolean) => {
    setG(next)
    ;(commit ? emit.commit : emit.change)(paintToken(next))
  }
  const setStops = (stops: Stop[], commit: boolean) =>
    apply({ ...g, stops }, commit)

  return (
    <div className="paint-build">
      <div className="swatches swatches--sm">
        {GRADIENT_PRESETS.map((t) => (
          <button
            key={t}
            className="swatch"
            style={{ background: paintSwatchCss(t) }}
            title="gradient preset"
            onClick={() => {
              const p = parsePaint(t)
              if (p && p.kind === 'gradient') setG(p)
              emit.commit(t)
            }}
          />
        ))}
      </div>

      <div className="paint-seg">
        {GRAD_TYPES.map((t) => (
          <button
            key={t}
            className={'paint-seg__btn' + (g.type === t ? ' is-active' : '')}
            onClick={() => apply({ ...g, type: t }, true)}
          >
            {GRAD_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {g.type !== 'radial' && (
        <label className="paint-range">
          <span>Angle</span>
          <input
            type="range"
            min={0}
            max={360}
            value={g.angle}
            onChange={(e) =>
              apply({ ...g, angle: Number(e.target.value) }, false)
            }
            onPointerUp={() => emit.commit(paintToken(g))}
          />
          <span className="paint-range__val">{g.angle}°</span>
        </label>
      )}

      <div className="paint-stops">
        {g.stops.map((s, i) => (
          <div className="paint-stop" key={i}>
            <input
              type="color"
              value={'#' + s.color}
              onChange={(e) =>
                setStops(
                  g.stops.map((x, j) =>
                    j === i ? { ...x, color: bareHex(e.target.value) } : x,
                  ),
                  false,
                )
              }
            />
            {g.stops.length > 2 && (
              <button
                className="paint-stop__x"
                title="remove stop"
                onClick={() =>
                  setStops(
                    g.stops.filter((_, j) => j !== i),
                    true,
                  )
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
        {g.stops.length < 6 && (
          <button
            className="paint-add"
            title="add stop"
            onClick={() =>
              setStops([...g.stops, { color: 'ffffff', pos: null }], true)
            }
          >
            +
          </button>
        )}
      </div>

      <div className="paint-preview" style={{ background: gradientCss(g) }} />
    </div>
  )
}

// ---- effect builder -------------------------------------------------------------------------------

function seedEffect(value: string): EffectPaint {
  const p = parsePaint(value)
  if (p && p.kind === 'effect') return p
  const d = effectDefaults('shimmer')
  return { kind: 'effect', name: 'shimmer', colors: d.colors, speed: d.speed }
}

function EffectBuilder({ value, emit }: { value: string; emit: Emitter }) {
  const [fx, setFx] = useState<EffectPaint>(() => seedEffect(value))
  const apply = (next: EffectPaint, commit: boolean) => {
    setFx(next)
    ;(commit ? emit.commit : emit.change)(paintToken(next))
  }
  const setColors = (colors: string[], commit: boolean) =>
    apply({ ...fx, colors }, commit)

  return (
    <div className="paint-build">
      <div className="swatches swatches--sm">
        {EFFECT_PRESETS.map((t) => (
          <button
            key={t}
            className="swatch"
            style={{ background: paintSwatchCss(t) }}
            title="effect preset"
            onClick={() => {
              const p = parsePaint(t)
              if (p && p.kind === 'effect') setFx(p)
              emit.commit(t)
            }}
          />
        ))}
      </div>

      <div className="paint-seg paint-seg--wrap">
        {EFFECT_NAMES.map((n) => (
          <button
            key={n}
            className={'paint-seg__btn' + (fx.name === n ? ' is-active' : '')}
            onClick={() => apply({ ...fx, name: n }, true)}
          >
            {effectLabel(n)}
          </button>
        ))}
      </div>

      <div className="paint-stops">
        {fx.colors.map((c, i) => (
          <div className="paint-stop" key={i}>
            <input
              type="color"
              value={'#' + c}
              onChange={(e) =>
                setColors(
                  fx.colors.map((x, j) =>
                    j === i ? bareHex(e.target.value) : x,
                  ),
                  false,
                )
              }
            />
            {fx.colors.length > 1 && (
              <button
                className="paint-stop__x"
                title="remove color"
                onClick={() =>
                  setColors(
                    fx.colors.filter((_, j) => j !== i),
                    true,
                  )
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
        {fx.colors.length < 6 && (
          <button
            className="paint-add"
            title="add color"
            onClick={() => setColors([...fx.colors, 'ffffff'], true)}
          >
            +
          </button>
        )}
      </div>

      <label className="paint-range">
        <span>Speed</span>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          // Left = fast: the slider reads inverted duration so dragging right slows it down.
          value={21 - fx.speed}
          onChange={(e) =>
            apply({ ...fx, speed: 21 - Number(e.target.value) }, false)
          }
          onPointerUp={() => emit.commit(paintToken(fx))}
        />
      </label>

      <div
        className="paint-preview"
        style={styleToProps(paintStyleFor(fx, 'bg'))}
      />
    </div>
  )
}

// ---- presentational core --------------------------------------------------------------------------

type PaintTab = 'solid' | 'gradient' | 'effect'

/** The Popchip trigger + tabbed sub-popover. The Solid tab is supplied by the adapter (its swatch grid
 *  differs); Gradient/Effect are shared builders that write paint tokens through `onCommitToken`. When
 *  `showPaint` is false only the Solid tab shows (a bg control with no paint sink). */
function PaintPicker({
  triggerColor,
  title,
  value,
  solid,
  onCommitToken,
  onLiveToken,
  showPaint = true,
}: {
  triggerColor: string
  title?: string
  value: string
  solid: ReactNode
  onCommitToken: (token: string) => void
  onLiveToken?: (token: string) => void
  showPaint?: boolean
}) {
  const emit = useTokenEmitter(onCommitToken, onLiveToken)
  const [tab, setTab] = useState<PaintTab>(paintKind(value))
  return (
    <Popchip swatch={triggerColor} title={title}>
      {showPaint && (
        <div className="paint-tabs">
          {(['solid', 'gradient', 'effect'] as PaintTab[]).map((t) => (
            <button
              key={t}
              className={'paint-tab' + (tab === t ? ' is-active' : '')}
              onClick={() => setTab(t)}
            >
              {t === 'solid'
                ? 'Solid'
                : t === 'gradient'
                  ? 'Gradient'
                  : 'Effect'}
            </button>
          ))}
        </div>
      )}
      {tab === 'solid' && solid}
      {showPaint && tab === 'gradient' && (
        <GradientBuilder value={value} emit={emit} />
      )}
      {showPaint && tab === 'effect' && (
        <EffectBuilder value={value} emit={emit} />
      )}
    </Popchip>
  )
}

// ---- adapters -------------------------------------------------------------------------------------

/** Raw-hex / paint color control (text color, shape fill, deck heading/body color). `value`/`onChange`
 *  use bare hex (no leading `#`) for a flat color, a `grad:`/`fx:` token for a paint, or '' = inherit
 *  the deck theme (a leading "T" swatch) when `themeDefault` is set. `onLive` (optional) previews a
 *  drag in real time; `onChange` is the commit. */
export function ColorField({
  value,
  onChange,
  onLive,
  themeDefault,
  solidOnly,
}: {
  value: string
  onChange: (hex: string) => void
  onLive?: (hex: string) => void
  themeDefault?: { color: string; title: string }
  // Contexts whose sink can only hold a flat hex (a TipTap color mark, an SVG-`currentColor` shape
  // fill) hide the Gradient/Effect tabs so the picker can't produce a paint token they'd mangle.
  solidOnly?: boolean
}) {
  const paint = isPaintToken(value)
  const inherited = !!themeDefault && !value
  const valueHex = value.replace(/^#+/, '').toLowerCase()
  const isPreset = !paint && COLOR_SWATCHES.includes(valueHex)
  const triggerColor = paint
    ? paintSwatchCss(value)
    : cssHex(value, themeDefault ? themeDefault.color : '111111')

  const swatches: SwatchSpec[] = []
  if (themeDefault)
    swatches.push({
      key: '__theme__',
      color: cssHex(themeDefault.color, '111111'),
      title: themeDefault.title,
      glyph: 'T',
      extraClass: 'swatch--theme',
      onSelect: () => onChange(''),
    })
  for (const h of COLOR_SWATCHES)
    swatches.push({
      key: h,
      color: '#' + h,
      title: '#' + h,
      onSelect: () => onChange(h),
    })

  const solid = (
    <SolidTab
      swatches={swatches}
      activeKey={inherited ? '__theme__' : isPreset ? valueHex : null}
      // A non-empty flat hex matching no preset came from the native picker — highlight it there.
      customActive={!paint && !inherited && valueHex !== '' && !isPreset}
      custom={{
        value: cssHex(
          paint ? '' : value,
          themeDefault ? themeDefault.color : '111111',
        ),
        onCommit: (hex) => onChange(bareHex(hex)),
        onLive: onLive ? (hex) => onLive(bareHex(hex)) : undefined,
      }}
    />
  )

  return (
    <PaintPicker
      triggerColor={triggerColor}
      title={inherited ? themeDefault.title : 'Color'}
      value={value}
      solid={solid}
      showPaint={!solidOnly}
      onCommitToken={onChange}
      onLiveToken={onLive}
    />
  )
}

/** Class-token color control (deck background / surface). The value is a CSS-class token, not a plain
 *  color: default, optional transparent, the named `swatches`, a minted `bg-custom-<hex>` from the
 *  native picker, or a `grad:`/`fx:` paint token from the Gradient/Effect tabs (`onPaint`, assigned
 *  directly — no minted class). `resolve` turns a token into a CSS color for the swatch preview. */
export function TokenColorField({
  current,
  label,
  swatches,
  resolve,
  onPick,
  onCustom,
  onCustomLive,
  onPaint,
  onPaintLive,
  allowTransparent,
}: {
  current?: string | null
  label: string
  swatches: string[]
  resolve: (value: string) => string
  onPick: (value: string) => void
  onCustom: (hex: string) => void
  onCustomLive?: (hex: string) => void
  onPaint?: (token: string) => void
  onPaintLive?: (token: string) => void
  allowTransparent?: boolean
}) {
  const cur = current || 'bg-default'
  const paint = isPaintToken(cur)
  const items: SwatchSpec[] = [
    {
      key: 'bg-default',
      color: resolve('bg-default'),
      title: 'default',
      onSelect: () => onPick('bg-default'),
    },
  ]
  if (allowTransparent)
    items.push({
      key: 'bg-transparent',
      color: CHECKER,
      title: 'transparent',
      onSelect: () => onPick('bg-transparent'),
    })
  for (const k of swatches)
    items.push({
      key: k,
      color: resolve(k),
      title: k,
      onSelect: () => onPick(k),
    })

  const solid = (
    <SolidTab
      swatches={items}
      activeKey={!paint && cur && items.some((i) => i.key === cur) ? cur : null}
      customActive={!!current && current.startsWith('bg-custom-')}
      custom={{
        value: bgInputHex(current, resolve),
        onCommit: onCustom,
        onLive: onCustomLive,
      }}
    />
  )

  return (
    <PaintPicker
      triggerColor={bgSwatch(cur, resolve)}
      title={label}
      value={cur}
      solid={solid}
      showPaint={!!onPaint}
      onCommitToken={onPaint ?? (() => {})}
      onLiveToken={onPaintLive}
    />
  )
}
