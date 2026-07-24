// A live, CSS-scaled mini-rendering of a slide for READ-ONLY surfaces (well thumbnails, overview
// cards, presenter, share) — a real DOM snapshot, not a raster (spec §5.1).
//
// One data path, shared with the editor's Stage: the root deck query carries a slide row plus
// component fragment refs. Each component reads its own fragment, so high-frequency leaf edits only
// re-render that leaf. Video / web frames show as black placeholders (a thumbnail must not spin up a
// live <iframe>/<video>).
//
// Stacking is CSS z-index from z_order, so refs do not need a parent-level materialized sort.

import { SLIDE_W } from '../config'
import { BackgroundImageLayer, MarkdownBodies, themeVars } from './render'
import { resolveBackground, resolveBackgroundImage } from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'
import type { ReactNode } from 'react'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'
import { StaticComponent } from './ObjectsLayer'

type DeckThemeRow = ({ background: string } & DeckThemeFields) | null

function SlideFrame({
  slide,
  deck,
  width,
  children,
}: {
  slide: SlideDetail
  deck: DeckThemeRow
  width: number
  children: ReactNode
}) {
  const scale = width / SLIDE_W
  return (
    <div
      className="well__thumb-inner"
      style={{
        width: SLIDE_W,
        height: (SLIDE_W * 9) / 16,
        transform: `scale(${scale})`,
        background: resolveBackground(slide.background, deck?.background),
        ...themeVars(deck, slide),
      }}
    >
      <BackgroundImageLayer
        image={resolveBackgroundImage(slide.background, deck?.background)}
      />
      {children}
    </div>
  )
}

export function SlideView({
  slide,
  deck,
  width,
  present = false,
  onComponentData,
  onComponentRemove,
}: {
  slide: SlideDetail
  deck: DeckThemeRow
  width: number
  // A presentation surface (Play / share flythrough). Runnable artifacts render live + interactive here;
  // on the inert read surfaces (thumbnails, overview) they show a poster instead. Set only for the
  // ACTIVE slide so at most one slide's sandboxes are live at a time.
  present?: boolean
  onComponentData?: (component: AnyComponent) => void
  onComponentRemove?: (id: string) => void
}) {
  // Both layers, always composited: the markdown Body underlay + the positioned Objects on top. Each
  // is emitted only when it has content, so old object-only and body-only data renders unchanged. The
  // persisted `render_mode` field is compatibility metadata, not a rendering branch.
  const components = mergeComponentRefs(slide)
  return (
    <SlideFrame slide={slide} deck={deck} width={width}>
      <MarkdownBodies slide={slide} />
      {components.map((component) => (
        <ComponentDataReader
          key={componentRefKey(component)}
          component={component}
          onData={onComponentData}
          onRemove={onComponentRemove}
        >
          {(c) => <StaticComponent c={c} live={false} present={present} />}
        </ComponentDataReader>
      ))}
    </SlideFrame>
  )
}
