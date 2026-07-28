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
import { component, deck, rels, slide } from './app-def.ts'

// Canonical deck fields. The retired physical `default_slide_mode` column stays out of every synced
// deck surface while additive migrations leave it in the underlying table.
export const DeckFragment = defineFragment(deck, (f) =>
  f.select(
    'id',
    'title',
    'created',
    'modified',
    'background',
    'surface',
    'chosen_presenter',
    'canned_transition',
    'custom_stylesheet',
    'deck_version',
    'owner_id',
    'visibility',
    'share_token',
    'heading_font',
    'heading_color',
    'body_font',
    'body_color',
    'text_align',
    'source_deck_id',
    'variant_label',
    'variant_prompt',
    'cid',
    'pid',
  ),
)

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
    'content',
    'props',
  ),
)

// One canonical slide + its components, z-ordered under a single alias. The legacy markdown/doc/cell/
// layout columns remain physically present but are not part of the runtime query footprint.
export const SlideFragment = defineFragment(slide, (f) =>
  f
    .select(
      'id',
      'deck_id',
      'sort',
      'x',
      'y',
      'z',
      'rotate_x',
      'rotate_y',
      'rotate_z',
      'imp_scale',
      'background',
      'surface',
      'created',
      'modified',
      'text_align',
      'body_component_id',
    )
    .sub('components', rels.slideComponents, ComponentFragment, (t) =>
      t.orderBy('z_order', 'asc'),
    ),
)
