import { describe, expect, it } from 'vitest'
import {
  buildComponentClipboardPayload,
  COMPONENT_CLIPBOARD_MIME,
  COMPONENT_CLIPBOARD_TEXT_PREFIX,
  instantiateComponentClipboard,
  parseComponentClipboard,
  parseComponentClipboardText,
  readComponentClipboardData,
  stringifyComponentClipboard,
  stringifyComponentClipboardText,
  writeComponentClipboardData,
} from './componentClipboard'
import type { AnyComponent } from './types'

const base = {
  slide_id: 'slide-a',
  scale_x: 1,
  scale_y: 1,
  scale_w: 320,
  scale_h: 180,
  rotate: 0,
  skew_x: 0,
  skew_y: 0,
  custom_classes: '',
}

describe('component clipboard', () => {
  it('serializes selected components without source ids and in z order', () => {
    const components: AnyComponent[] = [
      {
        ...base,
        id: 'img-1',
        kind: 'image',
        z_order: 8,
        x: 100,
        y: 120,
        src: 'https://example.com/a.png',
        image_type: 'url',
      },
      {
        ...base,
        id: 'artifact-1',
        kind: 'artifact',
        z_order: 3,
        x: 20,
        y: 40,
        code: 'export default function Demo() { return <div /> }',
        src: '/uploads/demo.html',
      },
    ]

    const payload = buildComponentClipboardPayload(components)

    expect(payload?.components.map((c) => c.kind)).toEqual([
      'artifact',
      'image',
    ])
    expect(payload?.components[0]).not.toHaveProperty('id')
    expect(payload?.components[0]).not.toHaveProperty('slide_id')
    expect(payload?.components[0]).toMatchObject({
      kind: 'artifact',
      code: components[1].code,
      src: components[1].src,
    })
  })

  it('round-trips through custom MIME and text fallback clipboard data', () => {
    const payload = buildComponentClipboardPayload([
      {
        ...base,
        id: 'frame-1',
        kind: 'webframe',
        z_order: 1,
        x: 10,
        y: 20,
        src: 'https://example.com',
      },
    ])!
    const data = new Map<string, string>()

    writeComponentClipboardData(
      {
        setData: (type, value) => data.set(type, value),
      },
      payload,
    )

    expect(data.get(COMPONENT_CLIPBOARD_MIME)).toBe(
      stringifyComponentClipboard(payload),
    )
    expect(data.get('text/plain')).toBe(
      stringifyComponentClipboardText(payload),
    )
    expect(
      readComponentClipboardData({
        getData: (type) => data.get(type) ?? '',
      }),
    ).toEqual(payload)
    expect(
      readComponentClipboardData({
        getData: (type) => (type === 'text/plain' ? data.get(type)! : ''),
      }),
    ).toEqual(payload)
  })

  it('pastes copies with fresh ids, the target slide, an offset, and new z-order', () => {
    const payload = buildComponentClipboardPayload([
      {
        ...base,
        id: 'shape-1',
        kind: 'shape',
        z_order: 2,
        x: 50,
        y: 60,
        fill: '1e1e1e',
        shape: 'rectangle',
        markup: '<svg />',
      },
      {
        ...base,
        id: 'video-1',
        kind: 'video',
        z_order: 4,
        x: 80,
        y: 90,
        src: 'https://video.example/watch',
        video_type: 'youtube',
        src_type: 'url',
        short_src: 'watch',
      },
    ])!
    const ids = ['new-shape', 'new-video']

    const pasted = instantiateComponentClipboard(payload, {
      slideId: 'slide-b',
      offset: 24,
      zStart: 100,
      newId: () => ids.shift()!,
    })

    expect(pasted.map((c) => c.id)).toEqual(['new-shape', 'new-video'])
    expect(pasted.map((c) => c.slide_id)).toEqual(['slide-b', 'slide-b'])
    expect(pasted.map((c) => [c.x, c.y, c.z_order])).toEqual([
      [74, 84, 100],
      [104, 114, 101],
    ])
    expect(pasted[0]).toMatchObject({
      kind: 'shape',
      fill: '1e1e1e',
      markup: '<svg />',
    })
  })

  it('rejects non-Strut and malformed clipboard content', () => {
    expect(parseComponentClipboard('{"components":[]}')).toBeNull()
    expect(
      parseComponentClipboardText(
        `${COMPONENT_CLIPBOARD_TEXT_PREFIX}{"format":"strut.components"}`,
      ),
    ).toBeNull()
    expect(
      parseComponentClipboard(
        '{"format":"strut.components","version":1,"components":[{"kind":"image","x":0}]}',
      ),
    ).toBeNull()
  })
})
