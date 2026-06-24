// Editor header (spec §4.3): logo/back, deck title, component inserters (hidden in overview),
// background/surface pickers, the Slides|Overview mode toggle, and Present.

import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Code2,
  Download,
  Image as ImageIcon,
  Play,
  Redo2,
  Shapes,
  Square,
  Type,
  Undo2,
  Video,
  Globe,
} from 'lucide-react'
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, newId } from '../config'
import { useApp, useMutate } from '../rindle/RindleProvider'
import { exportDeckHTML, exportDeckJSON } from './deckIO'
import { useEditor } from './EditorState'
import { useHistory, useHistoryState } from './UndoProvider'
import { CssEditorModal } from './CssEditor'
import type { ComponentTable } from '../../shared/app-def'
import {
  BACKGROUND_SWATCHES,
  resolveBackground,
  resolveSurface,
  SHAPE_NAMES,
  SHAPES,
  SURFACE_SWATCHES,
} from './types'
import { parseVideo } from './render'

interface DeckRow {
  id: string
  title: string
  background: string
  surface: string
  canned_transition: string
  custom_stylesheet: string
}

// new components sort above existing ones; a coarse monotonic z is fine (z is just an ordering)
const zNow = () => Math.floor(Date.now() / 1000)
const place = () => ({
  x: 440 + (Date.now() % 4) * 24,
  y: 280 + (Date.now() % 3) * 24,
})

