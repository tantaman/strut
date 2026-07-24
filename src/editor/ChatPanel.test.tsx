// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatPanel } from './ChatPanel'
import type { DeckChatContext } from './chatNarration'

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  useChat: vi.fn(),
}))

vi.mock('./aiChat', () => ({
  useChat: mocks.useChat,
}))

vi.mock('../rindle/authClient', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'member', isAnonymous: false } },
    }),
    signIn: { social: vi.fn() },
  },
}))

const deckContext: DeckChatContext = {
  take: () => '',
  clear: () => {},
}

beforeEach(() => {
  mocks.send.mockReset()
  mocks.useChat.mockReset()
  mocks.useChat.mockReturnValue({
    messages: [],
    send: mocks.send,
    busy: false,
    clear: vi.fn(),
    undoTip: null,
    undoLast: vi.fn(),
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
})
