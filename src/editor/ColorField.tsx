// The shared color picker (spec §8.5). One presentational core — `ColorPicker` — renders the Popchip
// trigger, the swatch grid, the native "dynamic" picker, and (optionally) recents. Two thin adapters
// feed it the two value models the app actually stores:
//
//   • ColorField      — raw hex (text font color, shape fill, deck heading/body color).
//   • TokenColorField — a CSS-class token vocabulary (`bg-orange`, `bg-transparent`, `img:<url>`,
//                       minted `bg-custom-<hex>`) for deck background / surface, which must express
//                       more than a flat color. See resolveBackground/resolveSurface in ./types.
//
// Keeping the presentation in one place means both pickers share identical trigger/panel/highlight
// behavior — a fix here (stable-width label, selected-swatch highlight for custom picks) lands once.

import { useEffect, useRef, useState } from 'react'
import { COLOR_SWATCHES, cssHex } from './types'
import { Popchip } from './Popchip'

const RECENTS_KEY = 'strut.colorChooser'

function readRecents(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
    return Array.isArray(v) ? v.slice(0, 8) : []
  } catch {
    return []
  }
}

function pushRecent(hex: string) {
  if (typeof localStorage === 'undefined') return
  const next = [hex, ...readRecents().filter((h) => h !== hex)].slice(0, 8)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
}

// The checkerboard fill used to depict a transparent background.
const CHECKER =
  'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 8px 8px'
const HEX6 = /^#[0-9a-f]{6}$/i

/** The trigger swatch color for a background/surface value (checker for transparent). */
function bgSwatch(value: string, resolve: (v: string) => string): string {
  return value === 'bg-transparent' ? CHECKER : resolve(value || 'bg-default')
}

/** A valid `#rrggbb` seed for the native custom picker: the current custom hex if the value is one,
 *  else the resolved class color when that's a plain hex (gradients/transparent fall back to white). */
function bgInputHex(
  value: string | null | undefined,
  resolve: (v: string) => string,
): string {
  if (value && value.startsWith('bg-custom-'))
    return '#' + value.slice('bg-custom-'.length)
  const r = resolve(value || 'bg-default')
  return HEX6.test(r) ? r : '#ffffff'
}

/** A native OS color picker that fires `onCommit` ONCE, when the picker is dismissed (the DOM
 *  `change` event) — not on every frame while the user drags. A controlled `<input type=color>`
 *  would call back continuously (React `onChange` is the `input` event), which floods recents /
 *  mints a custom color per frame. So we run it uncontrolled: sync the swatch via a ref when `value`
 *  changes externally, and only read it back on commit. The label shows the hex without a leading `#`. */
export function NativeColorInput({
  value,
  onCommit,
  active,
}: {
  value: string // '#rrggbb'
  onCommit: (hex: string) => void
  // When the current selection is a custom color that matches no preset, the native chip *is* the
  // selected swatch — outline it so the picker always shows what's currently chosen.
  active?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.value = value
  }, [value])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const commit = () => onCommit(el.value)
    el.addEventListener('change', commit)
    return () => el.removeEventListener('change', commit)
  }, [onCommit])
  return (
    <label className={'insp__custom' + (active ? ' is-active' : '')}>
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

/** The presentational core: a collapsed Popchip trigger that opens a sub-popover holding the swatch
 *  grid, the native custom picker, and optional recents. `activeKey` outlines the current grid swatch
 *  (null = none); `customActive` outlines the native chip when the selection came from it. */
function ColorPicker({
  triggerColor,
  triggerLabel,
  title,
  swatches,
  activeKey,
  custom,
  customActive,
  recents,
}: {
  triggerColor: string
  triggerLabel?: string
  title?: string
  swatches: SwatchSpec[]
  activeKey: string | null
  custom: { value: string; onCommit: (hex: string) => void }
  customActive: boolean
  recents?: { color: string; onSelect: () => void }[]
}) {
  return (
    <Popchip swatch={triggerColor} label={triggerLabel} title={title}>
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
      {/* Native picker sits above recents so adding a recent grows the panel downward without
          shoving the grid/custom controls around mid-interaction. */}
      <NativeColorInput
        value={custom.value}
        onCommit={custom.onCommit}
        active={customActive}
      />
      {recents && recents.length > 0 && (
        <div className="swatches swatches--sm">
          {recents.map((r) => (
            <button
              key={'r' + r.color}
              className="swatch"
              style={{ background: r.color }}
              title={r.color}
              onClick={r.onSelect}
            />
          ))}
        </div>
      )}
    </Popchip>
  )
}

/** Raw-hex color control (text color, shape fill, deck heading/body color). `value`/`onChange` use
 *  bare hex (no leading `#`). With `themeDefault`, value '' = inherit the deck theme (a leading "T"
 *  swatch + a "Theme" chip label). */
export function ColorField({
  value,
  onChange,
  themeDefault,
}: {
  value: string
  onChange: (hex: string) => void
  themeDefault?: { color: string; title: string }
}) {
  const [recents, setRecents] = useState<string[]>(readRecents)
  const inherited = !!themeDefault && !value
  const current = cssHex(value, themeDefault ? themeDefault.color : '111111')
  const valueHex = value.replace(/^#+/, '').toLowerCase()
  const isPreset = COLOR_SWATCHES.includes(valueHex)
  const pick = (hex: string) => {
    const bare = hex.replace(/^#+/, '').toLowerCase()
    pushRecent(bare)
    setRecents(readRecents())
    onChange(bare)
  }

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
      onSelect: () => pick(h),
    })

  return (
    <ColorPicker
      triggerColor={current}
      triggerLabel={inherited ? 'Theme' : current.replace(/^#/, '')}
      title="Color"
      swatches={swatches}
      activeKey={inherited ? '__theme__' : isPreset ? valueHex : null}
      // A non-empty hex that matches no preset came from the native picker — highlight it there so
      // a custom pick still reads as the currently selected swatch (bug: the highlight went blank).
      customActive={!inherited && valueHex !== '' && !isPreset}
      custom={{ value: current, onCommit: pick }}
      recents={recents.map((h) => ({
        color: '#' + h,
        onSelect: () => pick(h),
      }))}
    />
  )
}

/** Class-token color control (deck background / surface). The value is a CSS-class token, not a plain
 *  color: default, optional transparent, the named `swatches`, or a minted `bg-custom-<hex>` from the
 *  native picker (spec §8.3). `resolve` turns a token into a CSS color for the swatch preview. */
export function TokenColorField({
  current,
  label,
  swatches,
  resolve,
  onPick,
  onCustom,
  allowTransparent,
}: {
  current?: string | null
  label: string
  swatches: string[]
  resolve: (value: string) => string
  onPick: (value: string) => void
  onCustom: (hex: string) => void
  allowTransparent?: boolean
}) {
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

  return (
    <ColorPicker
      triggerColor={bgSwatch(current || 'bg-default', resolve)}
      title={label}
      swatches={items}
      activeKey={
        current && items.some((i) => i.key === current) ? current : null
      }
      // A custom (native-picked) color is a `bg-custom-<hex>` class that matches no grid swatch —
      // mark the native chip as the selected swatch so the dynamic pick stays visibly current.
      customActive={!!current && current.startsWith('bg-custom-')}
      custom={{ value: bgInputHex(current, resolve), onCommit: onCustom }}
    />
  )
}
