// Composable Rindle FRAGMENTS — reusable, co-located, PROJECTED selections over a table
// (rindle.sh/docs/fragments). The relay design: a root query spreads these, and each leaf component
// reads its own fragment with `useFragment` (a pure, typed, masked read — no extra subscription).
//
// `.select(...)` does two things: (1) MASKING — `useFragment(ComponentFragment, ref)` types the node
// to exactly these columns, so a reader can't touch a column it didn't declare; (2) FOOTPRINT — only
// these columns sync, trimming the wire payload for the high-volume component rows.
//
// Every on-slide object is one row of the polymorphic `component` table (shared spatial base + `type`
// + `fill` + a `props` JSON blob). The slide fragment nests them under a single z-ordered `components`
// alias — so `deck → slides → components` materializes from ONE query (one Ast, one materialization,
// one /query), and z-order across mixed types is a plain ORDER BY (no JS merge of five arrays).

import { defineFragment } from '@rindle/client'
import { component, rels, slide } from './app-def.ts'

// One leaf fragment for every component. `props` is a typed json<ComponentProps>() object (refined in
// app-def). Selecting explicitly keeps the sync footprint tight for these high-volume rows.
export const ComponentFragment = defineFragment(component, (f) =>
  f.select(
    'id',
    'slide_id',
    'type',
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
    'fill',
    'props',
  ),
)

// One slide + its components, z-ordered under a single alias. The component edges use fragment refs, so
// React readers can subscribe at the individual component boundary while the root deck query still
// syncs the whole subtree.
export const SlideFragment = defineFragment(slide, (f) =>
  f.sub('components', rels.slideComponents, ComponentFragment, (t) =>
    t.orderBy('z_order', 'asc'),
  ),
)
