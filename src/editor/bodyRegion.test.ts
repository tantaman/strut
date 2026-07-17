// The body-region rules, and the one guard that keeps the standalone export honest.
//
// `themeVars` (render.tsx) and `themeVarsCss` (impressExport.ts) are hand-written twins: the app sets
// CSS vars on the slide container as an object, the export writes the same vars into a string. The
// comment in strut.css says "keep them in sync" — and that discipline has ALREADY failed once (the
// export's `.strut-md` mirror is missing `position:relative;z-index:1`). Nothing tests it, so a var
// added to one and forgotten in the other renders fine in-app and silently wrong in an exported deck.
// The parity test below closes that specific hole for the var set.

import { describe, expect, it } from 'vitest'
import {
  resolveBodyRegion,
  bodyRegionStyle,
  bodyRegionRect,
  regionAtPoint,
  BODY_REGIONS,
  makeBackgroundImageToken,
} from './types'
import { themeVars } from './render'
import { toImpressHTML } from './impressExport'
import type { DeckBundle } from './serialize'
import { SLIDE_H, SLIDE_W } from '../config'

describe('resolveBodyRegion', () => {
  it('derives the complement of a half-bleed background image when unpinned', () => {
    expect(resolveBodyRegion('', 'left')).toBe('right')
    expect(resolveBodyRegion('', 'right')).toBe('left')
  })

  it('is full-bleed when no image takes a half', () => {
    expect(resolveBodyRegion('', 'full')).toBe('full')
    expect(resolveBodyRegion('', undefined)).toBe('full')
    expect(resolveBodyRegion(null, null)).toBe('full')
  })

  it('lets a pinned region win over the derivation', () => {
    // The whole point of pinning: the drag survives whatever the image is doing.
    expect(resolveBodyRegion('top', 'left')).toBe('top')
    expect(resolveBodyRegion('full', 'left')).toBe('full')
    expect(resolveBodyRegion('left', 'left')).toBe('left')
  })

  it('ignores a pin that is not a known region', () => {
    expect(resolveBodyRegion('sideways', 'left')).toBe('right')
    expect(resolveBodyRegion('garbage', undefined)).toBe('full')
  })

  it('un-partitions on its own when the image goes away', () => {
    // The magic in the "delete the image → text returns to full-bleed" direction: nothing has to
    // clean up `body_region`, because auto is a derivation and not a stored value.
    expect(resolveBodyRegion('', 'left')).toBe('right')
    expect(resolveBodyRegion('', undefined)).toBe('full')
  })
})

describe('bodyRegionStyle', () => {
  it('reproduces the pre-region full-bleed exactly', () => {
    // Must equal the `.strut-md` fallbacks in strut.css, or every existing slide shifts. `display:
    // block` matters as much as the inset: it's what keeps the stylesheet's flex centring inert for
    // slides that predate regions.
    expect(bodyRegionStyle('full')).toEqual({
      pad: '64px 88px',
      scale: 1,
      display: 'block',
    })
  })

  it('centres a partitioned body in its half, but never a full-bleed one', () => {
    expect(bodyRegionStyle('left').display).toBe('flex')
    expect(bodyRegionStyle('right').display).toBe('flex')
    expect(bodyRegionStyle('top').display).toBe('flex')
    expect(bodyRegionStyle('bottom').display).toBe('flex')
    expect(bodyRegionStyle('full').display).toBe('block')
  })

  it('confines a column to its half, leaving a gutter', () => {
    const left = bodyRegionStyle('left')
    // padding-right pushes content to stop short of the midline.
    expect(left.pad).toBe(`64px ${SLIDE_W / 2 + 24}px 64px 88px`)
    const right = bodyRegionStyle('right')
    expect(right.pad).toBe(`64px 88px 64px ${SLIDE_W / 2 + 24}px`)
  })

  it('confines a row to its half', () => {
    expect(bodyRegionStyle('top').pad).toBe(
      `64px 88px ${SLIDE_H / 2 + 24}px 88px`,
    )
    expect(bodyRegionStyle('bottom').pad).toBe(
      `${SLIDE_H / 2 + 24}px 88px 64px 88px`,
    )
  })

  it('shrinks type for columns, where width is the binding constraint', () => {
    // An 88px h1 in a half-width column fits ~5 characters without this.
    expect(bodyRegionStyle('left').scale).toBeLessThan(1)
    expect(bodyRegionStyle('right').scale).toBe(bodyRegionStyle('left').scale)
  })

  it('keeps rows nearer full size, since a row keeps the full measure', () => {
    expect(bodyRegionStyle('top').scale).toBeGreaterThan(
      bodyRegionStyle('left').scale,
    )
    expect(bodyRegionStyle('top').scale).toBeLessThanOrEqual(1)
  })

  it('produces a usable inset for every region', () => {
    for (const r of BODY_REGIONS) {
      const s = bodyRegionStyle(r)
      expect(s.pad).toMatch(/^[\d.]+px( [\d.]+px){1,3}$/)
      expect(s.scale).toBeGreaterThan(0)
    }
  })
})

