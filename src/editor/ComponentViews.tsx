// The relay render tree for READ-ONLY surfaces (well thumbnails, overview cards, presenter, share):
// one component PER component type, each reading its own PROJECTED fragment with `useFragment` — a
// pure, typed, masked read of the already-materialized node (no extra subscription). The parent
// `<SlideView>` reads `<SlideFragment>` and fans the five aliases out to the five leaf views.
//
// Stacking is by explicit `zIndex: z_order` (not DOM order), because rendering is now grouped by type
// rather than the single z-ordered list the old merge produced. Video/web frames render as
// placeholders here for performance — same as the old SlideThumb (the editor Stage renders the live
// element).

import { useFragment } from '@rindle/react'
import type { FragmentRef } from '@rindle/react'
import {
  ImageFragment,
  ShapeFragment,
  SlideFragment,
  TextFragment,
  VideoFragment,
  WebframeFragment,
} from '../../shared/fragments'
import { SLIDE_W } from '../config'
import { cmpStyle, renderInner } from './render'
import { backgroundImage, resolveBackground, type AnyComponent } from './types'

// Each leaf masks to its own columns via useFragment, then tags the node with kind/table so it can
// reuse the shared `cmpStyle`/`renderInner` (identical visuals to the editor) plus an explicit zIndex.
function TextView({ node }: { node: FragmentRef<typeof TextFragment> }) {
  const t = useFragment(TextFragment, node)
  const c: AnyComponent = { ...t, kind: 'text', table: 'text_component' }
  return (
    <div
      className="cmp cmp--text"
      style={{ ...cmpStyle(c), zIndex: t.z_order }}
    >
      {renderInner(c)}
    </div>
  )
}

function ImageView({ node }: { node: FragmentRef<typeof ImageFragment> }) {
  const i = useFragment(ImageFragment, node)
  const c: AnyComponent = { ...i, kind: 'image', table: 'image_component' }
  return (
    <div
      className="cmp cmp--image"
      style={{ ...cmpStyle(c), zIndex: i.z_order }}
    >
      {renderInner(c)}
    </div>
  )
}

function ShapeView({ node }: { node: FragmentRef<typeof ShapeFragment> }) {
  const s = useFragment(ShapeFragment, node)
  const c: AnyComponent = { ...s, kind: 'shape', table: 'shape_component' }
  return (
    <div
      className="cmp cmp--shape"
      style={{ ...cmpStyle(c), zIndex: s.z_order }}
    >
      {renderInner(c)}
    </div>
  )
}

function VideoView({ node }: { node: FragmentRef<typeof VideoFragment> }) {
  const v = useFragment(VideoFragment, node)
  const c: AnyComponent = { ...v, kind: 'video', table: 'video_component' }
  return (
    <div
      className="cmp cmp--video"
      style={{ ...cmpStyle(c), zIndex: v.z_order }}
    >
      <div style={{ width: '100%', height: '100%', background: '#000' }} />
    </div>
  )
}

function WebframeView({
  node,
}: {
  node: FragmentRef<typeof WebframeFragment>
}) {
  const w = useFragment(WebframeFragment, node)
  const c: AnyComponent = {
    ...w,
    kind: 'webframe',
    table: 'webframe_component',
  }
  return (
    <div
      className="cmp cmp--webframe"
      style={{ ...cmpStyle(c), zIndex: w.z_order }}
    >
      <div style={{ width: '100%', height: '100%', background: '#000' }} />
    </div>
  )
}

/** A live, CSS-scaled mini-rendering of a slide (spec §5.1: a real snapshot, not a raster), built
 *  from the slide's fragment ref — the relay replacement for the old <SlideThumb>. */
export function SlideView({
  slide,
  deck,
  width,
}: {
  slide: FragmentRef<typeof SlideFragment>
  deck: { background: string } | null
  width: number
}) {
  const s = useFragment(SlideFragment, slide)
  const scale = width / SLIDE_W
  return (
    <div
      className="well__thumb-inner"
      style={{
        width: SLIDE_W,
        height: (SLIDE_W * 9) / 16,
        transform: `scale(${scale})`,
        background: resolveBackground(s.background, deck?.background),
        backgroundImage: backgroundImage(s.background, deck?.background),
        backgroundSize: 'cover',
      }}
    >
      {s.texts.map((t) => (
        <TextView key={t.id} node={t} />
      ))}
      {s.images.map((i) => (
        <ImageView key={i.id} node={i} />
      ))}
      {s.shapes.map((sh) => (
        <ShapeView key={sh.id} node={sh} />
      ))}
      {s.videos.map((v) => (
        <VideoView key={v.id} node={v} />
      ))}
      {s.webframes.map((w) => (
        <WebframeView key={w.id} node={w} />
      ))}
    </div>
  )
}
