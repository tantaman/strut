import { describe, expect, it } from 'vitest'
import { scopeCss } from './css'

describe('scopeCss', () => {
  it('scopes selector lists without splitting commas inside functional selectors', () => {
    expect(scopeCss(':is(h1, h2), p { color: red; }')).toContain(
      '.strut-surface :is(h1, h2), .strut-surface p',
    )
  })

  it('recurses through supported grouping at-rules', () => {
    const scoped = scopeCss(
      '@media (max-width: 900px) { h1, p { font-size: 2rem; } }',
    )
    expect(scoped).toContain('@media (max-width: 900px)')
    expect(scoped).toContain('.strut-surface h1, .strut-surface p')
  })

  it('does not mistake braces or comment markers inside strings for CSS structure', () => {
    const scoped = scopeCss(
      '.label::before { content: "{/* not a comment */}"; color: red; }',
    )
    expect(scoped).toContain('.strut-surface .label::before')
    expect(scoped).toContain('content: "{/* not a comment */}"')
    expect(scoped).toContain('color: red')
  })
})
