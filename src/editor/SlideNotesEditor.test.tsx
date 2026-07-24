// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SlideNotesEditor } from './SlideNotesEditor'

const mocks = vi.hoisted(() => {
  const setSlideNotes = Object.assign(vi.fn(), { folded: vi.fn() })
  return {
    setSlideNotes,
    push: vi.fn(),
    useEditor: vi.fn(),
    options: null as null | {
      onUpdate: (event: { editor: { getJSON: () => unknown } }) => void
      onBlur: (event: { editor: { getJSON: () => unknown } }) => void
    },
    editorDoc: {},
  }
})

vi.mock('@tiptap/react', () => ({
  EditorContent: () => null,
  useEditor: mocks.useEditor,
}))

vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({ setSlideNotes: mocks.setSlideNotes }),
}))

vi.mock('./UndoProvider', () => ({
  useHistory: () => ({ push: mocks.push }),
}))

vi.mock('./tiptapSchema', () => ({ strutExtensions: [] }))
vi.mock('./tiptapDoc', () => ({ parseDoc: (doc: string) => JSON.parse(doc) }))

const beforeDoc = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})
const afterDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Keep this' }] },
  ],
}

beforeEach(() => {
  mocks.setSlideNotes.mockReset()
  mocks.setSlideNotes.folded.mockReset()
  mocks.push.mockReset()
  mocks.useEditor.mockReset()
  mocks.options = null
  mocks.editorDoc = JSON.parse(beforeDoc)
  mocks.useEditor.mockImplementation((options) => {
    mocks.options = options
    return {
      commands: { focus: vi.fn(), blur: vi.fn() },
      getJSON: () => mocks.editorDoc,
      isEmpty: false,
      isFocused: false,
    }
  })
})

afterEach(cleanup)

function updateNotes() {
  mocks.editorDoc = afterDoc
  act(() => {
    mocks.options?.onUpdate({ editor: { getJSON: () => mocks.editorDoc } })
  })
}

describe('SlideNotesEditor history', () => {
  it('commits one undo step when virtualization unmounts it without blur', () => {
    const view = render(
      <SlideNotesEditor
        slideId="slide-1"
        deckId="deck-1"
        doc={beforeDoc}
        canEdit
      />,
    )

    updateNotes()
    view.rerender(
      <SlideNotesEditor
        slideId="slide-1"
        deckId="deck-1"
        doc={beforeDoc}
        canEdit
      />,
    )

    // A normal rerender must not look like virtualization and end the current edit session.
    expect(mocks.setSlideNotes).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
    view.unmount()

    expect(mocks.setSlideNotes.folded).toHaveBeenCalledOnce()
    expect(mocks.setSlideNotes).toHaveBeenCalledOnce()
    expect(mocks.setSlideNotes).toHaveBeenCalledWith(
      expect.objectContaining({
        slideId: 'slide-1',
        deckId: 'deck-1',
        doc: JSON.stringify(afterDoc),
      }),
    )
    expect(mocks.push).toHaveBeenCalledOnce()
  })

  it('does not add another undo step on unmount after a normal blur', () => {
    const view = render(
      <SlideNotesEditor
        slideId="slide-1"
        deckId="deck-1"
        doc={beforeDoc}
        canEdit
      />,
    )

    updateNotes()
    act(() => {
      mocks.options?.onBlur({ editor: { getJSON: () => mocks.editorDoc } })
    })
    view.unmount()

    expect(mocks.setSlideNotes).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledOnce()
  })
})
