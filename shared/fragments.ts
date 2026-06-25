// Composable Rindle FRAGMENTS — reusable, co-located selections over a table (rindle.sh/docs/fragments).
//
// Why: a slide's components live in five per-type tables (text/image/shape/video/webframe), so the
// old `useSlideComponents` opened FIVE live queries PER slide and merged them in JS — a 12-slide deck
// meant ~60 subscriptions, multiplied again by every thumbnail/overview card that re-ran the same
// hook (RINDLE_NOTES #6/#12). Fragments fix that at the root: spreading these into ONE deck query
// assembles a single Ast → a single materialization → a single `/query` for the whole deck subtree
// (no per-component request fan-out). Components then READ the already-materialized node instead of
// each opening their own subscription.
//
// These leaf fragments don't `.select(...)` yet (omitting it selects all columns — the full row the
// renderer needs). A later pass can narrow each to exactly the columns its component reads to trim
// wire size; the composition below doesn't change when that happens.

import { defineFragment } from '@rindle/client'
import {
  image_component,
  shape_component,
  slide,
  text_component,
  video_component,
  webframe_component,
} from './schema.ts'
import { rels } from './app-def.ts'

// One reusable selection per component table — the unit a leaf component renders from.
export const TextFragment = defineFragment(text_component, (f) => f)
export const ImageFragment = defineFragment(image_component, (f) => f)
export const ShapeFragment = defineFragment(shape_component, (f) => f)
export const VideoFragment = defineFragment(video_component, (f) => f)
export const WebframeFragment = defineFragment(webframe_component, (f) => f)

// One slide plus all five of its component sets, each z-ordered and nested under a stable alias
// (`texts`/`images`/`shapes`/`videos`/`webframes`). Spread this under a deck's `slides` edge and the
// whole deck → slides → components tree materializes from ONE query.
export const SlideSubtree = defineFragment(slide, (f) =>
  f
    .sub('texts', rels.slideTexts, (t) =>
      t.orderBy('z_order', 'asc').include(TextFragment),
    )
    .sub('images', rels.slideImages, (t) =>
      t.orderBy('z_order', 'asc').include(ImageFragment),
    )
    .sub('shapes', rels.slideShapes, (t) =>
      t.orderBy('z_order', 'asc').include(ShapeFragment),
    )
    .sub('videos', rels.slideVideos, (t) =>
      t.orderBy('z_order', 'asc').include(VideoFragment),
    )
    .sub('webframes', rels.slideWebframes, (t) =>
      t.orderBy('z_order', 'asc').include(WebframeFragment),
    ),
)
