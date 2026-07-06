import { describe, expect, it } from 'vitest'
import {
  ARRANGE_LIMITS,
  PLACEMENT_BOUNDS,
  clampRequest,
  normalizePlan,
} from '../../shared/arrange'

// normalizePlan is the trust boundary between untrusted model output and the apply path: whatever the
// model returns, `order` must come out a full permutation of the deck's OWN ids and `layout` a known
// preset. These tests pin that guarantee (a poisoned plan can, at worst, benignly reorder the user's
// own slides — one undo away).
describe('normalizePlan', () => {
  const deck = ['a', 'b', 'c']

  it('passes through a valid full permutation', () => {
    const p = normalizePlan({ order: ['c', 'a', 'b'], layout: 'grid' }, deck)
    expect(p.order).toEqual(['c', 'a', 'b'])
    expect(p.layout).toBe('grid')
  })

  it('drops unknown ids and appends omitted deck slides (stays a permutation)', () => {
    const p = normalizePlan({ order: ['b', 'evil', 'b'] }, deck)
    // 'evil' dropped, duplicate 'b' collapsed, missing 'a'/'c' appended in deck order.
    expect(p.order).toEqual(['b', 'a', 'c'])
    expect([...p.order].sort()).toEqual(deck)
  })

  it('clamps an unknown/absent layout to keep', () => {
    expect(normalizePlan({ order: deck, layout: 'spiral' }, deck).layout).toBe('keep')
    expect(normalizePlan({ order: deck }, deck).layout).toBe('keep')
  })

  it('is total on garbage input', () => {
    for (const bad of [null, undefined, 42, 'x', { order: 'nope' }, {}]) {
      const p = normalizePlan(bad, deck)
      expect([...p.order].sort()).toEqual(deck)
      expect(p.layout).toBe('keep')
    }
  })

  it('keeps only groups that reference real ids', () => {
    const p = normalizePlan(
      {
        order: deck,
        groups: [
          { label: 'ok', slideIds: ['a', 'ghost'] },
          { label: 'empty', slideIds: ['ghost'] },
        ],
      },
      deck,
    )
    expect(p.groups).toEqual([{ label: 'ok', slideIds: ['a'] }])
  })
})

// Freeform placements are raw model-authored geometry — normalizePlan is the clamp/firewall: only real
// ids, every axis bounded, rotations degrees→radians, id-only noise dropped. Worst case is a bounded,
// on-camera, one-undo reposition of the user's own slides.
describe('normalizePlan · placements', () => {
  const deck = ['a', 'b', 'c']

  it('passes a valid placement, converting rotation degrees → radians', () => {
    const p = normalizePlan(
      { order: deck, placements: [{ id: 'b', x: 100, imp_scale: 5, rotate_z: 90 }] },
      deck,
    )
    expect(p.placements).toEqual([
      { id: 'b', x: 100, imp_scale: 5, rotate_z: Math.PI / 2 },
    ])
  })

  it('only sets the fields the model authored (absent axes stay unset)', () => {
    const p = normalizePlan({ order: deck, placements: [{ id: 'a', y: 12 }] }, deck)
    expect(p.placements).toEqual([{ id: 'a', y: 12 }])
  })

  it('clamps every axis to PLACEMENT_BOUNDS', () => {
    const B = PLACEMENT_BOUNDS
    const p = normalizePlan(
      {
        order: deck,
        placements: [
          { id: 'a', x: 1e9, y: -1e9, z: 1e9, imp_scale: 999, rotate_x: 720, rotate_z: -720 },
        ],
      },
      deck,
    )
    expect(p.placements).toEqual([
      {
        id: 'a',
        x: B.pos,
        y: -B.pos,
        z: B.pos,
        imp_scale: B.scaleMax,
        rotate_x: B.rotateDeg * (Math.PI / 180),
        rotate_z: -B.rotateDeg * (Math.PI / 180),
      },
    ])
  })

  it('drops unknown ids, duplicate ids, non-number axes, and id-only entries', () => {
    const p = normalizePlan(
      {
        order: deck,
        placements: [
          { id: 'ghost', x: 5 }, // unknown id → dropped
          { id: 'a', x: 10 }, // kept
          { id: 'a', x: 20 }, // duplicate id → dropped (first wins)
          { id: 'b', x: 'nope', imp_scale: NaN, z: Infinity }, // all garbage → id-only → dropped
          { id: 'c' }, // id-only → dropped
        ],
      },
      deck,
    )
    expect(p.placements).toEqual([{ id: 'a', x: 10 }])
  })

  it('leaves placements undefined when none survive', () => {
    expect(
      normalizePlan({ order: deck, placements: [{ id: 'ghost' }, { id: 'a' }] }, deck)
        .placements,
    ).toBeUndefined()
    expect(normalizePlan({ order: deck }, deck).placements).toBeUndefined()
    expect(normalizePlan({ order: deck, placements: 'nope' }, deck).placements).toBeUndefined()
  })
})

describe('clampRequest', () => {
  it('truncates instruction + per-slide text and coerces non-strings', () => {
    const req = clampRequest({
      deckId: 'd',
      instruction: 'x'.repeat(ARRANGE_LIMITS.maxInstruction + 50),
      slides: [
        { id: 's1', title: 'y'.repeat(500), text: 'z'.repeat(500) },
        // deliberately malformed (JSON is untrusted) — coerced to ''.
        { id: 1 as unknown as string, title: null as unknown as string, text: undefined as unknown as string },
      ],
    })
    expect(req.instruction).toHaveLength(ARRANGE_LIMITS.maxInstruction)
    expect(req.slides[0].text).toHaveLength(ARRANGE_LIMITS.maxTextPerSlide)
    expect(req.slides[0].title).toHaveLength(ARRANGE_LIMITS.maxTitle)
    expect(req.slides[1]).toEqual({ id: '', title: '', text: '' })
  })

  it('caps the number of slides', () => {
    const many = Array.from({ length: ARRANGE_LIMITS.maxSlides + 20 }, (_, i) => ({
      id: `s${i}`,
      title: '',
      text: '',
    }))
    const req = clampRequest({ deckId: 'd', instruction: '', slides: many })
    expect(req.slides).toHaveLength(ARRANGE_LIMITS.maxSlides)
  })
})
