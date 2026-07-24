// The "objects" layer: a slide's positioned spatial components rendered read-only (no selection, no
// handles). Two consumers share it — the read surfaces (SlideView thumbnails/overview/presenter/share)
// and the editor's LOCKED overlay, shown when the Body layer is the one being edited. The editor's
// INTERACTIVE objects (drag/resize/rotate) live in Stage; this is only the inert rendering.

import { cmpStyle, renderInner } from './render'
import { componentClassName } from './componentClasses'
import type { AnyComponent } from './types'
import type { SlideDetail } from './deckDetail'
import {
  ComponentDataReader,
  componentRefKey,
  mergeComponentRefs,
} from './componentFragments'

/** One component's pure visual box — `cmpStyle` + `renderInner`, minus interaction. `live=false` (read
 *  surfaces) shows video/web frames as black placeholders so a thumbnail never spins up a live embed;
 *  the editor overlay leaves `live` on (default) so a locked object looks identical to when editable.
 *
 *  `present` = the ACTIVE slide on a presentation surface. Its embeds render live + interactive; inert
 *  thumbnails/overview/inactive flight cards keep posters so they never boot N media players at once. */
export function StaticComponent({
  c,
  live = true,
  present = false,
}: {
  c: AnyComponent
  live?: boolean
  present?: boolean
}) {
  return (
    <div className={componentClassName(c)} style={cmpStyle(c)}>
      {c.kind === 'artifact' ? (
        live || present ? (
          renderInner(c, { interactive: present })
        ) : (
          <ArtifactPoster />
        )
      ) : !live && !present && (c.kind === 'video' || c.kind === 'webframe') ? (
        <div style={{ width: '100%', height: '100%', background: '#000' }} />
      ) : (
        renderInner(c, { interactive: present })
      )}
    </div>
  )
}

/** Inert stand-in for a runnable artifact on non-presentation read surfaces (thumbnails, overview). */
function ArtifactPoster() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f4f5',
        color: '#71717a',
        font: '600 14px/1.2 system-ui, sans-serif',
      }}
    >
      ▶ runnable
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
