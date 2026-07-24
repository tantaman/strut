import { describe, expect, it } from 'vitest'
import {
  alignFrames,
  distributeFrames,
  frameBounds,
  matchFrameSize,
  nudgeFrames,
  planZReorder,
  resizeFrameInLocalAxes,
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
  it('finds visible selection bounds and preserves fractional nudges', () => {
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

  it('computes the visual AABB of a frame rotated around its center', () => {
    const rotated = frame('rotated', 10, 20, 100, 50, Math.PI / 2)

    expect(frameBounds(rotated)).toMatchObject({
      centerX: 60,
      middleY: 45,
    })
    expect(frameBounds(rotated).left).toBeCloseTo(35)
    expect(frameBounds(rotated).top).toBeCloseTo(-5)
    expect(frameBounds(rotated).right).toBeCloseTo(85)
    expect(frameBounds(rotated).bottom).toBeCloseTo(95)
    expect(selectionBounds([rotated])).toEqual(frameBounds(rotated))
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

    const rotated = alignFrames(
      [frame('rotated', 10, 20, 100, 50, Math.PI / 2)],
      'left',
    )[0]
    expect(frameBounds(rotated).left).toBeCloseTo(0)

    const rotatedGroup = [
      frame('wide', 10, 25, 80, 20, Math.PI / 4),
      frame('tall', 140, 5, 20, 80, -Math.PI / 4),
    ]
    const targetRight = selectionBounds(rotatedGroup)!.right
    const alignedRotatedGroup = alignFrames(rotatedGroup, 'right')
    for (const item of alignedRotatedGroup) {
      expect(frameBounds(item).right).toBeCloseTo(targetRight)
    }
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

    const rotated = distributeFrames(
      [
        frame('first', 0, 0, 20, 40, Math.PI / 2),
        frame('middle', 40, 0, 20, 20),
        frame('last', 100, 0, 20, 40, Math.PI / 2),
      ],
      'horizontal',
    )
    const visible = rotated.map(frameBounds).sort((a, b) => a.left - b.left)
    expect(visible[1].left - visible[0].right).toBeCloseTo(20)
    expect(visible[2].left - visible[1].right).toBeCloseTo(20)
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
    expect(plan.undoAssignments).toEqual([
      { id: 'a', z: 0 },
      { id: 'b', z: 1 },
      { id: 'c', z: 2 },
      { id: 'd', z: 3 },
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

  it('maps rotated child centers through the visible selection bounds', () => {
    const source = [
      frame('a', 0, 0, 40, 20, Math.PI / 2),
      frame('b', 80, 40, 20, 40, Math.PI / 2),
    ]
    const before = selectionBounds(source)!
    const result = resizeGroupFrames(source, 'e', { x: 100, y: 0 })

    expect(before.x).toBeCloseTo(10)
    expect(before.y).toBeCloseTo(-10)
    expect(before.w).toBeCloseTo(100)
    expect(before.h).toBeCloseTo(80)
    expect(result.bounds?.x).toBeCloseTo(10)
    expect(result.bounds?.y).toBeCloseTo(-10)
    expect(result.bounds?.w).toBeCloseTo(200)
    expect(result.bounds?.h).toBeCloseTo(80)
    expect(result.frames).toEqual([
      frame('a', -10, 0, 80, 20, Math.PI / 2),
      frame('b', 150, 40, 40, 40, Math.PI / 2),
    ])
  })

  it('locks aspect around the opposite anchor or the selection center', () => {
    const source = [frame('box', 0, 0, 100, 50)]
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
  })
})

describe('single-frame local-axis resize', () => {
  it('projects canvas movement onto the rotated edge and fixes the opposite edge', () => {
    const source = frame('box', 0, 0, 100, 50, Math.PI / 2)
    const result = resizeFrameInLocalAxes(source, 'e', { x: 0, y: 20 })

    expect(result.frame.x).toBeCloseTo(-10)
    expect(result.frame.y).toBeCloseTo(10)
    expect(result.frame.w).toBeCloseTo(120)
    expect(result.frame.h).toBeCloseTo(50)
    expect(result.frame.rotate).toBe(source.rotate)
    // The local west-edge midpoint stays at the same canvas point: (50, -25).
    const centerX = result.frame.x + result.frame.w / 2
    const centerY = result.frame.y + result.frame.h / 2
    expect(
      centerX - (Math.cos(result.frame.rotate) * result.frame.w) / 2,
    ).toBeCloseTo(50)
    expect(
      centerY - (Math.sin(result.frame.rotate) * result.frame.w) / 2,
    ).toBeCloseTo(-25)
    expect(result.bounds).toEqual(frameBounds(result.frame))
  })

  it('supports centered, aspect-locked growth in local axes', () => {
    const angle = Math.PI / 4
    const source = frame('box', 20, 30, 100, 50, angle)
    const delta = { x: 10 * Math.cos(angle), y: 10 * Math.sin(angle) }
    const result = resizeFrameInLocalAxes(source, 'e', delta, {
      aspectLock: true,
      center: true,
      minSize: 8,
    })

    expect(result.frame.w).toBeCloseTo(120)
    expect(result.frame.h).toBeCloseTo(60)
    expect(result.frame.x + result.frame.w / 2).toBeCloseTo(70)
    expect(result.frame.y + result.frame.h / 2).toBeCloseTo(55)
    expect(result.frame.rotate).toBe(angle)
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

  it('snaps rotated objects by their visible edges', () => {
    const result = snapMove(
      [frame('moving', 0, 200, 100, 50, Math.PI / 2)],
      { x: 10, y: 0 },
      [frame('peer', 100, 400, 20, 40, Math.PI / 2)],
      { threshold: 5 },
    )

    expect(result.delta).toEqual({ x: 15, y: 0 })
    expect(result.frames[0].x).toBe(15)
    expect(result.guides).toEqual([
      {
        axis: 'x',
        position: 90,
        source: 'peer',
        targetId: 'peer',
        movingAnchor: 'right',
        targetAnchor: 'left',
      },
    ])
  })
})
