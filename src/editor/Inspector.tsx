// Floating selection inspector (spec §6.2/§6.3/§8.5): when exactly one component is selected on the
// stage, offer property controls — text font/size/color, shape fill, z-order, and CSS classes. All
// edits go through the named Rindle mutators (setText/setShapeFill/setComponentZ/setComponentClasses).

import { useState } from 'react'
import { FONT_FAMILIES, FONT_SIZES } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { COLOR_SWATCHES, cssHex, type AnyComponent } from './types'

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
function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
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
            className={'swatch' + (h === value.replace(/^#+/, '').toLowerCase() ? ' is-active' : '')}
            style={{ background: '#' + h }}
            title={'#' + h}
            onClick={() => pick(h)}
          />
        ))}
      </div>
      {recents.length > 0 && (
        <div className="swatches swatches--sm">
          {recents.map((h) => (
            <button key={h} className="swatch" style={{ background: '#' + h }} title={'#' + h} onClick={() => pick(h)} />
          ))}
        </div>
      )}
      <label className="insp__custom">
        <input type="color" value={current} onChange={(e) => pick(e.target.value)} />
        <span>{current}</span>
      </label>
    </div>
  )
}

export function Inspector({ components }: { components: readonly AnyComponent[] }) {
  const editor = useEditor()
  const mutate = useMutate()

  if (editor.selected.size !== 1) return null
  const c = components.find((x) => editor.selected.has(x.id))
  if (!c) return null

  const editText = (patch: Partial<Pick<AnyComponent, 'size' | 'color' | 'font_family' | 'text'>>) =>
    mutate.setText({
      id: c.id,
      text: patch.text ?? c.text ?? '',
      size: patch.size ?? c.size ?? 72,
      color: patch.color ?? c.color ?? '111111',
      font_family: patch.font_family ?? c.font_family ?? 'Lato',
    })

  const maxZ = components.reduce((m, x) => Math.max(m, x.z_order), 0)
  const minZ = components.reduce((m, x) => Math.min(m, x.z_order), 0)

  return (
    <div className="insp" onPointerDown={(e) => e.stopPropagation()}>
      <div className="insp__head">{c.kind}</div>

      {c.kind === 'text' && (
        <>
          <label className="insp__row">
            <span>Font</span>
            <select value={c.font_family || 'Lato'} onChange={(e) => editText({ font_family: e.target.value })}>
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
              onChange={(e) => editText({ size: Math.max(8, Number(e.target.value) || 72) })}
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
            <ColorField value={c.color ?? '111111'} onChange={(hex) => editText({ color: hex })} />
          </div>
        </>
      )}

      {c.kind === 'shape' && (
        <div className="insp__row insp__row--stack">
          <span>Fill</span>
          <ColorField value={c.fill ?? '3498db'} onChange={(hex) => mutate.setShapeFill({ id: c.id, fill: hex })} />
        </div>
      )}

      <label className="insp__row">
        <span>Classes</span>
        <input
          type="text"
          placeholder="css-class…"
          defaultValue={c.custom_classes ?? ''}
          onBlur={(e) => mutate.setComponentClasses({ table: c.table, id: c.id, custom_classes: e.target.value.trim() })}
        />
      </label>

      <div className="insp__row insp__zrow">
        <span>Order</span>
        <button
          className="btn btn--ghost"
          disabled={c.z_order >= maxZ}
          onClick={() => mutate.setComponentZ({ table: c.table, id: c.id, z_order: maxZ + 1 })}
        >
          Front
        </button>
        <button
          className="btn btn--ghost"
          disabled={c.z_order <= minZ}
          onClick={() => mutate.setComponentZ({ table: c.table, id: c.id, z_order: minZ - 1 })}
        >
          Back
        </button>
      </div>
    </div>
  )
}
