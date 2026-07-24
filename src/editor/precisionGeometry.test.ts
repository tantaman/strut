import { describe, expect, it } from 'vitest'
import {
  alignFrames,
  distributeFrames,
  matchFrameSize,
  nudgeFrames,
  planZReorder,
  resizeGroupFrames,
  selectionBounds,
  snapMove,
} from './precisionGeometry'
import type { PrecisionFrame, ResizeHandle } from './precisionGeometry'

const frame = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rotate = 0,
): PrecisionFrame => ({ id, x, y, w, h, rotate })

describe('precision geometry basics', () => {
  it('finds selection bounds and preserves fractional nudges', () => {
    const frames = [frame('a', 1.25, 8.5, 10.5, 20.25), frame('b', 20, 2, 4, 6)]

    expect(selectionBounds(frames)).toMatchObject({
      left: 1.25,
      top: 2,
      right: 24,
      bottom: 28.75,
      centerX: 12.625,
      middleY: 15.375,
    })
    expect(nudgeFrames(frames, 0.125, -1.75).map(({ x, y }) => [x, y])).toEqual(
      [
        [1.375, 6.75],
        [20.125, 0.25],
      ],
    )
  })

  it('aligns one frame to the canvas and many within selection bounds', () => {
    expect(alignFrames([frame('a', 40, 50, 200, 100)], 'centerX')[0].x).toBe(
      540,
    )
    expect(alignFrames([frame('a', 40, 50, 200, 100)], 'bottom')[0].y).toBe(620)

    const aligned = alignFrames(
      [frame('a', 10, 25, 20, 20), frame('b', 80, 5, 40, 10)],
      'right',
    )
    expect(aligned.map(({ x }) => x)).toEqual([100, 80])
  })

  it('distributes equal horizontal and vertical gaps with fixed endpoints', () => {
    const horizontal = distributeFrames(
      [
        frame('first', 0, 0, 10, 10),
        frame('third', 90, 30, 30, 20),
        frame('second', 17, 8, 20, 15),
      ],
      'horizontal',
    )
    expect(horizontal.map(({ id, x }) => [id, x])).toEqual([
      ['first', 0],
      ['third', 90],
      ['second', 40],
    ])

    const vertical = distributeFrames(
      [
        frame('first', 0, 0, 10, 10),
        frame('middle', 0, 12, 10, 10),
        frame('last', 0, 90, 10, 30),
      ],
      'vertical',
    )
    expect(vertical.find((item) => item.id === 'middle')?.y).toBe(45)
  })

  it('matches dimensions to the first supplied frame', () => {
    const frames = [
      frame('reference', 0, 0, 12.5, 30),
      frame('other', 4, 5, 80, 7),
    ]
    expect(matchFrameSize(frames, 'width').map(({ w }) => w)).toEqual([
      12.5, 12.5,
    ])
    expect(matchFrameSize(frames, 'height').map(({ h }) => h)).toEqual([30, 30])
  })
})

describe('z reorder plans', () => {
  const layers = [
    { id: 'a', z: 1 },
    { id: 'b', z: 1 },
    { id: 'c', z: 2 },
    { id: 'd', z: 3 },
  ]

  it('uses caller order to break z ties and moves a block forward stably', () => {
    const plan = planZReorder(layers, ['a', 'b'], 'forward')

    expect(plan.orderedIds).toEqual(['c', 'a', 'b', 'd'])
    expect(plan.assignments).toEqual([
      { id: 'c', previousZ: 2, z: 0 },
      { id: 'a', previousZ: 1, z: 1 },
      { id: 'b', previousZ: 1, z: 2 },
      { id: 'd', previousZ: 3, z: 3 },
    ])
  })

  it('plans front, backward, and back without disturbing selection order', () => {
    expect(planZReorder(layers, ['a', 'c'], 'front').orderedIds).toEqual([
      'b',
      'd',
      'a',
      'c',
    ])
    expect(planZReorder(layers, ['b', 'c'], 'backward').orderedIds).toEqual([
      'b',
      'c',
      'a',
      'd',
    ])
    expect(planZReorder(layers, ['b', 'd'], 'back').orderedIds).toEqual([
      'b',
      'd',
      'a',
      'c',
    ])
  })
})

