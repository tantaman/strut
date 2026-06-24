// Editor header (spec §4.3): logo/back, deck title, component inserters (hidden in overview),
// background/surface pickers, the Slides|Overview mode toggle, and Present.

import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Image as ImageIcon, Play, Shapes, Square, Type, Video, Globe } from 'lucide-react'
import { DEFAULT_FONT, DEFAULT_FONT_SIZE, newId } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useEditor } from './EditorState'
import { BACKGROUND_SWATCHES, resolveBackground, SHAPE_NAMES, SHAPES } from './types'
import { parseVideo } from './render'

interface DeckRow {
  id: string
  title: string
  background: string
  surface: string
}

// new components sort above existing ones; a coarse monotonic z is fine (z is just an ordering)
const zNow = () => Math.floor(Date.now() / 1000)
const place = () => ({ x: 440 + (Date.now() % 4) * 24, y: 280 + (Date.now() % 3) * 24 })

export function Header({ deck }: { deck: DeckRow | null }) {
  const editor = useEditor()
  const mutate = useMutate()
  const navigate = useNavigate()
  const [menu, setMenu] = useState<null | 'shapes' | 'bg' | 'surface' | 'media-image' | 'media-video' | 'media-web'>(null)
  const active = editor.activeSlideId
  const canInsert = active != null && editor.mode === 'slide'

  function addText() {
    if (!active) return
    const id = newId()
    const p = place()
    mutate.addText({
      id,
      slideId: active,
      x: p.x,
      y: p.y,
      z_order: zNow(),
      text: 'New text',
      size: DEFAULT_FONT_SIZE,
      color: '111111',
      font_family: DEFAULT_FONT,
    })
    editor.select(id)
  }

  function addShape(name: string) {
    if (!active) return
    const id = newId()
    const p = place()
    mutate.addShape({ id, slideId: active, x: p.x, y: p.y, z_order: zNow(), shape: name, markup: SHAPES[name], fill: '3498db' })
    editor.select(id)
    setMenu(null)
  }

  function addMedia(kind: 'image' | 'video' | 'web', url: string) {
    if (!active || !url) return
    const id = newId()
    const p = place()
    if (kind === 'image')
      mutate.addImage({ id, slideId: active, x: p.x, y: p.y, z_order: zNow(), src: url, image_type: '', scale_w: 400, scale_h: 300 })
    else if (kind === 'video')
      mutate.addVideo({ id, slideId: active, x: p.x, y: p.y, z_order: zNow(), src: url, ...parseVideo(url) })
    else mutate.addWebframe({ id, slideId: active, x: p.x, y: p.y, z_order: zNow(), src: url })
    editor.select(id)
    setMenu(null)
  }

  function setBg(scope: 'bg' | 'surface', value: string) {
    if (!deck) return
    mutate.setDeckTheme({ id: deck.id, [scope === 'bg' ? 'background' : 'surface']: value, now: Date.now() })
    setMenu(null)
  }

  return (
    <div className="hdr">
      <Link to="/" className="btn btn--ghost" title="All decks">
        ←
      </Link>
      <input
        className="hdr__title"
        value={deck?.title ?? ''}
        placeholder="Untitled"
        onChange={(e) => deck && mutate.renameDeck({ id: deck.id, title: e.target.value, now: Date.now() })}
      />

      {canInsert && (
        <>
          <div className="hdr__sep" />
          <div className="hdr__group">
            <button className="btn" onClick={addText} title="Text">
              <Type size={16} /> Text
            </button>
            <button className="btn" onClick={() => setMenu('media-image')} title="Image">
              <ImageIcon size={16} />
            </button>
            <button className="btn" onClick={() => setMenu('media-video')} title="Video">
              <Video size={16} />
            </button>
            <button className="btn" onClick={() => setMenu('media-web')} title="Web frame">
              <Globe size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn" onClick={() => setMenu(menu === 'shapes' ? null : 'shapes')} title="Shapes">
                <Shapes size={16} />
              </button>
              {menu === 'shapes' && (
                <div className="popover" style={{ top: '110%', left: 0 }}>
                  <div className="swatches" style={{ gridTemplateColumns: 'repeat(4, 30px)' }}>
                    {SHAPE_NAMES.map((n) => (
                      <button
                        key={n}
                        className="swatch"
                        title={n}
                        style={{ width: 30, height: 30, color: '#3498db', padding: 3 }}
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
        <BgButton label="Bg" current={deck?.background} open={menu === 'bg'} onToggle={() => setMenu(menu === 'bg' ? null : 'bg')} onPick={(v) => setBg('bg', v)} allowTransparent />
        <BgButton label="Surface" current={deck?.surface} open={menu === 'surface'} onToggle={() => setMenu(menu === 'surface' ? null : 'surface')} onPick={(v) => setBg('surface', v)} />
      </div>

      <div className="hdr__spacer" />

      <div className="seg">
        <button className={editor.mode === 'slide' ? 'is-active' : ''} onClick={() => editor.setMode('slide')}>
          Slides
        </button>
        <button className={editor.mode === 'overview' ? 'is-active' : ''} onClick={() => editor.setMode('overview')}>
          Overview
        </button>
      </div>

      <button
        className="btn btn--primary"
        onClick={() => deck && navigate({ to: '/deck/$deckId/play', params: { deckId: deck.id } })}
        title="Present"
      >
        <Play size={16} /> Present
      </button>

      {menu === 'media-image' && <MediaModal kind="image" onCancel={() => setMenu(null)} onSubmit={(u) => addMedia('image', u)} />}
      {menu === 'media-video' && <MediaModal kind="video" onCancel={() => setMenu(null)} onSubmit={(u) => addMedia('video', u)} />}
      {menu === 'media-web' && <MediaModal kind="web" onCancel={() => setMenu(null)} onSubmit={(u) => addMedia('web', u)} />}
    </div>
  )
}

function BgButton({
  label,
  current,
  open,
  onToggle,
  onPick,
  allowTransparent,
}: {
  label: string
  current?: string
  open: boolean
  onToggle: () => void
  onPick: (value: string) => void
  allowTransparent?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" onClick={onToggle} title={label}>
        <Square size={14} fill={current ? resolveBackground(current, current) : 'none'} /> {label}
      </button>
      {open && (
        <div className="popover" style={{ top: '110%', left: 0 }}>
          <div className="swatches">
            <button className="swatch" title="default" style={{ background: '#fff' }} onClick={() => onPick('bg-default')} />
            {allowTransparent && (
              <button
                className="swatch"
                title="transparent"
                style={{ background: 'repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 50% / 10px 10px' }}
                onClick={() => onPick('bg-transparent')}
              />
            )}
            {BACKGROUND_SWATCHES.map((k) => (
              <button key={k} className="swatch" title={k} style={{ background: resolveBackground(k, k) }} onClick={() => onPick(k)} />
            ))}
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
  const label = kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Web page'
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add {label}</h3>
        <input
          type="url"
          autoFocus
          placeholder={kind === 'video' ? 'YouTube or video URL' : kind === 'web' ? 'https://…' : 'Image URL'}
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
          <button className="btn btn--primary" disabled={!url} onClick={() => onSubmit(url)}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
