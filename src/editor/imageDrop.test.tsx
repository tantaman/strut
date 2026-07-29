// @vitest-environment jsdom

import { fireEvent, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DropImageHighlight, useDropImage } from './imageDrop'
import type { SlideDetail } from './deckDetail'

const mocks = vi.hoisted(() => ({
  addImage: vi.fn(),
  removeComponent: vi.fn(),
  historyPush: vi.fn(),
  uploadImage: vi.fn(async () => 'https://cdn.example/portrait.png'),
}))

vi.mock('../rindle/RindleProvider', () => ({
  useMutate: () => ({
    addImage: mocks.addImage,
    removeComponent: mocks.removeComponent,
  }),
}))

vi.mock('./UndoProvider', () => ({
  useHistory: () => ({ push: mocks.historyPush }),
}))

vi.mock('./upload', () => ({
  uploadImage: mocks.uploadImage,
}))

const slide = { id: 'slide-1' } as SlideDetail

function Harness() {
  const drop = useDropImage(slide)
  return (
    <div
      className={`slide-canvas${drop.active ? ' is-dropping' : ''}`}
      onDragOver={drop.onDragOver}
      onDragLeave={drop.onDragLeave}
      onDrop={drop.onDrop}
    >
      <DropImageHighlight rect={drop.preview} scale={1} />
    </div>
  )
}

describe('useDropImage preview', () => {
  beforeEach(() => {
    mocks.addImage.mockClear()
    mocks.removeComponent.mockClear()
    mocks.historyPush.mockClear()
    mocks.uploadImage.mockClear()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 400, height: 800, close: vi.fn() })),
    )
  })

  it('uses the image aspect ratio for both the hover preview and inserted object', async () => {
    const file = new File(['portrait'], 'portrait.png', {
      type: 'image/png',
      lastModified: 123,
    })
    const dataTransfer = {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => file,
        },
      ],
      dropEffect: 'none',
    }
    const { container } = render(<Harness />)
    const canvas = container.querySelector<HTMLElement>('.slide-canvas')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1280,
      bottom: 720,
      width: 1280,
      height: 720,
      toJSON: () => ({}),
    })

    fireEvent.dragOver(canvas, {
      clientX: 640,
      clientY: 360,
      dataTransfer,
    })

    await waitFor(() => {
      const preview = container.querySelector<HTMLElement>(
        '.drop-image-preview',
      )
      expect(preview?.style.width).toBe('324px')
      expect(preview?.style.height).toBe('648px')
    })

    fireEvent.drop(canvas, {
      clientX: 640,
      clientY: 360,
      dataTransfer,
    })

    await waitFor(() =>
      expect(mocks.addImage).toHaveBeenCalledWith(
        expect.objectContaining({
          slideId: 'slide-1',
          scale_w: 324,
          scale_h: 648,
        }),
      ),
    )
    expect(createImageBitmap).toHaveBeenCalledOnce()
  })

  it('arms the surface without showing a fake aspect ratio in protected drag mode', () => {
    const dataTransfer = {
      files: [],
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => null,
        },
      ],
      dropEffect: 'none',
    }
    const { container } = render(<Harness />)
    const canvas = container.querySelector<HTMLElement>('.slide-canvas')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1280,
      bottom: 720,
      width: 1280,
      height: 720,
      toJSON: () => ({}),
    })

    fireEvent.dragOver(canvas, {
      clientX: 640,
      clientY: 360,
      dataTransfer,
    })

    expect(canvas.classList.contains('is-dropping')).toBe(true)
    expect(container.querySelector('.drop-image-preview')).toBeNull()
  })
})