describe('axis-aligned group resize', () => {
  const cases: Array<{
    handle: ResizeHandle
    delta: { x: number; y: number }
    bounds: { x: number; y: number; w: number; h: number }
  }> = [
    {
      handle: 'n',
      delta: { x: 0, y: 10 },
      bounds: { x: 0, y: 10, w: 100, h: 90 },
    },
    {
      handle: 'ne',
      delta: { x: 10, y: 10 },
      bounds: { x: 0, y: 10, w: 110, h: 90 },
    },
    {
      handle: 'e',
      delta: { x: 10, y: 0 },
      bounds: { x: 0, y: 0, w: 110, h: 100 },
    },
    {
      handle: 'se',
      delta: { x: 10, y: 10 },
      bounds: { x: 0, y: 0, w: 110, h: 110 },
    },
    {
      handle: 's',
      delta: { x: 0, y: 10 },
      bounds: { x: 0, y: 0, w: 100, h: 110 },
    },
    {
      handle: 'sw',
      delta: { x: 10, y: 10 },
      bounds: { x: 10, y: 0, w: 90, h: 110 },
    },
    {
      handle: 'w',
      delta: { x: 10, y: 0 },
      bounds: { x: 10, y: 0, w: 90, h: 100 },
    },
    {
      handle: 'nw',
      delta: { x: 10, y: 10 },
      bounds: { x: 10, y: 10, w: 90, h: 90 },
    },
  ]

  it.each(cases)(
    'resizes from the $handle handle with its opposite anchor fixed',
    ({ handle, delta, bounds }) => {
      const result = resizeGroupFrames(
        [frame('box', 0, 0, 100, 100)],
        handle,
        delta,
      )
      expect(result.bounds).toMatchObject(bounds)
    },
  )

  it('preserves rotations and proportional child positions', () => {
    const result = resizeGroupFrames(
      [frame('a', 0, 0, 20, 20, 0.25), frame('b', 60, 40, 40, 60, -0.5)],
      'e',
      { x: 50, y: 0 },
    )

    expect(result.bounds).toMatchObject({ x: 0, y: 0, w: 150, h: 100 })
    expect(result.frames).toEqual([
      frame('a', 0, 0, 30, 20, 0.25),
      frame('b', 90, 40, 60, 60, -0.5),
    ])
  })

  it('locks aspect around the opposite anchor or the selection center', () => {
    const source = [frame('box', 0, 0, 100, 50, 0.75)]
    const anchored = resizeGroupFrames(
      source,
      'se',
      { x: 50, y: 0 },
      { aspectLock: true },
    )
    expect(anchored.bounds).toMatchObject({ x: 0, y: 0, w: 150, h: 75 })

    const centered = resizeGroupFrames(
      source,
      'e',
      { x: 10, y: 0 },
      { aspectLock: true, center: true },
    )
    expect(centered.bounds).toMatchObject({ x: -10, y: -5, w: 120, h: 60 })
    expect(centered.frames[0].rotate).toBe(0.75)
  })
})

describe('move snapping', () => {
  it('snaps independently to the closest peer axes and emits only winning guides', () => {
    const result = snapMove(
      [frame('moving', 190, 94, 100, 50)],
      { x: 5, y: 5 },
      [frame('peer', 300, 150, 80, 40)],
      { threshold: 6 },
    )

    expect(result.delta).toEqual({ x: 10, y: 6 })
    expect(result.frames[0]).toMatchObject({ x: 200, y: 100 })
    expect(result.guides).toEqual([
      {
        axis: 'x',
        position: 300,
        source: 'peer',
        targetId: 'peer',
        movingAnchor: 'right',
        targetAnchor: 'left',
      },
      {
        axis: 'y',
        position: 150,
        source: 'peer',
        targetId: 'peer',
        movingAnchor: 'bottom',
        targetAnchor: 'top',
      },
    ])
  })

  it('snaps to canvas guides and excludes selected ids from peer targets', () => {
    const result = snapMove(
      [frame('moving', 7.5, 8.25, 100, 50)],
      { x: 0, y: 0 },
      [frame('moving', 7.5, 8.25, 100, 50)],
      { threshold: 8.25 },
    )

    expect(result.delta).toEqual({ x: -7.5, y: -8.25 })
    expect(result.guides).toHaveLength(2)
    expect(
      result.guides.map(({ source, position }) => [source, position]),
    ).toEqual([
      ['canvas', 0],
      ['canvas', 0],
    ])
  })
})
