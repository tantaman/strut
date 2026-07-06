// Editor header (spec §4.3): logo/back, deck title, component inserters (hidden in overview), the
// per-slide Objects|Body edit-layer toggle, the deck Theme picker, the Slides|Overview mode toggle,
// and Present.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Code2,
  Download,
  FileText,
  Image as ImageIcon,
  Link2,
  Palette,
  Play,
  Redo2,
  Shapes,
  Sparkles,
  Type,
  Undo2,
  Video,
  Globe,
  Share2,
} from 'lucide-react'
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  FONT_FAMILIES,
  newId,
} from '../config'
import { useApp, useMutate } from '../rindle/RindleProvider'
import { uploadImage } from './upload'
import { exportDeckHTML, exportDeckJSON } from './deckIO'
import { track } from '../lib/analytics'
import { useEditor } from './EditorState'
import { useHistory, useHistoryState } from './UndoProvider'
import { CssEditorModal } from './CssEditor'
import { ShareModal } from './ShareModal'
import { ColorField, TokenColorField } from './ColorField'
import {
  BACKGROUND_SWATCHES,
  resolveBackground,
  resolveSurface,
  SHAPE_NAMES,
  SHAPES,
  SURFACE_SWATCHES,
} from './types'
import { cssFontFamily, parseVideo } from './render'
import type { SlideDetail } from './deckDetail'

interface DeckRow {
  id: string
  title: string
  background: string
  surface: string
  heading_font: string | null
  heading_color: string | null
  body_font: string | null
  body_color: string | null
  text_align: string | null
  default_slide_mode: string | null
  canned_transition: string
  // Rindle TEXT columns can be NULL, so this is nullable like the other theme fields; the read
  // sites guard with `?? ''`.
  custom_stylesheet: string | null
  owner_id: string
  visibility: string
  share_token: string
}

// new components sort above existing ones; a coarse monotonic z is fine (z is just an ordering)
const zNow = () => Math.floor(Date.now() / 1000)
const place = () => ({
  x: 440 + (Date.now() % 4) * 24,
  y: 280 + (Date.now() % 3) * 24,
})

