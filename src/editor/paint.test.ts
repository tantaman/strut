import { describe, expect, it } from 'vitest'
import {
  isPaintToken,
  paintPropsFromToken,
  paintStyleFor,
  paintSwatchCss,
  paintToken,
  parsePaint,
  styleToDecls,
} from './paint'
import type { EffectPaint, GradientPaint } from './paint'

describe('paint tokens', () => {
  it('round-trips a linear gradient', () => {
    const t = 'grad:linear/135/6741d9,3b5bdb'
    const p = parsePaint(t) as GradientPaint
    expect(p.kind).toBe('gradient')
    expect(p.type).toBe('linear')
    expect(p.angle).toBe(135)
    expect(p.stops).toEqual([
      { color: '6741d9', pos: null },
      { color: '3b5bdb', pos: null },
    ])
    expect(paintToken(p)).toBe(t)
  })

  it('round-trips gradient stops with positions', () => {
    const t = 'grad:radial/0/ffffff@0,000000@100'
    const p = parsePaint(t) as GradientPaint
    expect(p.stops).toEqual([
      { color: 'ffffff', pos: 0 },
      { color: '000000', pos: 100 },
    ])
    expect(paintToken(p)).toBe(t)
  })

  it('round-trips an effect and omits default speed', () => {
    const p = parsePaint('fx:shimmer/c0a062,fff4d6') as EffectPaint
    expect(p.kind).toBe('effect')
    expect(p.name).toBe('shimmer')
    expect(p.colors).toEqual(['c0a062', 'fff4d6'])
    expect(p.speed).toBe(3) // shimmer default
    expect(paintToken(p)).toBe('fx:shimmer/c0a062,fff4d6')
  })

  it('keeps a non-default effect speed in the token', () => {
    const p = parsePaint('fx:holo/ff0080,7928ca/10') as EffectPaint
    expect(p.speed).toBe(10) // holo default is 6, so 10 must survive
    expect(paintToken(p)).toBe('fx:holo/ff0080,7928ca/10')
  })

  it('treats flat hex and bg-* as non-paint tokens', () => {
    expect(isPaintToken('6741d9')).toBe(false)
    expect(isPaintToken('bg-orange')).toBe(false)
    expect(parsePaint('6741d9')).toBeNull()
    expect(parsePaint('bg-custom-abc123')).toBeNull()
  })

  it('rejects malformed / unsafe tokens without throwing', () => {
    expect(parsePaint('grad:linear/0/onlyone')).toBeNull() // needs >= 2 stops
    expect(parsePaint('grad:bogus/0/aaa,bbb')).toBeNull() // bad type
    expect(parsePaint('fx:sparkle/aaaaaa')).toBeNull() // unknown effect
    expect(parsePaint('grad:linear/0/zzz,notahex')).toBeNull() // no valid stops
  })
})

describe('paint CSS emission', () => {
  it('paints a box for a background target', () => {
    const p = parsePaint('grad:linear/90/ff0000,0000ff')!
    const s = paintStyleFor(p, 'bg')
    expect(s.background).toBe('linear-gradient(90deg, #ff0000, #0000ff)')
    expect(s.clip).toBeUndefined()
  })

  it('clips to text for a text target', () => {
    const props = paintPropsFromToken('grad:linear/90/ff0000,0000ff', 'text')!
    expect(props.backgroundClip).toBe('text')
    expect(props.WebkitBackgroundClip).toBe('text')
    expect(props.color).toBe('transparent')
    expect(props.background).toContain('linear-gradient')
  })

  it('emits an animation for effects', () => {
    const s = paintStyleFor(parsePaint('fx:shimmer/aaaaaa,ffffff')!, 'bg')
    expect(s.animation).toContain('strut-shimmer')
    expect(s.background).toContain('linear-gradient')
    expect(s.background).toContain('220% 100%') // oversized so the sweep has room to travel
  })

  it('returns null props for a non-paint token so callers keep flat handling', () => {
    expect(paintPropsFromToken('6741d9', 'text')).toBeNull()
  })

  it('gives a static swatch preview for any token', () => {
    expect(paintSwatchCss('6741d9')).toBe('#6741d9')
    expect(paintSwatchCss('grad:linear/90/ff0000,0000ff')).toContain(
      'linear-gradient',
    )
    // an animated effect previews as its base gradient, no animation on a swatch
    expect(paintSwatchCss('fx:holo/ff0080,7928ca')).toContain('conic-gradient')
  })

  it('emits inline decls for HTML export', () => {
    const decls = styleToDecls(
      paintStyleFor(parsePaint('fx:pulse/e03131,ff8787')!, 'text'),
    )
    expect(decls).toContain('background-clip:text')
    expect(decls).toContain('animation:strut-pulse')
    expect(decls).toContain('color:transparent')
  })
})
