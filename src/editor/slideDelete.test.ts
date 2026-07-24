import { describe, expect, it, vi } from 'vitest'
import { History } from './history'
import { captureDeletedSlide, deleteSlideWithUndo } from './slideDelete'
import type { StrutApp } from '../rindle/client'
import type { AnyComponent } from './types'
import type { SlideDetail } from './deckDetail'

const BODY_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}'

function fixtureSlide(): SlideDetail {
  return {
    id: 'slide-1',
    deck_id: 'deck-1',
    body_component_id: 'slide-1:body',
    sort: 'a0',
    x: 120,
    y: 240,
    z: 30,
    rotate_x: 0.1,
    rotate_y: 0.2,
    rotate_z: 0.3,
    imp_scale: 4,
    background: 'bg-custom-slide',
    surface: 'bg-custom-surface',
    text_align: 'right',
    components: [],
  } as unknown as SlideDetail
}

function fixturePrimary(): AnyComponent {
  return {
    id: 'slide-1:body',
    slide_id: 'slide-1',
    kind: 'text',
    doc: BODY_DOC,
    size: 36,
    color: '112233',
    font_family: 'Inter',
    x: 5,
    y: 6,
    z_order: 0,
    scale_x: 1,
    scale_y: 1,
    scale_w: 1200,
    scale_h: 680,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
    custom_classes: 'body-class',
  }
}

function fixtureImage(): AnyComponent {
  return {
    id: 'image-1',
    slide_id: 'slide-1',
    kind: 'image',
    x: 10,
    y: 20,
    z_order: 8,
    scale_x: 1,
    scale_y: 1,
    scale_w: 400,
    scale_h: 300,
    rotate: 12,
    skew_x: 2,
    skew_y: 3,
    custom_classes: 'rounded-xl shadow-lg',
    src: 'https://example.test/image.png',
    image_type: '',
  }
}

function mockMutate() {
  return {
    addSlide: vi.fn(),
    deleteSlide: vi.fn(),
    setSlideTransform: vi.fn(),
    setSlideTheme: vi.fn(),
    setSlideNotes: vi.fn(),
    addImage: vi.fn(),
    moveComponent: vi.fn(),
    transformComponent: vi.fn(),
    setComponentZ: vi.fn(),
    setText: vi.fn(),
    setComponentClasses: vi.fn(),
  } as unknown as StrutApp['mutate']
}

describe('deleteSlideWithUndo', () => {
  it('restores the slide, canonical primary, note, and positioned components in one undo', () => {
    const history = new History()
    const mutate = mockMutate()
    const snapshot = captureDeletedSlide(
      fixtureSlide(),
      [fixturePrimary(), fixtureImage()],
      { deckId: 'deck-1', doc: 'NOTE-DOC' },
    )

    deleteSlideWithUndo(snapshot, mutate, history)
    expect(mutate.deleteSlide).toHaveBeenCalledWith({
      id: 'slide-1',
      componentIds: ['slide-1:body', 'image-1'],
    })
    expect(history.undoLabel).toBe('Delete slide')

    history.undo()

    expect(mutate.addSlide).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        deckId: 'deck-1',
        sort: 'a0',
        x: 120,
        y: 240,
        content: BODY_DOC,
      }),
    )
    expect(mutate.setSlideTransform).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        z: 30,
        rotate_x: 0.1,
        rotate_y: 0.2,
        rotate_z: 0.3,
        imp_scale: 4,
      }),
    )
    expect(mutate.setSlideTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        background: 'bg-custom-slide',
        surface: 'bg-custom-surface',
        text_align: 'right',
      }),
    )
    expect(mutate.setText).toHaveBeenCalledWith({
      id: 'slide-1:body',
      size: 36,
      color: '112233',
      font_family: 'Inter',
    })
    expect(mutate.moveComponent).toHaveBeenCalledWith({
      id: 'slide-1:body',
      x: 5,
      y: 6,
    })
    expect(mutate.setSlideNotes).toHaveBeenCalledWith(
      expect.objectContaining({
        slideId: 'slide-1',
        deckId: 'deck-1',
        doc: 'NOTE-DOC',
      }),
    )
    expect(mutate.addImage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'image-1',
        slideId: 'slide-1',
        src: 'https://example.test/image.png',
      }),
    )

    history.redo()
    expect(mutate.deleteSlide).toHaveBeenCalledTimes(2)
  })

  it('preserves authoritative note absence', () => {
    const history = new History()
    const mutate = mockMutate()
    const snapshot = captureDeletedSlide(
      fixtureSlide(),
      [fixturePrimary()],
      null,
    )

    deleteSlideWithUndo(snapshot, mutate, history)
    history.undo()

    expect(mutate.setSlideNotes).not.toHaveBeenCalled()
    expect(mutate.addSlide).toHaveBeenCalledWith(
      expect.objectContaining({ content: BODY_DOC }),
    )
  })
})
