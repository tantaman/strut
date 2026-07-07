# AI Chat Tools — "let the advisor actually change the deck" — Implementation Plan

Status: **Proposed.** Realizes the Phase-2 hook the chat feature already scaffolds — *"`ChatTurn` is
deliberately kept open for Phase 2 (actionable chat): a turn may later carry an optional structured
`action` the user confirms → routed to the existing applyPlan/applyGenerated"* (`shared/chat.ts:13-15`)
— and the advisor's own promise *"You can SUGGEST changes but you cannot edit the deck yourself"*
(`server/chat.ts:31`), which this plan lifts. Assumes the **OpenRouter model seam has landed**
(`server/llm.ts`, commit `d1b5193e`); it is the load-bearing dependency (see keystone).

## Goal

Turn "✨ Chat" from an **advisor** (streamed prose, read-only) into an **operator**: the user asks in
natural language — *"make the background darker", "add three slides on pricing", "arrange these
chronologically", "tighten the intro slide"* — and the model drives the same mutations a human does, as
**one undoable step**, gated + synced for free. Five capabilities in v1:

| Ask | Applies via | Reuse |
|---|---|---|
| Change theme **colors** | `setDeckTheme` | new thin `applyThemePatch` (+ fixes an undo gap) |
| Change theme **fonts** | `setDeckTheme` | same |
| **Generate** a slide | `addSlide` + `setSlideDoc` | **`applyGenerated`** verbatim (`src/editor/aiGenerate.ts:51`) |
| Change **Overview layout** | `reorderSlide` + `setSlideTransform` | **`applyPlan`** verbatim (`src/editor/aiArrange.ts:149`) |
| Change **body text** | `setSlideDoc` / `setSlideMarkdown` | new thin `applyBodyEdit` |

## The keystone: chat becomes a natural-language front door to mutations that already exist

Nothing here invents a new write path. Every deck change in Strut — human edits, file import, AI Arrange,
AI Generate — already flows through the **one isomorphic mutator registry** (`shared/app-def.ts` `mutators`,
invoked as `app.mutate.<name>(args)`); the AI is *"just another producer of the ordinary mutations a
human action makes … so this inherits sync, server-side permission gating, and undo for free"*
(`aiGenerate.ts:2-5`, `aiArrange.ts:3-5`). Three facts make actionable chat an assembly job, not a build:

- **The mutators exist.** All five map to shipped, zod-typed mutators (`setDeckTheme` `app-def.ts:124`,
  `addSlide`/`setSlideDoc` `:154/:206`, `reorderSlide`/`setSlideTransform` `:172/:175`,
  `setSlideMarkdown` `:198`). Two of the five (**Arrange, Generate**) already have battle-tested
  one-undo apply paths — `applyPlan`, `applyGenerated` — that chat can call unchanged.
- **The model seam already routes model choice.** `resolveModel(userId)` → BYO OpenRouter (user pays,
  strong model) or app Workers AI (`server/llm.ts:51`); `callModel(choice, {messages, response_format})`
  is the exact one-shot structured call Arrange/Generate already make (`server/arrange.ts:94`). Chat tools
  are **another consumer of `callModel`** — a BYO user's stronger model improves tool inference for free,
  no work in this plan.
- **The trust boundary already exists and is the template.** `normalizePlan` re-derives the model's
  output against the deck's OWN slide ids and clamps every field — *"the worst a poisoned slide text can
  do is yield a benign reordering of the user's own slides, one undo away, never an arbitrary mutation"*
  (`shared/arrange.ts:8-11`). Actionable chat generalizes this into `normalizeAction`: **the model never
  names a mutation directly; it emits validated semantics that we translate.**

**Therefore: add a structured "action" schema the chat model emits, a `normalizeAction` firewall, and a
client dispatcher that routes each action to `applyPlan` / `applyGenerated` / a couple of new thin
one-undo appliers.** The seam, the mutators, sync, permissions, and quota plumbing are untouched.

## The load-bearing decision: structured actions, NOT native tool-calling

The seam threads `response_format` (json_schema) — the mechanism **already proven to work on the default
Workers AI llama model** (that is literally how Arrange/Generate run today). It has **no `tools`/
`tool_choice` parameter**. That is the whole argument:

