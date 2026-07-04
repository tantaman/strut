# Markdown Slides + Unified Theme — Implementation Plan

Status: **proposed** (not yet implemented). Addendum to [`STRUT_SPEC.md`](./STRUT_SPEC.md).

## Goal

Let a slide be authored as **markdown** instead of positioned components. A slide is *either*
spatial-component mode *or* markdown mode; the deck carries a default so the whole presentation can be
markdown, and new slides inherit it. A single, unified **theme** (fonts / color / alignment) drives
rendering for both modes.

## How this relates to the spec

The 2012 build had a markdown mode and `STRUT_SPEC.md` preserves it — `slide.markdown` (§3), the
**MDown** toggle (§4), the `markdownArea` rendered via `marked()` (§5.2), a CodeMirror editor (§5.3),
and a planned `theme` table (§3.5). None of it is implemented yet: the `slide` table
(`migrations/0001_init.sql`) has no `markdown` column, there is no theme table, and today's "theme" is
just `deck.background` / `deck.surface` / `deck.custom_stylesheet` plus a **per-text-box**
`font_family`.

This plan **diverges from the spec in one deliberate way**: the spec frames markdown as an *underlay*
that coexists behind positioned components; here it is a per-slide **mode** (either/or). The mode
framing is cleaner to author and to theme.

## Load-bearing decisions

- **Theme lives as `deck` columns, not a separate `theme` table.** A deck has exactly one theme and
  columns are additive/simpler. Revisit a `theme` table only if named, reusable cross-deck themes are
  wanted (spec §3.5).
- **Markdown is a per-slide *mode*** (`slide.render_mode`), with a deck-level default
  (`deck.default_slide_mode`).
- **Mode switching is non-destructive** — flipping a spatial slide to markdown hides but preserves its
  components (they stay in the DB, just not rendered).

## Sequencing

Phase 1 → 2 ship together as "unified theme" (valuable even before markdown exists). Then 3–4 as
"markdown slides." Then 5 (export/tests).

---

## Phase 1 — Data model + mutators (no UI)

**`migrations/0004_markdown_theme.sql`** — additive only, one statement per `;`, full-line comments
only (applier quirk, see 0002/0003 headers):

```sql
ALTER TABLE slide ADD COLUMN markdown TEXT;
ALTER TABLE slide ADD COLUMN render_mode TEXT;   -- '' = spatial | 'markdown'
ALTER TABLE slide ADD COLUMN text_align TEXT;     -- per-slide override; '' = inherit deck
ALTER TABLE deck  ADD COLUMN default_slide_mode TEXT;
ALTER TABLE deck  ADD COLUMN heading_font TEXT;
ALTER TABLE deck  ADD COLUMN body_font TEXT;
ALTER TABLE deck  ADD COLUMN text_color TEXT;
ALTER TABLE deck  ADD COLUMN text_align TEXT;
```

`rindle up --watch` regenerates `shared/schema.ts` automatically.

**`shared/app-def.ts`**

- Extend `SetDeckThemeArgs` with `heading_font?`, `body_font?`, `text_color?`, `text_align?`,
  `default_slide_mode?`; add matching `if (a.x !== undefined) row.x = a.x` lines to the `setDeckTheme`
  mutator.
- Extend `SetSlideThemeArgs` with `text_align?`; handle in `setSlideTheme`.
- Extend `AddSlideArgs` with `render_mode?: string`; in `addSlide` insert
  `markdown: '', render_mode: a.render_mode ?? ''`.
- New mutators: `setSlideMarkdown({ id, markdown, now })` and `setSlideMode({ id, render_mode, now })`
  → `tx.update('slide', …)`.

**`server/rindle-api.ts`** — mirror the new/changed mutators on the authoritative server twin (README:
it mirrors the predicted client mutators in `shared/app-def.ts`).

**`shared/fragments.ts`** — confirm `SlideFragment` projects the new slide scalars. It currently
declares no explicit `.select` on the slide's own columns (only `.sub` edges), so the new columns
should flow through; if masking is on, add `markdown`, `render_mode`, `text_align`.

