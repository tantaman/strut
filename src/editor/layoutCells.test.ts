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
  cellDocAt,
  cellPad,
  layoutCells,
  layoutDividers,
  parseCells,
  rectBodyStyle,
  resolveLayout,
  resolveSlidePad,
  slidePadScale,
  writeCellDoc,
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

describe('parseCells', () => {
  it('tolerates empty / null / malformed as no cells', () => {
    expect(parseCells('')).toEqual([])
    expect(parseCells(null)).toEqual([])
    expect(parseCells('{not json')).toEqual([])
    expect(parseCells('{"a":1}')).toEqual([]) // not an array
  })

  it('coerces non-string entries to empty strings', () => {
    expect(parseCells('["", "b", 3, null]')).toEqual(['', 'b', '', ''])
  })
})

describe('cellDocAt', () => {
  it('reads cell 0 from the doc column, higher cells from the cells blob', () => {
    const slide = { doc: 'DOC0', cells: JSON.stringify(['', 'C1', 'C2']) }
    expect(cellDocAt(slide, 0)).toBe('DOC0')
    expect(cellDocAt(slide, 1)).toBe('C1')
    expect(cellDocAt(slide, 2)).toBe('C2')
  })

  it('is empty for a cell with no stored content', () => {
    expect(cellDocAt({ doc: '', cells: '' }, 1)).toBe('')
    expect(cellDocAt({ doc: 'X', cells: JSON.stringify(['', 'C1']) }, 2)).toBe('')
    expect(cellDocAt(null, 0)).toBe('')
  })

  it('never lets the cells blob shadow cell 0 (doc is the source of truth)', () => {
    // Even if index 0 of the blob holds junk, cell 0 comes from `doc`.
    expect(cellDocAt({ doc: 'DOC0', cells: '["JUNK","C1"]' }, 0)).toBe('DOC0')
  })
})

describe('writeCellDoc', () => {
  it('sets one cell and preserves its siblings', () => {
    const next = writeCellDoc(JSON.stringify(['', 'C1', 'C2']), 2, 'C2new')
    expect(parseCells(next)).toEqual(['', 'C1', 'C2new'])
  })

  it('grows the array with placeholders up to the target index', () => {
    const next = writeCellDoc('', 3, 'C3')
    expect(parseCells(next)).toEqual(['', '', '', 'C3'])
  })

  it('round-trips through cellDocAt', () => {
    const cells = writeCellDoc(writeCellDoc('', 1, 'A'), 2, 'B')
    expect(cellDocAt({ doc: 'D', cells }, 1)).toBe('A')
    expect(cellDocAt({ doc: 'D', cells }, 2)).toBe('B')
  })
})

describe('cellPad', () => {
  it('gives positive insets and a scale in (0,1] for the whole canvas', () => {
    const full = cellPad({ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H })
    expect(full.padX).toBeGreaterThan(0)
    expect(full.padY).toBeGreaterThan(0)
    expect(full.scale).toBe(1)
  })

  it('eases the inset and shrinks type for a smaller cell', () => {
    const full = cellPad({ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H })
    const quad = cellPad({ x: 0, y: 0, w: SLIDE_W / 2, h: SLIDE_H / 2 })
    expect(quad.padX).toBeLessThan(full.padX)
    expect(quad.padY).toBeLessThan(full.padY)
    expect(quad.scale).toBeLessThan(full.scale)
    expect(quad.scale).toBeGreaterThan(0)
  })
})

describe('slidePadScale / density', () => {
  it('resolves presets, unknown/empty → comfortable', () => {
    expect(resolveSlidePad('')).toBe('')
    expect(resolveSlidePad('compact')).toBe('compact')
    expect(resolveSlidePad('edge')).toBe('edge')
    expect(resolveSlidePad('bogus')).toBe('')
    expect(resolveSlidePad(null)).toBe('')
  })

  it('scales the safe-area: comfortable 1, compact ½, edge 0', () => {
    expect(slidePadScale({ pad: '' })).toBe(1)
    expect(slidePadScale({ pad: 'compact' })).toBe(0.5)
    expect(slidePadScale({ pad: 'edge' })).toBe(0)
    expect(slidePadScale(null)).toBe(1)
  })

  it('rectBodyStyle full scales its pad, zero at edge (full bleed)', () => {
    const full = { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }
    expect(rectBodyStyle(full).pad).toBe('64px 88px') // default padScale = 1
    expect(rectBodyStyle(full, 0.5).pad).toBe('32px 44px')
    expect(rectBodyStyle(full, 0).pad).toBe('0px 0px')
  })

  it('cellPad scales with density (0 at edge), type-scale unaffected', () => {
    const cell = { x: 0, y: 0, w: SLIDE_W / 2, h: SLIDE_H }
    const comfy = cellPad(cell, 1)
    const edge = cellPad(cell, 0)
    expect(comfy.padX).toBeGreaterThan(0)
    expect(edge.padX).toBe(0)
    expect(edge.padY).toBe(0)
    expect(edge.scale).toBe(comfy.scale) // density changes padding, not type size
  })

  it('bodyRegionStyle keeps the confinement half when density → 0', () => {
    // 'left' at full bleed: the outer safe-area sides go to 0, but the RIGHT side (the confinement that
    // pins the body to the left half) must survive — else full-bleed would dissolve the region.
    const half = SLIDE_W / 2 + 24 // + GUTTER
    expect(bodyRegionStyle('left', 0).pad).toBe(`0px ${half}px 0px 0px`)
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
