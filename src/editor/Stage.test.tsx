// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Stage } from './Stage'
import type { SlideDetail } from './deckDetail'
import type * as ImageDropModule from './imageDrop'

const mocks = vi.hoisted(() => ({
  editor: {
    canEdit: true,
    selected: new Set<string>(),
    pendingShape: null as string | null,
    clearSelection: vi.fn(),
    isSelected: vi.fn(() => false),
    select: vi.fn(),
    selectMany: vi.fn(),
    setDraggingComponentId: vi.fn(),
    setPendingShape: vi.fn(),
  },
  drop: {
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    active: true,
    preview: { x: 100, y: 120, w: 320, h: 180 },
    busy: true,
  },
}))

vi.mock('./EditorState', () => ({
  useEditor: () => mocks.editor,
}))

vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({}),
}))

vi.mock('./UndoProvider', () => ({
  useHistory: () => ({ push: vi.fn() }),
}))

vi.mock('./useFitScale', () => ({
  useFitScale: () => 1,
}))

vi.mock('./Inspector', () => ({
  Inspector: () => null,
}))

vi.mock('./imageDrop', async (importOriginal) => {
  const original = await importOriginal<typeof ImageDropModule>()
  return {
    ...original,
    useDropImage: () => mocks.drop,
  }
})

function fixtureSlide(): SlideDetail {
  return {
    id: 'slide-1',
    deck_id: 'deck-1',
    body_component_id: 'slide-1:body',
    sort: 'a0',
    x: 0,
    y: 0,
    z: 0,
    rotate_x: 0,
    rotate_y: 0,
    rotate_z: 0,
    imp_scale: 1,
    background: '',
    surface: '',
    text_align: 'left',
    components: [],
  } as unknown as SlideDetail
}

describe('Stage image drop', () => {
  beforeEach(() => {
    mocks.editor.canEdit = true
    mocks.drop.onDragOver.mockClear()
    mocks.drop.onDragLeave.mockClear()
    mocks.drop.onDrop.mockClear()
  })

  it('connects image drop handlers and feedback to the precision canvas', () => {
    const { container } = render(<Stage slide={fixtureSlide()} deck={null} />)
    const canvas = container.querySelector('.slide-canvas')
    expect(canvas).not.toBeNull()

    fireEvent.dragOver(canvas!)
    fireEvent.dragLeave(canvas!)
    fireEvent.drop(canvas!)

    expect(mocks.drop.onDragOver).toHaveBeenCalledOnce()
    expect(mocks.drop.onDragLeave).toHaveBeenCalledOnce()
    expect(mocks.drop.onDrop).toHaveBeenCalledOnce()
    expect(container.querySelector('.drop-image-preview')).not.toBeNull()
    expect(screen.getByRole('status').textContent).toBe('Uploading image…')
  })

  it('does not accept drops when the deck is read-only', () => {
    mocks.editor.canEdit = false
    const { container } = render(<Stage slide={fixtureSlide()} deck={null} />)
    const canvas = container.querySelector('.slide-canvas')

    fireEvent.dragOver(canvas!)
    fireEvent.drop(canvas!)

    expect(mocks.drop.onDragOver).not.toHaveBeenCalled()
    expect(mocks.drop.onDrop).not.toHaveBeenCalled()
  })
})
