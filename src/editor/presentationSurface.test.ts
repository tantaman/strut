import { describe, expect, it } from 'vitest'
import { makeBackgroundImageToken, resolveSurface } from './types'
import { presentationSurfaceBackground } from './presentationSurface'

describe('presentationSurfaceBackground', () => {
  it('keeps ordinary surface colors unchanged', () => {
    expect(presentationSurfaceBackground('', 'bg-surf-blue')).toBe(
      resolveSurface('', 'bg-surf-blue'),
    )
  })

  it('composes an inherited deck surface image', () => {
    const image = makeBackgroundImageToken('https://example.com/deck.jpg')
    const background = presentationSurfaceBackground('', image)
    expect(background).toContain('url("https://example.com/deck.jpg")')
    expect(background).toContain('center / cover no-repeat')
  })

  it('composes a per-slide image over the deck surface color', () => {
    const image = makeBackgroundImageToken('https://example.com/slide.jpg')
    const background = presentationSurfaceBackground(image, 'bg-surf-ink')
    expect(background).toContain('url("https://example.com/slide.jpg")')
    expect(background).toContain(resolveSurface('', 'bg-surf-ink'))
  })
})