---

## Phase 2 — Theme model + unified picker (ships on its own)

**`src/editor/types.ts`** — add a resolver next to `resolveBackground`:

```ts
export interface ResolvedTheme { headingFont: string; bodyFont: string; textColor: string; textAlign: string }
export function resolveTheme(deck, slide?): ResolvedTheme  // slide.text_align wins, else deck, else default
```

Defaults: heading/body = `DEFAULT_FONT` (`config.ts`), color `#111111`, align `left`.

**`src/editor/Header.tsx`** — today's "theme controls" are only the `bg`/`surface` menus (`setBg`). Add
a **Theme** panel that also drives heading font + body font (from `FONT_FAMILIES`), text color (reuse
`COLOR_SWATCHES`), alignment (left/center), and the deck-wide markdown default toggle — all via
`setDeckTheme`. This is the single picker that makes sense across both modes.

**Spatial mode consumes the theme as defaults**: in `addText` (`Header.tsx`), seed `font_family` from
`deck.heading_font ?? DEFAULT_FONT` and `color` from `deck.text_color`. A box can still override via
the existing `RichTextToolbar` / `Inspector`.

**`src/strut.css`** — a `.strut-md` scope reading CSS vars (`--strut-heading-font`,
`--strut-body-font`, `--strut-text-color`, `--strut-text-align`) applied to
`h1/h2/h3/p/li/code/blockquote`.

---

## Phase 3 — Markdown render path (read-only surfaces)

- **Deps**: `marked` (spec §5.2) + `dompurify`. Output flows through `dangerouslySetInnerHTML` (same as
  the existing `TextBody` / `MarkupBody` in `render.tsx`), so sanitize.
- **`src/editor/render.tsx`** (or new `md.tsx`): `renderMarkdown(md, theme)` → sanitized HTML in a
  `.strut-md` container with theme vars set inline.
- **`src/editor/Stage.tsx`** (`Stage`): branch — if `slideData.render_mode === 'markdown'`, render the
  full-slide markdown surface in place of the component canvas.
- **`src/editor/SlideView.tsx`** (`SlideFrame`): same branch, so thumbnails (`SlideWell`), overview
  cards (`Overview`), presenter, and share all render markdown from this one component.

---

## Phase 4 — Markdown editing + mode toggle + add-slide default

- **Editor**: a split/overlay `<textarea>` seeded from `slide.markdown`, writing via `setSlideMarkdown`
  (debounced; one undo step per edit session via the existing `history` provider). CodeMirror (spec
  §5.3) is a later upgrade and must not gate v1.
- **Mode toggle**: a **MDown** button, mode-scoped to the slide editor (`editor.mode === 'slide'`,
  matching the `canInsert` gate in `Header.tsx`), calling `setSlideMode`. Non-destructive.
- **Add-slide inherits deck default**: pass `render_mode: deck.default_slide_mode` at all three
  creation sites — `SlideWell.tsx` (`addSlideAt` and the empty-deck add), `src/routes/index.tsx`, and
  `deckIO.ts` (import).

---

## Phase 5 — Export / serialize / import + tests

- **`src/editor/serialize.ts`**: add `markdown`, `render_mode`, `text_align` to slide export and the
  deck theme fields to deck export; parse them back in `fromJSON`.
- **`src/editor/impressExport.ts`**: for a markdown slide, emit `marked(slide.markdown)` inside the
  `.step` instead of components; inject the `.strut-md` theme CSS + vars into the `<style>` block.
  Theme fonts come from `FONT_FAMILIES`, already loaded by `__root.tsx` — no new font wiring.
- **Tests** (`pnpm test`): serialize round-trip with markdown + theme; `resolveTheme` precedence
  (slide override → deck → default); markdown sanitization.

---

## Open questions

- Should the markdown editor be inline-on-slide or a side panel? (v1: side/overlay textarea.)
- Do we want per-slide font overrides in markdown mode, or is alignment the only per-slide theme axis?
- Named/reusable themes (the spec's `theme` table) — deferred; deck columns for now.