- **Structured-output actions** work across *both* backends — the app-paid llama default *and* every BYO
  OpenRouter model — with zero seam changes. `normalize*` salvages sloppy output (`server/llm.ts:247-249`
  already notes OpenRouter ignores `response_format` for weak models and leans on normalize).
- **Native `tool_use`** would need seam surgery *and* is unreliable on the llama default (weak
  tool-calling) — so it would only work for BYO users on capable models, splitting the experience. Defer
  it to Phase 2, gated to models that advertise tool support.

v1 is: model emits a validated `Action` object → client dispatches. Exactly the Arrange/Generate shape,
widened to a small action union.

## Load-bearing decisions

- **Reuse over rebuild.** `arrange` and `generate` actions do **not** re-implement anything: the dispatcher
  calls the *existing* `/api/arrange` + `/api/generate` flows (which already prompt, `normalize*`, preview,
  and apply with one undo). Chat becomes the NL front door to the ✨ features already shipped; only **theme**
  and **body** are genuinely new apply code, and both are ~30-line one-undo appliers.
- **`normalizeAction` is the firewall — model choice stays safe.** Because a BYO user can point chat at
  *any* OpenRouter model, we trust nothing: target slide ids must exist in the digest; colors coerce to
  bare hex (`/^#?[0-9a-f]{3,8}$/i` → strip `#`, else drop the field); fonts clamp to the theme's known
  family set or `''` (inherit); body text length-capped. An action that survives normalization can only
  touch the user's own deck with in-range values — one undo away. Mirrors `normalizePlan`
  (`shared/arrange.ts:200`).
- **Every action is ONE undo.** The dispatcher wraps each apply in a single `history.push({label, undo,
  redo})` — reusing `applyPlan`/`applyGenerated` (which already do) and building the same for theme/body.
  **This surfaces an existing bug to fix in-scope:** the manual theme controls (`Header.tsx` `setBg`
  `:276`, `setTextTheme` `:285`) fire `mutate.setDeckTheme` with **no `history.push`**, so theme changes
  are *not* on Cmd/Z today. `applyThemePatch` fixes that for both the AI and the human path.
- **Mutations re-couple chat to the editor store — only for apply.** Today `useChat` deliberately touches
  ONLY the memory-only local `chat_message` table via `store.writeLocal`, never `app.mutate.*`
  (`aiChat.ts:6-9`). Actions need the *authoritative* store: the dispatcher takes the live editor
  `mutate` + `history` (from `useHistory()`) + live `slides`, which the panel must now receive. The chat
  thread stays local/un-synced; only the *action apply* goes through the real mutators.
- **Permissions & quota are already correct — do not add checks.** Applied actions flow through
  `app.mutate.*`, whose server guards (`withSlideEditable`/`withDeckEditable`, `server/rindle-api.ts`)
  reject a non-editor regardless of who produced the mutation — an unauthorized action simply snaps back.
  A v1 action turn is **one** `callModel` (single structured pass), so it meters exactly like today: one
  app quota unit (app-paid) or the user's own credits (BYO). No multi-round loop, no quota rework.
- **The digest is not enough grounding for two of the five.** `set_theme` needs the *current* resolved
  theme (so "make it warmer" / "match the accent" is grounded) — inject the deck's resolved
  background/surface/heading/body colors + fonts into the system context. `set_body` needs the target
  slide's **full** text, not the 240-char digest excerpt (`CHAT_LIMITS.maxTextPerSlide`) — send the full
  `doc` text for the referenced slide.

## The routing fork (needs your call — recommended path baked into the phases)

Structured output and token-streaming are mutually exclusive in one call (the seam reflects this:
`callModel` = one-shot structured, `streamModel` = prose stream). So "act vs advise" must be decided
*before* the call. Two shapes:

- **(A) Two lanes, explicit affordance — RECOMMENDED for v1.** Keep the shipped streamed advisor
  UNCHANGED (`streamModel`, the carefully-built rAF token fold in `aiChat.ts:154-176`). Add an **Edit**
  affordance in the composer (a small Chat／Edit segmented toggle, or a distinct send). Edit turns POST to
  a new `/api/chat/act` that runs the structured `callModel` action pass and returns `{ say, action }`;
  the client renders `say` and dispatches `action`. **Pros:** no streaming regression, one model call per
  turn, and the "AI is about to change my deck" boundary is *visible* (good for trust). **Cons:** a manual
  mode is slightly less magical.
