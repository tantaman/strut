// Contextual selected-object properties rail. Stage owns geometry and selection commands; this component
// owns only their compact, portalable UI plus the established type-specific Rindle mutations. Keeping
// that split lets the document remain the editor while precise object work appears only when selected.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_FONT, FONT_SIZES } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { buildArtifactModule } from './artifactBuild'
import { ColorField } from './ColorField'
import { ComponentDataReader, componentRefKey } from './componentFragments'
import type { ComponentRef } from './componentFragments'
import { useEditor } from './EditorState'
import type {
  Alignment,
  PrecisionFrame,
  ZReorderAction,
} from './precisionGeometry'
import { FontOptions } from './render'
import { textTypeOf } from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import { useHistory } from './UndoProvider'
import { uploadArtifact } from './upload'

export type PrecisionFramePatch = Partial<
  Pick<PrecisionFrame, 'x' | 'y' | 'w' | 'h' | 'rotate'>
>

export type PrecisionArrangeAction =
  | Alignment
  | 'distribute-horizontal'
  | 'distribute-vertical'
  | 'match-width'
  | 'match-height'

/** Geometry/selection commands stay in Stage so every direct manipulation and rail action shares the
 *  same component snapshots, mutation folding, and one-undo boundary. */
export interface PrecisionInspectorActions {
  frameFor: (component: AnyComponent) => PrecisionFrame
  setFrame: (id: string, patch: PrecisionFramePatch, label: string) => void
  duplicate: (ids: readonly string[]) => void
  delete: (ids: readonly string[]) => void
  arrange: (ids: readonly string[], action: PrecisionArrangeAction) => void
  reorder: (ids: readonly string[], action: ZReorderAction) => void
}

export function Inspector({
  componentRefs,
  getComponents,
  deck,
  actions,
  host,
}: {
  componentRefs: readonly ComponentRef[]
  getComponents: () => AnyComponent[]
  deck?: DeckThemeFields | null
  actions: PrecisionInspectorActions
  host?: HTMLElement | null
}) {
  const editor = useEditor()
  const ids = [...editor.selected]
  if (ids.length === 0) return null

  let content: React.ReactNode
  if (ids.length > 1) {
    content = <MultiInspector ids={ids} actions={actions} />
  } else {
    const selectedId = ids[0]
    if (editor.draggingComponentId === selectedId) {
      const selected = getComponents().find((c) => c.id === selectedId)
      content = selected ? (
        <InspectorPanel c={selected} deck={deck} actions={actions} />
      ) : null
    } else {
      content = (
        <>
          {componentRefs.map((component) => (
            <ComponentDataReader
              key={componentRefKey(component)}
              component={component}
            >
              {(c) =>
                c.id === selectedId ? (
                  <InspectorPanel c={c} deck={deck} actions={actions} />
                ) : null
              }
            </ComponentDataReader>
          ))}
        </>
      )
    }
  }

  return host ? createPortal(content, host) : content
}

function InspectorPanel({
  c,
  deck,
  actions,
}: {
  c: AnyComponent
  deck?: DeckThemeFields | null
  actions: PrecisionInspectorActions
}) {
  const mutate = useMutate()
  const history = useHistory()
  const frame = actions.frameFor(c)
  const ids = [c.id]

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
    const apply = (value: typeof before) =>
      mutate.setText({ id: c.id, ...value })
    apply(after)
    history.push({
      label,
      redo: () => apply(after),
      undo: () => apply(before),
    })
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
    const apply = (custom_classes: string) =>
      mutate.setComponentClasses({ id: c.id, custom_classes })
    apply(next)
    history.push({
      label: 'Classes',
      redo: () => apply(next),
      undo: () => apply(before),
    })
  }

  // Save an artifact's source + freshly-built URL as one undoable step (undo restores prior code+src).
  const setArtifactProps = (code: string, src: string) => {
    const before = { code: c.code ?? '', src: c.src ?? '' }
    const after = { code, src }
    const apply = (value: typeof before) =>
      mutate.setArtifact({ id: c.id, code: value.code, src: value.src })
    apply(after)
    history.push({
      label: 'Edit artifact',
      redo: () => apply(after),
      undo: () => apply(before),
    })
  }

  return (
    <div className="insp" onPointerDown={(event) => event.stopPropagation()}>
      <InspectorTitle
        title={c.kind}
        onDuplicate={() => actions.duplicate(ids)}
        onDelete={() => actions.delete(ids)}
      />

      <InspectorSection title="Frame">
        <div className="insp__frame-grid">
          <NumericCommitField
            label="X"
            title="Horizontal position"
            value={frame.x}
            onCommit={(x) => actions.setFrame(c.id, { x }, 'Set X')}
          />
          <NumericCommitField
            label="Y"
            title="Vertical position"
            value={frame.y}
            onCommit={(y) => actions.setFrame(c.id, { y }, 'Set Y')}
          />
          <NumericCommitField
            label="W"
            title="Width"
            min={1}
            value={frame.w}
            onCommit={(w) => actions.setFrame(c.id, { w }, 'Set width')}
          />
          <NumericCommitField
            label="H"
            title="Height"
            min={1}
            value={frame.h}
            onCommit={(h) => actions.setFrame(c.id, { h }, 'Set height')}
          />
          <NumericCommitField
            label="°"
            title="Angle"
            value={radiansToDegrees(frame.rotate)}
            onCommit={(degrees) =>
              actions.setFrame(
                c.id,
                { rotate: degreesToRadians(degrees) },
                'Set angle',
              )
            }
          />
        </div>
      </InspectorSection>

      {c.kind === 'text' && (
        <TextControls c={c} deck={deck} editText={editText} />
      )}

      {c.kind === 'shape' && (
        <InspectorSection title="Shape">
          <div className="insp__row">
            <span>Color</span>
            <ColorField value={c.fill ?? '3498db'} onChange={setFill} />
          </div>
        </InspectorSection>
      )}

      {c.kind === 'artifact' && (
        <InspectorSection title="Artifact">
          <ArtifactControls key={c.id} c={c} onSave={setArtifactProps} />
        </InspectorSection>
      )}

      <InspectorSection title="Align to slide">
        <AlignmentActions ids={ids} actions={actions} />
      </InspectorSection>

      <InspectorSection title="Layers">
        <LayerActions ids={ids} actions={actions} />
      </InspectorSection>

      <details className="insp__advanced">
        <summary>Advanced</summary>
        <ClassCommitField value={c.custom_classes} onCommit={setClasses} />
      </details>
    </div>
  )
}

