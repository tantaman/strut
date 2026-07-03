// Floating selection inspector (spec §6.2/§6.3/§8.5): when exactly one component is selected on the
// stage, offer property controls — text font/size/color, shape fill, z-order, and CSS classes. All
// edits go through the named Rindle mutators (setText/setShapeFill/setComponentZ/setComponentClasses).

import { memo, useState } from 'react'
import { FONT_FAMILIES, FONT_SIZES } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { COLOR_SWATCHES, cssHex } from './types'
import type { AnyComponent } from './types'
import { ComponentDataReader, componentRefKey } from './componentFragments'
import type { ComponentRef } from './componentFragments'

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

/** Swatch grid + native picker + recents. `value`/`onChange` use bare hex (no leading `#`). */
function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const [recents, setRecents] = useState<string[]>(readRecents)
  const current = cssHex(value, '111111')
  const pick = (hex: string) => {
    const bare = hex.replace(/^#+/, '').toLowerCase()
    pushRecent(bare)
    setRecents(readRecents())
    onChange(bare)
  }
  return (
    <div className="insp__color">
      <div className="swatches swatches--sm">
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
      <label className="insp__custom">
        <input
          type="color"
          value={current}
          onChange={(e) => pick(e.target.value)}
        />
        <span>{current}</span>
      </label>
    </div>
  )
}

export function Inspector({
  componentRefs,
  getComponents,
}: {
  componentRefs: readonly ComponentRef[]
  getComponents: () => AnyComponent[]
}) {
  const editor = useEditor()

  if (editor.selected.size !== 1) return null
  const selectedId = [...editor.selected][0]

  if (editor.draggingComponentId === selectedId) {
    const components = getComponents()
    const selected = components.find((c) => c.id === selectedId)
    return selected ? (
      <InspectorPanel c={selected} components={components} />
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
              <InspectorPanel c={c} components={getComponents()} />
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
}

const InspectorPanel = memo(function InspectorPanel({
  c,
  components,
}: InspectorPanelProps) {
  const mutate = useMutate()
  const history = useHistory()
  const allComponents = components.some((x) => x.id === c.id)
    ? components.map((x) => (x.id === c.id ? c : x))
    : [...components, c]

  const editText = (
    patch: Partial<
      Pick<AnyComponent, 'size' | 'color' | 'font_family' | 'text'>
    >,
    label = 'Edit text',
  ) => {
    const before = {
      text: c.text ?? '',
      size: c.size ?? 72,
      color: c.color ?? '111111',
      font_family: c.font_family ?? 'Lato',
    }
    const after = {
      text: patch.text ?? before.text,
      size: patch.size ?? before.size,
      color: patch.color ?? before.color,
      font_family: patch.font_family ?? before.font_family,
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

      {c.kind === 'text' && (
        <>
          <label className="insp__row">
            <span>Font</span>
            <select
              value={c.font_family || 'Lato'}
              onChange={(e) => editText({ font_family: e.target.value })}
            >
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
                editText({ size: Math.max(8, Number(e.target.value) || 72) })
              }
              list="strut-font-sizes"
            />
            <datalist id="strut-font-sizes">
              {FONT_SIZES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <div className="insp__row insp__row--stack">
            <span>Color</span>
            <ColorField
              value={c.color ?? '111111'}
              onChange={(hex) => editText({ color: hex })}
            />
          </div>
        </>
      )}

      {c.kind === 'shape' && (
        <div className="insp__row insp__row--stack">
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
    sameZBounds(prev.components, next.components)
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
        a.font_family === b.font_family
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
