// Floating selection inspector (spec §6.2/§6.3/§8.5): when exactly one component is selected on the
// stage, offer property controls — text font/size/color, shape fill, z-order, and CSS classes. All
// edits go through the named Rindle mutators (setText/setShapeFill/setComponentZ/setComponentClasses).

import { memo, useEffect, useRef, useState } from 'react'
import { DEFAULT_FONT, FONT_FAMILIES, FONT_SIZES } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { COLOR_SWATCHES, cssHex, textTypeOf } from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import { ComponentDataReader, componentRefKey } from './componentFragments'
import type { ComponentRef } from './componentFragments'
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

/** A native OS color picker that fires `onCommit` ONCE, when the picker is dismissed (the DOM
 *  `change` event) — not on every frame while the user drags. A controlled `<input type=color>`
 *  would call back continuously (React `onChange` is the `input` event), which floods recents /
 *  mints a custom color per frame. So we run it uncontrolled: sync the swatch via a ref when `value`
 *  changes externally, and only read it back on commit. The label shows the hex without a leading `#`. */
export function NativeColorInput({
  value,
  onCommit,
}: {
  value: string // '#rrggbb'
  onCommit: (hex: string) => void
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
    <label className="insp__custom">
      <input ref={ref} type="color" defaultValue={value} />
      <span>{value.replace(/^#/, '')}</span>
    </label>
  )
}

/** A collapsed color control: the trigger shows only the current swatch + value; the swatch grid,
 *  recents and native picker live in a click-to-open sub-popover (Figma-style — see Popchip). `value`
 *  /`onChange` use bare hex (no leading `#`). With `themeDefault`, value '' = inherit the deck theme
 *  (a leading "T" swatch + a "Theme" chip label). Exported for the Header's theme popover. */
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
  const pick = (hex: string) => {
    const bare = hex.replace(/^#+/, '').toLowerCase()
    pushRecent(bare)
    setRecents(readRecents())
    onChange(bare)
  }
  return (
    <Popchip
      swatch={current}
      label={inherited ? 'Theme' : current.replace(/^#/, '')}
      title="Color"
    >
      <div className="swatches swatches--sm">
        {themeDefault && (
          <button
            className={
              'swatch swatch--theme' + (inherited ? ' is-active' : '')
            }
            style={{ background: cssHex(themeDefault.color, '111111') }}
            title={themeDefault.title}
            onClick={() => onChange('')}
          >
            T
          </button>
        )}
        {COLOR_SWATCHES.map((h) => (
          <button
            key={h}
            className={
              'swatch' +
              (h === value.replace(/^#+/, '').toLowerCase() ? ' is-active' : '')
            }
            style={{ background: '#' + h }}
            title={'#' + h}
            onClick={() => pick(h)}
          />
        ))}
      </div>
      {recents.length > 0 && (
        <div className="swatches swatches--sm">
          {recents.map((h) => (
            <button
              key={h}
              className="swatch"
              style={{ background: '#' + h }}
              title={'#' + h}
              onClick={() => pick(h)}
            />
          ))}
        </div>
      )}
      <NativeColorInput value={current} onCommit={pick} />
    </Popchip>
  )
}

export function Inspector({
  componentRefs,
  getComponents,
  deck,
}: {
  componentRefs: readonly ComponentRef[]
  getComponents: () => AnyComponent[]
  deck?: DeckThemeFields | null
}) {
  const editor = useEditor()

  if (editor.selected.size !== 1) return null
  const selectedId = [...editor.selected][0]

  if (editor.draggingComponentId === selectedId) {
    const components = getComponents()
    const selected = components.find((c) => c.id === selectedId)
    return selected ? (
      <InspectorPanel c={selected} components={components} deck={deck} />
    ) : null
  }

  return (
    <>
      {componentRefs.map((component) => (
        <ComponentDataReader
          key={componentRefKey(component)}
          component={component}
        >
          {(c) =>
            c.id === selectedId ? (
              <InspectorPanel c={c} components={getComponents()} deck={deck} />
            ) : null
          }
        </ComponentDataReader>
      ))}
    </>
  )
}

interface InspectorPanelProps {
  c: AnyComponent
  components: readonly AnyComponent[]
  deck?: DeckThemeFields | null
}

const InspectorPanel = memo(function InspectorPanel({
  c,
  components,
  deck,
}: InspectorPanelProps) {
  const mutate = useMutate()
  const history = useHistory()
  const allComponents = components.some((x) => x.id === c.id)
    ? components.map((x) => (x.id === c.id ? c : x))
    : [...components, c]

  // '' color/font_family = inherit the deck theme for this component's category — preserved
  // through edits (defaults here must NOT materialize a concrete override).
  const editText = (
    patch: Partial<
      Pick<
        AnyComponent,
        'size' | 'color' | 'font_family' | 'text' | 'text_type'
      >
    >,
    label = 'Edit text',
  ) => {
    const before = {
      text: c.text ?? '',
      size: c.size ?? 72,
      color: c.color ?? '',
      font_family: c.font_family ?? '',
      text_type: textTypeOf(c) as string,
    }
    const after = {
      text: patch.text ?? before.text,
      size: patch.size ?? before.size,
      color: patch.color ?? before.color,
      font_family: patch.font_family ?? before.font_family,
      text_type: patch.text_type ?? before.text_type,
    }
    const apply = (v: typeof before) => mutate.setText({ id: c.id, ...v })
    apply(after)
    history.push({ label, redo: () => apply(after), undo: () => apply(before) })
  }

  const setFill = (fill: string) => {
    const before = c.fill ?? '3498db'
    if (before === fill) return
    mutate.setShapeFill({ id: c.id, fill })
    history.push({
      label: 'Fill',
      redo: () => mutate.setShapeFill({ id: c.id, fill }),
      undo: () => mutate.setShapeFill({ id: c.id, fill: before }),
    })
  }

  const setClasses = (next: string) => {
    const before = c.custom_classes
    if (before === next) return
    const apply = (v: string) =>
      mutate.setComponentClasses({
        id: c.id,
        custom_classes: v,
      })
    apply(next)
    history.push({
      label: 'Classes',
      redo: () => apply(next),
      undo: () => apply(before),
    })
  }

  const setZ = (z: number) => {
    const before = c.z_order
    mutate.setComponentZ({ id: c.id, z_order: z })
    history.push({
      label: 'Order',
      redo: () => mutate.setComponentZ({ id: c.id, z_order: z }),
      undo: () => mutate.setComponentZ({ id: c.id, z_order: before }),
    })
  }

  const maxZ = allComponents.reduce((m, x) => Math.max(m, x.z_order), 0)
  const minZ = allComponents.reduce((m, x) => Math.min(m, x.z_order), 0)

  return (
    <div className="insp" onPointerDown={(e) => e.stopPropagation()}>
      <div className="insp__head">{c.kind}</div>

      {c.kind === 'text' &&
        (() => {
          const cat = textTypeOf(c)
          const themeFont =
            (cat === 'heading' ? deck?.heading_font : deck?.body_font) ||
            DEFAULT_FONT
          const themeColor =
            (cat === 'heading' ? deck?.heading_color : deck?.body_color) ||
            '111111'
          return (
            <>
              <label className="insp__row">
                <span>Type</span>
                <select
                  value={cat}
                  onChange={(e) =>
                    editText({ text_type: e.target.value }, 'Text type')
                  }
                >
                  <option value="body">Body</option>
                  <option value="heading">Heading</option>
                </select>
              </label>
              <label className="insp__row">
                <span>Font</span>
                <select
                  value={c.font_family || ''}
                  onChange={(e) => editText({ font_family: e.target.value })}
                >
                  <option value="">Theme · {themeFont}</option>
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="insp__row">
                <span>Size</span>
                <input
                  type="number"
                  min={8}
                  max={400}
                  value={c.size ?? 72}
                  onChange={(e) =>
                    editText({
                      size: Math.max(8, Number(e.target.value) || 72),
                    })
                  }
                  list="strut-font-sizes"
                />
                <datalist id="strut-font-sizes">
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              <div className="insp__row">
                <span>Color</span>
                <ColorField
                  value={c.color ?? ''}
                  onChange={(hex) => editText({ color: hex })}
                  themeDefault={{
                    color: themeColor,
                    title: `Theme (${cat}) color`,
                  }}
                />
              </div>
            </>
          )
        })()}

      {c.kind === 'shape' && (
        <div className="insp__row">
          <span>Fill</span>
          <ColorField value={c.fill ?? '3498db'} onChange={setFill} />
        </div>
      )}

      <label className="insp__row">
        <span>Classes</span>
        <input
          type="text"
          placeholder="css-class…"
          defaultValue={c.custom_classes}
          onBlur={(e) => setClasses(e.target.value.trim())}
        />
      </label>

      <div className="insp__row insp__zrow">
        <span>Order</span>
        <button
          className="btn btn--ghost"
          disabled={c.z_order >= maxZ}
          onClick={() => setZ(maxZ + 1)}
        >
          Front
        </button>
        <button
          className="btn btn--ghost"
          disabled={c.z_order <= minZ}
          onClick={() => setZ(minZ - 1)}
        >
          Back
        </button>
      </div>
    </div>
  )
}, sameInspectorPanelProps)

function sameInspectorPanelProps(
  prev: InspectorPanelProps,
  next: InspectorPanelProps,
): boolean {
  return (
    sameInspectorComponent(prev.c, next.c) &&
    sameZBounds(prev.components, next.components) &&
    sameDeckTheme(prev.deck, next.deck)
  )
}

function sameDeckTheme(
  a: DeckThemeFields | null | undefined,
  b: DeckThemeFields | null | undefined,
): boolean {
  return (
    a?.heading_font === b?.heading_font &&
    a?.heading_color === b?.heading_color &&
    a?.body_font === b?.body_font &&
    a?.body_color === b?.body_color
  )
}

function sameInspectorComponent(a: AnyComponent, b: AnyComponent): boolean {
  if (
    a.id !== b.id ||
    a.kind !== b.kind ||
    a.z_order !== b.z_order ||
    a.custom_classes !== b.custom_classes
  )
    return false

  switch (a.kind) {
    case 'text':
      return (
        a.text === b.text &&
        a.size === b.size &&
        a.color === b.color &&
        a.font_family === b.font_family &&
        a.text_type === b.text_type
      )
    case 'shape':
      return a.fill === b.fill
    default:
      return true
  }
}

function sameZBounds(
  a: readonly AnyComponent[],
  b: readonly AnyComponent[],
): boolean {
  if (a.length !== b.length) return false
  const boundsA = zBounds(a)
  const boundsB = zBounds(b)
  return boundsA.min === boundsB.min && boundsA.max === boundsB.max
}

function zBounds(components: readonly AnyComponent[]): {
  min: number
  max: number
} {
  let min = Infinity
  let max = -Infinity
  for (const c of components) {
    min = Math.min(min, c.z_order)
    max = Math.max(max, c.z_order)
  }
  return { min, max }
}
