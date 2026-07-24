import { describe, expect, it } from 'vitest'
import {
  componentGeometry,
  DOC_TEXT_LAYOUTS,
  docTextLayoutForGeometry,
  geometryForDocTextLayout,
} from './docTextLayouts'
import type { AnyComponent } from './types'

function primary(patch: Partial<AnyComponent> = {}): AnyComponent {
  return {
    id: 'slide-1:body',
    slide_id: 'slide-1',
    kind: 'text',
    z_order: 0,
    x: 17,
    y: 23,
    scale_x: 1.2,
    scale_y: 0.8,
    scale_w: 451,
    scale_h: 219,
    rotate: 0.4,
    skew_x: 0.1,
    skew_y: -0.2,
    custom_classes: '',
    doc: '',
    ...patch,
  }
}

describe('doc text layout geometry', () => {
  it('defines the five useful one-component frames without layout state', () => {
    expect(DOC_TEXT_LAYOUTS.map(({ id, frame }) => ({ id, frame }))).toEqual([
      { id: 'full', frame: { x: 0, y: 0, w: 1280, h: 720 } },
      { id: 'left', frame: { x: 0, y: 0, w: 640, h: 720 } },
      { id: 'right', frame: { x: 640, y: 0, w: 640, h: 720 } },
      { id: 'top', frame: { x: 0, y: 0, w: 1280, h: 360 } },
      { id: 'bottom', frame: { x: 0, y: 360, w: 1280, h: 360 } },
    ])
  })

  it('snaps position, size, rotation, scale and skew while preserving identity', () => {
    expect(geometryForDocTextLayout(primary(), 'right')).toEqual({
      id: 'slide-1:body',
      x: 640,
      y: 0,
      scale_x: 1,
      scale_y: 1,
      scale_w: 640,
      scale_h: 720,
      rotate: 0,
      skew_x: 0,
      skew_y: 0,
    })
  })

  it('detects every exact preset from persisted component geometry', () => {
    for (const layout of DOC_TEXT_LAYOUTS) {
      const geometry = geometryForDocTextLayout(primary(), layout.id)
      expect(docTextLayoutForGeometry(geometry)).toBe(layout.id)
    }
  })

  it('reports a precision-adjusted frame as custom', () => {
    const full = geometryForDocTextLayout(primary(), 'full')
    expect(docTextLayoutForGeometry({ ...full, x: 4 })).toBeNull()
    expect(docTextLayoutForGeometry({ ...full, x: 0.0001 })).toBeNull()
    expect(docTextLayoutForGeometry({ ...full, scale_w: 1200 })).toBeNull()
    expect(docTextLayoutForGeometry({ ...full, rotate: 0.02 })).toBeNull()
    expect(docTextLayoutForGeometry({ ...full, skew_y: 0.02 })).toBeNull()
    expect(docTextLayoutForGeometry({ ...full, scale_x: 0.9 })).toBeNull()
  })

  it('captures the exact pre-snap geometry for undo', () => {
    const before = componentGeometry(primary())
    geometryForDocTextLayout(primary(), 'bottom')
    expect(before).toEqual({
      id: 'slide-1:body',
      x: 17,
      y: 23,
      scale_x: 1.2,
      scale_y: 0.8,
      scale_w: 451,
      scale_h: 219,
      rotate: 0.4,
      skew_x: 0.1,
      skew_y: -0.2,
    })
  })
})
