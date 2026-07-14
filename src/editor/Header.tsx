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
  Circle,
  Code2,
  Diamond,
  Download,
  FileText,
  Image as ImageIcon,
  Link2,
  Minus,
  MoveRight,
  Palette,
  Pencil,
  Play,
  Redo2,
  Shapes,
  Sparkles,
  Square,
  SquareCode,
  Type,
  Undo2,
  Upload,
  Video,
  Globe,
  Share2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, newId } from '../config'
import { useApp, useMutate } from '../rindle/RindleProvider'
import { uploadArtifact, uploadImage } from './upload'
import { place, zNow } from './componentOps'
import { exportDeckHTML, exportDeckJSON } from './deckIO'
import { track } from '../lib/analytics'
import { useEditor } from './EditorState'
import { useHistory, useHistoryState } from './UndoProvider'
import { CssEditorModal } from './CssEditor'
import { ShareModal } from './ShareModal'
import { createDeckVariant } from './deckVariant'
import { UsageMeter } from '../rindle/UsageMeter'
import { applyThemePatch } from './aiTheme'
import { ColorField, TokenColorField } from './ColorField'
import {
  BACKGROUND_SWATCHES,
  BACKGROUND_IMAGE_LAYOUTS,
  makeBackgroundImageToken,
  parseBackgroundImageToken,
  resolveBackground,
  resolveBackgroundImage,
  resolveSurface,
  SHAPE_TOOLS,
  SURFACE_SWATCHES,
} from './types'
import type { BackgroundImageLayout } from './types'
import { cssFontFamily, FontOptions, parseVideo } from './render'
import type { SlideDetail } from './deckDetail'
import { ThemeToggle } from '../ThemeToggle'

// Shape-tool icons, in SHAPE_TOOLS order. The menu shows the "2"–"7" hint that matches the
// keyboard shortcut wired up in Stage.
const SHAPE_TOOL_ICONS: Record<string, LucideIcon> = {
  rectangle: Square,
  diamond: Diamond,
  ellipse: Circle,
  arrow: MoveRight,
  line: Minus,
  draw: Pencil,
}

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
  source_deck_id: string
  variant_label: string
  variant_prompt: string
}

type BackgroundImageTarget = 'deck' | 'slide' | 'surface' | 'slide-surface'

interface DeckVariantRow {
  id: string
  title: string
  modified: number
  slideCount: number
  variant_label: string
}

// Seed a fresh artifact with a runnable snippet so the block does something the instant it's dropped —
// and doubles as inline docs for the format (ES module; import from esm.sh; render into #root).
const STARTER_ARTIFACT = `// Runnable artifact — an ES module. Import libraries from esm.sh and render
// into #root (or document.body). Edit the code in the panel, then press Run.
import confetti from 'https://esm.sh/canvas-confetti@1'

const root = document.getElementById('root')
root.style.cssText =
  'height:100%;display:grid;place-items:center;font:600 22px system-ui;color:#18181b'
root.textContent = '🎉 Hello from a runnable artifact'
confetti({ particleCount: 120, spread: 70 })
`

