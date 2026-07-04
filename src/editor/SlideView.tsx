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
import { cmpStyle, MarkdownSurface, renderInner, themeVars } from './render'
import { backgroundImage, composeBackground, resolveBackground } from './types'
import type { AnyComponent, DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'
import type { ReactNode } from 'react'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'

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
        background: composeBackground(
          resolveBackground(slide.background, deck?.background),
          backgroundImage(slide.background, deck?.background),
        ),
        ...themeVars(deck, slide),
      }}
    >
      {children}
    </div>
  )
}

export function SlideView({
  slide,
  deck,
  width,
  onComponentData,
  onComponentRemove,
}: {
  slide: SlideDetail
  deck: DeckThemeRow
  width: number
  onComponentData?: (component: AnyComponent) => void
  onComponentRemove?: (id: string) => void
}) {
  // Markdown mode: one full-slide markdown surface in place of the component canvas (spec: a slide
  // is either spatial-component mode or markdown mode). Components stay in the DB, just unrendered.
  if (slide.render_mode === 'markdown') {
    return (
      <SlideFrame slide={slide} deck={deck} width={width}>
        <MarkdownSurface markdown={slide.markdown} />
      </SlideFrame>
    )
  }
  const components = mergeComponentRefs(slide)
  return (
    <SlideFrame slide={slide} deck={deck} width={width}>
      {components.map((component) => (
        <ComponentDataReader
          key={componentRefKey(component)}
          component={component}
          onData={onComponentData}
          onRemove={onComponentRemove}
        >
          {(c) => <StaticComponent c={c} />}
        </ComponentDataReader>
      ))}
    </SlideFrame>
  )
}

