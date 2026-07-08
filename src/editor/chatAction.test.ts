import { describe, expect, it } from 'vitest'
import {
  CHAT_ACTION_LIMITS,
  clampChatActRequest,
  normalizeActions,
} from '../../shared/chatAction'
import type { ChatAction } from '../../shared/chatAction'

// normalizeActions is the trust boundary between untrusted Edit-lane model output and the apply path
// (mirrors normalizePlan). Whatever the model returns, a surviving action can only touch the user's OWN
// deck (or a slide it creates this turn) with in-range values — targets must be real ids or same-turn refs,
// colors clamp to bare hex, fonts to the allowlist, and the list is capped at maxActions.
const FONTS = ['Lato', 'Inter', 'JetBrains Mono']
const opts = { slideIds: ['a', 'b', 'c'], fonts: FONTS }

// Most cases below drive a single action — this reads it out of the list.
const one = (raw: unknown): ChatAction | null =>
  normalizeActions({ action: raw }, opts).actions[0] ?? null

describe('normalizeActions · set_theme', () => {
  it('coerces colors to bare hex and clamps fonts to the allowlist', () => {
    expect(
      one({
        kind: 'set_theme',
        background: '#1E1E24',
        heading_color: 'ff0000',
        body_font: 'inter', // case-insensitive match → canonical
        heading_font: '', // explicit reset
      }),
    ).toEqual({
      kind: 'set_theme',
      background: '1e1e24', // '#' stripped, lowercased
      heading_color: 'ff0000',
      body_font: 'Inter',
      heading_font: '',
    })
  })

  it('drops invalid hex and unknown fonts, not the whole action', () => {
    expect(
      one({
        kind: 'set_theme',
        background: 'not-a-color',
        surface: '#abc', // valid 3-digit
        body_font: 'Comic Sans', // not in allowlist → dropped
      }),
    ).toEqual({ kind: 'set_theme', surface: 'abc' })
  })

  it('returns nothing when no theme field survives', () => {
    expect(
      one({ kind: 'set_theme', background: 'nope', body_font: 'Nope' }),
    ).toBeNull()
  })
})

describe('normalizeActions · set_body', () => {
  it('accepts a real slide id + trims/caps the markdown', () => {
    expect(
      one({ kind: 'set_body', slideId: 'b', markdown: '  # Hi  ' }),
    ).toEqual({ kind: 'set_body', slideId: 'b', markdown: '# Hi' })
  })

  it('rejects an unknown slide id (a poisoned rewrite of a foreign slide)', () => {
    expect(
      one({ kind: 'set_body', slideId: 'evil', markdown: '# x' }),
    ).toBeNull()
  })

  it('rejects empty markdown', () => {
    expect(one({ kind: 'set_body', slideId: 'a', markdown: '   ' })).toBeNull()
  })
})

describe('normalizeActions · create_slide', () => {
  it('keeps an optional ref + markdown (trimmed/capped)', () => {
    expect(
      one({ kind: 'create_slide', ref: '  s1  ', markdown: '  # New  ' }),
    ).toEqual({ kind: 'create_slide', ref: 's1', markdown: '# New' })
  })

  it('is valid with no fields (a plain blank slide)', () => {
    expect(one({ kind: 'create_slide' })).toEqual({ kind: 'create_slide' })
  })
})

describe('normalizeActions · generate & arrange', () => {
  it('requires a description and clamps count to [1, max]', () => {
    expect(
      one({ kind: 'generate', description: 'pricing', count: 999 }),
    ).toEqual({
      kind: 'generate',
      description: 'pricing',
      count: CHAT_ACTION_LIMITS.maxCount,
    })
    expect(one({ kind: 'generate', description: '' })).toBeNull()
  })

  it('allows an empty arrange instruction (best-judgment reorder)', () => {
    expect(one({ kind: 'arrange' })).toEqual({
      kind: 'arrange',
      instruction: '',
    })
  })
})

describe('normalizeActions · add_image', () => {
  it('keeps a generate/search description (capped) with optional alt', () => {
    expect(
      one({
        kind: 'add_image',
        source: 'search',
        value: '  mountain at dawn  ',
        alt: '  a peak  ',
      }),
    ).toEqual({
      kind: 'add_image',
      source: 'search',
      value: 'mountain at dawn',
      alt: 'a peak',
    })
  })

  it('accepts an https url in url mode but REJECTS javascript:/relative (security)', () => {
    expect(
      one({
        kind: 'add_image',
        source: 'url',
        value: 'https://img.example.com/a.jpg',
      }),
    ).toEqual({
      kind: 'add_image',
      source: 'url',
      value: 'https://img.example.com/a.jpg',
    })
    for (const bad of [
      'javascript:alert(1)',
      'data:image/png;base64,x',
      '/local.jpg',
      'not a url',
    ]) {
      expect(one({ kind: 'add_image', source: 'url', value: bad })).toBeNull()
    }
  })

  it('keeps a slideId that is a real deck slide, drops an unknown one', () => {
    expect(
      one({ kind: 'add_image', source: 'search', value: 'x', slideId: 'c' }),
    ).toMatchObject({ slideId: 'c' })
    // An unknown target is simply dropped (the dispatcher falls back to active) — the action still stands.
    expect(
      one({
        kind: 'add_image',
        source: 'search',
        value: 'x',
        slideId: 'ghost',
      }),
    ).toEqual({ kind: 'add_image', source: 'search', value: 'x' })
  })

  it('drops an unknown source or an empty value', () => {
    expect(one({ kind: 'add_image', source: 'nope', value: 'x' })).toBeNull()
    expect(
      one({ kind: 'add_image', source: 'generate', value: '   ' }),
    ).toBeNull()
  })
})