function MultiInspector({
  ids,
  actions,
}: {
  ids: readonly string[]
  actions: PrecisionInspectorActions
}) {
  return (
    <div className="insp" onPointerDown={(event) => event.stopPropagation()}>
      <InspectorTitle
        title={`${ids.length} objects`}
        onDuplicate={() => actions.duplicate(ids)}
        onDelete={() => actions.delete(ids)}
      />

      <InspectorSection title="Align">
        <AlignmentActions ids={ids} actions={actions} />
      </InspectorSection>

      <InspectorSection title="Distribute">
        <div className="insp__action-grid insp__action-grid--two">
          <RailButton
            label="Horizontal"
            title="Distribute horizontally"
            onClick={() => actions.arrange(ids, 'distribute-horizontal')}
          />
          <RailButton
            label="Vertical"
            title="Distribute vertically"
            onClick={() => actions.arrange(ids, 'distribute-vertical')}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Match size">
        <div className="insp__action-grid insp__action-grid--two">
          <RailButton
            label="Width"
            title="Match width to the first selected object"
            onClick={() => actions.arrange(ids, 'match-width')}
          />
          <RailButton
            label="Height"
            title="Match height to the first selected object"
            onClick={() => actions.arrange(ids, 'match-height')}
          />
        </div>
      </InspectorSection>

      <InspectorSection title="Layers">
        <LayerActions ids={ids} actions={actions} />
      </InspectorSection>
    </div>
  )
}

function InspectorTitle({
  title,
  onDuplicate,
  onDelete,
}: {
  title: string
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="insp__titlebar">
      <div className="insp__head">{title}</div>
      <div className="insp__toolbar">
        <RailButton
          label="Duplicate"
          title="Duplicate selected objects"
          onClick={onDuplicate}
        />
        <RailButton
          label="Delete"
          title="Delete selected objects"
          danger
          onClick={onDelete}
        />
      </div>
    </div>
  )
}

function InspectorSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="insp__section">
      <h3 className="insp__section-title">{title}</h3>
      {children}
    </section>
  )
}

function AlignmentActions({
  ids,
  actions,
}: {
  ids: readonly string[]
  actions: PrecisionInspectorActions
}) {
  const alignments: readonly {
    action: Alignment
    label: string
    title: string
  }[] = [
    { action: 'left', label: 'Left', title: 'Align left' },
    { action: 'centerX', label: 'Center', title: 'Align horizontal centers' },
    { action: 'right', label: 'Right', title: 'Align right' },
    { action: 'top', label: 'Top', title: 'Align top' },
    { action: 'middleY', label: 'Middle', title: 'Align vertical centers' },
    { action: 'bottom', label: 'Bottom', title: 'Align bottom' },
  ]
  return (
    <div className="insp__action-grid insp__action-grid--three">
      {alignments.map(({ action, label, title }) => (
        <RailButton
          key={action}
          label={label}
          title={title}
          onClick={() => actions.arrange(ids, action)}
        />
      ))}
    </div>
  )
}