export function Header({
  deck,
  activeSlide,
  chatOpen,
  onToggleChat,
}: {
  deck: DeckRow | null
  activeSlide: SlideDetail | null
  // "✨ Chat" advisor rail toggle. Visible to everyone (the panel itself gates guests with a sign-in
  // nudge); state is owned by the editor page so the panel can mount alongside the well/stage.
  chatOpen: boolean
  onToggleChat: () => void
}) {
  const editor = useEditor()
  const mutate = useMutate()
  const app = useApp()
  const history = useHistory()
  const hist = useHistoryState()
  const navigate = useNavigate()
  const [menu, setMenu] = useState<
    | null
    | 'shapes'
    | 'theme'
    | 'media-image'
    | 'media-video'
    | 'media-web'
    | 'share'
  >(null)
  const [exporting, setExporting] = useState(false)
  const [cssOpen, setCssOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const active = editor.activeSlideId
  // The active slide's editable layer: 'markdown' = Body, '' = Objects (both always render; this only
  // says which one you're editing). The component inserters belong to the Objects layer, so they show
  // only when it's the one being edited — flip to Objects (slide toolbar) to drop an image on a body slide.
  const editingBody = activeSlide?.render_mode === 'markdown'
  const canEditSlide =
    active != null && editor.mode === 'slide' && editor.canEdit
  const canInsert = canEditSlide && !editingBody

  // Flip the active slide's editable layer (Objects '' ⇄ Body 'markdown'). Both layers always render;
  // this only picks what you edit (and which inserters show). Non-destructive + one undo. Lives in the
  // top bar (moved here from the on-slide hover toolbar).
  function setSlideLayer(next: '' | 'markdown') {
    const slide = activeSlide
    if (!slide) return
    const before = slide.render_mode === 'markdown' ? 'markdown' : ''
    if (next === before) return
    const apply = (m: '' | 'markdown') =>
      mutate.setSlideMode({ id: slide.id, render_mode: m, now: Date.now() })
    apply(next)
    history.push({
      label: next === 'markdown' ? 'Edit body' : 'Edit objects',
      redo: () => apply(next),
      undo: () => apply(before),
    })
  }

  // The Theme popover dismisses on a pointer-down outside its wrapper (button + panel + any nested
  // color sub-popovers are all inside `themeRef`, so those clicks don't close it). Other menus keep
  // their toggle-only behavior.
  const themeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (menu !== 'theme') return
    const onDown = (e: PointerEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node))
        setMenu(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [menu])

  // Same dismiss-on-outside-pointer for the Share/export dropdown (it now also launches the
  // Share modal, so a stray outside click should close the menu, not just a second toggle).
  const shareRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (menu !== 'share') return
    const onDown = (e: PointerEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node))
        setMenu(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [menu])

  // Insert a component as one undoable step (undo removes it; redo re-adds with the same id).
  function recordInsert(id: string, doAdd: () => void, label: string) {
    doAdd()
    editor.select(id)
    history.push({
      label,
      redo: doAdd,
      undo: () => mutate.removeComponent({ id }),
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
      // '' color/font = follow the deck theme (body category) until explicitly overridden.
      color: '',
      font_family: '',
      text_type: 'body',
    }
    recordInsert(id, () => mutate.addText(args), 'Add text')
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
    recordInsert(id, () => mutate.addShape(args), 'Add shape')
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
      recordInsert(id, () => mutate.addImage(args), 'Add image')
    } else if (kind === 'video') {
      const args = { ...base, src: url, ...parseVideo(url) }
      recordInsert(id, () => mutate.addVideo(args), 'Add video')
    } else {
      const args = { ...base, src: url }
      recordInsert(id, () => mutate.addWebframe(args), 'Add web frame')
    }
    setMenu(null)
  }

  // Theme edits deliberately do NOT close the popover — the user usually tweaks several
  // defaults (bg, surface, fonts) in one visit.
  function setBg(scope: 'bg' | 'surface', value: string) {
    if (!deck) return
    mutate.setDeckTheme({
      id: deck.id,
      [scope === 'bg' ? 'background' : 'surface']: value,
      now: Date.now(),
    })
  }

  function setTextTheme(
    patch: Partial<
      Record<
        'heading_font' | 'heading_color' | 'body_font' | 'body_color',
        string
      >
    >,
  ) {
    if (!deck) return
    mutate.setDeckTheme({ id: deck.id, ...patch, now: Date.now() })
  }

  function setDeckAlign(align: string) {
    if (!deck) return
    mutate.setDeckTheme({ id: deck.id, text_align: align, now: Date.now() })
  }

  function setDefaultMarkdown(on: boolean) {
    if (!deck) return
    mutate.setDeckTheme({
      id: deck.id,
      default_slide_mode: on ? 'markdown' : '',
      now: Date.now(),
    })
  }

  async function doExport(kind: 'json' | 'html') {
    if (!deck || exporting || !app) return
    setMenu(null)
    setExporting(true)
    try {
      if (kind === 'json') await exportDeckJSON(app.store, deck.id)
      else await exportDeckHTML(app.store, deck.id)
      track('export', { kind })
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

  // ---- live drag preview -------------------------------------------------------------------------
  // While the native color picker is dragged it streams frames; fold them into one debounced write per
  // target so the deck updates in real time without flooding history. Custom bg/surface picks assign
  // `bg-custom-<hex>` WITHOUT minting a class per frame — resolveBackground/resolveSurface read the hex
  // straight out of the class name, so the editor previews instantly; the `<style>` rule is minted once
  // on commit (setCustom, fired by the picker's terminating `change`).
  function setBgLive(scope: 'bg' | 'surface', value: string) {
    if (!deck) return
    const patch = scope === 'bg' ? { background: value } : { surface: value }
    mutate.setDeckTheme.folded(
      { key: `deck-theme:${scope}` },
      { id: deck.id, ...patch, now: Date.now() },
    )
  }

  function setCustomLive(scope: 'bg' | 'surface', hex: string) {
    const bare = hex.replace(/^#+/, '').toLowerCase()
    setBgLive(scope, `bg-custom-${bare}`)
  }

  function setTextThemeLive(
    patch: Partial<
      Record<
        'heading_font' | 'heading_color' | 'body_font' | 'body_color',
        string
      >
    >,
  ) {
    if (!deck) return
    // One target per drag (a single color input) → key the fold on that column.
    const key = Object.keys(patch)[0] ?? 'text'
    mutate.setDeckTheme.folded(
      { key: `deck-theme:${key}` },
      { id: deck.id, ...patch, now: Date.now() },
    )
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
        readOnly={!editor.canEdit}
        onChange={(e) =>
          deck &&
          editor.canEdit &&
          mutate.renameDeck({
            id: deck.id,
            title: e.target.value,
            now: Date.now(),
          })
        }
      />

      {/* Secondary tools: a single cluster so it can collapse to icons and then drop to a
          second row on narrow screens (see .hdr__tools media queries in strut.css). */}
      <div className="hdr__tools">
        {/* Per-slide edit-layer toggle: Objects (positioned components) vs Body (markdown). Both layers
            always render; this picks the editable one. Kept FIRST in the cluster so it stays leftmost
            whether or not the (Objects-only) inserters are showing — no leading divider. */}
        {canEditSlide && (
          <div className="seg seg--layers" role="group" aria-label="Edit layer">
            <button
              className={editingBody ? '' : 'is-active'}
              onClick={() => setSlideLayer('')}
              title="Edit objects (drag & place text, images, shapes)"
              aria-pressed={!editingBody}
            >
              <Shapes size={15} />
              <span className="lbl">Objects</span>
            </button>
            <button
              className={editingBody ? 'is-active' : ''}
              onClick={() => setSlideLayer('markdown')}
              title="Edit body (markdown text)"
              aria-pressed={editingBody}
            >
              <FileText size={15} />
              <span className="lbl">Body</span>
            </button>
          </div>
        )}
        {canInsert && (
          <>
            <div className="hdr__sep" />
            <div className="hdr__group">
              <button className="btn" onClick={addText} title="Text">
                <Type size={16} /> <span className="lbl">Text</span>
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

        {editor.canEdit && (
          <>
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
              <div style={{ position: 'relative' }} ref={themeRef}>
                <button
                  className="btn"
                  onClick={() => setMenu(menu === 'theme' ? null : 'theme')}
                  title="Theme"
                  disabled={!deck}
                >
                  <Palette size={16} /> <span className="lbl">Theme</span>
                </button>
                {menu === 'theme' && deck && (
                  <ThemePopover
                    deck={deck}
                    onBackground={(v) => setBg('bg', v)}
                    onCustomBackground={(hex) => setCustom('bg', hex)}
                    onCustomBackgroundLive={(hex) => setCustomLive('bg', hex)}
                    onSurface={(v) => setBg('surface', v)}
                    onCustomSurface={(hex) => setCustom('surface', hex)}
                    onCustomSurfaceLive={(hex) => setCustomLive('surface', hex)}
                    onText={setTextTheme}
                    onTextLive={setTextThemeLive}
                    onAlign={setDeckAlign}
                    onDefaultMarkdown={setDefaultMarkdown}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {editor.canEdit && (
          <button
            className="btn"
            onClick={() => setCssOpen(true)}
            title="Custom CSS"
            disabled={!deck}
          >
            <Code2 size={16} /> <span className="lbl">CSS</span>
          </button>
        )}

        {/* Share + Export merged into one "Share" umbrella dropdown: the collaborate/link action
            up top, the download formats grouped beneath. */}
        <div style={{ position: 'relative' }} ref={shareRef}>
          <button
            className="btn"
            onClick={() => setMenu(menu === 'share' ? null : 'share')}
            title="Share & export"
            disabled={!deck}
          >
            <Share2 size={16} />{' '}
            <span className="lbl">{exporting ? 'Exporting…' : 'Share'}</span>
            <ChevronDown size={14} className="btn__caret" />
          </button>
          {menu === 'share' && (
            <div
              className="popover popover--menu"
              style={{ top: '110%', right: 0 }}
            >
              <button
                className="menu-item menu-item--icon"
                onClick={() => {
                  setMenu(null)
                  setShareOpen(true)
                }}
              >
                <Link2 size={15} /> Share…
                <span className="menu-item__hint">link &amp; invite</span>
              </button>
              <div className="menu-sep" />
              <div className="menu-label">Download</div>
              <button
                className="menu-item menu-item--icon"
                onClick={() => doExport('json')}
              >
                <Download size={15} /> Strut JSON (.strut)
              </button>
              <button
                className="menu-item menu-item--icon"
                onClick={() => doExport('html')}
              >
                <Download size={15} /> Standalone HTML (impress.js)
              </button>
            </div>
          )}
        </div>
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
        className={chatOpen ? 'btn is-active' : 'btn'}
        onClick={onToggleChat}
        title="Chat with an AI advisor about your deck"
        aria-pressed={chatOpen}
      >
        <Sparkles size={16} /> <span className="lbl">Chat</span>
      </button>

      <button
        className="btn btn--primary"
        onClick={() =>
          deck &&
          navigate({
            to: '/deck/$deckId/play',
            params: { deckId: deck.id },
            // Carry the current view + slide so Esc can drop back into exactly this spot.
            search: {
              view: editor.mode,
              slide: editor.activeSlideId ?? undefined,
            },
          })
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
      {shareOpen && deck && (
        <ShareModal deck={deck} onClose={() => setShareOpen(false)} />
      )}
    </div>
  )
}

/** Deck text-theme font picker: '' = the built-in default (Lato), otherwise a family name. */
function ThemeFontSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (family: string) => void
}) {
  return (
    <select
      value={value || DEFAULT_FONT}
      style={{ fontFamily: cssFontFamily(value) }}
      onChange={(e) =>
        onChange(e.target.value === DEFAULT_FONT ? '' : e.target.value)
      }
    >
      {FONT_FAMILIES.map((f) => (
        <option key={f} value={f} style={{ fontFamily: cssFontFamily(f) }}>
          {f}
        </option>
      ))}
    </select>
  )
}

/** The deck Theme popover: default background + surface colors, and the default font + color for
 *  each text category (heading | body). Text components with no explicit color/font follow these. */
function ThemePopover({
  deck,
  onBackground,
  onCustomBackground,
  onCustomBackgroundLive,
  onSurface,
  onCustomSurface,
  onCustomSurfaceLive,
  onText,
  onTextLive,
  onAlign,
  onDefaultMarkdown,
}: {
  deck: DeckRow
  onBackground: (value: string) => void
  onCustomBackground: (hex: string) => void
  onCustomBackgroundLive: (hex: string) => void
  onSurface: (value: string) => void
  onCustomSurface: (hex: string) => void
  onCustomSurfaceLive: (hex: string) => void
  onText: (
    patch: Partial<
      Record<
        'heading_font' | 'heading_color' | 'body_font' | 'body_color',
        string
      >
    >,
  ) => void
  onTextLive: (
    patch: Partial<
      Record<
        'heading_font' | 'heading_color' | 'body_font' | 'body_color',
        string
      >
    >,
  ) => void
  onAlign: (align: string) => void
  onDefaultMarkdown: (on: boolean) => void
}) {
  const align = deck.text_align || 'left'
  return (
    <div className="popover popover--theme" style={{ top: '110%', left: 0 }}>
      <div className="insp__row">
        <span>Background</span>
        <TokenColorField
          label="Slide background"
          current={deck.background}
          swatches={BACKGROUND_SWATCHES}
          resolve={(v) => resolveBackground(v, v)}
          onPick={onBackground}
          onCustom={onCustomBackground}
          onCustomLive={onCustomBackgroundLive}
          allowTransparent
        />
      </div>
      <div className="insp__row">
        <span>Surface</span>
        <TokenColorField
          label="Surface"
          current={deck.surface}
          swatches={SURFACE_SWATCHES}
          resolve={(v) => resolveSurface(v, v)}
          onPick={onSurface}
          onCustom={onCustomSurface}
          onCustomLive={onCustomSurfaceLive}
        />
      </div>

      <div className="theme__group">
        <div className="theme__label">Heading text</div>
        <div className="insp__row">
          <span>Font</span>
          <ThemeFontSelect
            value={deck.heading_font ?? ''}
            onChange={(f) => onText({ heading_font: f })}
          />
        </div>
        <div className="insp__row">
          <span>Color</span>
          <ColorField
            value={deck.heading_color ?? ''}
            onChange={(hex) => onText({ heading_color: hex })}
            onLive={(hex) => onTextLive({ heading_color: hex })}
          />
        </div>
      </div>

      <div className="theme__group">
        <div className="theme__label">Body text</div>
        <div className="insp__row">
          <span>Font</span>
          <ThemeFontSelect
            value={deck.body_font ?? ''}
            onChange={(f) => onText({ body_font: f })}
          />
        </div>
        <div className="insp__row">
          <span>Color</span>
          <ColorField
            value={deck.body_color ?? ''}
            onChange={(hex) => onText({ body_color: hex })}
            onLive={(hex) => onTextLive({ body_color: hex })}
          />
        </div>
      </div>

      <div className="theme__group">
        <div className="theme__label">Layout</div>
        <div className="insp__row">
          <span>Align</span>
          <div className="seg seg--align">
            {(
              [
                ['left', AlignLeft],
                ['center', AlignCenter],
                ['right', AlignRight],
              ] as const
            ).map(([value, Icon]) => (
              <button
                key={value}
                className={align === value ? 'is-active' : ''}
                title={`Align ${value}`}
                onClick={() => onAlign(value)}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
        <label className="theme__check">
          <input
            type="checkbox"
            checked={deck.default_slide_mode === 'markdown'}
            onChange={(e) => onDefaultMarkdown(e.target.checked)}
          />
          <span>New slides use Markdown</span>
        </label>
      </div>
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label =
    kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Web page'

  async function pickFile(f: File) {
    setError(null)
    setUploading(true)
    try {
      onSubmit(await uploadImage(f))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

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
          <>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void pickFile(f)
              }}
            />
            {uploading && <p className="modal__note">Uploading…</p>}
          </>
        )}
        {error && <p className="modal__error">{error}</p>}
        <div className="modal__row">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={!url || uploading}
            onClick={() => onSubmit(url)}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
