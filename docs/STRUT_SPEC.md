# Strut — Behavior & Data-Model Specification

> A complete, framework-agnostic specification of the Strut presentation editor, reverse-engineered
> from the feature-complete 2012 codebase (`origin/old-master`), cross-checked against the live site
> and the in-progress React/cr-sqlite rewrite (`main`). This document is the source of truth for
> re-implementing Strut on a new stack (target data layer: a normalized SQL schema + named mutators +
> live windowed queries, e.g. [Rindle](https://rindle.sh/)).
>
> **How to read this:** Sections 1–3 define *what Strut is* and *its data model*. Sections 4–10 define
> *behavior* per feature area. Section 11 consolidates interactions/shortcuts. Section 12 is the
> old-vs-new gap analysis. Section 13 gives concrete recommendations for the rewrite.

---

## Table of Contents

1. [Product overview](#1-product-overview)
2. [Core concepts & glossary](#2-core-concepts--glossary)
3. [Data model](#3-data-model)
4. [Application shell, modes & header](#4-application-shell-modes--header)
5. [Slide editor mode (canvas + well)](#5-slide-editor-mode-canvas--well)
6. [Slide components](#6-slide-components)
7. [Overview / transition (3D) editor — the signature feature](#7-overview--transition-3d-editor)
8. [Theming: backgrounds, surfaces, stylesheets, colors](#8-theming)
9. [Generators, preview, export & import](#9-generators-preview-export--import)
10. [Persistence, autosave & sync](#10-persistence-autosave--sync)
11. [Interactions & keyboard shortcuts (consolidated)](#11-interactions--keyboard-shortcuts)
12. [Gap analysis: old-master vs. main rewrite](#12-gap-analysis)
13. [Recommendations for the rewrite](#13-recommendations-for-the-rewrite)

---

## 1. Product overview

**Strut is an HTML5 GUI authoring tool for spatial presentations.** It is a WYSIWYG editor that lets a
user build a deck of slides, place rich content (text, images, shapes, video, web frames) on each
slide, arrange the slides in *3-D space*, and then render the deck into a runnable presentation using a
pluggable presentation engine (primarily **impress.js**, also **Bespoke.js**, **reveal.js**, and a
printable **handouts** mode).

Its distinguishing feature versus ordinary slide tools is the **Overview / transition editor**: slides
are not just an ordered list, they are *objects positioned in a 3-D world* (x, y, z, rotateX/Y/Z, scale).
The "presentation" is a **camera flight** through that world, visiting slides in order. This is the
impress.js model, made visual and editable.

Two editing **modes**:
- **Slide editor mode** — edit the content of one slide at a time (the WYSIWYG canvas).
- **Overview mode** — arrange all slides in space and define the camera path / transitions.

Design tenets (from the live site and code):
- Runs entirely in a web browser; presentations play on desktop, mobile, and tablets.
- Local-first: presentations are stored in the browser and can be exported or hosted/shared.
- Plugin architecture: every feature is a swappable service; missing services degrade gracefully.
- Two-layer visual model: a deck-wide **surface** (the "table") with slide **cards** floating on it.

Supported browsers (2012): Firefox, Chrome, Safari; basic IE10. (The 3-D transitions require a modern
CSS-transform engine.)

---

## 2. Core concepts & glossary

| Term | Meaning |
|---|---|
| **Deck** | One presentation. Owns an ordered collection of slides + deck-wide settings (surface, background, theme, custom CSS, chosen generator/transition, filename). |
| **Slide** | One step in the presentation. Has 3-D spatial state (`x,y,z,rotateX,rotateY,rotateZ,impScale`), an ordered set of components, an optional per-slide background/surface override, and a markdown body. A slide *is itself a spatial object* (it carries its position in the impress world). |
| **Component** | A content element placed on a slide: TextBox, Image, Shape, Video, or WebFrame. Has 2-D transform state within the slide (`x,y,scale,rotate,skewX,skewY`) plus type-specific data. |
| **Surface** | The deck-wide backdrop — the "table" the whole presentation sits on. The bottom visual layer. Deck-wide by default, optional per-slide override. |
| **Background** | The fill of an individual slide *card* (1024×768), drawn on top of the surface. Can be a solid class, a custom color, an image, or transparent (lets the surface show through). |
| **Theme** | The emergent combination of surface + backgrounds + text/font styling + custom CSS. (Old Strut has no single "theme object"; the rewrite introduces a `theme` table.) |
| **Generator / Presenter** | A renderer that turns the deck into a runnable presentation. impress / impressm / reveal / bespoke / handouts. Each declares capabilities that enable/disable editor features. |
| **Transition** | How the camera moves between slides. *Free-form stepping* (impress: per-slide 3-D position) or *canned transitions* (Bespoke presets: cube, coverflow, carousel, …). |
| **Operating table** | The central WYSIWYG editing canvas for the active slide (1024×768 coordinate space, auto-scaled to fit). |
| **Slide well** | The scrollable list/strip of slide thumbnails ("snapshots"). |
| **Snapshot / drawer** | A live, CSS-scaled mini-rendering of a slide (not a raster image) used in the well and overview. |

### Canonical dimensions

- **Slide coordinate space: `1024 × 768`** (`config.slide.size`). All component `x/y/width` are stored
  in these units. The operating table renders at exactly 1024×768 and CSS-scales to fit; the final
  presentation uses the same space, so *what you place is what renders*. (The `main` rewrite uses
  `1280×720` in `config.ts` — a change to note, not necessarily to keep.)
- **Overview grid space: `75 × 50`** (`config.slide.overviewSize`). Slide cards in the overview live in
  this small grid; the impress generator scales it up to 1024×768 on export (×`1024/75`, ×`768/50`).

---

## 3. Data model

This section defines the canonical data model. It is presented as a **normalized relational schema**
(the shape the rewrite should adopt), annotated with the original old-master attribute names/defaults
and the corresponding `main`-branch cr-sqlite columns. Units and defaults are authoritative.

### 3.1 Entity overview

```
deck 1───* slide 1───* component   (component is polymorphic: text | image | shape | video | webframe | line)
  │            │
  │            └── per-slide background/surface override, markdown body, 3-D transition transform
  ├── theme (surface/background palette, fonts, text colors)
  ├── custom_background[]  (user-minted color classes)
  ├── presenter/generator selection + canned transition
  └── filename / version / generation id
```

### 3.2 `deck`

| Field | Type | Default | Meaning |
|---|---|---|---|
| `id` | id | — | deck id |
| `title` / `fileName` | text | `'Untitled'` / `'presentation-unnamed'` | display title & storage key |
| `created`, `modified` | int (epoch ms) | — | timestamps |
| `background` | text (css-class or `img:<url>` or `bg-custom-<hex>`) | `'bg-default'` | deck-wide slide-card background |
| `surface` | text (css-class or `img:<url>`) | `'bg-default'` | the deck-wide "table" |
| `theme_id` | id → theme | — | (rewrite) bundled theme |
| `chosen_presenter` / `generator` | text | `'impress'` | active generator id |
| `cannedTransition` | text | `'none'` | Bespoke transition class name |
| `customStylesheet` | text (CSS) | `''` | user CSS, auto-scoped to `.strut-surface` |
| `deckVersion` | text | `'1.0'` | schema/migration version |
| `__genid` | int | `0`, bumped each save | monotonic generation counter (higher = newer) |

Old-master also carries a `customBackgrounds` sub-model (`{ bgs: [{klass, style}] }`) — model this as a
child table `custom_background(deck_id, klass, style)`.

**Active-slide semantics:** exactly one slide is "active" (loaded in the operating table). Setting a new
active slide deselects the previous one and unselects its components. Selection of slides is a separate
multi-select set. (In old-master these live on the models; the rewrite persists them as `selected_slide`
/ `selected_component` tables so selection is reactive — a reasonable choice, though it could also be
ephemeral.)

### 3.3 `slide`

| Field | Type | Default | Meaning / unit |
|---|---|---|---|
| `id` | id | — | |
| `deck_id` | id → deck | — | |
| `order` | fractional index (text) | — | position within deck. Old-master used an integer `index` maintained on add/remove; the rewrite uses cr-sqlite **fractional indexing** keyed by `deck_id` (insert "after_id"). Prefer fractional. |
| `x`, `y` | float (overview px) | lazily assigned | position in overview grid (see auto-layout below). `setInt` → integer. |
| `z` | float (px) | `0` | depth; **not** rescaled on export |
| `rotateX`, `rotateY`, `rotateZ` | float (**radians**) | `0` | 3-D rotation. Stored radians; shown in degrees in UI; exported in degrees. |
| `impScale` | float (factor) | `3` | impress `data-scale` and card size factor |
| `background` | text | inherit | per-slide background override (`bg-default` → inherit deck; `bg-transparent` → show surface) |
| `surface` | text | inherit | per-slide surface override |
| `markdown` | text | `''` | slide-level markdown body, rendered behind/with components |
| `created`, `modified` | int | — | |

**Default auto-layout** (applied to any slide lacking `x` when the overview/impress renders): on a
nominal 6-column grid, `x = n*280 + 180`, `y = floor(n/6)*280 + 180`. ⚠️ Known quirk: `x` is *not*
wrapped by column count, so default-arranged slides form a diagonal staircase (x marches right by 280
each slide; y steps down every 6). The same formula is used by the editor and the exporter, so they
agree. The rewrite can choose a cleaner default.

**Reordering preserves spatial slots:** when slides are reordered, their *position data*
(`{x,y,z,rotateX/Y/Z,impScale}`) is swapped back so the spatial arrangement stays put while *which slide
occupies each slot* changes — i.e. reordering re-routes the camera path, it does not move the world.
(This is an explicit design behavior to replicate; see `SlideCollection.slidesReorganized`.)

### 3.4 `component` (polymorphic)

All components share a **spatial/transform** base (within the slide's 1024×768 space):

| Field | Type | Default | Meaning |
|---|---|---|---|
| `id` | id | — | |
| `slide_id` | id → slide | — | |
| `type` | enum | — | `TextBox` \| `Image` \| `Shape` \| `Video` \| `WebFrame` (rewrite adds `line`) |
| `x`, `y` | int (px) | `1024/3 ≈ 341`, `768/3 = 256` | CSS left/top within slide |
| `scale` | object `{x, y, width?, height?}` | `{x:1, y:1}` | `x,y` unitless multipliers; `width,height` px for box-sized media |
| `rotate` | float (**radians**) | `0` | rotation; Shift snaps to π/8 (22.5°) |
| `skewX`, `skewY` | float (radians) | `0` | skew |
| `color` | hex (no `#`) | — | text color (TextBox) |
| `customClasses` | text | `''` | extra CSS classes (targetable by custom stylesheet) |
| `z-index` | (runtime only) | — | implicit "last touched wins" via a global counter; **not persisted** in old-master. The rewrite should consider an explicit `z_order` column if it wants stable stacking. |

> Note: old-master has **no opacity, no explicit width/height, no z attribute** on the base component
> (width/height derive from the DOM × `scale`). 3-D rotation (`rotateX/Y/Z`, `z` depth) exists only on
> *slides* (and on the special 3-D-rotatable slide cards in overview), not on components.

**Type-specific data:**

- **TextBox** — `text` (HTML string; uses `<b>/<i>/<font>` tags, *not* inline CSS, because
  `styleWithCSS` is disabled), `size` (font size px, default **72**). Inherits font family/size/color
  from the last-edited text (a global "font state").
- **Image** — `src` is *either* a URL/data-URI string *or* a storage reference `{docKey, attachKey}`
  (binary stored separately; see §10). Derived: `uri` (resolved blob/object URL, transient), `imageType`
  (e.g. `PNG`, `JPEG`, `SVG`). SVG images are box-resized (aspect-locked) rather than CSS-scaled.
- **Shape** — `markup` (inline SVG string), `fill` (hex). The SVG uses `preserveAspectRatio="none"` so
  it stretches to the component box. Selecting a shape pops a floating color picker for `fill` (no
  stroke control). Built-in shapes: **square, triangle, circle, hexagon, pentagon, star, pacman, heart,
  infinity, yin-yang** (glasses exists as an asset but is disabled).
- **Video** — `src`, plus parsed `videoType` (`youtube` | `html5`), `srcType` (mime / `yt`), `shortSrc`
  (YouTube id or matched URL). YouTube renders a player embed; HTML5 renders `<video controls>`.
- **WebFrame** — `src` (iframe URL). Rendered as a 960×768 iframe with a click-catching overlay.
- **Line** (rewrite-only, schema scaffold) — `props` (JSON) + `line_point(line_id, x, y)` vertices.
  Not implemented anywhere; carried for a future drawing feature.

### 3.5 `theme` (rewrite concept; old-master equivalent is the surface+background+CSS combo)

| Field | Type | Meaning |
|---|---|---|
| `id` | id | |
| `name` | text | |
| `bg_colorset`, `fg_colorset` | text | named color-scheme classes |
| `fontset` | text | named font class |
| `surface_color`, `slide_color`, `font_color` | text | explicit color overrides |

Plus `recent_color(color, theme_id, first_used, last_used)` for the color-picker history, and
`presenter(name, available_transitions[json], picked_transition)` for the generator/transition catalog.

### 3.6 Serialization / file format (the `.strut`/JSON shape)

A saved/exported presentation is a single JSON object — the deck deep-serialized (slides → components).
This is also the **import** format (round-trips exactly). Representative shape:

```jsonc
{
  "fileName": "my-talk",
  "deckVersion": "1.0",
  "__genid": 3,
  "background": "bg-default",
  "surface": "bg-default",
  "cannedTransition": "none",
  "customStylesheet": "/* user CSS, scoped to .strut-surface */",
  "customBackgrounds": { "bgs": [ { "klass": "bg-custom-ff0000", "style": "#ff0000" } ] },
  "slides": [
    {
      "type": "slide", "index": 0, "active": true, "selected": true,
      "x": 180, "y": 180, "z": 0, "impScale": 3,
      "rotateX": 0, "rotateY": 0, "rotateZ": 0,
      "background": "bg-transparent", "surface": "bg-default",
      "markdown": "# Title\nspeaker body",
      "components": [
        { "type": "TextBox", "x": 341, "y": 256, "scale": {"x":1,"y":1},
          "rotate": 0, "skewX": 0, "skewY": 0, "size": 72,
          "text": "<font size=\"72\">Hello</font>", "customClasses": "" },
        { "type": "Image", "x": 361, "y": 276,
          "scale": {"x":1,"y":1,"width":200,"height":150},
          "src": {"docKey":"my-talk","attachKey":"logo.png"}, "imageType": "" },
        { "type": "Video", "x": 200, "y": 150, "scale": {"x":1,"y":1},
          "src": "https://www.youtube.com/watch?v=abc123",
          "shortSrc": "abc123", "videoType": "youtube", "srcType": "yt" },
        { "type": "Shape", "x": 500, "y": 300, "scale": {"x":1,"y":1},
          "fill": "3498db", "markup": "<svg ...><rect .../></svg>" },
        { "type": "WebFrame", "x": 100, "y": 400, "scale": {"x":1,"y":1},
          "src": "https://example.com" }
      ]
    }
  ]
}
```

Notes:
- Backbone only serializes attributes that exist, so optional fields (`color`, `customClasses`,
  `skewX/Y`, `markdown`) appear only once set.
- Embedded images store `src` as `{docKey, attachKey}`; the deck JSON never contains image bytes.
- `DeckUpgrade.to1_0` is the only migration: for pre-1.0 decks it stamps `deckVersion='1.0'` and
  **clears** legacy `background`/`surface` on the deck and every slide (destructive reset to defaults).

### 3.7 Undo/redo model

A single bounded (capacity 20) command history is shared app-wide. Commands are
`{ do(), undo(), name }`. `record(cb, name)` batches everything pushed during `cb` into one
`CombinedCommand` (atomic multi-step undo). **Undoable operations:** slide add/remove/move,
component add/remove/move, and each component transform (scale/rotate/skew/text-scale/text-edit).
**Not** undoable: file/save/preference operations. The rewrite's schema reserves
`undo_stack`/`redo_stack(deck_id, order, operation)` for an operation-log approach (currently a stub).

---

## 4. Application shell, modes & header

### 4.1 Plugin / service architecture (context)

The whole UI is assembled at runtime from **services** registered against a `ServiceRegistry`. A static
manifest (`features.js`) initializes each bundle; bundles `register` services under string interfaces
(`strut.EditMode`, `strut.ThemeProvider`, `strut.ComponentButtonProvider`, `strut.LogoMenuItemProvider`,
`strut.presentation_generator`, `strut.StorageProvider`, `strut.StartupTask`, …) with optional metadata
(e.g. `{id:'overview'}`, `{modes:{'slide-editor':true}}`). Consumers query `getBest(...)` or subscribe to
a live `ServiceCollection` that emits `registered`/`deregistered`. Consequence: **the header has no
hard-coded contents** — its mode buttons, component buttons, theme controls, generators, and menu items
are all populated from whatever services exist, and a missing service simply omits its UI (the shell
even guards against "no modes available"). *For the rewrite, this can become plain composition; the key
behavior to preserve is graceful feature presence/absence, not the registry mechanism itself.*

### 4.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (navbar)                                                   │
│  [Logo▾]  [Text][Image][Video][Web][Shapes▾]  [bg▾][surf▾][CSS][Class]   [Slides|Overview]  [▶Present▾] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ACTIVE MODE BODY  (slide-editor OR overview — exactly one)      │
│                                                                   │
│   slide-editor:  [ slide well ][ operating table (1024×768) ]     │
│   overview:      [ 3-D world canvas of slide cards ]              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Header controls (left → right)

- **Logo dropdown** — a menu populated by services: **Undo**, **Redo** (each shows the name of the next
  undo/redo action + a hotkey label), **Cut / Copy / Paste / Delete**, **Save** (opens Save-As modal if
  the deck is unnamed), plus **New / Open / Save As / Import / Export** (storage & exporter bundles).
- **Create-component buttons** — one per component type: **Text**, **Image**, **Video**, **Website**
  (WebFrame), and a **Shapes** dropdown. Text inserts immediately; Image/Video/Website open an import
  modal (URL / browse / drag-drop); Shapes opens a thumbnail dropdown. *This group is hidden in overview
  mode.*
- **Theme controls** — background dropdown, surface dropdown (both with hover-preview), **CSS** button
  (edit deck stylesheet), **Class** button (assign CSS classes to selected component). Theme controls
  are mode-scoped (e.g. the **MDown** markdown toggle appears only in slide-editor mode).
- **Mode buttons** — **Slides** (`icon-th-list`) and **Overview** (`icon-th-large`). Each hides itself
  when active, so the visible button toggles to the *other* mode.
- **Preview / Present** — a green split button. Main half launches a live preview with the chosen
  generator; the dropdown half lists generators (checkmark = current) and persists the choice.

### 4.4 Modes

`EditorModel` owns `modeId` (default `'slide-editor'`) and the live `activeMode` ({view, model, id,
close}). Switching modes closes the prior mode's view and builds the new one. The rewrite mirrors this
with `editor_mode: "slide" | "layout"` ("layout" = overview).

### 4.5 Startup flow

On load: initialize storage, construct the editor model+view, render immediately. Then **restore** in
priority order: (1) crash-recovery exit-save → (2) last-opened presentation by name → (3) a fresh
single-slide deck. (A splash screen was scaffolded but never implemented.) "New presentation" prompts
for a name (default `presentation-<n+1>`), validates it (no empty / `/` / `\` / NUL), and imports an
empty deck with one slide.

---

## 5. Slide editor mode (canvas + well)

### 5.1 Slide well (left thumbnail list)

- Renders one **live snapshot** per slide (a CSS-scaled mini-rendering, ~120×90 in the well — *not* a
  raster; it re-renders on the slide's `contentsChanged`). Video/WebFrame are skipped in thumbnails for
  performance; text/image/shape are drawn. Each snapshot shows a number **badge** and a red **×** remove
  button.
- **Select:** single click → that slide becomes *active* (loads into the operating table). Ctrl/Cmd/Shift
  + click → add to multi-selection without changing the active slide.
- **Reorder:** drag a snapshot vertically (multi-select drags together). On drop, move to the computed
  index (undoable). Reordering swaps spatial slots (see §3.3).
- **Delete:** the × removes the slide (undoable); after removing the active slide, the neighbor becomes
  active.
- **Add slide:** a floating green **+** button *follows the cursor* as it moves over the well (unusual:
  hover-driven, not right-click), tracking the insertion gap; clicking inserts a new blank slide there,
  auto-selected & active. (The rewrite uses a simpler add-slide context button — acceptable.)
- **Clipboard:** cut/copy/paste/delete act on the selected slides when the well is focused; paste clones.

### 5.2 Operating table (central canvas)

- Renders the active slide in a `1024×768` container, then **auto-scales** (`transform: scale`) to fit
  the available area (min height 300px), centered. No manual zoom/pan. This *is* the final presentation's
  coordinate space, so placement is exact.
- Paints the slide **background** (resolved against deck/surface) and the outer element's **surface**
  class; repaints on background/surface changes.
- A `markdownArea` behind the components renders the slide's markdown (via `marked()`); it re-renders on
  `change:markdown`.
- **Marquee select:** drag empty canvas to rubber-band select components; disabled while dragging a
  component. Click empty canvas → deselect all + commit any in-progress text edit.
- Switching the active slide tears down old component views and builds the new slide's.

### 5.3 Markdown editor

- Toggled by the **MDown** header button or the slide context menu (Edit/Preview). Opens a full-canvas
  **CodeMirror** editor (markdown mode, line numbers, Enter continues lists) seeded with the slide's
  `markdown`. Switching to preview / changing slides / launching preview writes the editor value back to
  the slide first.
- Markdown is **per-slide body content** (free-form HTML rendered behind/with the positioned
  components), *not* parsed into components. Default placeholder `"# Markdown!"` saves as empty if
  untouched. The same markdown is rendered in thumbnails and in the exported presentation.
- *(The rewrite replaces CodeMirror with a Lexical rich-text editor that round-trips markdown — a
  per-component text editor rather than a per-slide body. Note this divergence; see §12.)*

### 5.4 Context menus

- **Operating-table right-click:** a **Background** submenu (solid swatches with hover preview + Invisible
  / Reset) and a **Markdown** submenu (Edit / Preview). *No bring-to-front/send-to-back/duplicate*
  (z-order is implicit; duplicate is copy/paste; delete is the component × or Delete key).
- **Well menu:** the floating **+** add-slide button (see §5.1).

---

## 6. Slide components

### 6.1 Inserting

- **Text** inserts immediately at the default position (`341,256`) with collision nudging (+20,+20 if it
  would land within 5px of an existing component). New text inherits the global font state (family/size/
  color of the last edit).
- **Image / Video / Website** open an **import modal**: type a URL (with live preview), **Browse** a local
  file, or **drag-drop** a file. Local files are stored as attachments and referenced by
  `{docKey, attachKey}`; if no storage is available, images upload to imgur and use the returned URL.
- **Shapes** dropdown: pick a thumbnail → inserts a Shape carrying that SVG markup.

### 6.2 Manipulating a selected component (on-canvas handles)

Each selected component shows handles wired to delta-drag controls:

| Handle | Gesture | Effect |
|---|---|---|
| **Move** (body) | drag | move (deltas ÷ canvas scale). **Shift = snap to 20px grid.** Multi-select moves together as one undo entry. |
| **Scale** (corner) | drag | resize. Default locks aspect; **Shift = independent axes.** For TextBox, scale = font size. For SVG/Shape/YouTube, scale resizes the box (see mixers below). |
| **Rotate** | drag around center | rotate (radians). **Shift = snap to 22.5° (π/8).** |
| **Skew X / Skew Y** | drag | `skew = initial + atan2(delta, 22)` rad |
| **Center X / Center Y** | click | center the component on that axis within the slide |
| **Remove (×)** | click | delete (undoable). Empty text boxes self-delete on edit-complete. |
| **X / Y inputs** | type | exact integer position |

- **Z-order is implicit**: clicking/touching a component raises its CSS z-index via a global counter
  ("last touched wins"). Not persisted. No explicit front/back UI.
- **No opacity** control anywhere.
- **"Mixers"** are per-type scale strategies (not animation): raster image / HTML5 video / webframe use
  CSS `scale()`; **SVG image** resizes the box with aspect lock; **Shape** and **YouTube** resize the
  embedded object/box freely.

### 6.3 TextBox rich text (Etch inline toolbar)

- **Double-click** to edit (contenteditable). A floating toolbar appears near the box. (Type-to-edit when
  selected exists but is disabled pending modal-key handling.)
- Toolbar (default set): **Bold, Italic**, **Unordered/Ordered list**, **Justify left/center**, **Link**
  (prompt for URL, forces `http://`), **Font family**, **Font size**, **Color** (Spectrum picker),
  **Clear formatting**. Underline / justify-right / H3 heading exist in the library but aren't in the
  default set.
- **Font families:** a curated set organized by role (defined once in `config.ts` `FONTS`, which also
  derives the Google Fonts `<link>` and the picker `<optgroup>`s): _sans_ — Inter, Lato (default), DM
  Sans, Space Grotesk; _serif_ — Fraunces, Playfair Display, Lora; _display_ — Anton, Archivo Black;
  _mono_ — JetBrains Mono; _playful_ — Fredoka, Press Start 2P.
- **Font sizes:** 144, 96, 72 (default), 64, 48, 36, 24, 16, 12, 8. (Font size sets the model `size`
  attribute directly, not via execCommand.)
- Formatting uses legacy `<b>/<i>/<font>` tags (`styleWithCSS` off) so text serializes as the renderer
  expects. Paste inserts plain text only. Selecting away from / blurring an editing box commits the edit
  (records a Text undo); an empty box is deleted.

### 6.4 Image / Shape / Video / WebFrame specifics

- **Image:** raster set to natural pixel size, CSS-scaled; **SVG** images are box-resized aspect-locked
  (min 50×50). No on-canvas crop. Resolves `{docKey,attachKey}` → object URL on load; revokes on dispose.
- **Shape:** selecting pops a floating Spectrum color picker (top-right of the shape) bound to `fill`;
  SVG stretches (no aspect lock, no stroke control).
- **Video:** YouTube → classic embed player; HTML5 → `<video controls>` with detected mime; box-resize.
- **WebFrame:** 960×768 iframe + click-catching overlay so drags hit the component, not the page.

### 6.5 3-D rotatable component view

A special component view (`transforms = [rotateX, rotateY, rotateZ, scale]`) used for the **slide cards in
overview mode** (slides behave like 3-D-rotatable components). It adds rotateX/Y/Z drag handles
(~0.02 rad/px) and numeric inputs in **degrees** (converted to radians on store), plus `z` (depth) and
`scale`/`impScale` inputs. Components on a slide do **not** get 3-D rotation; only slides do.

---

## 7. Overview / transition (3D) editor

**This is Strut's defining capability.** Entering **Overview** mode shows a bird's-eye "world" — all
slides at once, each as a draggable 3-D card positioned at its `(x,y)` center, depth-offset by `z`,
tilted by `rotateX/Y/Z`, scaled by `impScale`, over the deck surface. The **camera path is the slide
order** (each card shows its 1-based ordinal badge; there is no drawn connector line). The exported
presentation animates the impress camera from card to card in that order.

Which transition editor appears depends on the **active generator's capabilities**:
- impress (`freeformStepping`) → the **free-form 3-D world** editor.
- bespoke (`cannedTransitions`) → the **canned transitions** picker.
These are mutually exclusive.

### 7.1 Free-form 3-D editing

Each card supports:
- **Drag** to set `x,y` (deltas ÷ container scale; **Shift = 20px snap**). The stored x/y is the card
  *center* (CSS `translate(-50%,-50%)`). Group-drag for multi-select. Drop records a "Move Slide
  Transition" undo entry.
- **Rotate handles** rotateX (vertical drag), rotateY (horizontal drag), rotateZ (angular drag), in
  radians; live preview uses CSS `perspective(500px)` + `preserve-3d` so cards visibly tilt.
- **Numeric inputs** for `z` (px), `scale`/`impScale` (factor), and `rotateX/Y/Z` (typed in **degrees**,
  stored radians). These are the fine-positioning controls (the originally-designed "XY stepping" view
  was never built).
- **Selection:** click / Ctrl-Cmd-Shift toggle / rubber-band marquee.

Units summary: `x,y,z` = integer pixels; `rotate*` = radians stored / degrees shown; `impScale` =
unitless (default 3).

### 7.2 Canned transitions (Bespoke only)

A thumbnail grid of presets: **carousel, classic, concave, coverflow, cube, cubeb, cards, none**.
Clicking sets `deck.cannedTransition = <name>`. Strut does **not** compute any arrangement for these —
it just emits the name as a CSS class on the Bespoke container; the Bespoke plugin performs the actual
effect. (So free-form 3-D stepping and canned transitions are mutually exclusive, gated by generator.)

### 7.3 Camera path & reordering

The camera visits slides in `order`. Reordering swaps the spatial slot data between slides (positions are
slot-bound), so changing slide order re-routes the camera through the same world layout. The impress
export also appends a synthetic `#overview` step at the centroid of all slides with `data-scale="9"` — a
zoom-out "see everything" step.

### 7.4 No substeps

There is **no** concept of impress substeps / per-slide build steps / fragment reveals / nested
transitions. Each slide is exactly one impress step.

---

## 8. Theming

### 8.1 Two-layer model

Every slide renders as two stacked layers:
1. **Surface** — the deck-wide outer "table" (`.strut-surface`). Bottom layer.
2. **Background** — the individual slide card (`.slideContainer`, 1024×768) on top of the surface.

Both use the *same* machinery (same provider, same CSS-class vocabulary, same dropdown). The only
difference is which attribute they write (`background` vs `surface`) and which element they target. Each
can be set **deck-wide** ("All Slides") or **per-slide** ("Selected Slide").

### 8.2 Palettes

A single curated hue set — `THEME_HUES` in `editor/types.ts` — is the source of truth for the default
color stack. Each entry carries a stable `key`, a human `name`, the slide-card `card` color, and the
deck `surface` color (a lighter sibling of the same hue). The background/surface token records and the
picker swatch lists all derive from it, so a card and its surface can't drift apart and the picker can
never offer a hue the resolver doesn't know. Because card/surface fill large areas of the screen, the
values are deliberately **muted** (low-chroma) — at full-bleed, fully-saturated hues read as harsh — and
sit as dusty siblings of the vivid text/shape swatches (§8.5), which stay punchy since they're small
accents.

| key | name | card | surface |
| --- | --- | --- | --- |
| `ink` | Ink | `#22222a` | `#2e2e37` |
| `white` | White | `#ffffff` | `#eef0f2` |
| `smoke` | Smoke | `#dadde0` | `#eceef0` |
| `red` | Red | `#b24a45` | `#c67a74` |
| `orange` | Orange | `#c26a3c` | `#d59463` |
| `yellow` | Yellow | `#e5c454` | `#efd688` |
| `green` | Green | `#5a8a52` | `#7ba874` |
| `teal` | Teal | `#3d8a78` | `#64a897` |
| `blue` | Blue | `#4a72a0` | `#7295bd` |
| `indigo` | Indigo | `#5a6bb0` | `#8290c9` |
| `violet` | Violet | `#7862ad` | `#9a86c4` |
| `pink` | Pink | `#b25f7d` | `#c98aa1` |

**Backgrounds** are keyed `bg-<key>` (solid slide-card colors), plus special values: `bg-default`
(white card / "inherit"), `bg-transparent` (show surface through), `img:<url>` (image), `bg-custom-<hex>`
(custom color). **Surfaces** (the table) are keyed `bg-surf-<key>`; they support `bg-default` (a radial
gray gradient), `img:`, and `bg-custom` but **not** transparent (they're the bottom layer). Surfaces ship
flat.

### 8.3 Custom colors & images

- **Custom color:** picking "custom" opens a Spectrum color modal; the chosen hex mints a class
  `bg-custom-<hex>` recorded on the deck's `customBackgrounds`, then assigned like any swatch. A
  `<style id="customBackgrounds">` element emits `.bg-custom-<hex>{background:#<hex>}`. Orphaned custom
  classes are auto-pruned (when >10 unused accumulate, and on import).
- **Custom image:** picking "image" opens the image chooser; the value becomes `img:<url>`. Image
  backgrounds are emitted as generated per-slide CSS rules (not classes).

### 8.4 Stylesheet system

- **CSS editor** (header "CSS" button): a CodeMirror editor for the deck's `customStylesheet`. On save,
  every selector is auto-prefixed with `.strut-surface ` so user CSS is sandboxed to the presentation
  surface (and can't leak into editor chrome); on edit it's un-prefixed back. The live `<style
  id="userStylesheet">` and the deck attribute stay in sync.
- **Class editor** (header "Class" button, enabled when a component is selected): a popover to assign
  arbitrary CSS class names (`customClasses`) to the selected component(s), targetable by the custom CSS.

### 8.5 Color picker

Spectrum-based, with a shared recent-colors palette persisted to `localStorage['strut.colorChooser']`
(dark theme). Used for: custom backgrounds/surfaces, text color, and shape fill. (The rewrite reimplements
this as `ColorPicker2` with Open Color swatches + a chroma-js HSV picker + recents — a fine modern
replacement.)

### 8.6 How theming reaches the output

At generation time the template emits: the user CSS verbatim (already `.strut-surface`-scoped), one rule
per custom color class, generated per-slide image-background rules, the surface class on the outer
wrapper, and per-slide `data-state` + background classes. A resolution helper reconciles deck-vs-slide-vs-
surface precedence (slide value → deck background → `bg-transparent` shows surface → `bg-default` resolves
to surface; equal-to-surface blanks out so the surface shows through).

---

## 9. Generators, preview, export & import

### 9.1 Generators (pluggable renderers)

| id | label | output | capabilities |
|---|---|---|---|
| `impress` | Impress | impress.js: `#impress` of absolutely-positioned 3-D `.step` divs | `freeformStepping` |
| `impressm` | Impress (mobile) | same markup; toggles a mobile display-limiting block | `freeformStepping` |
| `reveal` | Reveal | reveal.js: `.reveal > .slides > section` | `XYstepping`, `cannedTransitions` |
| `bespoke` | Bespoke | bespoke.js: `#main > article > section`, transition class on `#main` | `cannedTransitions` |
| `handouts` | Handouts | printable: each slide at half-scale beside a "Notes:" column | — |

Each generator: `generate(deck) → HTML string`, `getSlideHash(editorModel)`, `capabilities` (which gate
editor features). The chosen generator persists in session metadata.

### 9.2 Impress output mapping (the critical contract)

Per slide → a `.step` div. **Exact attribute mapping** (overview space → slide space):

| Slide property (unit) | impress attribute | transform |
|---|---|---|
| `x` (overview px) | `data-x` | `x × 1024/75` |
| `y` (overview px) | `data-y` | `y × 768/50` |
| `z` (px) | `data-z` | unscaled (emitted only if truthy) |
| `rotateX/Y/Z` (rad) | `data-rotate-x/-y/-z` | degrees = `rad×180/π` (only if truthy) |
| `impScale` (factor) | `data-scale` | as-is (only if truthy) |
| `order/index` | `data-state="strut-slide-<i>"` | step state / camera order |

Skeleton:

```html
<style>{{customStylesheet}}</style>
<style>/* .bg-custom-<hex>{background:#<hex>} per custom color */</style>
<!-- per-slide image-background <style> rules -->
<div class="bg <surface-class> strut-surface"><div class="bg innerBg">
  <div id="impress">
    <div class="step" data-state="strut-slide-0<surface-suffix>"
         data-x=".." data-y=".." [data-z data-rotate-x/y/z data-scale]>
      <div class="<bg-class> slideContainer strut-slide-0" style="width:1024px;height:768px;">
        <div class="themedArea"><!-- marked(markdown) --></div>
        <!-- each component: .componentContainer > .transformContainer > body -->
      </div>
    </div>
    <!-- ... more steps ... -->
    <div id="overview" class="step" data-state="strut-slide-overview"
         data-x="<centroid>" data-y="<centroid>" data-scale="9"></div>
  </div>
  <div class="hint">Use a spacebar or arrow keys to navigate</div>
</div></div>
```

**Component markup** (within a step): outer `.componentContainer` carries `top/left` (= y/x px),
`transform: rotate(<rad>rad) skewX(<rad>rad) skewY(<rad>rad)`, and optional explicit `width/height`;
inner `.transformContainer` carries `transform: scale(scale.x, scale.y)` (origin 0 0). Bodies:
- TextBox → `<div style="font-size:<size>px" class="antialias">{{text}}</div>`
- Image → `<img src="<uri>">` (raster) or an SVG container with `<img width/height 100%>` for SVG
- Shape → the SVG `markup` with injected `fill`
- Video → `<video controls><source src type></video>` or a YouTube embed
- WebFrame → `<iframe width=960 height=768 src>`

### 9.3 Preview / present

Launching preview: close any prior preview window → `generate(deck)` → stash the HTML string and a
`{surface}` config in `localStorage` (`preview-string` / `preview-config`) → open
`preview_export/<generator>.html#<slideHash>` in a new window. The static host page reads the localStorage
string, injects it as the body, loads the engine (impress/bespoke/…), and inits. (Impress hash:
`#/step-<activeIndex+1>`.) The same host pages back exported standalone presentations.

### 9.4 Export

- **JSON / `.strut`:** `exportPresentation()` bumps `__genid` and deep-serializes the deck (§3.6).
  Delivered via a download link (or Flash Downloadify / textarea fallback). This is the canonical,
  round-trippable file format.
- **ZIP (standalone):** an Archiver (JSZip) intended to produce a double-clickable folder
  (`index.html` = `<html>` + impress render, `preview_export/{images,scripts/impress.js,css/main.css}`),
  re-encoding raster images to bundled files and rewriting their `src`. **In the shipped build this is
  disabled** — users are instead told to **Present + browser "Save Page As."** (node-webkit & remote zip
  variants are stubs.)

### 9.5 Import

An **Import** menu item opens a file picker; importers form a chain-of-responsibility. The **JSON
importer** parses a `.strut`/JSON file and calls `importPresentation`, which runs the `to1_0` upgrade,
restores deck attributes + custom backgrounds, resets the slides (rehydrating components via a factory,
normalizing legacy `ImageModel`→`Image`), and prunes unused custom colors. Import is the exact inverse of
JSON export.

---

## 10. Persistence, autosave & sync

### 10.1 old-master storage model

- **Provider abstraction** (`StorageInterface` over pluggable `StorageProvider`s): `ls / getContents /
  setContents / rm` + attachment ops (`setAttachment / getAttachmentURL / …`). Providers:
  **LargeLocalStorage** ("Local", default — IndexedDB/FileSystem/WebSQL/localStorage backends, 75 MB,
  supports attachments), **localStorage** ("Local Storage", legacy, ~5 MB, no attachments, being
  migrated away), **remoteStorage** (unhosted protocol, partial), **Dropbox** (stub).
- **A presentation = one JSON document (the deck) + N binary attachments** keyed `(fileName, imageName)`.
  Image bytes never live in the deck JSON; the deck stores `{docKey, attachKey}` references. (The
  "Archiver" concept is realized via attachments, not a zip.)
- **Identity = `deck.fileName`** (flat key, no path separators). Exactly one presentation is "current."
- **Save/Open modal:** tabs = providers; body = a file browser (filename input + list of saved names,
  no thumbnails); Ok runs save/open. Open auto-saves the current deck first.
- **Autosave:** a **TimedSaver** writes every **20s** unconditionally (no dirty tracking, gated only on
  storage-ready), and an **ExitSaver** writes a synchronous crash-recovery copy to
  `localStorage['strut-exitsave']` on page unload. Session metadata (`lastPresentation`, `lastProvider`,
  `num`, `fontState`, `generator_index`) persists to `localStorage['Strut_sessionMeta']`.

### 10.2 main-rewrite storage/sync model (the direction)

- **cr-sqlite (CRDT) local-first.** Each deck is its **own local SQLite (WASM) database**; a separate
  **meta DB** (`deck_map`) catalogs them (title, dbid, last_modified, is_dirty). Offline works by default.
- **Sync:** a Web Worker runs the cr-sqlite ws-client; one **sync room per deck DB** over a WebSocket
  endpoint; an Express + ws-server persists DBs server-side. Collaborative editing converges via CRRs.
- **Selection and undo/redo are persisted in the DB** in the rewrite (reactive selection), though they
  could be ephemeral.

> For the new stack: this maps directly onto a normalized SQL schema + a sync daemon + optimistic local
> mutations — the Rindle three-tier shape. Keep the per-deck-database + meta-catalog split (or the
> equivalent row-scoped sync) and the local-first/offline default.

---

## 11. Interactions & keyboard shortcuts

| Action | Shortcut (Win/Linux · Mac) | Scope |
|---|---|---|
| Cut | `Ctrl+X` · `⌘X` | focused panel (well = slides, canvas = components) |
| Copy | `Ctrl+C` · `⌘C` | focused panel |
| Paste (clones) | `Ctrl+V` · `⌘V` | focused panel |
| Delete | `Del` · `⌘⌫` | focused panel |
| Undo | `Ctrl+Z` · `⌘Z` | global editor history |
| Redo | `Ctrl+Y` · `⌘Y` | global editor history |
| (rewrite) Command palette | `Ctrl/⌘+P` | global |

Gesture modifiers (context-dependent **Shift**): move = snap to 20px grid; rotate = snap to 22.5°; scale =
unlock aspect ratio. No save/arrow-key shortcuts in old-master (save is menu-only; navigation lives in the
preview engine). On `window.blur`, pressed-key state is cleared to avoid stuck modifiers.

Interaction verbs:
- Well snapshot: click = make active; Ctrl/Cmd/Shift+click = multi-select; vertical drag = reorder; × =
  delete; hover = move the floating + insertion button.
- Canvas: drag empty = marquee; click empty = deselect + commit text edit; component mousedown = select +
  raise z; component drag = move; handles = scale/rotate/skew/center; × = delete; double-click text =
  edit.
- Overview card: drag = position x/y; rotate handles = rotateX/Y/Z; numeric inputs = z/scale/rotate.

---

## 12. Gap analysis

### 12.1 `old-master` — feature-complete reference (✅ implemented)

Decks/slides/components CRUD; full WYSIWYG canvas with move/scale/rotate/skew/center & multi-select;
rich-text (Etch) with fonts/sizes/color/lists/links/align; images (URL/file/drag-drop, imgur fallback,
SVG box-resize); shapes (10 SVGs + fill picker); video (YouTube/HTML5); web frames; per-slide markdown
(CodeMirror); **3-D overview editor** (free-form positioning + canned Bespoke transitions); themes
(surfaces/backgrounds/custom colors/images/custom CSS/class editor); **generators** (impress / impressm /
reveal / bespoke / handouts) + live preview; **JSON export/import** (round-trip); undo/redo; local + (partial)
remote storage with attachments; 20s autosave + exit-save crash recovery; i18n locales.

Weak/stubbed in old-master: ZIP export (disabled → "Save Page As"), Dropbox (stub), remoteStorage
(partial, no attachments), splash screen (skeleton), no per-component opacity / z-order UI / stroke / crop.

### 12.2 `main` — React/cr-sqlite rewrite (visual reference only)

✅ **Working:** multi-deck dashboard (open/create), per-deck local DB + WebSocket sync (local-first/
offline/collab foundation), slide CRUD + drag-reorder (fractional index), **Lexical** rich-text per
component (markdown round-trip, draggable, throttled persistence), image embeds (URL modal + draggable
canvas), live markdown thumbnails, header with undo/redo buttons + add-text/add-image + color/font
pickers with live hover-preview + recent colors, marquee multi-select + Delete, modern color picker
(`ColorPicker2`), font selector, command-palette shell, toasts.

❌ **Missing / broken / stubbed** (the gap to close):
1. **Present / playback mode — entirely missing** (no `/present`, no impress/bespoke integration,
   `launchPresentation` empty). *You can author but not present.*
2. **Layout / 3-D overview editor — non-functional** (schema has slide `x/y/z`; layout view renders tiles
   + rotation inputs but nothing writes positions; drag only logs). **The signature feature is absent.**
3. **Drawing / shapes — scaffolding only** (shape/line/point tables + toolbar exist; no create/render;
   Excalidraw remnants commented out).
4. **Transitions editor — stubbed** (`decodeTransitions`→`[]`; `setTransitionType` targets a wrong
   column; only a hardcoded transition seeded).
5. **Export — missing** (no JSON/ZIP/PDF/HTML; `renderToSVG` commented out).
6. **Generators / import — missing.**
7. **Undo/redo — UI + stacks exist but operation log unimplemented.**
8. **Text formatting toolbars — inert stubs** (Lexical content works; bold/italic/heading/align/color
   menus are empty and unmounted).
9. **Theming visually inert** — pickers write DB + preview state but `fns.get*` return `undefined`, so
   the canvas isn't restyled; `setAllTextColor`/`setAllFont` mutations broken/empty.
10. **Latent schema/code mismatches** in mutations (`presenter.transition_type` vs `picked_transition`;
    `theme.text_color` vs `font_color`; a non-existent `markdown` table; invalid `ON CONFLICT` syntax).
11. Property panel fully commented out; image cropper present as legacy `.jsx`, unwired; sync endpoint
    hardcoded to localhost; `Resizable` (8-handle) implemented but not wired to components.

**Bottom line:** the rewrite has a solid local-first/sync foundation and a working *slide authoring loop*,
but is missing essentially everything that makes Strut a *presentation* tool: present mode, the impress
3-D layout editor, transitions, drawing/shapes, theming application, and export.

---

## 13. Recommendations for the rewrite

Framed for a normalized-SQL + named-mutators + live-windowed-queries stack (Rindle-shaped), but
framework-agnostic.

### 13.1 Data model (source of truth = SQL tables)

- Tables: `deck`, `slide`, and **per-type component tables** (`text_component`, `image_component`,
  `shape_component`, `video_component`, `webframe_component`, optionally `line_component`+`line_point`)
  — each component table shares the spatial base columns (`x,y,scale_x,scale_y,scale_w,scale_h,rotate,
  skew_x,skew_y,custom_classes`) plus its type-specific columns. Plus `theme`, `custom_background`,
  `recent_color`, `presenter`. (A single polymorphic `component(type, props json)` table is the
  alternative — simpler joins, weaker typing; the original used polymorphic, the rewrite split per type.
  Recommend per-type tables to get typed live queries.)
- Keep **slide `order` as a fractional index** keyed by `deck_id` (the rewrite already does this) and
  preserve the **slot-bound spatial reorder** behavior (§3.3) — reordering re-routes the camera, not the
  world.
- Store **rotations in radians, scales as factors**; convert to degrees only at the UI edge and to
  `data-*` degrees at export. Don't rescale `z` on export.
- Decide **z-order**: add an explicit per-slide `z_order` integer (the old "last touched wins" is
  non-deterministic across sessions). 
- Decide selection & undo: selection can be ephemeral or a small reactive table; for undo, prefer a real
  operation log (the rewrite's `undo_stack`/`redo_stack` idea) over the old in-memory command list, since
  collaborative + persistent undo needs it.

### 13.2 Live queries (windowed)

- Slide well = a windowed live query over `slide WHERE deck_id ORDER BY order` (with a live
  per-slide component count if you want badges).
- Operating table = live queries for the active slide + its components (one per type, unioned).
- Overview = the same slide set with spatial columns; selection-driven.
- Header undo/redo enablement, recent colors, theme — each a small live query.

### 13.3 Mutators (named, deterministic)

One mutator per editing operation, mirroring the old command set: `addSlide(after)`, `removeSlide`,
`reorderSlide(after)`, `addComponent(type, …)`, `removeComponent`, `moveComponent(x,y)`,
`transformComponent(scale/rotate/skew)`, `setText`, `setSlideTransform(x,y,z,rotate*,impScale)`,
`setBackground/Surface(scope, value)`, `mintCustomColor`, `setCannedTransition`, `setGenerator`. Pass ids
and timestamps as args (no `Date.now()`/random inside mutators). High-frequency drags (move/rotate/scale)
should fold to the last value.

### 13.4 Behavior parity checklist (port priority)

1. **Restore the 3-D overview editor** (free-form positioning + camera-path ordering) — the differentiator.
2. **Restore present mode** — wire impress.js (and/or a modern equivalent) reading slide `data-*` from the
   exact mapping in §9.2.
3. **Export** — at minimum the JSON round-trip (§3.6) and a standalone-HTML impress export.
4. **Theming application** — make surface/background/custom-color/custom-CSS actually restyle the canvas
   and the output (the pickers already exist; the `fns.get*` need to return real styles).
5. **Component coverage** — shapes (SVG library + fill), video (YouTube/HTML5), web frames; the rewrite
   only does text + image today.
6. **Text formatting toolbar** — wire the Lexical mark/heading/align/color menus.
7. **Undo/redo** — implement the operation log.
8. Fix the latent schema/column mismatches (§12.2 #10) before building on them.

### 13.5 Things to consciously decide (divergences to resolve)

- **Slide size:** old `1024×768` vs rewrite `1280×720`. Pick one (16:9 `1280×720` is the modern default).
- **Markdown:** old = per-slide body (CodeMirror) behind components; rewrite = per-component Lexical text.
  These are different mental models — decide whether a slide has a markdown "body" plus components, or is
  purely a set of components (recommend the latter for consistency; keep markdown shortcuts inside the
  text component).
- **Generators:** old supported impress/reveal/bespoke/handouts. Decide how many to keep (impress is core;
  bespoke/reveal/handouts are nice-to-have).
- **Storage:** keep the per-deck-DB + meta-catalog split and local-first/offline default.

---

*End of specification. Source: reverse-engineered from `origin/old-master` (feature-complete 2012 build)
and `main` (React/cr-sqlite rewrite), cross-checked with strut.io. Every property name, default, unit,
and the impress `data-*` mapping in this document were read from source, not inferred.*
