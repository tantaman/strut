import { describe, expect, it } from 'vitest'
import {
  MAX_GENERATED_THEME_CSS,
  sanitizeGeneratedThemeCss,
} from '../../shared/generatedThemeCss'

describe('sanitizeGeneratedThemeCss', () => {
  it('keeps a flat visual subset and drops layout/interaction declarations', () => {
    expect(
      sanitizeGeneratedThemeCss(`
        .strut-md h1 { color: #223344; letter-spacing: -.03em; position: fixed; transform: scale(.9); }
        .strut-md p { line-height: 1.55; display: none; opacity: 0; filter: blur(20px); }
      `),
    ).toBe(
      '.strut-md h1 { color: #223344; letter-spacing: -.03em; }\n' +
        '.strut-md p { line-height: 1.55; }',
    )
  })

  it('rejects network loads, at-rules, style breakouts, and editor selectors', () => {
    for (const css of [
      '@import "https://example.com/x.css";',
      '.x { background: url(https://example.com/x.png); }',
      '.x { background-image: image("https://example.com/x.png"); }',
      '.x { background-image: src("https://example.com/x.png"); }',
      '.x { background-image: image-set("//example.com/x.png" 1x); }',
      '.x { background: "data:image/png;base64,AAAA"; }',
      '</style><script>alert(1)</script>',
      '.chat { color: red; }',
      'body { color: red; }',
    ]) {
      expect(sanitizeGeneratedThemeCss(css)).toBeUndefined()
    }
  })

  it('preserves an explicit reset and caps model output before parsing', () => {
    expect(sanitizeGeneratedThemeCss('   ')).toBe('')
    expect(
      sanitizeGeneratedThemeCss(
        `.strut-md { color: red; }${'x'.repeat(MAX_GENERATED_THEME_CSS)}`,
      ),
    ).toBeUndefined()
  })
})
