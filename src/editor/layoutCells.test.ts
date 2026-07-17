// The layout tiling geometry (types.ts): a `layout` divides the canvas into ordered cells, and the
// body renders in cell 0 with the same padding discipline as the legacy single body-region. These pin
// the two properties phase 2 depends on: the tiles cover the canvas without gaps/overlap, and a cell's
// body-style confines content to that cell exactly the way bodyRegionStyle's half/row cases do.

import { describe, expect, it } from 'vitest'
import {
  SLIDE_LAYOUTS,
  bodyCells,
  bodyRegionRect,
  bodyRegionStyle,
  bodyStyleFor,
  layoutCells,
  layoutDividers,
  rectBodyStyle,
  resolveLayout,
} from './types'
import { SLIDE_H, SLIDE_W } from '../config'

describe('resolveLayout', () => {
  it('passes known presets through and falls unknown/empty to full', () => {
    expect(resolveLayout('cols-2')).toBe('cols-2')
    expect(resolveLayout('')).toBe('')
    expect(resolveLayout(null)).toBe('')
    expect(resolveLayout('nonsense')).toBe('')
  })
})

describe('layoutCells', () => {
  it('gives full a single whole-canvas cell', () => {
    expect(layoutCells('')).toEqual([{ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }])
  })

  it('has the expected cell count per preset', () => {
    expect(layoutCells('cols-2')).toHaveLength(2)
    expect(layoutCells('rows-2')).toHaveLength(2)
    expect(layoutCells('tri')).toHaveLength(3)
    expect(layoutCells('grid-4')).toHaveLength(4)
    expect(layoutCells('split-l')).toHaveLength(2)
  })

  it('tiles the whole canvas with no gaps or overlap', () => {
    for (const layout of SLIDE_LAYOUTS) {
      const cells = layoutCells(layout)
      const area = cells.reduce((sum, c) => sum + c.w * c.h, 0)
      expect(area).toBe(SLIDE_W * SLIDE_H)
      // Every cell is inside the canvas.
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.y).toBeGreaterThanOrEqual(0)
        expect(c.x + c.w).toBeLessThanOrEqual(SLIDE_W)
        expect(c.y + c.h).toBeLessThanOrEqual(SLIDE_H)
      }
    }
  })

  it('orders cells in reading order (top-left first, row-major)', () => {
    const grid = layoutCells('grid-4')
    expect(grid[0]).toEqual({ x: 0, y: 0, w: SLIDE_W / 2, h: SLIDE_H / 2 })
    expect(grid[1].x).toBeGreaterThan(grid[0].x) // top-right after top-left
    expect(grid[2].y).toBeGreaterThan(grid[0].y) // bottom row after top row
  })
})

describe('layoutDividers', () => {
  it('has none for a full slide', () => {
    expect(layoutDividers('')).toEqual([])
  })

  it('draws one interior line per boundary, never doubled', () => {
    // cols-2 → a single vertical divider at the midline (not two edges stacked).
    expect(layoutDividers('cols-2')).toEqual([
      { x: SLIDE_W / 2, y: 0, length: SLIDE_H, vertical: true },
    ])
    // tri → exactly two verticals (thirds), each once — the bug was the shared edge drawn twice.
    const tri = layoutDividers('tri')
    expect(tri).toHaveLength(2)
    expect(tri.every((d) => d.vertical)).toBe(true)
  })

  it('never places a divider on the canvas boundary', () => {
    for (const layout of SLIDE_LAYOUTS) {
      for (const d of layoutDividers(layout)) {
        if (d.vertical) {
          expect(d.x).toBeGreaterThan(0)
          expect(d.x).toBeLessThan(SLIDE_W)
        } else {
          expect(d.y).toBeGreaterThan(0)
          expect(d.y).toBeLessThan(SLIDE_H)
        }
      }
    }
  })

  it('covers both axes for a 2×2 grid, deduped', () => {
    const g = layoutDividers('grid-4')
    expect(g.some((d) => d.vertical)).toBe(true)
    expect(g.some((d) => !d.vertical)).toBe(true)
    // No two identical segments survived the dedupe.
    const keys = g.map((d) => `${d.vertical}|${d.x}|${d.y}|${d.length}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('rectBodyStyle', () => {
  it('reproduces the legacy full-bleed exactly for the whole canvas', () => {
    expect(rectBodyStyle({ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H })).toEqual({
      pad: '64px 88px',
      scale: 1,
      display: 'block',
    })
  })

  it('confines a cell by padding the full distance to the interior edges', () => {
    // The bug this guards: a quadrant must inset its interior sides all the way to the canvas edge
    // (plus a gutter), not by a bare gutter — else the body spills into neighbouring cells.
    const topLeft = rectBodyStyle({
      x: 0,
      y: 0,
      w: SLIDE_W / 2,
      h: SLIDE_H / 2,
    })
    // top/left touch the canvas edge → safe pad; right/bottom are interior → distance + gutter.
    expect(topLeft.pad).toBe(
      `64px ${SLIDE_W / 2 + 24}px ${SLIDE_H / 2 + 24}px 88px`,
    )
    expect(topLeft.display).toBe('flex')
  })

  it('matches bodyRegionStyle padding for the half regions (same tiling, one axis)', () => {
    // A 2-column cell-0 is the same rect as the legacy 'left' region, so their insets must agree.
    expect(rectBodyStyle(bodyRegionRect('left')).pad).toBe(
      bodyRegionStyle('left').pad,
    )
    expect(rectBodyStyle(bodyRegionRect('top')).pad).toBe(
      bodyRegionStyle('top').pad,
    )
  })

  it('shrinks type for smaller cells', () => {
    const full = rectBodyStyle({ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H })
    const quad = rectBodyStyle({ x: 0, y: 0, w: SLIDE_W / 2, h: SLIDE_H / 2 })
    expect(quad.scale).toBeLessThan(full.scale)
    expect(quad.scale).toBeGreaterThan(0)
  })
})

describe('bodyStyleFor / bodyCells', () => {
  it('uses the layout cell-0 when a real tiling is set', () => {
    const style = bodyStyleFor({ layout: 'cols-2' }, null)
    expect(style).toEqual(rectBodyStyle(layoutCells('cols-2')[0]))
    expect(bodyCells({ layout: 'grid-4' }, null)).toHaveLength(4)
  })

  it('falls back to the legacy single region when layout is full', () => {
    // No layout, a right-pinned body → exactly the legacy path, so old slides are untouched.
    expect(bodyStyleFor({ layout: '', body_region: 'right' }, null)).toEqual(
      bodyRegionStyle('right'),
    )
    expect(bodyCells({ body_region: 'right' }, null)).toEqual([
      bodyRegionRect('right'),
    ])
  })
})
