// The "objects" layer: a slide's positioned spatial components rendered read-only (no selection, no
// handles). Two consumers share it — the read surfaces (SlideView thumbnails/overview/presenter/share)
// and the editor's LOCKED overlay, shown when the Body layer is the one being edited. The editor's
// INTERACTIVE objects (drag/resize/rotate) live in Stage; this is only the inert rendering.

import { cmpStyle, renderInner } from './render'
import type { AnyComponent } from './types'
import type { SlideDetail } from './deckDetail'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'

/** One component's pure visual box — `cmpStyle` + `renderInner`, minus interaction. `live=false` (read
 *  surfaces) shows video/web frames as black placeholders so a thumbnail never spins up a live embed;
 *  the editor overlay leaves `live` on (default) so a locked object looks identical to when editable. */
export function StaticComponent({
  c,
  live = true,
}: {
  c: AnyComponent
  live?: boolean
}) {
  return (
    <div className={`cmp cmp--${c.kind}`} style={cmpStyle(c)}>
      {!live && (c.kind === 'video' || c.kind === 'webframe') ? (
        <div style={{ width: '100%', height: '100%', background: '#000' }} />
      ) : (
        renderInner(c)
      )}
    </div>
  )
}

/** The locked objects overlay for the editor's Body-edit layer: the slide's components rendered on top
 *  of the markdown but inert (pointer-events:none via `.slide-locked-layer`) so clicks fall through to
 *  the text being edited. Renders nothing when the slide has no components (so a pure-markdown slide is
 *  unchanged). */
export function LockedObjects({ slide }: { slide: SlideDetail }) {
  const components = mergeComponentRefs(slide)
  if (components.length === 0) return null
  return (
    <div className="slide-locked-layer">
      {components.map((component) => (
        <ComponentDataReader
          key={componentRefKey(component)}
          component={component}
        >
          {(c) => <StaticComponent c={c} />}
        </ComponentDataReader>
      ))}
    </div>
  )
}