export function Header({ deck }: { deck: DeckRow | null }) {
  const editor = useEditor()
  const mutate = useMutate()
  const app = useApp()
  const history = useHistory()
  const hist = useHistoryState()
  const navigate = useNavigate()
  const [menu, setMenu] = useState<
    | null
    | 'shapes'
    | 'bg'
    | 'surface'
    | 'media-image'
    | 'media-video'
    | 'media-web'
    | 'export'
  >(null)
  const [exporting, setExporting] = useState(false)
  const [cssOpen, setCssOpen] = useState(false)
  const active = editor.activeSlideId
  const canInsert = active != null && editor.mode === 'slide'

  // Insert a component as one undoable step (undo removes it; redo re-adds with the same id).
  function recordInsert(
    table: ComponentTable,
    id: string,
    doAdd: () => void,
    label: string,
  ) {
    doAdd()
    editor.select(id)
    history.push({
      label,
      redo: doAdd,
      undo: () => mutate.removeComponent({ table, id }),
    })
  }

  function addText() {
    if (!active) return
    const id = newId()
    const p = place()
    const args = {
      id,
      slideId: active,
      x: p.x,
      y: p.y,
      z_order: zNow(),
      text: 'New text',
      size: DEFAULT_FONT_SIZE,
      color: '111111',
      font_family: DEFAULT_FONT,
    }
    recordInsert('text_component', id, () => mutate.addText(args), 'Add text')
  }

  function addShape(name: string) {
    if (!active) return
    const id = newId()
    const p = place()
    const args = {
      id,
      slideId: active,
      x: p.x,
      y: p.y,
      z_order: zNow(),
      shape: name,
      markup: SHAPES[name],
      fill: '3498db',
    }
    recordInsert(
      'shape_component',
      id,
      () => mutate.addShape(args),
      'Add shape',
    )
    setMenu(null)
  }

  function addMedia(kind: 'image' | 'video' | 'web', url: string) {
    if (!active || !url) return
    const id = newId()
    const p = place()
    const base = { id, slideId: active, x: p.x, y: p.y, z_order: zNow() }
    if (kind === 'image') {
      const args = {
        ...base,
        src: url,
        image_type: '',
        scale_w: 400,
        scale_h: 300,
      }
      recordInsert(
        'image_component',
        id,
        () => mutate.addImage(args),
        'Add image',
      )
    } else if (kind === 'video') {
      const args = { ...base, src: url, ...parseVideo(url) }
      recordInsert(
        'video_component',
        id,
        () => mutate.addVideo(args),
        'Add video',
      )
    } else {
      const args = { ...base, src: url }
      recordInsert(
        'webframe_component',
        id,
        () => mutate.addWebframe(args),
        'Add web frame',
      )
    }
    setMenu(null)
  }

  function setBg(scope: 'bg' | 'surface', value: string) {
    if (!deck) return
    mutate.setDeckTheme({
      id: deck.id,
      [scope === 'bg' ? 'background' : 'surface']: value,
      now: Date.now(),
    })
    setMenu(null)
  }

  async function doExport(kind: 'json' | 'html') {
    if (!deck || exporting) return
    setMenu(null)
    setExporting(true)
    try {
      if (kind === 'json') await exportDeckJSON(app.store, deck.id)
      else await exportDeckHTML(app.store, deck.id)
    } finally {
      setExporting(false)
    }
  }

  // Custom color: mint a `bg-custom-<hex>` class recorded on the deck (spec §8.3), then assign it.
  function setCustom(scope: 'bg' | 'surface', hex: string) {
    if (!deck) return
    const bare = hex.replace(/^#+/, '').toLowerCase()
    const klass = `bg-custom-${bare}`
    mutate.mintCustomColor({
      id: newId(),
      deckId: deck.id,
      klass,
      style: `.${klass}{background:#${bare}}`,
    })
    setBg(scope, klass)
  }

  return (
    <div className="hdr">
      <Link to="/" className="hdr__home" title="All decks">
        <img src="/strut-logo.png" alt="Strut" />
      </Link>
      <input
        className="hdr__title"
        value={deck?.title ?? ''}
        placeholder="Untitled"
        onChange={(e) =>
          deck &&
          mutate.renameDeck({
            id: deck.id,
            title: e.target.value,
            now: Date.now(),
          })
        }
      />

      {canInsert && (
        <>
          <div className="hdr__sep" />
          <div className="hdr__group">
            <button className="btn" onClick={addText} title="Text">
              <Type size={16} /> Text
            </button>
            <button
              className="btn"
              onClick={() => setMenu('media-image')}
              title="Image"
            >
              <ImageIcon size={16} />
            </button>
            <button
              className="btn"
              onClick={() => setMenu('media-video')}
              title="Video"
            >
              <Video size={16} />
            </button>
            <button
              className="btn"
              onClick={() => setMenu('media-web')}
              title="Web frame"
            >
              <Globe size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="btn"
                onClick={() => setMenu(menu === 'shapes' ? null : 'shapes')}
                title="Shapes"
              >
                <Shapes size={16} />
              </button>
              {menu === 'shapes' && (
                <div className="popover" style={{ top: '110%', left: 0 }}>
                  <div
                    className="swatches"
                    style={{ gridTemplateColumns: 'repeat(4, 30px)' }}
                  >
                    {SHAPE_NAMES.map((n) => (
                      <button
                        key={n}
                        className="swatch"
                        title={n}
                        style={{
                          width: 30,
                          height: 30,
                          color: '#3498db',
                          padding: 3,
                        }}
                        onClick={() => addShape(n)}
                        dangerouslySetInnerHTML={{ __html: SHAPES[n] }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="hdr__sep" />
      <div className="hdr__group">
        <button
          className="btn"
          disabled={!hist.canUndo}
          onClick={() => history.undo()}
          title={hist.undoLabel ? `Undo ${hist.undoLabel}` : 'Undo (⌘Z)'}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="btn"
          disabled={!hist.canRedo}
          onClick={() => history.redo()}
          title={hist.redoLabel ? `Redo ${hist.redoLabel}` : 'Redo (⇧⌘Z)'}
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="hdr__sep" />
      <div className="hdr__group">
        <BgButton
          label="Bg"
          current={deck?.background}
          swatches={BACKGROUND_SWATCHES}
          resolve={(v) => resolveBackground(v, v)}
          open={menu === 'bg'}
          onToggle={() => setMenu(menu === 'bg' ? null : 'bg')}
          onPick={(v) => setBg('bg', v)}
          onCustom={(hex) => setCustom('bg', hex)}
          allowTransparent
        />
        <BgButton
          label="Surface"
          current={deck?.surface}
          swatches={SURFACE_SWATCHES}
          resolve={(v) => resolveSurface(v, v)}
          open={menu === 'surface'}
          onToggle={() => setMenu(menu === 'surface' ? null : 'surface')}
          onPick={(v) => setBg('surface', v)}
          onCustom={(hex) => setCustom('surface', hex)}
        />
      </div>

      <div className="hdr__spacer" />

      <div className="seg">
        <button
          className={editor.mode === 'slide' ? 'is-active' : ''}
          onClick={() => editor.setMode('slide')}
        >
          Slides
        </button>
        <button
          className={editor.mode === 'overview' ? 'is-active' : ''}
          onClick={() => editor.setMode('overview')}
        >
          Overview
        </button>
      </div>

      <button
        className="btn"
        onClick={() => setCssOpen(true)}
        title="Custom CSS"
        disabled={!deck}
      >
        <Code2 size={16} /> CSS
      </button>

      <div style={{ position: 'relative' }}>
        <button
          className="btn"
          onClick={() => setMenu(menu === 'export' ? null : 'export')}
          title="Export"
          disabled={!deck || exporting}
        >
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export'}
        </button>
        {menu === 'export' && (
          <div
            className="popover popover--menu"
            style={{ top: '110%', right: 0 }}
          >
            <button className="menu-item" onClick={() => doExport('json')}>
              Strut JSON (.strut)
            </button>
            <button className="menu-item" onClick={() => doExport('html')}>
              Standalone HTML (impress.js)
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn--primary"
        onClick={() =>
          deck &&
          navigate({ to: '/deck/$deckId/play', params: { deckId: deck.id } })
        }
        title="Present"
      >
        <Play size={16} /> Present
      </button>

      {menu === 'media-image' && (
        <MediaModal
          kind="image"
          onCancel={() => setMenu(null)}
          onSubmit={(u) => addMedia('image', u)}
        />
      )}
      {menu === 'media-video' && (
        <MediaModal
          kind="video"
          onCancel={() => setMenu(null)}
          onSubmit={(u) => addMedia('video', u)}
        />
      )}
      {menu === 'media-web' && (
        <MediaModal
          kind="web"
          onCancel={() => setMenu(null)}
          onSubmit={(u) => addMedia('web', u)}
        />
      )}
      {cssOpen && deck && (
        <CssEditorModal
          deckId={deck.id}
          initial={deck.custom_stylesheet ?? ''}
          onClose={() => setCssOpen(false)}
        />
      )}
    </div>
  )
}

function BgButton({
  label,
  current,
  swatches,
  resolve,
  open,
  onToggle,
  onPick,
  onCustom,
  allowTransparent,
}: {
  label: string
  current?: string
  swatches: string[]
  resolve: (value: string) => string
  open: boolean
  onToggle: () => void
  onPick: (value: string) => void
  onCustom: (hex: string) => void
  allowTransparent?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" onClick={onToggle} title={label}>
        <Square size={14} fill={current ? resolve(current) : 'none'} /> {label}
      </button>
      {open && (
        <div className="popover" style={{ top: '110%', left: 0 }}>
          <div className="swatches">
            <button
              className="swatch"
              title="default"
              style={{ background: resolve('bg-default') }}
              onClick={() => onPick('bg-default')}
            />
            {allowTransparent && (
              <button
                className="swatch"
                title="transparent"
                style={{
                  background:
                    'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 10px 10px',
                }}
                onClick={() => onPick('bg-transparent')}
              />
            )}
            {swatches.map((k) => (
              <button
                key={k}
                className="swatch"
                title={k}
                style={{ background: resolve(k) }}
                onClick={() => onPick(k)}
              />
            ))}
            <label className="swatch swatch--custom" title="custom color">
              +
              <input type="color" onChange={(e) => onCustom(e.target.value)} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function MediaModal({
  kind,
  onCancel,
  onSubmit,
}: {
  kind: 'image' | 'video' | 'web'
  onCancel: () => void
  onSubmit: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const label =
    kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Web page'
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add {label}</h3>
        <input
          type="url"
          autoFocus
          placeholder={
            kind === 'video'
              ? 'YouTube or video URL'
              : kind === 'web'
                ? 'https://…'
                : 'Image URL'
          }
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url) onSubmit(url)
            if (e.key === 'Escape') onCancel()
          }}
        />
        {kind === 'image' && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => onSubmit(String(reader.result))
              reader.readAsDataURL(f)
            }}
          />
        )}
        <div className="modal__row">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={!url}
            onClick={() => onSubmit(url)}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
