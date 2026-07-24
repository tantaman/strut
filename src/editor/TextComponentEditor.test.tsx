// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TextComponentEditor } from './TextComponentEditor'
import type { AnyComponent } from './types'

const mocks = vi.hoisted(() => {
  const setTextContent = Object.assign(vi.fn(), { folded: vi.fn() })
  let editorDoc: unknown = null
  return {
    setTextContent,
    push: vi.fn(),
    useEditor: vi.fn(),
    options: null as null | Record<string, unknown>,
    get editorDoc() {
      return editorDoc
    },
    set editorDoc(value: unknown) {
      editorDoc = value
    },
    blur: vi.fn(),
    domBlur: vi.fn(),
    chain: vi.fn(),
    setContent: vi.fn(),
    setMeta: vi.fn(),
    run: vi.fn(),
  }
})

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div data-testid="editor-content" />,
  useEditor: mocks.useEditor,
}))

vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({ setTextContent: mocks.setTextContent }),
}))

vi.mock('./UndoProvider', () => ({
  useHistory: () => ({ push: mocks.push }),
}))

vi.mock('./tiptapSchema', () => ({ strutExtensions: [] }))
vi.mock('./slashCommand', () => ({ SlashCommand: {} }))
vi.mock('./tiptapDoc', () => ({ parseDoc: (doc: string) => JSON.parse(doc) }))

const beforeDoc = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})
const afterDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Shared text' }] },
  ],
}
const finalDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Shared text, finished' }],
    },
  ],
}

function component(doc = beforeDoc): AnyComponent {
  return {
    id: 'text-1',
    slide_id: 'slide-1',
    kind: 'text',
    z_order: 0,
    x: 0,
    y: 0,
    scale_x: 1,
    scale_y: 1,
    scale_w: 1280,
    scale_h: 720,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: '',
    doc,
  }
}

beforeEach(() => {
  mocks.setTextContent.mockReset()
  mocks.setTextContent.folded.mockReset()
  mocks.push.mockReset()
  mocks.useEditor.mockReset()
  mocks.blur.mockReset()
  mocks.domBlur.mockReset()
  mocks.chain.mockReset()
  mocks.setContent.mockReset()
  mocks.setMeta.mockReset()
  mocks.run.mockReset()
  const chainApi = {
    setContent: mocks.setContent,
    setMeta: mocks.setMeta,
    run: mocks.run,
  }
  mocks.setContent.mockImplementation((doc: unknown) => {
    mocks.editorDoc = doc
    return chainApi
  })
  mocks.setMeta.mockReturnValue(chainApi)
  mocks.run.mockReturnValue(true)
  mocks.chain.mockReturnValue(chainApi)
  mocks.options = null
  mocks.editorDoc = JSON.parse(beforeDoc)
  mocks.useEditor.mockImplementation((options: Record<string, unknown>) => {
    mocks.options = options
    return {
      commands: { blur: mocks.blur },
      chain: mocks.chain,
      getJSON: () => mocks.editorDoc,
      isEmpty: false,
      view: { dom: { blur: mocks.domBlur } },
    }
  })
})

afterEach(cleanup)

function callback(name: string): (...args: never[]) => void {
  return mocks.options?.[name] as (...args: never[]) => void
}

