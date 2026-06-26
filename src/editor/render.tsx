// Pure visual rendering of a component (no interaction). Shared by the stage (which wraps it with
// selection + handles) and the read-only thumbnails/overview cards.

import type { CSSProperties, ReactNode } from 'react'
import { cssHex } from './types'
import type { AnyComponent, ComponentKind } from './types'

const DEFAULT_W: Record<ComponentKind, number> = {
  text: 0,
  image: 400,
  shape: 200,
  video: 480,
  webframe: 640,
}
const DEFAULT_H: Record<ComponentKind, number> = {
  text: 0,
  image: 300,
  shape: 200,
  video: 270,
  webframe: 480,
}

/** A CSS `font-family` value safe for inline styles: quoted (so digit-leading names like
 *  "Press Start 2P" are valid) with a generic fallback for when the web font hasn't loaded. */
export function cssFontFamily(name: string | undefined): string {
  const fam = (name || 'Lato').replace(/"/g, '')
  return `"${fam}", sans-serif`
}

export function componentSize(c: AnyComponent): { w: number; h: number } {
  return {
    w: c.scale_w || DEFAULT_W[c.kind],
    h: c.scale_h || DEFAULT_H[c.kind],
  }
}

export function cmpStyle(c: AnyComponent): CSSProperties {
  const base: CSSProperties = {
    left: c.x,
    top: c.y,
    zIndex: c.z_order,
    transform: `rotate(${c.rotate}rad) skewX(${c.skew_x}rad) skewY(${c.skew_y}rad)`,
  }
  if (c.kind === 'text') {
    return {
      ...base,
      fontSize: c.size ?? 72,
      color: cssHex(c.color, '111111'),
      // Quote the family: an unquoted CSS font-family token can't start with a digit, so a name
      // like "Press Start 2P" is invalid unquoted and the browser drops the whole declaration.
      // (The impress export already quotes it the same way.)
      fontFamily: cssFontFamily(c.font_family),
      whiteSpace: 'pre-wrap',
      lineHeight: 1.1,
      maxWidth: 1100,
    }
  }
  const { w, h } = componentSize(c)
  return { ...base, width: w, height: h, color: cssHex(c.fill, '3498db') }
}

export function renderInner(c: AnyComponent): ReactNode {
  switch (c.kind) {
    case 'text':
      return (
        <div
          className="cmp__textbody"
          dangerouslySetInnerHTML={{
            __html: c.text && c.text.length ? c.text : 'Text',
          }}
        />
      )
    case 'image':
      return c.src ? (
        <img src={c.src} alt="" draggable={false} />
      ) : (
        <div className="cmp__ph">image</div>
      )
    case 'shape':
      return (
        <div
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{ __html: c.markup || '' }}
        />
      )
    case 'video':
      if (c.video_type === 'youtube' && c.short_src)
        return (
          <iframe
            src={`https://www.youtube.com/embed/${c.short_src}`}
            title="video"
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              pointerEvents: 'none',
            }}
            allowFullScreen
          />
        )
      return (
        <video src={c.src} controls style={{ width: '100%', height: '100%' }} />
      )
    case 'webframe':
      return (
        <iframe
          src={c.src}
          title="web frame"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
          }}
        />
      )
  }
}

/** Parse a video URL into the stored video fields (spec §3.4). */
export function parseVideo(url: string): {
  video_type: string
  src_type: string
  short_src: string
} {
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/,
  )
  if (yt) return { video_type: 'youtube', src_type: 'yt', short_src: yt[1] }
  return { video_type: 'html5', src_type: '', short_src: '' }
}
