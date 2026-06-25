// Composable Rindle FRAGMENTS — reusable, co-located, PROJECTED selections over a table
// (rindle.sh/docs/fragments). The relay design: a root query spreads these, and each leaf component
// reads its own fragment with `useFragment` (a pure, typed, masked read — no extra subscription).
//
// `.select(...)` does two things: (1) MASKING — `useFragment(TextFragment, ref)` types the node to
// exactly these columns, so a component can't read a column it didn't declare; (2) FOOTPRINT — only
// these columns sync, trimming the wire payload for the high-volume component rows.
//
// The five component tables share a spatial base (position/scale/rotate/skew/z + custom_classes) and
// add their own type fields. The slide fragment nests all five, z-ordered, under stable aliases — so
// `deck → slides → components` materializes from ONE query (one Ast, one materialization, one /query).

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

// The spatial columns every component leaf selects, plus its own type fields.
export const TextFragment = defineFragment(text_component, (f) =>
  f.select(
    'id',
    'slide_id',
    'z_order',
    'x',
    'y',
    'scale_x',
    'scale_y',
    'scale_w',
    'scale_h',
    'rotate',
    'skew_x',
    'skew_y',
    'custom_classes',
    'text',
    'size',
    'color',
    'font_family',
  ),
)

export const ImageFragment = defineFragment(image_component, (f) =>
  f.select(
    'id',
    'slide_id',
    'z_order',
    'x',
    'y',
    'scale_x',
    'scale_y',
    'scale_w',
    'scale_h',
    'rotate',
    'skew_x',
    'skew_y',
    'custom_classes',
    'src',
    'image_type',
  ),
)

export const ShapeFragment = defineFragment(shape_component, (f) =>
  f.select(
    'id',
    'slide_id',
    'z_order',
    'x',
    'y',
    'scale_x',
    'scale_y',
    'scale_w',
    'scale_h',
    'rotate',
    'skew_x',
    'skew_y',
    'custom_classes',
    'shape',
    'markup',
    'fill',
  ),
)

export const VideoFragment = defineFragment(video_component, (f) =>
  f.select(
    'id',
    'slide_id',
    'z_order',
    'x',
    'y',
    'scale_x',
    'scale_y',
    'scale_w',
    'scale_h',
    'rotate',
    'skew_x',
    'skew_y',
    'custom_classes',
    'src',
    'video_type',
    'src_type',
    'short_src',
  ),
)

export const WebframeFragment = defineFragment(webframe_component, (f) =>
  f.select(
    'id',
    'slide_id',
    'z_order',
    'x',
    'y',
    'scale_x',
    'scale_y',
    'scale_w',
    'scale_h',
    'rotate',
    'skew_x',
    'skew_y',
    'custom_classes',
    'src',
  ),
)

// One slide + all five of its component sets, each z-ordered under a stable alias. Spread into a deck
// query's `slides` edge and the whole subtree materializes from one query. (The slide row itself is
// left unprojected — it's a single small row per slide; projection pays off on the component rows.)
export const SlideFragment = defineFragment(slide, (f) =>
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
