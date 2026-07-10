// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  NARRATE_LIMITS,
  clampNarrateRequest,
  clampTargetSlides,
  normalizeNarrated,
} from '../../shared/transcript'

// The firewall: whatever the model returns, normalizeNarrated caps the count, trims each slide's body +
// notes, and drops junk — the trust boundary between untrusted model output (a transcript can be poisoned)
// and the slide-add + notes apply path (src/editor/aiNarrate.ts).
describe('normalizeNarrated', () => {
  it('keeps well-formed slides (body + notes) in order', () => {
    const out = normalizeNarrated({
      slides: [
        { markdown: '# A\n\n- one', notes: 'so first, one thing' },
        { markdown: '# B', notes: 'and then B' },
      ],
    })
    expect(out.slides).toEqual([
      { markdown: '# A\n\n- one', notes: 'so first, one thing' },
      { markdown: '# B', notes: 'and then B' },
    ])
  })

  it('caps at maxSlides (40)', () => {
    const many = {
      slides: Array.from({ length: 60 }, (_, i) => ({
        markdown: `# ${i}`,
        notes: `n${i}`,
      })),
    }
    expect(normalizeNarrated(many).slides).toHaveLength(
      NARRATE_LIMITS.maxSlides,
    )
  })

  it('honors a lower explicit cap', () => {
    const many = {
      slides: Array.from({ length: 10 }, (_, i) => ({
        markdown: `# ${i}`,
        notes: `n${i}`,
      })),
    }
    expect(normalizeNarrated(many, 3).slides).toHaveLength(3)
  })

  it('drops a slide with empty / non-string / whitespace-only body even when notes are present', () => {
    const out = normalizeNarrated({
      slides: [
        { markdown: '# real', notes: 'keep me' },
        { markdown: '', notes: 'orphan notes' },
        { markdown: '   ', notes: 'still orphan' },
        { markdown: 42, notes: 'nope' },
        { nope: true },
        null,
        'string',
      ],
    })
    expect(out.slides).toEqual([{ markdown: '# real', notes: 'keep me' }])
  })

  it('keeps a body-only slide with empty notes (notes are optional)', () => {
    const out = normalizeNarrated({
      slides: [
        { markdown: '# body only' },
        { markdown: '# bad notes', notes: 123 },
      ],
    })
    expect(out.slides).toEqual([
      { markdown: '# body only', notes: '' },
      { markdown: '# bad notes', notes: '' },
    ])
  })

  it('truncates an over-long body and over-long notes independently', () => {
    const bigMd = '#'.repeat(NARRATE_LIMITS.maxMarkdownPerSlide + 500)
    const bigNotes = 'y'.repeat(NARRATE_LIMITS.maxNotesPerSlide + 500)
    const out = normalizeNarrated({
      slides: [{ markdown: bigMd, notes: bigNotes }],
    })
    expect(out.slides[0].markdown.length).toBe(
      NARRATE_LIMITS.maxMarkdownPerSlide,
    )
    expect(out.slides[0].notes.length).toBe(NARRATE_LIMITS.maxNotesPerSlide)
  })

  it('tolerates garbage input', () => {
    expect(normalizeNarrated(null).slides).toEqual([])
    expect(normalizeNarrated({}).slides).toEqual([])
    expect(normalizeNarrated({ slides: 'nope' }).slides).toEqual([])
  })
})

describe('clampNarrateRequest', () => {
  it('coerces + truncates the transcript', () => {
    const r = clampNarrateRequest({
      deckId: 'd1',
      transcript: 'z'.repeat(NARRATE_LIMITS.maxTranscript + 100),
      targetSlides: 8,
    })
    expect(r.deckId).toBe('d1')
    expect(r.transcript.length).toBe(NARRATE_LIMITS.maxTranscript)
    expect(r.targetSlides).toBe(8)
  })

  it('null-safes non-string fields and drops a bad target', () => {
    const r = clampNarrateRequest({
      deckId: 1,
      transcript: null,
      targetSlides: 'lots',
    } as never)
    expect(r).toEqual({ deckId: '', transcript: '', targetSlides: undefined })
  })
})

describe('clampTargetSlides', () => {
  it('accepts a positive integer', () => {
    expect(clampTargetSlides(8)).toBe(8)
  })
  it('parses a numeric string and floors a float', () => {
    expect(clampTargetSlides('12')).toBe(12)
    expect(clampTargetSlides(5.9)).toBe(5)
  })
  it('caps at maxSlides', () => {
    expect(clampTargetSlides(999)).toBe(NARRATE_LIMITS.maxSlides)
  })
  it('returns undefined for junk / non-positive (let the model choose)', () => {
    expect(clampTargetSlides(undefined)).toBeUndefined()
    expect(clampTargetSlides(0)).toBeUndefined()
    expect(clampTargetSlides(-3)).toBeUndefined()
    expect(clampTargetSlides('auto')).toBeUndefined()
    expect(clampTargetSlides(NaN)).toBeUndefined()
  })
})
