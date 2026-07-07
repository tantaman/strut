// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { History } from './history'
import { applyThemePatch } from './aiTheme'
import { applyBodyEdit } from './aiBody'
import type { SetDeckThemeArgs, SetSlideDocArgs } from '../../shared/app-def'
import type { SlideDetail } from './deckDetail'

// The two genuinely-new one-undo appliers (aiTheme / aiBody). Each captures the deck/slide's before-value,
// applies the change, and pushes exactly ONE reversible history command — the whole point of the Edit lane.

describe('applyThemePatch', () => {
  it('applies the patch and reverts to the captured before-values on undo (one entry)', () => {
    const calls: SetDeckThemeArgs[] = []
    const mutate = { setDeckTheme: (a: SetDeckThemeArgs) => calls.push(a) }
    const history = new History()
    const deck = { id: 'd', background: 'bg-default', heading_color: '' }

    applyThemePatch(
      { background: 'bg-custom-abc', heading_color: 'ff0000' },
      { mutate, history, deck },
      'AI theme',
    )

    // Applied once, with the new values.
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      id: 'd',
      background: 'bg-custom-abc',
      heading_color: 'ff0000',
    })
    expect(history.canUndo).toBe(true)
    expect(history.undoLabel).toBe('AI theme')

    history.undo()
    // Undo restores ONLY the touched columns to their captured before-values.
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({
      id: 'd',
      background: 'bg-default',
      heading_color: '',
    })
  })

  it('is a no-op for an empty patch', () => {
    const mutate = { setDeckTheme: vi.fn() }
    const history = new History()
    applyThemePatch({}, { mutate, history, deck: { id: 'd' } })
    expect(mutate.setDeckTheme).not.toHaveBeenCalled()
    expect(history.canUndo).toBe(false)
  })
})

describe('applyBodyEdit', () => {
  const slides = [{ id: 's1', doc: 'BEFORE_DOC' } as unknown as SlideDetail]

  it('swaps in the converted doc and restores the prior doc on undo', () => {
    const calls: SetSlideDocArgs[] = []
    const mutate = { setSlideDoc: (a: SetSlideDocArgs) => calls.push(a) }
    const history = new History()

    const ok = applyBodyEdit('s1', '# Tighter\n\n- a\n- b', {
      mutate,
      history,
      slides,
    })
    expect(ok).toBe(true)
    expect(calls).toHaveLength(1)
    // markdownToDoc produced a real (non-empty, JSON) doc that isn't the old value.
    expect(calls[0].id).toBe('s1')
    expect(calls[0].doc).not.toBe('BEFORE_DOC')
    expect(() => JSON.parse(calls[0].doc)).not.toThrow()

    history.undo()
    expect(calls).toHaveLength(2)
    expect(calls[1]).toMatchObject({ id: 's1', doc: 'BEFORE_DOC' })
  })

  it('returns false (no mutation) when the target slide is gone', () => {
    const mutate = { setSlideDoc: vi.fn() }
    const history = new History()
    expect(applyBodyEdit('ghost', '# x', { mutate, history, slides })).toBe(
      false,
    )
    expect(mutate.setSlideDoc).not.toHaveBeenCalled()
    expect(history.canUndo).toBe(false)
  })
})
