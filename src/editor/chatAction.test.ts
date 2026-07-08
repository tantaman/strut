import { describe, expect, it } from 'vitest'
import {
  CHAT_ACTION_LIMITS,
  clampChatActRequest,
  normalizeAction,
} from '../../shared/chatAction'

// normalizeAction is the trust boundary between untrusted Edit-lane model output and the apply path
// (mirrors normalizePlan). Whatever the model returns, a surviving action can only touch the user's OWN
// deck with in-range values — target ids must be real, colors clamp to bare hex, fonts to the allowlist.
const FONTS = ['Lato', 'Inter', 'JetBrains Mono']
const opts = { slideIds: ['a', 'b', 'c'], fonts: FONTS }

describe('normalizeAction · set_theme', () => {
  it('coerces colors to bare hex and clamps fonts to the allowlist', () => {
    const { action } = normalizeAction(
      {
        say: 'Darkened it.',
        action: {
          kind: 'set_theme',
          background: '#1E1E24',
          heading_color: 'ff0000',
          body_font: 'inter', // case-insensitive match → canonical
          heading_font: '', // explicit reset
        },
      },
      opts,
    )
    expect(action).toEqual({
      kind: 'set_theme',
      background: '1e1e24', // '#' stripped, lowercased
      heading_color: 'ff0000',
      body_font: 'Inter',
      heading_font: '',
    })
  })

  it('drops invalid hex and unknown fonts, not the whole action', () => {
    const { action } = normalizeAction(
      {
        action: {
          kind: 'set_theme',
          background: 'not-a-color',
          surface: '#abc', // valid 3-digit
          body_font: 'Comic Sans', // not in allowlist → dropped
        },
      },
      opts,
    )
    expect(action).toEqual({ kind: 'set_theme', surface: 'abc' })
  })

  it('returns null when no theme field survives', () => {
    expect(
      normalizeAction(
        {
          action: { kind: 'set_theme', background: 'nope', body_font: 'Nope' },
        },
        opts,
      ).action,
    ).toBeNull()
  })
})

describe('normalizeAction · set_body', () => {
  it('accepts a real slide id + trims/caps the markdown', () => {
    const { action } = normalizeAction(
      { action: { kind: 'set_body', slideId: 'b', markdown: '  # Hi  ' } },
      opts,
    )
    expect(action).toEqual({ kind: 'set_body', slideId: 'b', markdown: '# Hi' })
  })

  it('rejects an unknown slide id (a poisoned rewrite of a foreign slide)', () => {
    expect(
      normalizeAction(
        { action: { kind: 'set_body', slideId: 'evil', markdown: '# x' } },
        opts,
      ).action,
    ).toBeNull()
  })

  it('rejects empty markdown', () => {
    expect(
      normalizeAction(
        { action: { kind: 'set_body', slideId: 'a', markdown: '   ' } },
        opts,
      ).action,
    ).toBeNull()
  })
})

describe('normalizeAction · generate & arrange', () => {
  it('requires a description and clamps count to [1, max]', () => {
    expect(
      normalizeAction(
        { action: { kind: 'generate', description: 'pricing', count: 999 } },
        opts,
      ).action,
    ).toEqual({
      kind: 'generate',
      description: 'pricing',
      count: CHAT_ACTION_LIMITS.maxCount,
    })
    expect(
      normalizeAction({ action: { kind: 'generate', description: '' } }, opts)
        .action,
    ).toBeNull()
  })

  it('allows an empty arrange instruction (best-judgment reorder)', () => {
    expect(
      normalizeAction({ action: { kind: 'arrange' } }, opts).action,
    ).toEqual({ kind: 'arrange', instruction: '' })
  })
})

describe('normalizeAction · add_image', () => {
  it('keeps a generate/search description (capped) with optional alt', () => {
    expect(
      normalizeAction(
        {
          action: {
            kind: 'add_image',
            source: 'search',
            value: '  mountain at dawn  ',
            alt: '  a peak  ',
          },
        },
        opts,
      ).action,
    ).toEqual({
      kind: 'add_image',
      source: 'search',
      value: 'mountain at dawn',
      alt: 'a peak',
    })
  })

  it('accepts an https url in url mode but REJECTS javascript:/relative (security)', () => {
    expect(
      normalizeAction(
        {
          action: {
            kind: 'add_image',
            source: 'url',
            value: 'https://img.example.com/a.jpg',
          },
        },
        opts,
      ).action,
    ).toEqual({
      kind: 'add_image',
      source: 'url',
      value: 'https://img.example.com/a.jpg',
    })
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,x', '/local.jpg', 'not a url']) {
      expect(
        normalizeAction(
          { action: { kind: 'add_image', source: 'url', value: bad } },
          opts,
        ).action,
      ).toBeNull()
    }
  })

  it('drops an unknown source or an empty value', () => {
    expect(
      normalizeAction(
        { action: { kind: 'add_image', source: 'nope', value: 'x' } },
        opts,
      ).action,
    ).toBeNull()
    expect(
      normalizeAction(
        { action: { kind: 'add_image', source: 'generate', value: '   ' } },
        opts,
      ).action,
    ).toBeNull()
  })
})

describe('normalizeAction · add_web', () => {
  it('accepts an http(s) url and rejects a javascript: url (unsandboxed iframe = XSS)', () => {
    expect(
      normalizeAction(
        { action: { kind: 'add_web', src: 'https://example.com/x' } },
        opts,
      ).action,
    ).toEqual({ kind: 'add_web', src: 'https://example.com/x' })
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'ftp://x', '']) {
      expect(
        normalizeAction({ action: { kind: 'add_web', src: bad } }, opts).action,
      ).toBeNull()
    }
  })
})

describe('normalizeAction · add_artifact', () => {
  it('keeps non-empty code (capped) with an optional title', () => {
    const { action } = normalizeAction(
      {
        action: {
          kind: 'add_artifact',
          code: 'export default () => null',
          title: 'Chart',
        },
      },
      opts,
    )
    expect(action).toEqual({
      kind: 'add_artifact',
      code: 'export default () => null',
      title: 'Chart',
    })
  })

  it('caps very long code and rejects whitespace-only code', () => {
    const big = normalizeAction(
      { action: { kind: 'add_artifact', code: 'x'.repeat(99_999) } },
      opts,
    ).action as { code: string } | null
    expect(big?.code).toHaveLength(CHAT_ACTION_LIMITS.maxArtifactCode)
    expect(
      normalizeAction(
        { action: { kind: 'add_artifact', code: '   \n  ' } },
        opts,
      ).action,
    ).toBeNull()
  })
})

describe('normalizeAction · totality', () => {
  it('caps `say` and is total on garbage', () => {
    const long = normalizeAction({ say: 'x'.repeat(9999) }, opts)
    expect(long.say).toHaveLength(CHAT_ACTION_LIMITS.maxSay)
    for (const bad of [null, undefined, 42, 'x', { action: 'nope' }, {}]) {
      const r = normalizeAction(bad, opts)
      expect(r.action).toBeNull()
      expect(typeof r.say).toBe('string')
    }
  })

  it('drops an unknown action kind', () => {
    expect(
      normalizeAction({ action: { kind: 'delete_deck' } }, opts).action,
    ).toBeNull()
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
