// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  GENERATE_LIMITS,
  clampGenerateRequest,
  normalizeGenerated,
} from '../../shared/generate'
import { markdownToDoc } from './aiGenerate'

// The firewall: whatever the model returns, normalizeGenerated caps the count, trims each slide, and
// drops junk — the trust boundary between untrusted model output and the slide-add apply path.
describe('normalizeGenerated', () => {
  it('keeps well-formed slides in order', () => {
    const out = normalizeGenerated({
      slides: [{ markdown: '# A\n\n- one' }, { markdown: '# B' }],
    })
    expect(out.slides).toEqual([{ markdown: '# A\n\n- one' }, { markdown: '# B' }])
  })

  it('caps at maxSlides (15)', () => {
    const many = { slides: Array.from({ length: 40 }, (_, i) => ({ markdown: `# ${i}` })) }
    expect(normalizeGenerated(many).slides).toHaveLength(GENERATE_LIMITS.maxSlides)
  })

  it('honors a lower explicit cap', () => {
    const many = { slides: Array.from({ length: 10 }, (_, i) => ({ markdown: `# ${i}` })) }
    expect(normalizeGenerated(many, 3).slides).toHaveLength(3)
  })

  it('drops empty / non-string / whitespace-only markdown', () => {
    const out = normalizeGenerated({
      slides: [
        { markdown: '# real' },
        { markdown: '' },
        { markdown: '   ' },
        { markdown: 42 },
        { nope: true },
        null,
        'string',
      ],
    })
    expect(out.slides).toEqual([{ markdown: '# real' }])
  })

  it('truncates an over-long slide', () => {
    const big = 'x'.repeat(GENERATE_LIMITS.maxMarkdownPerSlide + 500)
    const out = normalizeGenerated({ slides: [{ markdown: big }] })
    expect(out.slides[0].markdown.length).toBe(GENERATE_LIMITS.maxMarkdownPerSlide)
  })

  it('tolerates garbage input', () => {
    expect(normalizeGenerated(null).slides).toEqual([])
    expect(normalizeGenerated({}).slides).toEqual([])
    expect(normalizeGenerated({ slides: 'nope' }).slides).toEqual([])
  })
})

describe('clampGenerateRequest', () => {
  it('coerces + truncates', () => {
    const r = clampGenerateRequest({
      deckId: 'd1',
      prompt: 'z'.repeat(GENERATE_LIMITS.maxPrompt + 100),
    })
    expect(r.deckId).toBe('d1')
    expect(r.prompt.length).toBe(GENERATE_LIMITS.maxPrompt)
  })

  it('null-safes non-string fields', () => {
    const r = clampGenerateRequest({ deckId: 1, prompt: null } as never)
    expect(r).toEqual({ deckId: '', prompt: '' })
  })
})

// markdownToDoc is the one piece of real work on the apply path: markdown → sanitized HTML → ProseMirror
// JSON via the shared schema (markdown-mode slides render from `doc`, not the raw markdown column).
describe('markdownToDoc', () => {
  it('produces a parseable TipTap doc with the expected structure', () => {
    const doc = JSON.parse(markdownToDoc('# Title\n\n- one\n- two'))
    expect(doc.type).toBe('doc')
    const types = (doc.content as { type: string }[]).map((n) => n.type)
    expect(types).toContain('heading')
    expect(types).toContain('bulletList')
  })

  it('keeps the heading text', () => {
    const doc = JSON.parse(markdownToDoc('# Hello world'))
    const heading = (doc.content as { type: string; content?: { text?: string }[] }[]).find(
      (n) => n.type === 'heading',
    )
    expect(heading?.content?.[0]?.text).toBe('Hello world')
  })

  it('never throws on empty input', () => {
    const doc = JSON.parse(markdownToDoc(''))
    expect(doc.type).toBe('doc')
  })
})
