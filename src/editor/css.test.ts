import { describe, expect, it } from 'vitest'
import { scopeCss } from './css'

describe('scopeCss trust boundary', () => {
  it('scopes ordinary rules and recursively keeps media/supports groups', () => {
    const scoped = scopeCss(`
      .plain { color: red; }
      @media (max-width: 700px) { .small { padding: 4px; } }
      @supports (display: grid) { .supported { gap: 8px; } }
    `)

    expect(scoped).toContain('.strut-surface .plain { color: red; }')
    expect(scoped).toContain('@media (max-width: 700px)')
    expect(scoped).toContain('.strut-surface .small { padding: 4px; }')
    expect(scoped).toContain('@supports (display: grid)')
    expect(scoped).toContain('.strut-surface .supported { gap: 8px; }')
  })

  it('strips imports and every unscoped or unknown at-rule without losing following rules', () => {
    const scoped = scopeCss(`
      @import "https://example.com/theme.css";
      .safe { color: green; }
      @font-face { font-family: Remote; src: url(https://example.com/font.woff2); }
      @keyframes vanish { to { opacity: 0; } }
      @layer unsafe { body { display: none; } }
      @container card (width > 200px) { .wide { color: purple; } }
    `)

    expect(scoped).toContain('.strut-surface .safe { color: green; }')
    expect(scoped).not.toMatch(
      /@import|@font-face|@keyframes|@layer|@container/,
    )
    expect(scoped).not.toContain('example.com')
    expect(scoped).not.toContain('body')
  })

  it('drops resource-loading rules, including string-based image and src functions', () => {
    const scoped = scopeCss(`
      .safe { background-image: linear-gradient(red, blue); }
      .url { background: url(https://example.com/a.png); }
      .image { background-image: image("https://example.com/b.png"); }
      .src { background-image: src("//example.com/c.png"); }
      .escaped { background: u\\72l(relative.png); }
      @media (min-width: 1px) {
        .nested { background-image: image-set("data:image/png;base64,AAAA" 1x); }
      }
    `)

    expect(scoped).toContain(
      '.strut-surface .safe { background-image: linear-gradient(red, blue); }',
    )
    expect(scoped).not.toContain('.url')
    expect(scoped).not.toContain('.image')
    expect(scoped).not.toContain('.src')
    expect(scoped).not.toContain('.escaped')
    expect(scoped).not.toContain('.nested')
    expect(scoped).not.toContain('example.com')
    expect(scoped).not.toContain('data:image')
  })

  it('rejects an entire stylesheet containing an HTML style breakout', () => {
    expect(
      scopeCss('.safe { color: red; }</style><script>alert(1)</script>'),
    ).toBe('')
    expect(scopeCss('/* </style> */ .safe { color: red; }')).toBe('')
  })

  it('does not mistake quoted braces or selector commas for structure', () => {
    const scoped = scopeCss(`
      [data-mark="{"] { content: "}"; color: red; }
      :is(.alpha, .beta) { padding: 2px; }
      body { color: black; }
    `)

    expect(scoped).toContain('.strut-surface [data-mark="{"]')
    expect(scoped).toContain('.strut-surface :is(.alpha, .beta)')
    expect(scoped).toContain('.strut-surface body { color: black; }')
    expect(scoped).not.toMatch(/(?:^|\n)body\s*\{/)
  })
})
