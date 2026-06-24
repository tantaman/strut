// A live, CSS-scaled mini-rendering of a slide (spec §5.1: a real snapshot, not a raster). Video and
// web frames are drawn as placeholders in thumbnails for performance.

import { SLIDE_W } from '../config'
import { cmpStyle, renderInner } from './render'
import { backgroundImage, resolveBackground } from './types'
import { useSlideComponents } from './useSlideComponents'

interface SlideRow {
  id: string
  background: string
  surface: string
}

export function SlideThumb({
  slide,
  deck,
  width,
}: {
  slide: SlideRow
  deck: { background: string } | null
  width: number
}) {
  const components = useSlideComponents(slide.id)
  const scale = width / SLIDE_W
  return (
    <div
      className="well__thumb-inner"
      style={{
        width: SLIDE_W,
        height: (SLIDE_W * 9) / 16,
        transform: `scale(${scale})`,
        background: resolveBackground(slide.background, deck?.background),
        backgroundImage: backgroundImage(slide.background, deck?.background),
        backgroundSize: 'cover',
      }}
    >
      {components.map((c) => (
        <div key={c.id} className={`cmp cmp--${c.kind}`} style={cmpStyle(c)}>
          {c.kind === 'video' || c.kind === 'webframe' ? (
            <div style={{ width: '100%', height: '100%', background: '#000' }} />
          ) : (
            renderInner(c)
          )}
        </div>
      ))}
    </div>
  )
}
