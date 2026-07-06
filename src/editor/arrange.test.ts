import { describe, expect, it } from 'vitest'
import { ARRANGE_LIMITS, clampRequest, normalizePlan } from '../../shared/arrange'

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
