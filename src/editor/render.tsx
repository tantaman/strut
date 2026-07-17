// Pure visual rendering of a component (no interaction). Shared by the stage (which wraps it with
// selection + handles) and the read-only thumbnails/overview cards.

import { memo, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  bodyRegionStyle,
  cssHex,
  cssUrlValue,
  resolveBackgroundImage,
  resolveBodyRegion,
  resolveTextAlign,
  textTypeOf,
} from './types'
import type {
  AnyComponent,
  BackgroundImageSpec,
  ComponentKind,
  DeckPresentationFields,
  SlideThemeFields,
} from './types'
import { docToHtml } from './tiptapDoc'
import { FONTS_BY_CATEGORY } from '../config'

const DEFAULT_W: Record<ComponentKind, number> = {
  text: 0,
  image: 400,
  shape: 200,
  video: 480,
  webframe: 640,
  artifact: 640,
}
const DEFAULT_H: Record<ComponentKind, number> = {
  text: 0,
  image: 300,
  shape: 200,
  video: 270,
  webframe: 480,
  artifact: 480,
}

/** A CSS `font-family` value safe for inline styles: quoted (so digit-leading names like
 *  "Press Start 2P" are valid) with a generic fallback for when the web font hasn't loaded. */
export function cssFontFamily(name: string | undefined): string {
  const fam = (name || 'Lato').replace(/"/g, '')
  return `"${fam}", sans-serif`
}

/** Grouped <optgroup> font choices for a native <select>, shared by every font picker (deck theme,
 *  inspector, format bar) so they all present the same curated, category-organized list. Each option
 *  previews itself in its own font; the caller supplies any leading "theme default" option. */
export function FontOptions() {
  return (
    <>
      {FONTS_BY_CATEGORY.map((group) => (
        <optgroup key={group.category} label={group.label}>
          {group.fonts.map((f) => (
            <option
              key={f.name}
              value={f.name}
              style={{ fontFamily: cssFontFamily(f.name) }}
            >
              {f.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )
}

/** The deck text theme as CSS variables. Set on every slide container (stage canvas, thumbnail
 *  frame, impress export), so a text component with an empty color/font_family can inherit via
 *  `var(--strut-<category>-…)` no matter which surface renders it. `--strut-text-align` (slide
 *  override → deck default → 'left') drives markdown-mode alignment; the optional `slide` supplies
 *  the per-slide override.
 *
 *  `--strut-body-pad` / `--strut-type-scale` carry the body's REGION (see resolveBodyRegion). Riding
 *  as vars on the container is what keeps partitioning to one place: every app surface already sets
 *  these vars, so the thumbnail, the stage, Doc's cards, Play and share all partition for free — none
 *  of them needs to learn the concept. The standalone export has its own twin, themeVarsCss.
 *
 *  IMPORTANT: every var added here must also be added to `themeVarsCss` in impressExport.ts, or an
 *  exported deck renders differently from the app. `themeVars.test.ts` pins the two together. */
export function themeVars(
  theme: DeckPresentationFields | null | undefined,
  slide?: SlideThemeFields | null,
): CSSProperties {
  const region = bodyRegionStyle(
    resolveBodyRegion(
      slide?.body_region,
      resolveBackgroundImage(
        slide?.background ?? undefined,
        theme?.background ?? undefined,
      )?.layout,
    ),
  )
  return {
    '--strut-heading-color': cssHex(theme?.heading_color ?? '', '111111'),
    '--strut-heading-font': cssFontFamily(theme?.heading_font ?? ''),
    '--strut-body-color': cssHex(theme?.body_color ?? '', '111111'),
    '--strut-body-font': cssFontFamily(theme?.body_font ?? ''),
    '--strut-text-align': resolveTextAlign(
      slide?.text_align,
      theme?.text_align,
    ),
    '--strut-body-pad': region.pad,
    '--strut-type-scale': String(region.scale),
    '--strut-body-display': region.display,
  } as CSSProperties
}

export function componentSize(c: AnyComponent): { w: number; h: number } {
  return {
    w: c.scale_w || DEFAULT_W[c.kind],
    h: c.scale_h || DEFAULT_H[c.kind],
  }
}

export function backgroundImageLayerOuterStyle(
  image: BackgroundImageSpec,
): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    opacity: image.fade ? 0.48 : 1,
  }
  if (image.layout === 'left') {
    style.left = 0
    style.width = '50%'
  } else if (image.layout === 'right') {
    style.right = 0
    style.width = '50%'
  } else {
    style.left = 0
    style.right = 0
  }
  if (image.mask) {
    const mask =
      image.layout === 'left'
        ? 'linear-gradient(90deg, #000 0%, #000 72%, transparent 100%)'
        : image.layout === 'right'
          ? 'linear-gradient(270deg, #000 0%, #000 72%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)'
    style.maskImage = mask
    style.WebkitMaskImage = mask
  }
  return style
}

export function backgroundImageLayerInnerStyle(
  image: BackgroundImageSpec,
): CSSProperties {
  return {
    position: 'absolute',
    inset: image.blur ? -14 : 0,
    backgroundImage: cssUrlValue(image.src),
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    filter: image.blur ? 'blur(10px)' : undefined,
  }
}

export function BackgroundImageLayer({
  image,
}: {
  image?: BackgroundImageSpec
}) {
  if (!image) return null
  return (
    <div
      className="slide-bg-img"
      style={backgroundImageLayerOuterStyle(image)}
      aria-hidden
    >
      <div
        className="slide-bg-img__media"
        style={backgroundImageLayerInnerStyle(image)}
      />
    </div>
  )
}

export function cmpStyle(c: AnyComponent): CSSProperties {
  const base: CSSProperties = {
    left: c.x,
    top: c.y,
    zIndex: c.z_order,
    transform: `rotate(${c.rotate}rad) skewX(${c.skew_x}rad) skewY(${c.skew_y}rad)`,
  }
  if (c.kind === 'text') {
    const cat = textTypeOf(c)
    return {
      ...base,
      fontSize: c.size ?? 72,
      // '' = inherit the deck theme default for this component's category (heading | body), read
      // from the CSS variables every slide container sets (themeVars above).
      color: c.color
        ? cssHex(c.color, '111111')
        : `var(--strut-${cat}-color, #111111)`,
      // Quote the family: an unquoted CSS font-family token can't start with a digit, so a name
      // like "Press Start 2P" is invalid unquoted and the browser drops the whole declaration.
      // (The impress export already quotes it the same way.)
      fontFamily: c.font_family
        ? cssFontFamily(c.font_family)
        : `var(--strut-${cat}-font, ${cssFontFamily('')})`,
      whiteSpace: 'pre-wrap',
      lineHeight: 1.1,
      maxWidth: 1100,
    }
  }
  const { w, h } = componentSize(c)
  return { ...base, width: w, height: h, color: cssHex(c.fill, '3498db') }
}

const FULL_SIZE_STYLE: CSSProperties = { width: '100%', height: '100%' }

const TextBody = memo(function TextBody({ html }: { html: string }) {
  const dangerouslySetInnerHTML = useMemo(() => ({ __html: html }), [html])
  return (
    <div
      className="cmp__textbody"
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  )
})

const MarkupBody = memo(function MarkupBody({ markup }: { markup: string }) {
  const dangerouslySetInnerHTML = useMemo(() => ({ __html: markup }), [markup])
  return (
    <div
      style={FULL_SIZE_STYLE}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  )
})

/** A read-only full-slide markdown surface (spec: markdown mode). Renders a stored TipTap `doc` (JSON
 *  string) to sanitized HTML inside a `.strut-md` scope; the theme (fonts/colors/alignment) flows in
 *  via the CSS vars the enclosing slide container sets (themeVars). Used by every read-only surface —
 *  thumbnails, overview, presenter, share — and the editor stage's non-editing (viewer) branch. The
 *  editing branch renders TipTapSlideEditor into the same `.strut-md` scope instead. */
export const MarkdownSurface = memo(function MarkdownSurface({
  doc,
}: {
  doc: string | null | undefined
}) {
  const dangerouslySetInnerHTML = useMemo(
    () => ({ __html: docToHtml(doc) }),
    [doc],
  )
  return (
    <div
      className="strut-md"
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  )
})

/** `opts.interactive` lets the artifact iframe accept pointer events (Present mode). Everywhere else it
 *  stays pointer-transparent so the editor can drag/select the box and thumbnails stay inert. */
export function renderInner(
  c: AnyComponent,
  opts?: { interactive?: boolean },
): ReactNode {
  switch (c.kind) {
    case 'text':
      return <TextBody html={c.text && c.text.length ? c.text : 'Text'} />
    case 'image':
      return c.src ? (
        <img src={c.src} alt="" draggable={false} />
      ) : (
        <div className="cmp__ph">image</div>
      )
    case 'shape':
      return <MarkupBody markup={c.markup || ''} />
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
    case 'artifact':
      // Runnable code. NO `allow-same-origin` — with only `allow-scripts` the frame runs in a unique
      // opaque origin, so it can't reach the app's cookies/storage/DOM even if served same-origin. NO
      // allow-top-navigation / allow-popups / allow-modals / allow-forms, and no `allow=` feature grants.
      if (!c.src)
        return (
          <div className="cmp__ph">▶ runnable — press Run in the panel</div>
        )
      return (
        <iframe
          src={c.src}
          title="artifact"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            background: '#fff',
            pointerEvents: opts?.interactive ? 'auto' : 'none',
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
