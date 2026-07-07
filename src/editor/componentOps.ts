// Inserting a component from a full snapshot, via the typed add* mutators. Shared by two callers that
// used to carry identical per-type switches: undo/duplicate (reinsertComponent, preserving the id) and
// file import (deckIO.addComponent, minting a fresh id). The add* mutators only take position + type
// fields (they reset the spatial base), so any non-default geometry + classes are re-applied after —
// keyed on `target.id` so a freshly-minted or a preserved id both work.

import type { StrutApp } from '../rindle/client'
import { SHAPES, type AnyComponent } from './types'

type Mutate = StrutApp['mutate']

/** The fields insertComponent reads: the kind discriminator, the spatial transform + classes, and the
 *  type-specific leaves. `id`/`slide_id` are supplied separately (import mints, undo preserves), so
 *  both `AnyComponent` and deckIO's `ImportedComponent` satisfy this. */
export type ComponentSpec = Omit<AnyComponent, 'id' | 'slide_id'>

export function insertComponent(
  mutate: Mutate,
  target: { id: string; slideId: string },
  c: ComponentSpec,
): void {
  const common = {
    id: target.id,
    slideId: target.slideId,
    x: c.x,
    y: c.y,
    z_order: c.z_order,
  }
  switch (c.kind) {
    case 'text':
      // '' color/font_family = theme-inherited; '' text_type = body — preserve, don't materialize.
      mutate.addText({
        ...common,
        text: c.text ?? 'Text',
        size: c.size ?? 72,
        color: c.color ?? '',
        font_family: c.font_family ?? '',
        text_type: c.text_type ?? '',
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
    case 'artifact':
      mutate.addArtifact({ ...common, code: c.code ?? '', src: c.src ?? '' })
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
      id: target.id,
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
      id: target.id,
      custom_classes: c.custom_classes,
    })
}

/** Undo/duplicate: re-insert a component from a full in-memory snapshot, preserving its ORIGINAL id so
 *  redo/undo stay stable. */
export function reinsertComponent(mutate: Mutate, c: AnyComponent): void {
  insertComponent(mutate, { id: c.id, slideId: c.slide_id }, c)
}
