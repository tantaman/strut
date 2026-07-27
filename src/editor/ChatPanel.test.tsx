// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatPanel } from './ChatPanel'
import type { DeckChatContext } from './chatNarration'

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  useChat: vi.fn(),
  useModelStatus: vi.fn(),
}))

vi.mock('./aiChat', () => ({
  useChat: mocks.useChat,
}))

// The panel's access signal: a connected key or a plan that pays for inference. Default here is "the
// viewer connected their own model", the ordinary way ✨ is on.
vi.mock('../rindle/modelClient', () => ({
  useModelStatus: mocks.useModelStatus,
  getModelStatus: vi.fn(),
  connectModel: vi.fn(),
  disconnectModel: vi.fn(),
}))

const deckContext: DeckChatContext = {
  take: () => '',
  clear: () => {},
}

beforeEach(() => {
  mocks.send.mockReset()
  mocks.useChat.mockReset()
  mocks.useModelStatus.mockReset().mockReturnValue({
    status: {
      connected: true,
      provider: 'openrouter',
      model: null,
      appPaid: false,
    },
    loading: false,
    refresh: vi.fn(),
  })
  mocks.useChat.mockReturnValue({
    messages: [],
    send: mocks.send,
    busy: false,
    clear: vi.fn(),
    undoTip: null,
    undoLast: vi.fn(),
  })
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((file: File) => `blob:${file.name}`),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(cleanup)

describe('ChatPanel permissions', () => {
  it('readably disables chat for a read-only viewer', () => {
    render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit={false}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('status').getAttribute('aria-disabled')).toBe(
      'true',
    )
    expect(screen.getByRole('status').textContent).toMatch(/read-only/i)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(mocks.useChat).toHaveBeenCalledWith(
      'd1',
      [],
      expect.objectContaining({ canEdit: false }),
    )
  })

  it('offers the connect flow instead of the composer when there is no model to run on', () => {
    mocks.useModelStatus.mockReturnValue({
      status: {
        connected: false,
        provider: null,
        model: null,
        appPaid: false,
      },
      loading: false,
      refresh: vi.fn(),
    })

    render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Connect a model' })).toBeTruthy()
  })

  it('composes on a paid plan with no connected key', () => {
    mocks.useModelStatus.mockReturnValue({
      status: { connected: false, provider: null, model: null, appPaid: true },
      loading: false,
      refresh: vi.fn(),
    })

    render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('lets an editable member compose and send', () => {
    render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        onClose={vi.fn()}
      />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Make it clearer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mocks.send).toHaveBeenCalledWith('Make it clearer')
  })

  it('sends selected photos as ephemeral style references', () => {
    const { container } = render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        styleIntent={1}
        onClose={vi.fn()}
      />,
    )
    const file = new File(['look'], 'look.png', { type: 'image/png' })
    const picker = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(picker, { target: { files: [file] } })

    expect(screen.getByRole('img', { name: 'look.png' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mocks.send).toHaveBeenCalledWith(
      'Restyle this deck using these images as visual references.',
      [file],
    )
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'look.png' })).toBeTruthy()
  })

  it('keeps style references available when the AI turn fails', () => {
    const props = {
      deckId: 'd1',
      slides: [],
      deck: null,
      activeSlide: null,
      deckContext,
      canEdit: true,
      styleIntent: 1,
      onClose: vi.fn(),
    }
    const { container, rerender } = render(<ChatPanel {...props} />)
    const file = new File(['look'], 'look.png', { type: 'image/png' })
    const picker = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(picker, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    mocks.useChat.mockReturnValue({
      messages: [
        {
          id: 'a1',
          role: 'assistant',
          content: '',
          status: 'streaming',
        },
      ],
      send: mocks.send,
      busy: true,
      clear: vi.fn(),
      undoTip: null,
      undoLast: vi.fn(),
    })
    rerender(<ChatPanel {...props} />)

    mocks.useChat.mockReturnValue({
      messages: [
        {
          id: 'a1',
          role: 'assistant',
          content: 'Could not match that look.',
          status: 'error',
        },
      ],
      send: mocks.send,
      busy: false,
      clear: vi.fn(),
      undoTip: null,
      undoLast: vi.fn(),
    })
    rerender(<ChatPanel {...props} />)

    expect(screen.getByRole('img', { name: 'look.png' })).toBeTruthy()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('clears style references after a successful AI turn', () => {
    const props = {
      deckId: 'd1',
      slides: [],
      deck: null,
      activeSlide: null,
      deckContext,
      canEdit: true,
      styleIntent: 1,
      onClose: vi.fn(),
    }
    const { container, rerender } = render(<ChatPanel {...props} />)
    const file = new File(['look'], 'look.png', { type: 'image/png' })
    const picker = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(picker, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    mocks.useChat.mockReturnValue({
      messages: [
        {
          id: 'a1',
          role: 'assistant',
          content: 'Matched the look.',
          status: 'done',
        },
      ],
      send: mocks.send,
      busy: false,
      clear: vi.fn(),
      undoTip: { label: 'AI theme' },
      undoLast: vi.fn(),
    })
    rerender(<ChatPanel {...props} />)

    expect(screen.queryByRole('img', { name: 'look.png' })).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:look.png')
  })

  it('rejects unsupported reference files before sending', () => {
    const { container } = render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        onClose={vi.fn()}
      />,
    )
    const picker = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(picker, {
      target: {
        files: [new File(['svg'], 'look.svg', { type: 'image/svg+xml' })],
      },
    })

    expect(screen.getByRole('alert').textContent).toMatch(/jpeg, png, or webp/i)
    expect(
      screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it('infers a missing browser MIME type from a familiar image extension', () => {
    const { container } = render(
      <ChatPanel
        deckId="d1"
        slides={[]}
        deck={null}
        activeSlide={null}
        deckContext={deckContext}
        canEdit
        onClose={vi.fn()}
      />,
    )
    const picker = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(picker, {
      target: { files: [new File(['jpeg'], 'look.JPG')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(mocks.send).toHaveBeenCalledWith(
      'Restyle this deck using these images as visual references.',
      [expect.objectContaining({ name: 'look.JPG', type: 'image/jpeg' })],
    )
  })
})