- **(B) Unified structured turn.** Every turn is one `callModel` returning `{ say, action? }`; stream
  nothing. **Pros:** simplest, most magical (model decides to act or advise). **Cons:** the shipped
  advisor loses token-streaming — a real regression to a deliberately-built experience — and structured
  output degrades free-prose advice quality on weak models.

Recommendation: **(A)** for v1 — it protects the shipped advisor and keeps the mutation boundary explicit
— with **auto-routing** (a cheap intent classification, or a leading-imperative heuristic, that promotes a
turn to the Edit lane with no manual toggle) as the Phase-2 magic. If you'd rather ship the simplest thing
and are fine dropping streamed advice, take (B); the action schema + dispatcher below are identical either
way.

## The action schema (v1)

A discriminated union the model emits, validated by `normalizeAction`. Shape mirrors `arrangeJsonSchema`
(`shared/arrange.ts:118`), lives in a new `shared/chatAction.ts`:

```ts
type Action =
  | { kind: 'set_theme';                       // → setDeckTheme (colors + fonts)
      background?: string; surface?: string;    // bare hex, normalized
      heading_color?: string; body_color?: string;
      heading_font?: string; body_font?: string } // clamped to known families or ''
  | { kind: 'set_body'; slideId: string; markdown: string }   // → setSlideMarkdown/setSlideDoc, one slide
  | { kind: 'generate'; description: string; count?: number } // → existing /api/generate → applyGenerated
  | { kind: 'arrange'; instruction: string }                  // → existing /api/arrange  → applyPlan
```

`say` (a short prose confirmation/answer) rides alongside. The model picks the action *kind* and its
semantic payload; **it never emits geometry, ids it wasn't given, or a mutator name** — the dispatcher
translates, `normalizeAction` guarantees.

## Sequencing

Ordered by leverage (reuse first) and by blast-radius/variance (riskiest last):

### Phase 1 — Plumbing + the two free wins (Arrange, Generate)
- `shared/chatAction.ts` — the `Action` union, its json_schema, and `normalizeAction(raw, {slideIds})`.
- `/api/chat/act` route (lane A) — mirror `api.chat.tsx` auth/throttle/quota/`resolveModel`, but call
  `callModel` (structured) not `streamModel`, and return `{ say, action }` JSON.
- Client dispatcher `src/editor/aiChatActions.ts` — `dispatchAction(action, {mutate, history, slides,
  deckId})`. For `arrange`/`generate` it simply invokes the **existing** arrange/generate client flows
  (`Overview` preview→`applyPlan`, `SlideWell`→`applyGenerated`), so these two ship with zero new apply
  code and full preview/undo.
- Compose affordance + wire `mutate`/`history`/`slides` into `ChatPanel`.

### Phase 2 — Theme (colors + fonts) + fix the undo gap
- `applyThemePatch(patch, {mutate, history, deck})` — capture the before-values of the touched theme
  columns, `redo` = `setDeckTheme(patch)`, `undo` = `setDeckTheme(before)`, one `history.push`.
- Refactor `Header.tsx` `setBg`/`setTextTheme` to go through `applyThemePatch` so **manual** theme edits
  become undoable too (closes the pre-existing gap).
- Inject resolved current theme into the action-pass system context (grounding).

### Phase 3 — Body text (highest variance, do last)
- `applyBodyEdit(slideId, markdown, {mutate, history, slides})` — capture the target slide's before
  `doc`/`markdown`, convert markdown→doc via the shared `markdownToDoc` (`aiGenerate.ts:38`), `redo` =
  `setSlideDoc`, `undo` = restore, one undo. Send the target slide's **full** text as grounding.

### Phase 4+ — Richness
- Native `tool_use` loop for BYO models that advertise tool support (multi-step, model-driven).
- Auto-routing (drop the manual Edit toggle). Preview-then-confirm for deck-wide actions (reuse Arrange's
  ghost-overlay `previewCards`, `aiArrange.ts:127`). More actions (per-slide theme, add image/shape,
  component text via `setText`).

## Open questions / forks

