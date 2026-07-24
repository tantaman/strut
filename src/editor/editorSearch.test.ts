import { describe, expect, it } from 'vitest'
import {
  parseEditorSearch,
  playExitSearch,
  playStartIndex,
} from './editorSearch'

describe('parseEditorSearch', () => {
  it.each(['slide', 'doc', 'overview', 'research'])(
    'ignores the legacy %s view while preserving the active slide',
    (view) => {
      expect(parseEditorSearch({ view, slide: 's2' })).toEqual({
        slide: 's2',
      })
    },
  )

  it.each([undefined, null, 42, {}, ['s2']])(
    'drops a non-string slide value (%j)',
    (slide) => {
      expect(parseEditorSearch({ view: 'overview', slide })).toEqual({})
    },
  )
})

describe('playStartIndex', () => {
  const slides = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]

  it('opens on a known slide', () => {
    expect(playStartIndex(slides, 's2')).toBe(1)
  })

  it('defaults to the first slide when the requested slide is unknown or absent', () => {
    expect(playStartIndex(slides, 'missing')).toBe(0)
    expect(playStartIndex(slides)).toBe(0)
  })

  it('also accepts slide-id arrays', () => {
    expect(playStartIndex(['s1', 's2'], 's2')).toBe(1)
  })
})

describe('playExitSearch', () => {
  const slides = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]

  it('returns only the slide currently being presented', () => {
    expect(playExitSearch(slides, 1, 's1')).toEqual({ slide: 's2' })
  })

  it('uses the incoming slide only when there is no current slide', () => {
    expect(playExitSearch(slides, 99, 's3')).toEqual({ slide: 's3' })
    expect(playExitSearch([], 0)).toEqual({})
  })
})
