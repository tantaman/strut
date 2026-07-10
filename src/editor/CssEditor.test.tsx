// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CssEditorModal, DeckStyles } from './CssEditor'

const mocks = vi.hoisted(() => ({ setDeckTheme: vi.fn() }))
vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({ setDeckTheme: mocks.setDeckTheme }),
}))

beforeEach(() => mocks.setDeckTheme.mockClear())

describe('DeckStyles', () => {
  it('renders generated CSS before user CSS and scopes both to the slide surface', () => {
    const { container } = render(
      <DeckStyles
        generatedCss="h1 { color: red; }"
        userCss="h1 { color: blue; }"
      />,
    )
    const styles = [...container.querySelectorAll('style')].map(
      (style) => style.textContent,
    )
    expect(styles).toHaveLength(2)
    expect(styles[0]).toContain('.strut-surface h1')
    expect(styles[0]).toContain('red')
    expect(styles[1]).toContain('.strut-surface h1')
    expect(styles[1]).toContain('blue')
  })
})

describe('CssEditorModal', () => {
  it('edits and saves the AI and user layers independently', () => {
    const onClose = vi.fn()
    render(
      <CssEditorModal
        deckId="d1"
        generatedInitial="h1 { color: red; }"
        userInitial="h1 { color: blue; }"
        onClose={onClose}
      />,
    )

    const editor = screen.getByRole('textbox')
    expect(editor.value).toBe('h1 { color: red; }')
    fireEvent.change(editor, { target: { value: 'h1 { color: orange; }' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Custom overrides' }))
    expect(editor.value).toBe('h1 { color: blue; }')
    fireEvent.change(editor, { target: { value: 'h1 { color: navy; }' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/ }))

    expect(mocks.setDeckTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'd1',
        generated_stylesheet: 'h1 { color: orange; }',
        custom_stylesheet: 'h1 { color: navy; }',
      }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
