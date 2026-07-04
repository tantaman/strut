import { describe, expect, it } from 'vitest'
import { resolveTextAlign, resolveTheme } from './types'

describe('resolveTextAlign', () => {
  it('lets a per-slide override win over the deck default', () => {
    expect(resolveTextAlign('center', 'right')).toBe('center')
  })
  it('falls back to the deck default when the slide has no override', () => {
    expect(resolveTextAlign('', 'right')).toBe('right')
    expect(resolveTextAlign(null, 'center')).toBe('center')
    expect(resolveTextAlign(undefined, 'right')).toBe('right')
  })
  it('falls back to the built-in "left" when nothing is set', () => {
    expect(resolveTextAlign('', '')).toBe('left')
    expect(resolveTextAlign(undefined, undefined)).toBe('left')
    expect(resolveTextAlign(null, null)).toBe('left')
  })
  it('ignores unrecognized values', () => {
    expect(resolveTextAlign('justify', '')).toBe('left')
  })
})

describe('resolveTheme', () => {
  it('uses built-in defaults for a bare/empty deck', () => {
    expect(resolveTheme(null)).toEqual({
      headingFont: 'Lato',
      headingColor: '#111111',
      bodyFont: 'Lato',
      bodyColor: '#111111',
      textAlign: 'left',
    })
  })

  it('resolves deck fonts/colors and normalizes bare hex to #rrggbb', () => {
    const t = resolveTheme({
      heading_font: 'Ubuntu',
      heading_color: 'ff0000',
      body_font: 'Droid Sans Mono',
      body_color: '#00ff00',
    })
    expect(t.headingFont).toBe('Ubuntu')
    expect(t.headingColor).toBe('#ff0000')
    expect(t.bodyFont).toBe('Droid Sans Mono')
    expect(t.bodyColor).toBe('#00ff00')
  })

  it('applies text-align precedence: slide override → deck → default', () => {
    expect(resolveTheme({ text_align: 'right' }).textAlign).toBe('right')
    expect(
      resolveTheme({ text_align: 'right' }, { text_align: 'center' }).textAlign,
    ).toBe('center')
    expect(resolveTheme({ text_align: 'right' }, { text_align: '' }).textAlign).toBe(
      'right',
    )
    expect(resolveTheme(null, { text_align: '' }).textAlign).toBe('left')
  })
})
