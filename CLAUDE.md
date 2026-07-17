# Strut — orientation

Strut is an **elegant editor for surfing AI-generated decks.** You build a deck of slides,
place rich content on each, arrange them in 3-D space, and play the deck as a camera flight
through that world. The point of the product is to let a person _surf_ what AI can make — go
from an idea to a living, spatial presentation with almost nothing in the way.

Read this before designing or building anything here. It is the bar the work is held to.
The README covers stack/architecture/setup; `docs/STRUT_SPEC.md` is the deep spec. This file
is the **why**.

## North star

**Frictionless. Minimal. Elegant.** In that order, every time.

The user is here to _surf_ — to move fast across possibilities and be delighted by what shows
up. Every screen, control, and prompt is measured against: does this get out of the way? If a
feature adds a step, a mode, a dialog, or a decision the user didn't ask for, it is suspect
until proven essential.

When two designs are equally capable, ship the one with less chrome, fewer clicks, and less to
explain. **Removing a control is usually the better feature.**

## Principles (how "frictionless & minimal" cashes out)

- **Chrome-free by default.** A deck opens straight into the content — no header, no toolbars,
  no panels competing for attention. Editing affordances appear _when reached for_, not up
  front. Progressive disclosure over persistent UI. (See the doc-first / surf direction.)
- **One ambient AI surface, not buttons everywhere.** AI is a conversation and a few in-place
  ✨ affordances, not a wall of features. The user describes; Strut acts. Prefer a single
  chat/edit lane over scattering AI entry points across the UI.
- **AI edits are trustable and reversible.** Every AI mutation applies as _one undo_. The user
  should always feel safe saying yes, because saying no is a single ⌘Z.
- **No signup wall.** Guest-first: a visitor can create and edit immediately (anon session,
  promote to an account later). Never gate the core experience behind auth.
- **A small taste of good beats unlimited slop.** Free/default AI uses the best small model we
  can afford, not the cheapest possible. Quality of the first impression matters more than
  quota size.
- **Keyboard-first, direct manipulation.** Slash menus and shortcuts over toolbars; drag and
  place over dialogs. Formatting is markdown you type, not a ribbon you hunt through.
- **Phones home to no one.** Analytics and any hosted/commercial features are opt-in and
  off in every clone. A fork is fully functional, private, and self-hostable with no strings.
- **Elegant means finished.** Motion is smooth, empty states are considered, defaults are
  good, nothing flickers. "Works" is not the bar; "feels effortless" is.

## Working here

- Match the minimalism of the existing UI. New UI should feel like it was always there —
  quiet, spatial, out of the way. When in doubt, show less.
- Before adding a control/mode/setting, ask whether a good default or an AI action removes the
  need for it. Prefer that.
- AI features live in `src/editor/ai*.ts` (client) and `server/*.ts` (authoritative). New AI
  actions should follow the established shape: describe → propose → apply-as-one-undo, with a
  server-side quota/entitlement check. See the `AI_*_PLAN.md` docs for the patterns.
- Keep this file honest. If the product's orientation shifts, update this — it is the first
  thing an agent reads.

## Map

- `README.md` — stack, architecture, local setup, deploy.
- `docs/STRUT_SPEC.md` — the full product/technical spec.
- `RINDLE_NOTES.md` — the data layer (migrations → schema → optimistic store + live queries).
- `AI_ARRANGE_PLAN.md`, `AI_CHAT_PLAN.md`, `AI_CHAT_TOOLS_PLAN.md`, `OPENROUTER_PLAN.md` —
  how the AI surfaces are designed.
- `src/editor/` — the editor (views, AI lanes, components). `shared/` — schema, queries,
  mutators shared by client + server. `server/` — API routes, AI backends, auth, storage.
