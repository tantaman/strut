// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocTextLayoutPicker } from './DocTextLayoutPicker'
import type { AnyComponent } from './types'

const mocks = vi.hoisted(() => ({
  moveComponent: vi.fn(),
  transformComponent: vi.fn(),
  push: vi.fn(),
}))

vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({
    moveComponent: mocks.moveComponent,
    transformComponent: mocks.transformComponent,
  }),
}))

vi.mock('./UndoProvider', () => ({
  useHistory: () => ({ push: mocks.push }),
}))

function primary(patch: Partial<AnyComponent> = {}): AnyComponent {
  return {
    id: 'slide-1:body',
    slide_id: 'slide-1',
    kind: 'text',
    z_order: 0,
    x: 13,
    y: 21,
    scale_x: 1.1,
    scale_y: 0.9,
    scale_w: 500,
    scale_h: 250,
    rotate: 0.2,
    skew_x: 0.1,
    skew_y: -0.1,
    custom_classes: '',
    doc: '',
    ...patch,
  }
}

beforeEach(() => {
  mocks.moveComponent.mockReset()
  mocks.transformComponent.mockReset()
  mocks.push.mockReset()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0)
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('DocTextLayoutPicker', () => {
  it('snaps canonical geometry and records the entire change as one undo', () => {
    render(<DocTextLayoutPicker component={primary()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Text layout: Custom' }))
    fireEvent.click(screen.getByRole('button', { name: 'Text right' }))

    expect(mocks.moveComponent).toHaveBeenCalledOnce()
    expect(mocks.moveComponent).toHaveBeenLastCalledWith({
      id: 'slide-1:body',
      x: 640,
      y: 0,
    })
    expect(mocks.transformComponent).toHaveBeenCalledOnce()
    expect(mocks.transformComponent).toHaveBeenLastCalledWith({
      id: 'slide-1:body',
      scale_x: 1,
      scale_y: 1,
      scale_w: 640,
      scale_h: 720,
      rotate: 0,
      skew_x: 0,
      skew_y: 0,
    })
    expect(mocks.push).toHaveBeenCalledOnce()

    const command = mocks.push.mock.calls[0][0] as {
      undo: () => void
      redo: () => void
    }
    command.undo()
    expect(mocks.moveComponent).toHaveBeenLastCalledWith({
      id: 'slide-1:body',
      x: 13,
      y: 21,
    })
    expect(mocks.transformComponent).toHaveBeenLastCalledWith({
      id: 'slide-1:body',
      scale_x: 1.1,
      scale_y: 0.9,
      scale_w: 500,
      scale_h: 250,
      rotate: 0.2,
      skew_x: 0.1,
      skew_y: -0.1,
    })
    command.redo()
    expect(mocks.moveComponent).toHaveBeenLastCalledWith({
      id: 'slide-1:body',
      x: 640,
      y: 0,
    })
  })

  it('marks a canonical frame active and does not record a no-op selection', () => {
    render(
      <DocTextLayoutPicker
        component={primary({
          x: 0,
          y: 0,
          scale_x: 1,
          scale_y: 1,
          scale_w: 1280,
          scale_h: 720,
          rotate: 0,
          skew_x: 0,
          skew_y: 0,
        })}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Text layout: Full slide' }),
    )
    const full = screen.getByRole('button', { name: 'Full slide' })
    expect(full.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(full)
    expect(mocks.moveComponent).not.toHaveBeenCalled()
    expect(mocks.transformComponent).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('hands focus into the portaled choices and restores it after selection', () => {
    render(<DocTextLayoutPicker component={primary()} />)

    const trigger = screen.getByRole('button', {
      name: 'Text layout: Custom',
    })
    fireEvent.click(trigger)
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Full slide' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Text top' }))
    expect(document.activeElement).toBe(trigger)
  })
})