describe('TextComponentEditor', () => {
  it('streams updates and visibly replays one undo for the focus session', () => {
    const view = render(<TextComponentEditor component={component()} primary />)
    const mountedEditor = mocks.useEditor.mock.results[0].value
    act(() => callback('onCreate')({ editor: mountedEditor } as never))
    mocks.editorDoc = afterDoc
    const editor = { getJSON: () => mocks.editorDoc }

    act(() => callback('onUpdate')({ editor } as never))

    // Rindle immediately echoes the folded content back through the component fragment. Even if the
    // browser omitted TipTap's focus callback, that rerender must not advance the session baseline and
    // erase the pending undo.
    expect(mocks.push).toHaveBeenCalledOnce()
    view.rerender(
      <TextComponentEditor
        component={component(JSON.stringify(afterDoc))}
        primary
      />,
    )
    mocks.editorDoc = finalDoc
    act(() => callback('onUpdate')({ editor } as never))
    expect(mocks.push).toHaveBeenCalledOnce()
    act(() => callback('onBlur')({ editor } as never))

    expect(mocks.setTextContent.folded).toHaveBeenCalledWith(
      { key: 'text-1' },
      { id: 'text-1', content: JSON.stringify(afterDoc) },
    )
    expect(mocks.setTextContent).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledOnce()
    const command = mocks.push.mock.calls[0][0] as {
      undo: () => void
      redo: () => void
    }
    mocks.setTextContent.mockClear()
    command.undo()
    expect(mocks.setContent).toHaveBeenNthCalledWith(1, JSON.parse(beforeDoc), {
      emitUpdate: false,
    })
    expect(mocks.editorDoc).toEqual(JSON.parse(beforeDoc))
    command.redo()
    expect(mocks.setContent).toHaveBeenNthCalledWith(2, finalDoc, {
      emitUpdate: false,
    })
    expect(mocks.setMeta).toHaveBeenNthCalledWith(1, 'addToHistory', false)
    expect(mocks.setMeta).toHaveBeenNthCalledWith(2, 'addToHistory', false)
    expect(mocks.editorDoc).toEqual(finalDoc)
    expect(mocks.setTextContent).toHaveBeenNthCalledWith(1, {
      id: 'text-1',
      content: beforeDoc,
    })
    expect(mocks.setTextContent).toHaveBeenNthCalledWith(2, {
      id: 'text-1',
      content: JSON.stringify(finalDoc),
    })
    act(() => callback('onDestroy')())
  })

  it('reconciles a pending external document after a clean focus session', () => {
    const view = render(<TextComponentEditor component={component()} primary />)
    const mountedEditor = mocks.useEditor.mock.results[0].value
    act(() => callback('onCreate')({ editor: mountedEditor } as never))
    act(() => callback('onFocus')())

    view.rerender(
      <TextComponentEditor
        component={component(JSON.stringify(afterDoc))}
        primary
      />,
    )
    expect(mocks.setContent).not.toHaveBeenCalled()

    act(() => callback('onBlur')({ editor: mountedEditor } as never))

    expect(mocks.setContent).toHaveBeenCalledOnce()
    expect(mocks.setContent).toHaveBeenCalledWith(afterDoc, {
      emitUpdate: false,
    })
    expect(mocks.setMeta).toHaveBeenCalledWith('addToHistory', false)
    expect(mocks.editorDoc).toEqual(afterDoc)
    expect(mocks.setTextContent).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('keeps local edits when an external document arrives during a dirty session', () => {
    const view = render(<TextComponentEditor component={component()} primary />)
    const mountedEditor = mocks.useEditor.mock.results[0].value
    act(() => callback('onCreate')({ editor: mountedEditor } as never))
    act(() => callback('onFocus')())

    view.rerender(
      <TextComponentEditor
        component={component(JSON.stringify(afterDoc))}
        primary
      />,
    )
    mocks.editorDoc = finalDoc
    act(() => callback('onUpdate')({ editor: mountedEditor } as never))
    act(() => callback('onBlur')({ editor: mountedEditor } as never))

    expect(mocks.setContent).not.toHaveBeenCalled()
    expect(mocks.editorDoc).toEqual(finalDoc)
    expect(mocks.setTextContent).toHaveBeenCalledOnce()
    expect(mocks.setTextContent).toHaveBeenCalledWith({
      id: 'text-1',
      content: JSON.stringify(finalDoc),
    })
    expect(mocks.push).toHaveBeenCalledOnce()
  })

  it('does not treat a stale optimistic prop as a new external edit', () => {
    render(<TextComponentEditor component={component()} primary />)
    const mountedEditor = mocks.useEditor.mock.results[0].value
    act(() => callback('onCreate')({ editor: mountedEditor } as never))
    act(() => callback('onFocus')())
    mocks.editorDoc = afterDoc
    act(() => callback('onUpdate')({ editor: mountedEditor } as never))
    act(() => callback('onBlur')({ editor: mountedEditor } as never))

    // Focus can return before Rindle has echoed the just-committed local document through props. A
    // second clean session must not mistake that already-stale prop for a newly arrived remote edit.
    act(() => callback('onFocus')())
    act(() => callback('onBlur')({ editor: mountedEditor } as never))

    expect(mocks.setContent).not.toHaveBeenCalled()
    expect(mocks.editorDoc).toEqual(afterDoc)
    expect(mocks.setTextContent).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledOnce()
  })

  it('commits when precision suspends the card editor without a blur', () => {
    const onBlur = vi.fn()
    render(
      <TextComponentEditor component={component()} primary onBlur={onBlur} />,
    )
    mocks.editorDoc = afterDoc
    const editor = { getJSON: () => mocks.editorDoc }

    act(() => callback('onCreate')({ editor } as never))
    act(() => callback('onUpdate')({ editor } as never))
    act(() => callback('onDestroy')())

    expect(mocks.setTextContent).toHaveBeenCalledOnce()
    expect(mocks.push).toHaveBeenCalledOnce()
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it('focuses at the end for precision and lets Escape leave text editing', () => {
    const view = render(
      <TextComponentEditor component={component()} autoFocus />,
    )

    expect(mocks.options?.autofocus).toBe('end')
    fireEvent.keyDown(view.container.firstElementChild!, { key: 'Escape' })
    expect(mocks.domBlur).toHaveBeenCalledOnce()
    expect(mocks.blur).toHaveBeenCalledOnce()
  })
})
