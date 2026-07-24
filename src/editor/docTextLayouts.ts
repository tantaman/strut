import { SLIDE_H, SLIDE_W } from '../config'
import type { AnyComponent } from './types'

/** A doc-first layout is a stateless snap command over the canonical primary text component. The
 *  resulting frame is the persisted truth; there is deliberately no parallel slide.layout value. */
export const DOC_TEXT_LAYOUTS = [
  {
    id: 'full',
    label: 'Full slide',
    frame: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H },
  },
  {
    id: 'left',
    label: 'Text left',
    frame: { x: 0, y: 0, w: SLIDE_W / 2, h: SLIDE_H },
  },
  {
    id: 'right',
    label: 'Text right',
    frame: { x: SLIDE_W / 2, y: 0, w: SLIDE_W / 2, h: SLIDE_H },
  },
  {
    id: 'top',
    label: 'Text top',
    frame: { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H / 2 },
  },
  {
    id: 'bottom',
    label: 'Text bottom',
    frame: { x: 0, y: SLIDE_H / 2, w: SLIDE_W, h: SLIDE_H / 2 },
  },
] as const

export type DocTextLayout = (typeof DOC_TEXT_LAYOUTS)[number]
export type DocTextLayoutId = DocTextLayout['id']

/** Everything a layout changes. Keeping the complete transform in the snapshot is what lets one undo
 *  restore a hand-positioned/rotated precision frame exactly after a preset performs a true snap. */
export interface ComponentGeometry {
  id: string
  x: number
  y: number
  scale_x: number
  scale_y: number
  scale_w: number
  scale_h: number
  rotate: number
  skew_x: number
  skew_y: number
}

export function componentGeometry(component: AnyComponent): ComponentGeometry {
  return {
    id: component.id,
    x: component.x,
    y: component.y,
    scale_x: component.scale_x,
    scale_y: component.scale_y,
    scale_w: component.scale_w,
    scale_h: component.scale_h,
    rotate: component.rotate,
    skew_x: component.skew_x,
    skew_y: component.skew_y,
  }
}

export function geometryForDocTextLayout(
  component: AnyComponent,
  layoutId: DocTextLayoutId,
): ComponentGeometry {
  const layout = DOC_TEXT_LAYOUTS.find((candidate) => candidate.id === layoutId)
  // The id is closed over a union generated from DOC_TEXT_LAYOUTS, so this is unreachable at runtime;
  // retaining the guard keeps the helper safe if it is ever called from untyped import data.
  if (!layout) return componentGeometry(component)
  return {
    id: component.id,
    x: layout.frame.x,
    y: layout.frame.y,
    scale_x: 1,
    scale_y: 1,
    scale_w: layout.frame.w,
    scale_h: layout.frame.h,
    rotate: 0,
    skew_x: 0,
    skew_y: 0,
  }
}

/** Derive the active chip from canonical geometry. A precision adjustment becomes "Custom" instead of
 *  leaving behind a stale layout label that no longer describes what Present will render. */
export function docTextLayoutForGeometry(
  geometry: ComponentGeometry,
): DocTextLayoutId | null {
  if (
    geometry.scale_x !== 1 ||
    geometry.scale_y !== 1 ||
    geometry.rotate !== 0 ||
    geometry.skew_x !== 0 ||
    geometry.skew_y !== 0
  )
    return null

  const layout = DOC_TEXT_LAYOUTS.find(
    (candidate) =>
      geometry.x === candidate.frame.x &&
      geometry.y === candidate.frame.y &&
      geometry.scale_w === candidate.frame.w &&
      geometry.scale_h === candidate.frame.h,
  )
  return layout?.id ?? null
}
