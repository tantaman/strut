// Reinserting a component from a full snapshot — used by undo (restore a deleted component) and
// could back any "duplicate"/"paste" later. The add* mutators only take position + type fields and
// reset the spatial transform via spatialBase, so we re-apply geometry + classes afterwards (the same
// dance deckIO.addComponent does on import, but preserving the ORIGINAL id so redo/undo stay stable).

import type { StrutApp } from '../rindle/client'
import { SHAPES, type AnyComponent } from './types'

type Mutate = StrutApp['mutate']

export function reinsertComponent(mutate: Mutate, c: AnyComponent): void {
  const common = {
    id: c.id,
    slideId: c.slide_id,
    x: c.x,
    y: c.y,
    z_order: c.z_order,
  }
  switch (c.kind) {
    case 'text':
      mutate.addText({
        ...common,
        text: c.text ?? 'Text',
        size: c.size ?? 72,
        color: c.color ?? '111111',
        font_family: c.font_family ?? 'Lato',
      })
      break
    case 'image':
      mutate.addImage({
        ...common,
        src: c.src ?? '',
        image_type: c.image_type ?? '',
        scale_w: c.scale_w || 400,
        scale_h: c.scale_h || 300,
      })
      break
    case 'shape':
      mutate.addShape({
        ...common,
        shape: c.shape ?? 'square',
        markup: c.markup || SHAPES[c.shape ?? 'square'] || '',
        fill: c.fill ?? '3498db',
      })
      break
    case 'video':
      mutate.addVideo({
        ...common,
        src: c.src ?? '',
        video_type: c.video_type ?? 'html5',
        src_type: c.src_type ?? '',
        short_src: c.short_src ?? '',
      })
      break
    case 'webframe':
      mutate.addWebframe({ ...common, src: c.src ?? '' })
      break
  }
  if (
    c.rotate ||
    c.skew_x ||
    c.skew_y ||
    c.scale_w ||
    c.scale_h ||
    c.scale_x !== 1 ||
    c.scale_y !== 1
  ) {
    mutate.transformComponent({
      table: c.table,
      id: c.id,
      scale_x: c.scale_x || 1,
      scale_y: c.scale_y || 1,
      scale_w: c.scale_w || 0,
      scale_h: c.scale_h || 0,
      rotate: c.rotate || 0,
      skew_x: c.skew_x || 0,
      skew_y: c.skew_y || 0,
    })
  }
  if (c.custom_classes)
    mutate.setComponentClasses({
      table: c.table,
      id: c.id,
      custom_classes: c.custom_classes,
    })
}
