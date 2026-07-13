// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyNarrated } from './aiNarrate'
import type { NarrateMutate } from './aiNarrate'
import { History } from './history'
import type { SlideDetail } from './deckDetail'
import type { AddSlideArgs, SetSlideNotesArgs } from '../../shared/app-def'

// Integration test for the differentiated apply path: applyNarrated must append markdown-mode slides AND
// write each slide's narration into the slide_notes side table (the thing that makes Research mode land
// populated) — all as ONE undoable step whose undo removes the slides (the notes cascade with them). Driven
// against the REAL History so the undo/redo semantics are exercised, not mocked.

type Call = { fn: string; args: unknown }

function recorder() {
  const calls: Call[] = []
  const mutate: NarrateMutate = {
    addSlide: (a) => void calls.push({ fn: 'addSlide', args: a }),
    setSlideDoc: (a) => void calls.push({ fn: 'setSlideDoc', args: a }),
    setSlideNotes: (a) => void calls.push({ fn: 'setSlideNotes', args: a }),
    deleteSlide: (a) => void calls.push({ fn: 'deleteSlide', args: a }),
  }
  return { calls, mutate }
}

const narrated = {
  slides: [
    {
      markdown: '# Opening\n\n- why it matters',
      notes: 'so, first, why this matters',
    },
    { markdown: '# Close', notes: '' }, // no narration → no slide_notes row
  ],
}

describe('applyNarrated', () => {
  const deckId = 'deck-1'

  it('appends body docs, writes notes only where present, returns the first id', () => {
    const { calls, mutate } = recorder()
    const history = new History()
    const firstId = applyNarrated(
      narrated,
      mutate,
      { deckId, slides: [] },
      history,
    )

    const adds = calls
      .filter((c) => c.fn === 'addSlide')
      .map((c) => c.args as AddSlideArgs)
    const docs = calls.filter((c) => c.fn === 'setSlideDoc')
    const notes = calls
      .filter((c) => c.fn === 'setSlideNotes')
      .map((c) => c.args as SetSlideNotesArgs)

    expect(adds).toHaveLength(2)
    expect(docs).toHaveLength(2)
    // Notes are written ONLY for the slide that had narration (the empty-notes slide gets no row).
    expect(notes).toHaveLength(1)

    // Every new slide is markdown-mode and on the right deck.
    for (const a of adds) {
      expect(a.render_mode).toBe('markdown')
      expect(a.deckId).toBe(deckId)
    }

    // The notes row targets the FIRST slide, carries the deck id (server gate needs the real owning deck),
    // and holds a non-empty, parseable TipTap doc — not raw text.
    expect(notes[0].slideId).toBe(adds[0].id)
    expect(notes[0].deckId).toBe(deckId)
    expect(typeof notes[0].now).toBe('number')
    expect(JSON.parse(notes[0].doc).type).toBe('doc')

    expect(firstId).toBe(adds[0].id)
  })

  it('is ONE undoable step: undo deletes every new slide (notes cascade with the slide)', () => {
    const { calls, mutate } = recorder()
    const history = new History()
    applyNarrated(narrated, mutate, { deckId, slides: [] }, history)

    expect(history.canUndo).toBe(true)
    expect(history.undoLabel).toBe('Generate slides from recording')

    const before = calls.length
    history.undo()
    const afterUndo = calls.slice(before)
    // Undo issues exactly two deleteSlide calls and NOTHING else — it does not separately delete notes,
    // because deleteSlide cascades the slide_notes row (see app-def deleteSlide / server rindle-api).
    expect(afterUndo.filter((c) => c.fn === 'deleteSlide')).toHaveLength(2)
    expect(afterUndo.every((c) => c.fn === 'deleteSlide')).toBe(true)

    // Redo replays the whole batch — slides + the one notes row — in one step.
    const beforeRedo = calls.length
    history.redo()
    const replay = calls.slice(beforeRedo)
    expect(replay.filter((c) => c.fn === 'addSlide')).toHaveLength(2)
    expect(replay.filter((c) => c.fn === 'setSlideNotes')).toHaveLength(1)
  })

  it('no-ops on an empty narrated deck', () => {
    const { calls, mutate } = recorder()
    const history = new History()
    const id = applyNarrated(
      { slides: [] },
      mutate,
      { deckId, slides: [] },
      history,
    )
    expect(id).toBeNull()
    expect(calls).toHaveLength(0)
    expect(history.canUndo).toBe(false)
  })

  it('appends AFTER existing slides (sort keys strictly increasing past the last)', () => {
    const { calls, mutate } = recorder()
    const history = new History()
    const existing = [{ sort: 'a0', x: 0, y: 0 } as unknown as SlideDetail]
    applyNarrated(narrated, mutate, { deckId, slides: existing }, history)
    const adds = calls
      .filter((c) => c.fn === 'addSlide')
      .map((c) => c.args as AddSlideArgs)
    expect(adds).toHaveLength(2)
    // Both new keys sort strictly after the last existing key ('a0') and are increasing between themselves.
    for (const a of adds) expect(a.sort > 'a0').toBe(true)
    expect(adds[0].sort < adds[1].sort).toBe(true)
  })
})