describe('bodyRegionRect', () => {
  it('halves the canvas on the right axis', () => {
    expect(bodyRegionRect('full')).toEqual({
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
    })
    expect(bodyRegionRect('left')).toEqual({
      x: 0,
      y: 0,
      w: SLIDE_W / 2,
      h: SLIDE_H,
    })
    expect(bodyRegionRect('right')).toEqual({
      x: SLIDE_W / 2,
      y: 0,
      w: SLIDE_W / 2,
      h: SLIDE_H,
    })
    expect(bodyRegionRect('top')).toEqual({
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H / 2,
    })
    expect(bodyRegionRect('bottom')).toEqual({
      x: 0,
      y: SLIDE_H / 2,
      w: SLIDE_W,
      h: SLIDE_H / 2,
    })
  })

  it('pairs a body half with the image half it leaves free', () => {
    // The body's rect and the background image's 50% half must tile the canvas without overlapping,
    // or the text sits on top of the picture.
    const body = bodyRegionRect('right')
    expect(body.x).toBe(SLIDE_W / 2)
    expect(body.x + body.w).toBe(SLIDE_W)
  })
})

describe('regionAtPoint (the snap gesture)', () => {
  it('snaps to the half you drag toward', () => {
    expect(regionAtPoint(0.05, 0.5)).toBe('left')
    expect(regionAtPoint(0.95, 0.5)).toBe('right')
    expect(regionAtPoint(0.5, 0.02)).toBe('top')
    expect(regionAtPoint(0.5, 0.98)).toBe('bottom')
  })

  it('returns to full width in the middle', () => {
    expect(regionAtPoint(0.5, 0.5)).toBe('full')
    expect(regionAtPoint(0.55, 0.45)).toBe('full')
  })

  it('picks by dominant axis in the corners', () => {
    // Top-left, but further from the vertical midline than the horizontal one → a column, not a row.
    expect(regionAtPoint(0.02, 0.35)).toBe('left')
    // Same corner, but the vertical offset now dominates → a row.
    expect(regionAtPoint(0.4, 0.02)).toBe('top')
  })

  it('covers the whole card — every point lands somewhere', () => {
    for (let x = 0; x <= 1.0001; x += 0.1)
      for (let y = 0; y <= 1.0001; y += 0.1)
        expect(BODY_REGIONS).toContain(regionAtPoint(x, y))
  })
})

describe('pin only when it disagrees with auto', () => {
  // The rule DocRegion.commit applies: dragging the body to the side the image already implies should
  // CLEAR the pin, not record it — otherwise the slide stops tracking its image and "delete the image
  // → text returns to full-bleed" quietly stops working.
  const pinFor = (dropped: string, auto: string) =>
    dropped === auto ? '' : dropped

  it('clears the pin when the drag agrees with the derivation', () => {
    const auto = resolveBodyRegion('', 'left') // image left → body right
    expect(pinFor('right', auto)).toBe('')
  })

  it('records the pin when the drag overrides the derivation', () => {
    const auto = resolveBodyRegion('', 'left')
    expect(pinFor('top', auto)).toBe('top')
    expect(pinFor('full', auto)).toBe('full')
  })

  it('a cleared pin still resolves back to the derived region', () => {
    expect(resolveBodyRegion(pinFor('right', 'right'), 'left')).toBe('right')
  })
})

// ---- the export mirror ----------------------------------------------------------------------------

function bundle(slide: Partial<DeckBundle['slides'][number]>): DeckBundle {
  return {
    deck: {
      id: 'd1',
      title: 'T',
      background: 'bg-ink',
      surface: 'bg-surf-ink',
      heading_font: 'Lato',
      heading_color: 'ffffff',
      body_font: 'Lato',
      body_color: 'dddddd',
      text_align: '',
      default_slide_mode: 'markdown',
      chosen_presenter: 'impress',
      canned_transition: 'zoom',
      custom_stylesheet: '',
      deck_version: '1.0',
    },
    slides: [
      {
        id: 's1',
        x: 0,
        y: 0,
        z: 0,
        rotate_x: 0,
        rotate_y: 0,
        rotate_z: 0,
        imp_scale: 3,
        background: '',
        surface: '',
        doc: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
          ],
        }),
        render_mode: 'markdown',
        ...slide,
      },
    ],
    componentsBySlide: {},
    customBackgrounds: [],
  }
}

describe('themeVars / themeVarsCss parity', () => {
  it('exports every CSS var the app sets on a slide container', () => {
    // The guard: add a var to themeVars, forget impressExport, and this fails instead of shipping a
    // deck that renders one way in Strut and another way in the exported HTML.
    const appVars = Object.keys(
      themeVars(
        { background: 'bg-ink', heading_font: 'Lato' },
        { text_align: 'center', body_region: 'left' },
      ),
    ).filter((k) => k.startsWith('--strut-'))
    expect(appVars.length).toBeGreaterThan(0)

    const html = toImpressHTML(bundle({ body_region: 'left' }))
    for (const v of appVars) expect(html).toContain(`${v}:`)
  })

  it('carries a pinned region into the exported deck', () => {
    const html = toImpressHTML(bundle({ body_region: 'right' }))
    const { pad, scale } = bodyRegionStyle('right')
    expect(html).toContain(`--strut-body-pad:${pad};`)
    expect(html).toContain(`--strut-type-scale:${scale};`)
  })

  it('exports the AUTO region derived from a half-bleed image, not the raw column', () => {
    // `body_region` is '' here — the export must run the same derivation the app does, or a deck
    // whose text sits beside its image in Strut exports with the text full-bleed under it.
    const html = toImpressHTML(
      bundle({
        body_region: '',
        background: makeBackgroundImageToken('https://e.com/a.png', {
          layout: 'left',
        }),
      }),
    )
    expect(html).toContain(`--strut-body-pad:${bodyRegionStyle('right').pad};`)
  })

  it('leaves a plain full-bleed slide on the default region', () => {
    const html = toImpressHTML(bundle({}))
    expect(html).toContain(`--strut-body-pad:${bodyRegionStyle('full').pad};`)
    expect(html).toContain('--strut-type-scale:1;')
  })
})
