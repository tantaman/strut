// The shared color picker (spec §8.5). One presentational core — `ColorPicker` — renders the Popchip
// trigger and a sub-popover holding the swatch grid + the native "dynamic" picker. Two thin adapters
// feed it the two value models the app actually stores:
//
//   • ColorField      — raw hex (text font color, shape fill, deck heading/body color).
//   • TokenColorField — a CSS-class token vocabulary (`bg-orange`, `bg-transparent`, `img:<url>`,
//                       minted `bg-custom-<hex>`) for deck background / surface, which must express
//                       more than a flat color. See resolveBackground/resolveSurface in ./types.
//
// Keeping the presentation in one place means every picker looks and behaves identically: the trigger
// is a bare swatch chip (no hex label), and the panel is just the swatch grid + the native picker (no
// recents row). So the four theme controls and the inspector's fill/text pickers all match.
//
// Live drag: the native picker streams `input` events continuously while the user drags the spectrum /
// hue. Adapters may pass an `onLive` to apply each frame through a Rindle `.folded` (debounced,
// last-value-wins) mutation for real-time preview; the terminating `change` still runs `onCommit` for
// the durable write (mint a custom class, push to history, …). Callers that omit `onLive` stay
// commit-only — the picker only applies when it's dismissed.

import { useEffect, useRef } from 'react'
import { COLOR_SWATCHES, cssHex } from './types'
import { Popchip } from './Popchip'

// The checkerboard fill used to depict a transparent background.
const CHECKER =
  'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 8px 8px'
const HEX6 = /^#[0-9a-f]{6}$/i

/** Bare, lowercased hex (stored form) from any `#rrggbb` / `rrggbb` the picker hands back. */
function bareHex(hex: string): string {
  return hex.replace(/^#+/, '').toLowerCase()
}

/** The trigger swatch color for a background/surface value (checker for transparent). */
function bgSwatch(
  value: string | null | undefined,
  resolve: (v: string) => string,
): string {
  return value === 'bg-transparent' ? CHECKER : resolve(value ?? 'bg-default')
}

/** A valid `#rrggbb` seed for the native custom picker: the current custom hex if the value is one,
 *  else the resolved class color when that's a plain hex (gradients/transparent fall back to white). */
function bgInputHex(
  value: string | null | undefined,
  resolve: (v: string) => string,
): string {
  if (value && value.startsWith('bg-custom-'))
    return '#' + value.slice('bg-custom-'.length)
  const r = resolve(value ?? 'bg-default')
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

/** The presentational core: a collapsed Popchip trigger (bare swatch chip) that opens a sub-popover
 *  holding the swatch grid and the native custom picker. `activeKey` outlines the current grid swatch
 *  (null = none); `customActive` outlines the native chip when the selection came from it. */
function ColorPicker({
  triggerColor,
  title,
  swatches,
  activeKey,
  custom,
  customActive,
}: {
  triggerColor: string
  title?: string
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
    <Popchip swatch={triggerColor} title={title}>
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
    </Popchip>
  )
}

/** Raw-hex color control (text color, shape fill, deck heading/body color). `value`/`onChange` use
 *  bare hex (no leading `#`). With `themeDefault`, value '' = inherit the deck theme (a leading "T"
 *  swatch). `onLive` (optional) previews a native-picker drag in real time; `onChange` is the commit. */
export function ColorField({
  value,
  onChange,
  onLive,
  themeDefault,
}: {
  value: string
  onChange: (hex: string) => void
  onLive?: (hex: string) => void
  themeDefault?: { color: string; title: string }
}) {
  const inherited = !!themeDefault && !value
  const current = cssHex(value, themeDefault ? themeDefault.color : '111111')
  const valueHex = value.replace(/^#+/, '').toLowerCase()
  const isPreset = COLOR_SWATCHES.includes(valueHex)

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

  return (
    <ColorPicker
      triggerColor={current}
      // No visible label (chip-only trigger); the tooltip carries the "inherits theme" hint that the
      // dropped label used to show, so an inherited swatch is still explainable on hover.
      title={inherited ? themeDefault.title : 'Color'}
      swatches={swatches}
      activeKey={inherited ? '__theme__' : isPreset ? valueHex : null}
      // A non-empty hex that matches no preset came from the native picker — highlight it there so
      // a custom pick still reads as the currently selected swatch.
      customActive={!inherited && valueHex !== '' && !isPreset}
      custom={{
        value: current,
        onCommit: (hex) => onChange(bareHex(hex)),
        onLive: onLive ? (hex) => onLive(bareHex(hex)) : undefined,
      }}
    />
  )
}

/** Class-token color control (deck background / surface). The value is a CSS-class token, not a plain
 *  color: default, optional transparent, the named `swatches`, or a minted `bg-custom-<hex>` from the
 *  native picker (spec §8.3). `resolve` turns a token into a CSS color for the swatch preview.
 *  `onCustomLive` (optional) previews a native-picker drag in real time; `onCustom` is the commit. */
export function TokenColorField({
  current,
  label,
  swatches,
  resolve,
  onPick,
  onCustom,
  onCustomLive,
  allowTransparent,
  defaultToken = 'bg-default',
  defaultTitle = 'default',
  defaultGlyph,
}: {
  current?: string | null
  label: string
  swatches: { key: string; name: string }[]
  resolve: (value: string) => string
  onPick: (value: string) => void
  onCustom: (hex: string) => void
  onCustomLive?: (hex: string) => void
  allowTransparent?: boolean
  defaultToken?: string
  defaultTitle?: string
  defaultGlyph?: string
}) {
  const active = current ?? defaultToken
  const items: SwatchSpec[] = [
    {
      key: defaultToken,
      color: resolve(defaultToken),
      title: defaultTitle,
      glyph: defaultGlyph,
      onSelect: () => onPick(defaultToken),
    },
  ]
  if (allowTransparent)
    items.push({
      key: 'bg-transparent',
      color: CHECKER,
      title: 'transparent',
      onSelect: () => onPick('bg-transparent'),
    })
  for (const s of swatches)
    items.push({
      key: s.key,
      color: resolve(s.key),
      title: s.name,
      onSelect: () => onPick(s.key),
    })

  return (
    <ColorPicker
      triggerColor={bgSwatch(active, resolve)}
      title={label}
      swatches={items}
      activeKey={items.some((i) => i.key === active) ? active : null}
      // A custom (native-picked) color is a `bg-custom-<hex>` class that matches no grid swatch —
      // mark the native chip as the selected swatch so the dynamic pick stays visibly current.
      customActive={!!current && current.startsWith('bg-custom-')}
      custom={{
        value: bgInputHex(active, resolve),
        onCommit: onCustom,
        onLive: onCustomLive,
      }}
    />
  )
}
