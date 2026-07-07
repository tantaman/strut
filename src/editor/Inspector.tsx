// Floating selection inspector (spec §6.2/§6.3/§8.5): when exactly one component is selected on the
// stage, offer property controls — text font/size/color, shape fill, z-order, and CSS classes. All
// edits go through the named Rindle mutators (setText/setShapeFill/setComponentZ/setComponentClasses).

import { memo, useState } from 'react'
import { DEFAULT_FONT, FONT_SIZES } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { useHistory } from './UndoProvider'
import { textTypeOf } from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import { ComponentDataReader, componentRefKey } from './componentFragments'
import type { ComponentRef } from './componentFragments'
import { ColorField } from './ColorField'
import { FontOptions } from './render'
import { uploadArtifact } from './upload'
import { buildArtifactModule } from './artifactBuild'

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

  // Save an artifact's source + freshly-built URL as one undoable step (undo restores the prior code+src).
  const setArtifactProps = (code: string, src: string) => {
    const before = { code: c.code ?? '', src: c.src ?? '' }
    const after = { code, src }
    const apply = (v: typeof before) =>
      mutate.setArtifact({ id: c.id, code: v.code, src: v.src })
    apply(after)
    history.push({
      label: 'Edit artifact',
      redo: () => apply(after),
      undo: () => apply(before),
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
                  <FontOptions />
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

      {c.kind === 'artifact' && (
        <ArtifactControls key={c.id} c={c} onSave={setArtifactProps} />
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

/** Code editor + Run for a runnable artifact. `draft` is a local editing buffer (keyed by component id in
 *  the parent, so selecting a different artifact remounts with fresh code). Run builds the source via the
 *  API and saves both the code and the returned URL onto the component (one undoable step). */
function ArtifactControls({
  c,
  onSave,
}: {
  c: AnyComponent
  onSave: (code: string, src: string) => void
}) {
  const [draft, setDraft] = useState(c.code ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      // A raw React component (JSX + bare `react` imports + default export) is transpiled and given a
      // mount shim here; a plain ES module passes through untouched. See artifactBuild.ts.
      const built = await buildArtifactModule(draft)
      const url = await uploadArtifact(built)
      onSave(draft, url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Build failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="insp__artifact">
      <textarea
        className="insp__code"
        spellCheck={false}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={12}
        style={{
          width: '100%',
          font: '12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace',
          whiteSpace: 'pre',
          resize: 'vertical',
        }}
        placeholder={
          '// Paste a default-exported React component (JSX + Tailwind ok),\n' +
          '// or an ES module that imports from https://esm.sh and renders into #root'
        }
      />
      {error && <p className="modal__error">{error}</p>}
      <div className="insp__row insp__zrow">
        <button className="btn btn--primary" disabled={busy} onClick={run}>
          {busy ? 'Building…' : 'Run'}
        </button>
        <span className="insp__hint" style={{ opacity: 0.6, fontSize: 12 }}>
          runs sandboxed
        </span>
      </div>
    </div>
  )
}

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
    case 'artifact':
      return a.code === b.code && a.src === b.src
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
