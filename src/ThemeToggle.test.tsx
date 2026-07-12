// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle, themeBootstrapScript } from './ThemeToggle'

function matchMedia(matches: boolean) {
  return vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.colorScheme = ''
  window.matchMedia = matchMedia(false)
})

afterEach(cleanup)

describe('theme bootstrap', () => {
  it('uses the OS preference when the user has not chosen a theme', () => {
    window.matchMedia = matchMedia(true)
    window.eval(themeBootstrapScript)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('prefers a saved choice over the OS preference', () => {
    localStorage.setItem('strut-theme', 'light')
    window.matchMedia = matchMedia(true)
    window.eval(themeBootstrapScript)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('ThemeToggle', () => {
  it('switches the document theme and persists the choice', () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('strut-theme')).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeTruthy()
  })
})