export function Header({
  deck,
  activeSlide,
  variants,
  makesPublic,
  chatOpen,
  onToggleChat,
}: {
  deck: DeckRow | null
  activeSlide: SlideDetail | null
  variants: readonly DeckVariantRow[]
  makesPublic: boolean
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
  const [variantOpen, setVariantOpen] = useState(false)
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

  // The Theme popover dismisses on a pointer-down outside its wrapper. Portaled color sub-popovers
  // stop pointer-down propagation themselves so swatch clicks do not close the whole menu.
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
    // Arm the shape tool for draw-to-place (tldraw/Figma): nothing is inserted here. The Stage's canvas
    // draw gesture sweeps the box (or a single click drops a default size), commits the shape, selects
    // it, and reverts to Select. Esc cancels.
    editor.setPendingShape(name)
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

  // Drop a runnable artifact seeded with the starter snippet. We build it first (so it runs immediately),
  // but if the build fails — offline, over quota — we still insert with the code and an empty src, which
  // renders the "press Run" placeholder; the inspector's Run button rebuilds it. One undoable step.
  async function addArtifact() {
    if (!active) return
    const id = newId()
    const p = place()
    const base = { id, slideId: active, x: p.x, y: p.y, z_order: zNow() }
    let src = ''
    try {
      src = await uploadArtifact(STARTER_ARTIFACT)
    } catch {
      // insert unbuilt; the user can Run from the inspector panel
    }
    const args = { ...base, code: STARTER_ARTIFACT, src }
    recordInsert(id, () => mutate.addArtifact(args), 'Add artifact')
  }

  // Theme edits deliberately do NOT close the popover — the user usually tweaks several
  // defaults (bg, surface, fonts) in one visit. Each commit goes through applyThemePatch so it lands on
  // Cmd/Z as one undo (closing the pre-existing no-undo gap; shared with the AI Edit lane's set_theme).
  function setBg(scope: 'bg' | 'surface', value: string) {
    if (!deck) return
    applyThemePatch(
      scope === 'bg' ? { background: value } : { surface: value },
      { mutate, history, deck },
      scope === 'bg' ? 'Background color' : 'Surface color',
    )
  }

  function setSlideBackground(value: string) {
    const slide = activeSlide
    if (!slide) return
    const before = slide.background
    if (before === value) return
    const apply = (background: string) =>
      mutate.setSlideTheme({ id: slide.id, background, now: Date.now() })
    apply(value)
    history.push({
      label: 'Slide background',
      redo: () => apply(value),
      undo: () => apply(before),
    })
  }

  function setSlideSurface(value: string) {
    const slide = activeSlide
    if (!slide) return
    const before = slide.surface
    if (before === value) return
    const apply = (surface: string) =>
      mutate.setSlideTheme({ id: slide.id, surface, now: Date.now() })
    apply(value)
    history.push({
      label: 'Slide surface',
      redo: () => apply(value),
      undo: () => apply(before),
    })
  }

  function setSlideCustomBackground(hex: string) {
    if (!deck || !activeSlide) return
    const bare = hex.replace(/^#+/, '').toLowerCase()
    const klass = `bg-custom-${bare}`
    mutate.mintCustomColor({
      id: newId(),
      deckId: deck.id,
      klass,
      style: `.${klass}{background:#${bare}}`,
    })
    setSlideBackground(klass)
  }

  function setSlideCustomSurface(hex: string) {
    if (!deck || !activeSlide) return
    const bare = hex.replace(/^#+/, '').toLowerCase()
    const klass = `bg-custom-${bare}`
    mutate.mintCustomColor({
      id: newId(),
      deckId: deck.id,
      klass,
      style: `.${klass}{background:#${bare}}`,
    })
    setSlideSurface(klass)
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
    applyThemePatch(patch, { mutate, history, deck }, 'Text theme')
  }

  function setDeckAlign(align: string) {
    if (!deck) return
    applyThemePatch(
      { text_align: align },
      { mutate, history, deck },
      'Text alignment',
    )
  }

  function setDefaultMarkdown(on: boolean) {
    if (!deck) return
    // default_slide_mode is an enum column (not covered by applyThemePatch's string patch) — one undo
    // by hand so this toggle is also reversible.
    const before = deck.default_slide_mode === 'markdown' ? 'markdown' : ''
    const next = on ? 'markdown' : ''
    if (before === next) return
    const apply = (m: '' | 'markdown') =>
      mutate.setDeckTheme({
        id: deck.id,
        default_slide_mode: m,
        now: Date.now(),
      })
    apply(next)
    history.push({
      label: 'Default slide mode',
      redo: () => apply(next),
      undo: () => apply(before),
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

  function newDeckVisibility(): {
    visibility: 'private' | 'public-read'
    share_token: string
  } {
    return makesPublic
      ? { visibility: 'public-read', share_token: newId() }
      : { visibility: 'private', share_token: '' }
  }

  async function onCreateVariant(audience: string, instructions: string) {
    if (!deck || !app) throw new Error('Editor is still connecting')
    const id = await createDeckVariant({
      app,
      sourceDeckId: deck.id,
      audience,
      instructions,
      initialVisibility: newDeckVisibility(),
    })
    track('variant:create')
    setVariantOpen(false)
    navigate({ to: '/deck/$deckId', params: { deckId: id } })
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
      { key: `deck-theme:${scope}`, roomDebounceMs: 0 },
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
      { key: `deck-theme:${key}`, roomDebounceMs: 0 },
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
      {deck?.source_deck_id && (
        <Link
          to="/deck/$deckId"
          params={{ deckId: deck.source_deck_id }}
          className="hdr__variant-source"
          title="Open source deck"
        >
          Variant{deck.variant_label ? `: ${deck.variant_label}` : ''}
        </Link>
      )}

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
              <button
                className="btn"
                onClick={() => void addArtifact()}
                title="Runnable code artifact"
              >
                <SquareCode size={16} />
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  className={`btn${editor.pendingShape ? ' is-active' : ''}`}
                  onClick={() => setMenu(menu === 'shapes' ? null : 'shapes')}
                  title={
                    editor.pendingShape
                      ? 'Drag on the slide to draw the shape (Esc to cancel)'
                      : 'Shapes'
                  }
                >
                  <Shapes size={16} />
                </button>
                {menu === 'shapes' && (
                  <div className="popover" style={{ top: '110%', left: 0 }}>
                    <div className="shape-menu">
                      {SHAPE_TOOLS.map((n, i) => {
                        const Icon = SHAPE_TOOL_ICONS[n]
                        return (
                          <button
                            key={n}
                            className={`shape-menu__tool${
                              editor.pendingShape === n ? ' is-active' : ''
                            }`}
                            title={`${n} (${i + 2})`}
                            onClick={() => addShape(n)}
                          >
                            <Icon size={18} />
                            <span className="shape-menu__key">{i + 2}</span>
                          </button>
                        )
                      })}
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
                  title="Theme & custom CSS"
                  disabled={!deck}
                >
                  <Palette size={16} /> <span className="lbl">Design</span>
                </button>
                {menu === 'theme' && deck && (
                  <ThemePopover
                    deck={deck}
                    activeSlide={activeSlide}
                    onBackground={(v) => setBg('bg', v)}
                    onCustomBackground={(hex) => setCustom('bg', hex)}
                    onCustomBackgroundLive={(hex) => setCustomLive('bg', hex)}
                    onSlideBackground={setSlideBackground}
                    onSlideCustomBackground={setSlideCustomBackground}
                    onSlideSurface={setSlideSurface}
                    onSlideCustomSurface={setSlideCustomSurface}
                    onSurface={(v) => setBg('surface', v)}
                    onCustomSurface={(hex) => setCustom('surface', hex)}
                    onCustomSurfaceLive={(hex) => setCustomLive('surface', hex)}
                    onText={setTextTheme}
                    onTextLive={setTextThemeLive}
                    onAlign={setDeckAlign}
                    onDefaultMarkdown={setDefaultMarkdown}
                    onEditCss={() => {
                      setMenu(null)
                      setCssOpen(true)
                    }}
                  />
                )}
              </div>
            </div>
          </>
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
              <button
                className="menu-item menu-item--icon"
                onClick={() => {
                  setMenu(null)
                  setVariantOpen(true)
                }}
              >
                <Sparkles size={15} /> Create variant…
                <span className="menu-item__hint">new deck</span>
              </button>
              {variants.length > 0 && (
                <>
                  <div className="menu-sep" />
                  <div className="menu-label">Variants</div>
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      className="menu-item menu-item--icon"
                      onClick={() => {
                        setMenu(null)
                        navigate({
                          to: '/deck/$deckId',
                          params: { deckId: v.id },
                        })
                      }}
                    >
                      <Sparkles size={15} />
                      {v.title || 'Untitled'}
                      <span className="menu-item__hint">
                        {v.slideCount} slide{v.slideCount === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </>
              )}
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

      {/* Mode toggle, Chat, and Present are marked so the mobile stylesheet can hide them here and
          hand those actions to the bottom tab bar (thumb reach) — see the @media block in strut.css. */}
      <div className="seg hdr__mode">
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
        <button
          className={editor.mode === 'research' ? 'is-active' : ''}
          onClick={() => editor.setMode('research')}
        >
          Research
        </button>
      </div>

      <button
        className={chatOpen ? 'btn hdr__chat is-active' : 'btn hdr__chat'}
        onClick={onToggleChat}
        title="Chat with an AI advisor about your deck"
        aria-pressed={chatOpen}
      >
        <Sparkles size={16} /> <span className="lbl">Chat</span>
      </button>

      <button
        className="btn btn--primary hdr__present"
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

      {/* Usage ring — this is the point of consumption (AI + uploads), so it lives here too. Hidden on
          the mobile app-bar (the actions it tracks move to the tab bar). */}
      <UsageMeter />

      <ThemeToggle className="hdr__theme-toggle" />

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
      {variantOpen && deck && (
        <VariantModal
          onCancel={() => setVariantOpen(false)}
          onCreate={onCreateVariant}
        />
      )}
    </div>
  )
}

function VariantModal({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (audience: string, instructions: string) => Promise<void>
}) {
  const [audience, setAudience] = useState('Executive brief')
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onCreate(audience.trim() || 'Variant', instructions.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create variant</h3>
        <label className="modal__field">
          <span>Audience</span>
          <input
            type="text"
            autoFocus
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit()
              if (e.key === 'Escape' && !busy) onCancel()
            }}
          />
        </label>
        <label className="modal__field">
          <span>Instructions</span>
          <textarea
            value={instructions}
            placeholder="6 slides, focus on risks and next steps"
            onChange={(e) => setInstructions(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !busy) onCancel()
            }}
          />
        </label>
        {error && <p className="modal__error">{error}</p>}
        <div className="modal__row">
          <button className="btn btn--ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={busy} onClick={submit}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
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
      <FontOptions />
    </select>
  )
}

/** The deck Theme popover: default background + surface colors, and the default font + color for
 *  each text category (heading | body). Text components with no explicit color/font follow these. */
function ThemePopover({
  deck,
  activeSlide,
  onBackground,
  onCustomBackground,
  onCustomBackgroundLive,
  onSlideBackground,
  onSlideCustomBackground,
  onSlideSurface,
  onSlideCustomSurface,
  onSurface,
  onCustomSurface,
  onCustomSurfaceLive,
  onText,
  onTextLive,
  onAlign,
  onDefaultMarkdown,
  onEditCss,
}: {
  deck: DeckRow
  activeSlide: SlideDetail | null
  onBackground: (value: string) => void
  onCustomBackground: (hex: string) => void
  onCustomBackgroundLive: (hex: string) => void
  onSlideBackground: (value: string) => void
  onSlideCustomBackground: (hex: string) => void
  onSlideSurface: (value: string) => void
  onSlideCustomSurface: (hex: string) => void
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
  onEditCss: () => void
}) {
  const align = deck.text_align || 'left'
  const [imageTarget, setImageTarget] = useState<BackgroundImageTarget | null>(
    null,
  )
  const imageModal =
    imageTarget === 'deck'
      ? {
          title: 'Deck background image',
          value: deck.background,
          fallback: undefined,
          supportsEffects: true,
          onChange: onBackground,
        }
      : imageTarget === 'slide' && activeSlide
        ? {
            title: 'Slide background image',
            value: activeSlide.background,
            fallback: deck.background,
            supportsEffects: true,
            allowInherit: true,
            onChange: onSlideBackground,
          }
        : imageTarget === 'surface'
          ? {
              title: 'Deck surface image',
              value: deck.surface,
              fallback: undefined,
              supportsEffects: false,
              onChange: onSurface,
            }
          : imageTarget === 'slide-surface' && activeSlide
            ? {
                title: 'View surface image',
                value: activeSlide.surface,
                fallback: deck.surface,
                supportsEffects: false,
                allowInherit: true,
                onChange: onSlideSurface,
              }
            : null

  return (
    <>
      <div className="popover popover--theme" style={{ top: '110%', left: 0 }}>
        <div className="theme__group theme__group--first">
          <div className="theme__label">Background</div>
          <div className="theme__bggrid">
            <div className="theme__bgcell">
              <span>Deck</span>
              <TokenColorField
                label="Deck background"
                current={deck.background}
                swatches={BACKGROUND_SWATCHES}
                resolve={(v) => resolveBackground(v, v)}
                onPick={onBackground}
                onCustom={onCustomBackground}
                onCustomLive={onCustomBackgroundLive}
                allowTransparent
                imageAction={{
                  title: 'Set deck background image',
                  active: !!parseBackgroundImageToken(deck.background),
                  onSelect: () => setImageTarget('deck'),
                }}
              />
            </div>
            <div className="theme__bgcell">
              <span>Slide</span>
              {activeSlide ? (
                <TokenColorField
                  label="Slide background"
                  current={activeSlide.background}
                  swatches={BACKGROUND_SWATCHES}
                  resolve={(v) => resolveBackground(v, deck.background)}
                  onPick={onSlideBackground}
                  onCustom={onSlideCustomBackground}
                  allowTransparent
                  imageAction={{
                    title: 'Set slide background image',
                    active: !!parseBackgroundImageToken(activeSlide.background),
                    onSelect: () => setImageTarget('slide'),
                  }}
                  defaultToken=""
                  defaultTitle="inherit deck"
                  defaultGlyph="D"
                />
              ) : (
                <div className="theme__inline-note">No slide</div>
              )}
            </div>
            <div className="theme__bgcell">
              <span title="Default surface behind slides">Surface</span>
              <TokenColorField
                label="Deck surface"
                current={deck.surface}
                swatches={SURFACE_SWATCHES}
                resolve={(v) => resolveSurface(v, v)}
                onPick={onSurface}
                onCustom={onCustomSurface}
                onCustomLive={onCustomSurfaceLive}
                imageAction={{
                  title: 'Set surface image',
                  active: !!parseBackgroundImageToken(deck.surface),
                  onSelect: () => setImageTarget('surface'),
                }}
              />
            </div>
            <div className="theme__bgcell">
              <span title="Surface color while this slide is in view">
                View
              </span>
              {activeSlide ? (
                <TokenColorField
                  label="View surface"
                  current={activeSlide.surface}
                  swatches={SURFACE_SWATCHES}
                  resolve={(v) => resolveSurface(v, deck.surface)}
                  onPick={onSlideSurface}
                  onCustom={onSlideCustomSurface}
                  imageAction={{
                    title: 'Set view surface image',
                    active: !!parseBackgroundImageToken(activeSlide.surface),
                    onSelect: () => setImageTarget('slide-surface'),
                  }}
                  defaultToken=""
                  defaultTitle="inherit surface"
                  defaultGlyph="D"
                />
              ) : (
                <div className="theme__inline-note">No slide</div>
              )}
            </div>
          </div>
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

        {/* Custom CSS lives here rather than as its own header button — theme + CSS are one job. */}
        <div className="menu-sep" />
        <button className="menu-item menu-item--icon" onClick={onEditCss}>
          <Code2 size={15} /> Edit custom CSS…
        </button>
      </div>
      {imageModal && (
        <BackgroundImageModal
          {...imageModal}
          onClose={() => setImageTarget(null)}
        />
      )}
    </>
  )
}

function BackgroundImageModal({
  title,
  value,
  fallback,
  supportsEffects,
  allowInherit,
  onChange,
  onClose,
}: {
  title: string
  value: string
  fallback?: string
  supportsEffects: boolean
  allowInherit?: boolean
  onChange: (value: string) => void
  onClose: () => void
}) {
  const image = resolveBackgroundImage(value, fallback)
  const explicitImage = parseBackgroundImageToken(value)
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(image?.src ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUrl(image?.src ?? '')
    setError(null)
  }, [image?.src, value])

  const layout = image?.layout ?? 'full'
  const hasImage = !!(image?.src || url.trim())

  function writeImage(
    patch: Partial<{
      src: string
      layout: BackgroundImageLayout
      fade: boolean
      blur: boolean
      mask: boolean
    }>,
  ) {
    const src = (patch.src ?? image?.src ?? url).trim()
    if (!src) return
    setError(null)
    setUrl(src)
    onChange(
      makeBackgroundImageToken(src, {
        layout: supportsEffects
          ? (patch.layout ?? image?.layout ?? 'full')
          : 'full',
        fade: supportsEffects ? (patch.fade ?? image?.fade ?? false) : false,
        blur: supportsEffects ? (patch.blur ?? image?.blur ?? false) : false,
        mask: supportsEffects ? (patch.mask ?? image?.mask ?? false) : false,
      }),
    )
  }

  function writeEffect(key: 'fade' | 'blur' | 'mask', checked: boolean) {
    if (key === 'fade') writeImage({ fade: checked })
    else if (key === 'blur') writeImage({ blur: checked })
    else writeImage({ mask: checked })
  }

  async function pickFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      writeImage({ src: await uploadImage(file) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    setUrl('')
    onChange('bg-default')
  }

  function done() {
    if (url.trim()) writeImage({ src: url })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--bgimg" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="theme__bgimg theme__bgimg--modal">
          <div className="theme__bgimg-line">
            <span>Image</span>
            <input
              className="theme__bgimg-url"
              type="url"
              autoFocus
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => url.trim() && writeImage({ src: url })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') done()
                if (e.key === 'Escape') onClose()
              }}
            />
          </div>
          <input
            className="theme__bgimg-file"
            type="file"
            ref={fileRef}
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void pickFile(file)
              e.currentTarget.value = ''
            }}
          />
          <button
            className="btn btn--ghost theme__bgimg-upload"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload image'}
          </button>
          {supportsEffects && (
            <>
              <div className="theme__bgimg-line">
                <span>Fit</span>
                <div
                  className="seg seg--bgimg"
                  role="group"
                  aria-label="Image fit"
                >
                  {BACKGROUND_IMAGE_LAYOUTS.map((layoutValue) => (
                    <button
                      key={layoutValue}
                      className={layout === layoutValue ? 'is-active' : ''}
                      disabled={!hasImage}
                      onClick={() => writeImage({ layout: layoutValue })}
                    >
                      {layoutValue === 'full'
                        ? 'Full'
                        : layoutValue === 'left'
                          ? 'Left'
                          : 'Right'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="theme__fx">
                {(
                  [
                    ['fade', 'Fade'],
                    ['blur', 'Blur'],
                    ['mask', 'Mask'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      disabled={!hasImage}
                      checked={!!image?.[key]}
                      onChange={(e) => writeEffect(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
          {uploading && <div className="modal__note">Uploading...</div>}
          {error && <div className="modal__error">{error}</div>}
          <div className="theme__bgimg-actions">
            {allowInherit && (
              <button
                className="btn btn--ghost"
                disabled={!value}
                onClick={() => {
                  setUrl('')
                  onChange('')
                }}
              >
                Inherit
              </button>
            )}
            <button
              className="btn btn--ghost"
              disabled={!explicitImage && !image}
              onClick={removeImage}
            >
              Remove
            </button>
            <span className="theme__bgimg-actions-spacer" />
            <button className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn--primary"
              disabled={uploading || !url.trim()}
              onClick={done}
            >
              Done
            </button>
          </div>
        </div>
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