1. **Routing (A vs B) — above.** The one decision that shapes the UX; recommend (A).
2. **Auto-apply vs propose-then-confirm.** Arrange/Generate today apply immediately as one undo (no
   confirm). Match that (rely on undo + a visible "Undo" chip in the chat row), or gate deck-wide actions
   (theme, arrange) behind an Apply/Dismiss card? Recommend: auto-apply-with-undo for v1, confirm as a
   Phase-4 polish for broad changes.
3. **One action per turn vs a small batch.** v1 = one action per turn (simplest, one undo). Multi-action
   turns ("recolor AND add a closing slide") need either a batch action or the tool_use loop — Phase 4.
4. **Font allowlist source.** `normalizeAction` clamps fonts to "known families" — reuse the editor's font
   picker list as the single source; define where that list lives before Phase 2.

## Out of scope (for this plan)

- Native tool-calling / multi-step agentic loops (Phase 4; needs seam `tools` support).
- Streaming for action turns (structured output is one-shot by nature — matches Arrange/Generate).
- New mutators — v1 reuses only what exists; component-level edits (image/shape/`setText`) are Phase 4.
- Any change to the model seam, sync engine, quota tables, or permission guards.

## Quick file map

| File | New? | Role |
|---|---|---|
| `shared/chatAction.ts` | new | `Action` union + json_schema + `normalizeAction` (the firewall, mirrors `normalizePlan`) |
| `src/routes/api.chat.act.tsx` | new | Structured action endpoint: auth/throttle/quota + `resolveModel` → `callModel` → `{ say, action }` |
| `server/chatAct.ts` | new | Adapter: build the action-extraction prompt + schema, call `callModel`, `normalizeAction` |
| `src/editor/aiChatActions.ts` | new | Client dispatcher → `applyPlan` / `applyGenerated` / `applyThemePatch` / `applyBodyEdit` |
| `src/editor/aiTheme.ts` | new | `applyThemePatch` — one-undo `setDeckTheme` (also adopted by `Header.tsx`) |
| `src/editor/aiBody.ts` | new | `applyBodyEdit` — one-undo body rewrite via `markdownToDoc` + `setSlideDoc` |
| `src/editor/ChatPanel.tsx` | mod | Edit affordance; receive + thread `mutate`/`history`/`slides`; render `say` + Undo chip |
| `src/editor/aiChat.ts` | mod | Send-path branch for the Edit lane (or the unified turn under fork B) |
| `src/editor/Header.tsx` | mod | Route `setBg`/`setTextTheme` through `applyThemePatch` (close the no-undo gap) |
| `shared/chat.ts` | mod | Populate the `action` field the contract already reserves (`:13-15`) |

## Relevant existing anchors

- Phase-2 hook this realizes: `shared/chat.ts:13-15`; advisor "cannot edit" line to lift:
  `server/chat.ts:31`.
- The model seam (the dependency): `server/llm.ts` — `resolveModel:51`, `callModel:110`
  (`response_format`, no `tools`), `streamModel:164`.
- Structured-output + firewall template to clone: `server/arrange.ts:84-121` (the `callModel` +
  `json_schema` call), `shared/arrange.ts:118` (`arrangeJsonSchema`), `:200` (`normalizePlan`).
- One-undo apply templates to reuse verbatim: `src/editor/aiArrange.ts:149` (`applyPlan`),
  `src/editor/aiGenerate.ts:51` (`applyGenerated`), `:38` (`markdownToDoc`).
- Undo API: `src/editor/history.ts` — `push:35`, `batch:53`; accessed via `useHistory()`.
- Mutators + zod args: `shared/app-def.ts` — `setDeckThemeArgs:124`, `addSlideArgs:154`,
  `setSlideDocArgs:206`, `setSlideMarkdownArgs:198`, `reorderSlideArgs:172`, `setSlideTransformArgs:175`,
  `setTextArgs:307`.
- The undo gap to fix: `src/editor/Header.tsx:276` (`setBg`), `:285` (`setTextTheme`) — no `history.push`.
- Chat's local-only store (stays as-is; actions bypass it for `app.mutate.*`): `src/editor/aiChat.ts:6-9`,
  `useChat:240`.
- Route to mirror for `/api/chat/act` (auth/throttle/quota/`resolveModel`/BYO branch):
  `src/routes/api.chat.tsx:52-140`.
- Server permission guards that make applied actions safe by construction: `server/rindle-api.ts`
  (`withSlideEditable` / `withDeckEditable`).
</content>
</invoke>