function LayerActions({
  ids,
  actions,
}: {
  ids: readonly string[]
  actions: PrecisionInspectorActions
}) {
  const layers: readonly {
    action: ZReorderAction
    label: string
    title: string
  }[] = [
    { action: 'front', label: 'Front', title: 'Bring to front' },
    { action: 'forward', label: 'Forward', title: 'Bring forward one layer' },
    { action: 'backward', label: 'Backward', title: 'Send backward one layer' },
    { action: 'back', label: 'Back', title: 'Send to back' },
  ]
  return (
    <div className="insp__action-grid insp__action-grid--two">
      {layers.map(({ action, label, title }) => (
        <RailButton
          key={action}
          label={label}
          title={title}
          onClick={() => actions.reorder(ids, action)}
        />
      ))}
    </div>
  )
}

function RailButton({
  label,
  title,
  danger = false,
  onClick,
}: {
  label: string
  title: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`btn btn--ghost insp__action${danger ? ' insp__action--danger' : ''}`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function TextControls({
  c,
  deck,
  editText,
}: {
  c: AnyComponent
  deck?: DeckThemeFields | null
  editText: (
    patch: Partial<
      Pick<
        AnyComponent,
        'size' | 'color' | 'font_family' | 'text' | 'text_type'
      >
    >,
    label?: string,
  ) => void
}) {
  const category = textTypeOf(c)
  const themeFont =
    (category === 'heading' ? deck?.heading_font : deck?.body_font) ||
    DEFAULT_FONT
  const themeColor =
    (category === 'heading' ? deck?.heading_color : deck?.body_color) ||
    '111111'

  return (
    <InspectorSection title="Text">
      <label className="insp__row">
        <span>Type</span>
        <select
          value={category}
          onChange={(event) =>
            editText({ text_type: event.target.value }, 'Text type')
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
          onChange={(event) =>
            editText({ font_family: event.target.value }, 'Text font')
          }
        >
          <option value="">Theme · {themeFont}</option>
          <FontOptions />
        </select>
      </label>
      <NumericCommitField
        label="Size"
        title="Text size"
        min={8}
        max={400}
        list="strut-font-sizes"
        value={c.size ?? 72}
        onCommit={(size) => editText({ size }, 'Text size')}
      />
      <datalist id="strut-font-sizes">
        {FONT_SIZES.map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>
      <div className="insp__row">
        <span>Color</span>
        <ColorField
          value={c.color ?? ''}
          onChange={(color) => editText({ color }, 'Text color')}
          themeDefault={{
            color: themeColor,
            title: `Theme (${category}) color`,
          }}
        />
      </div>
    </InspectorSection>
  )
}

function NumericCommitField({
  label,
  title,
  value,
  min,
  max,
  list,
  onCommit,
}: {
  label: string
  title?: string
  value: number
  min?: number
  max?: number
  list?: string
  onCommit: (value: number) => void
}) {
  const focused = useRef(false)
  const [draft, setDraft] = useState(() => formatNumber(value))

  useEffect(() => {
    if (!focused.current) setDraft(formatNumber(value))
  }, [value])

  const reset = () => setDraft(formatNumber(value))
  const commit = () => {
    if (draft.trim() === '') {
      reset()
      return
    }
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) {
      reset()
      return
    }
    const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed))
    setDraft(formatNumber(next))
    if (next !== value) onCommit(next)
  }

  return (
    <label className="insp__field" title={title}>
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        max={max}
        list={list}
        aria-label={title ?? label}
        value={draft}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          focused.current = false
          commit()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            reset()
            event.currentTarget.select()
          }
        }}
      />
    </label>
  )
}

function ClassCommitField({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const focused = useRef(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!focused.current) setDraft(value)
  }, [value])

  const reset = () => setDraft(value)
  const commit = () => {
    const next = draft.trim()
    setDraft(next)
    if (next !== value) onCommit(next)
  }

  return (
    <label className="insp__row">
      <span>Classes</span>
      <input
        type="text"
        placeholder="css-class…"
        value={draft}
        onFocus={() => {
          focused.current = true
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          focused.current = false
          commit()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            reset()
            event.currentTarget.select()
          }
        }}
      />
    </label>
  )
}

/** Code editor + Run for a runnable artifact. Run builds and saves source + URL as one undo step. */
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
      const built = await buildArtifactModule(draft)
      const url = await uploadArtifact(built)
      onSave(draft, url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Build failed')
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
        onChange={(event) => setDraft(event.target.value)}
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
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={run}
        >
          {busy ? 'Building…' : 'Run'}
        </button>
        <span className="insp__hint">runs sandboxed</span>
      </div>
    </div>
  )
}

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(2))
  return String(Object.is(rounded, -0) ? 0 : rounded)
}

const radiansToDegrees = (radians: number): number => (radians * 180) / Math.PI

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180
