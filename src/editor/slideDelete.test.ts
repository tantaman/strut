import { describe, expect, it, vi } from 'vitest'
import { History } from './history'
import { captureDeletedSlide, deleteSlideWithUndo } from './slideDelete'
import type { StrutApp } from '../rindle/client'
import type { AnyComponent } from './types'
import type { SlideDetail } from './deckDetail'

function fixtureSlide(): SlideDetail {
  return {
    id: 'slide-1',
    deck_id: 'deck-1',
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
    markdown: '# Legacy body',
    render_mode: 'markdown',
    text_align: 'right',
    doc: '{"type":"doc","content":[{"type":"paragraph"}]}',
    body_region: 'left',
    layout: 'grid-4',
    cells: '["","CELL-1","CELL-2","CELL-3"]',
    pad: 'compact',
    valign: 'bottom',
    components: [],
  } as unknown as SlideDetail
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
    fill: '',
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
    setSlideMarkdown: vi.fn(),
    setSlideDoc: vi.fn(),
    setSlideCells: vi.fn(),
    setSlideNotes: vi.fn(),
    addImage: vi.fn(),
    transformComponent: vi.fn(),
    setComponentClasses: vi.fn(),
  } as unknown as StrutApp['mutate']
}

describe('deleteSlideWithUndo', () => {
  it('restores the complete slide, cells, note, and components in one undo', () => {
    const history = new History()
    const mutate = mockMutate()
    const snapshot = captureDeletedSlide(fixtureSlide(), [fixtureImage()], {
      deckId: 'deck-1',
      doc: 'NOTE-DOC',
    })

    deleteSlideWithUndo(snapshot, mutate, history)

    expect(mutate.deleteSlide).toHaveBeenCalledOnce()
    expect(mutate.deleteSlide).toHaveBeenLastCalledWith({
      id: 'slide-1',
      componentIds: ['image-1'],
    })
    expect(history.undoLabel).toBe('Delete slide')

    history.undo()

    expect(mutate.addSlide).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        deckId: 'deck-1',
        sort: 'a0',
        x: 120,
        y: 240,
        render_mode: 'markdown',
        layout: 'grid-4',
        pad: 'compact',
        valign: 'bottom',
        text_align: 'right',
      }),
    )
    expect(mutate.setSlideTransform).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        x: 120,
        y: 240,
        z: 30,
        rotate_x: 0.1,
        rotate_y: 0.2,
        rotate_z: 0.3,
        imp_scale: 4,
      }),
    )
    expect(mutate.setSlideTheme).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        background: 'bg-custom-slide',
        surface: 'bg-custom-surface',
        text_align: 'right',
        body_region: 'left',
        layout: 'grid-4',
        pad: 'compact',
        valign: 'bottom',
      }),
    )
    expect(mutate.setSlideMarkdown).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'slide-1', markdown: '# Legacy body' }),
    )
    expect(mutate.setSlideDoc).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'slide-1', doc: fixtureSlide().doc }),
    )
    expect(mutate.setSlideCells).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'slide-1',
        cells: '["","CELL-1","CELL-2","CELL-3"]',
      }),
    )
    expect(mutate.setSlideNotes).toHaveBeenLastCalledWith(
      expect.objectContaining({
        slideId: 'slide-1',
        deckId: 'deck-1',
        doc: 'NOTE-DOC',
      }),
    )
    expect(mutate.addImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 'image-1',
        slideId: 'slide-1',
        src: 'https://example.test/image.png',
      }),
    )
    expect(mutate.transformComponent).toHaveBeenLastCalledWith({
      id: 'image-1',
      scale_x: 1,
      scale_y: 1,
      scale_w: 400,
      scale_h: 300,
      rotate: 12,
      skew_x: 2,
      skew_y: 3,
    })
    expect(mutate.setComponentClasses).toHaveBeenLastCalledWith({
      id: 'image-1',
      custom_classes: 'rounded-xl shadow-lg',
    })

    history.redo()
    expect(mutate.deleteSlide).toHaveBeenCalledTimes(2)
  })

  it('preserves authoritative note absence instead of inventing a note row', () => {
    const history = new History()
    const mutate = mockMutate()
    const snapshot = captureDeletedSlide(fixtureSlide(), [], null)

    deleteSlideWithUndo(snapshot, mutate, history)
    history.undo()

    expect(mutate.setSlideNotes).not.toHaveBeenCalled()
    expect(mutate.setSlideCells).toHaveBeenCalledOnce()
    expect(mutate.setSlideMarkdown).toHaveBeenCalledOnce()
    expect(mutate.setSlideDoc).toHaveBeenCalledOnce()
  })
})