describe('normalizeActions · add_web', () => {
  it('accepts an http(s) url and rejects a javascript: url (unsandboxed iframe = XSS)', () => {
    expect(one({ kind: 'add_web', src: 'https://example.com/x' })).toEqual({
      kind: 'add_web',
      src: 'https://example.com/x',
    })
    for (const bad of [
      'javascript:alert(1)',
      'data:text/html,<script>',
      'ftp://x',
      '',
    ]) {
      expect(one({ kind: 'add_web', src: bad })).toBeNull()
    }
  })
})

describe('normalizeActions · add_artifact', () => {
  it('keeps non-empty code (capped) with an optional title', () => {
    expect(
      one({
        kind: 'add_artifact',
        code: 'export default () => null',
        title: 'Chart',
      }),
    ).toEqual({
      kind: 'add_artifact',
      code: 'export default () => null',
      title: 'Chart',
    })
  })

  it('caps very long code and rejects whitespace-only code', () => {
    const big = one({ kind: 'add_artifact', code: 'x'.repeat(99_999) }) as {
      code: string
    } | null
    expect(big?.code).toHaveLength(CHAT_ACTION_LIMITS.maxArtifactCode)
    expect(one({ kind: 'add_artifact', code: '   \n  ' })).toBeNull()
  })
})

describe('normalizeActions · the action LIST', () => {
  it('keeps a multi-action turn in order and lets a later action target a same-turn create_slide ref', () => {
    const { actions } = normalizeActions(
      {
        say: 'New slide with a photo.',
        actions: [
          { kind: 'create_slide', ref: 'new1' },
          {
            kind: 'add_image',
            source: 'search',
            value: 'mountains',
            slideId: 'new1',
          },
        ],
      },
      opts,
    )
    expect(actions).toEqual([
      { kind: 'create_slide', ref: 'new1' },
      {
        kind: 'add_image',
        source: 'search',
        value: 'mountains',
        slideId: 'new1',
      },
    ])
  })

  it('resolves a ref declared by a LATER create_slide (two-pass), regardless of order', () => {
    const { actions } = normalizeActions(
      {
        actions: [
          { kind: 'add_image', source: 'search', value: 'x', slideId: 'later' },
          { kind: 'create_slide', ref: 'later' },
        ],
      },
      opts,
    )
    expect(actions[0]).toMatchObject({ kind: 'add_image', slideId: 'later' })
  })

  it('accepts a single `action` (a model that emitted one) as a one-element list', () => {
    expect(
      normalizeActions({ action: { kind: 'arrange' } }, opts).actions,
    ).toEqual([{ kind: 'arrange', instruction: '' }])
  })

  it('caps the list at maxActions', () => {
    const many = Array.from(
      { length: CHAT_ACTION_LIMITS.maxActions + 10 },
      () => ({
        kind: 'create_slide',
      }),
    )
    expect(normalizeActions({ actions: many }, opts).actions).toHaveLength(
      CHAT_ACTION_LIMITS.maxActions,
    )
  })
})

describe('normalizeActions · totality', () => {
  it('caps `say` and is total on garbage', () => {
    const long = normalizeActions({ say: 'x'.repeat(9999) }, opts)
    expect(long.say).toHaveLength(CHAT_ACTION_LIMITS.maxSay)
    for (const bad of [null, undefined, 42, 'x', { action: 'nope' }, {}]) {
      const r = normalizeActions(bad, opts)
      expect(r.actions).toEqual([])
      expect(typeof r.say).toBe('string')
    }
  })

  it('drops an unknown action kind', () => {
    expect(
      normalizeActions({ action: { kind: 'delete_deck' } }, opts).actions,
    ).toEqual([])
  })
})

describe('clampChatActRequest', () => {
  it('caps the active-slide text and coerces theme fields, keeps the digest half', () => {
    const req = clampChatActRequest({
      deckId: 'd',
      messages: [{ role: 'user', content: 'hi' }],
      slides: [{ id: 's1', title: 't', text: 'x' }],
      theme: {
        background: '#000',
        surface: '#111',
        headingColor: '#222',
        bodyColor: '#333',
        headingFont: 'Lato',
        bodyFont: 'Inter',
      },
      activeSlide: {
        id: 's1',
        text: 'y'.repeat(CHAT_ACTION_LIMITS.maxActiveText + 50),
      },
    })
    expect(req.deckId).toBe('d')
    expect(req.slides).toHaveLength(1)
    expect(req.theme?.background).toBe('#000')
    expect(req.activeSlide?.text).toHaveLength(CHAT_ACTION_LIMITS.maxActiveText)
  })

  it('drops an active slide with no id and omits an absent theme', () => {
    const req = clampChatActRequest({
      deckId: 'd',
      messages: [],
      slides: [],
      activeSlide: { id: '', text: 'orphan' },
    })
    expect(req.activeSlide).toBeUndefined()
    expect(req.theme).toBeUndefined()
  })
})
