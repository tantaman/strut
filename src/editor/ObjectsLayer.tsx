// A slide's positioned components rendered read-only (no selection or handles). Read surfaces use this
// component; precision editing's interactive stack lives in Stage.

import { cmpStyle, renderInner } from './render'
import { componentClassName } from './componentClasses'
import type { AnyComponent } from './types'

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
  primary = false,
}: {
  c: AnyComponent
  live?: boolean
  present?: boolean
  /** The slide's doc-first text component. It shares the same geometry/content as precision editing. */
  primary?: boolean
}) {
  return (
    <div
      className={componentClassName(c, primary ? ['is-primary'] : [])}
      style={cmpStyle(c)}
    >
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
