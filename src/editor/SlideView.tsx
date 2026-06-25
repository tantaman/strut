// A live, CSS-scaled mini-rendering of a slide for READ-ONLY surfaces (well thumbnails, overview
// cards, presenter, share) — a real DOM snapshot, not a raster (spec §5.1).
//
// One data path, shared with the editor's Stage: read the slide through `useFragment(SlideFragment)`
// — unmasking the five component arrays the composed deck query already materialized — then
// `mergeComponents` flattens them into the single z-ordered list the renderer walks. The ONLY
// difference from the Stage is that the Stage wraps each component with selection/resize handles;
// here we render the pure visual. Video / web frames show as black placeholders (a thumbnail must
// not spin up a live <iframe>/<video>).
//
// Stacking is DOM order: `mergeComponents` sorts ascending by z_order, so later siblings paint on top.

import { useFragment } from '@rindle/react'
import type { FragmentRef } from '@rindle/react'
import { SlideFragment } from '../../shared/fragments'
import { SLIDE_W } from '../config'
import { cmpStyle, renderInner } from './render'
import { backgroundImage, mergeComponents, resolveBackground } from './types'
import type { AnyComponent } from './types'

// The pure visual box — the same `cmpStyle` + `renderInner` the editor's <ComponentView> wraps, minus
// interaction. Video / web frames are black placeholders (no live embed in a read-only thumbnail).
function StaticComponent({ c }: { c: AnyComponent }) {
  return (
    <div className={`cmp cmp--${c.kind}`} style={cmpStyle(c)}>
      {c.kind === 'video' || c.kind === 'webframe' ? (
        <div style={{ width: '100%', height: '100%', background: '#000' }} />
      ) : (
        renderInner(c)
      )}
    </div>
  )
}

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
  const components = mergeComponents(
    s.texts,
    s.images,
    s.shapes,
    s.videos,
    s.webframes,
  )
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
      {components.map((c) => (
        <StaticComponent key={c.id} c={c} />
      ))}
    </div>
  )
}
