import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StaticComponent } from './ObjectsLayer'
import type { AnyComponent, ComponentKind } from './types'

function component(
  kind: ComponentKind,
  props: Partial<AnyComponent> = {},
): AnyComponent {
  return {
    id: 'component-1',
    slide_id: 'slide-1',
    kind,
    z_order: 1,
    x: 0,
    y: 0,
    scale_x: 1,
    scale_y: 1,
    scale_w: 320,
    scale_h: 180,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: 'hero',
    ...props,
  }
}

describe('StaticComponent presentation embeds', () => {
  it.each([
    ['video', component('video', { src: '/clip.mp4', video_type: 'html5' })],
    ['webframe', component('webframe', { src: 'https://example.com/embed' })],
  ] as const)('keeps %s inert outside presentation', (_, c) => {
    const html = renderToStaticMarkup(<StaticComponent c={c} live={false} />)
    expect(html).not.toContain('<video')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('background:#000')
  })

  it('renders the active HTML5 video in presentation', () => {
    const html = renderToStaticMarkup(
      <StaticComponent
        c={component('video', { src: '/clip.mp4', video_type: 'html5' })}
        live={false}
        present
      />,
    )
    expect(html).toContain('<video')
    expect(html).toContain('src="/clip.mp4"')
  })

  it.each([
    [
      'YouTube video',
      component('video', {
        video_type: 'youtube',
        short_src: 'abcdefghijk',
      }),
    ],
    ['web frame', component('webframe', { src: 'https://example.com/embed' })],
  ] as const)('renders the active %s interactively in presentation', (_, c) => {
    const html = renderToStaticMarkup(
      <StaticComponent c={c} live={false} present />,
    )
    expect(html).toContain('<iframe')
    expect(html).toContain('pointer-events:auto')
  })

  it('applies normalized persisted classes on read surfaces', () => {
    const html = renderToStaticMarkup(
      <StaticComponent
        c={component('text', {
          text: 'Hello',
          custom_classes: 'hero hero bad" onload=alert(1)',
        })}
        live={false}
      />,
    )
    expect(html).toContain('class="cmp cmp--text hero"')
    expect(html).not.toContain('onload=')
  })
})
