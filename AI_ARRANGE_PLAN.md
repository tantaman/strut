# AI Arrange — "Connect your model, let it arrange the overview" — Implementation Plan

Status: **proposed** (not yet implemented). Realizes the AI note in [`notes.md`](./notes.md):
*"AI integration is streaming into a local-only table and using the user's OAuth to Claude or whatever …
let them auth claude/gpt and let that make edits we apply … first step is editing the presentation."*

## Goal

Let a user connect an LLM they control (via OAuth where the provider supports it, or a pasted API key)
and ask it to **arrange the slides in the Overview** — set the reading/camera order and lay the cards
out spatially — from a natural-language instruction ("group by topic, timeline left-to-right, intro
first, CTA last"). The model proposes; the user previews and applies; one keystroke undoes the whole
thing.

## The keystone: the AI needs no new "apply" pathway

Arrangement in strut is *already* just two mutations that a human drag produces today:

- **Reading / camera order** → `mutate.reorderSlide({ id, sort })`, where `sort` is a fractional index
  from `keyBetween` / `keysBetween` (`src/lib/order.ts`). Human path: `SlideWell.tsx` `drop()`
  (`src/editor/SlideWell.tsx:171`, key at `:185`, mutate at `:187`).
- **Spatial 3-D layout in the Overview** → `mutate.setSlideTransform` (`src/editor/Overview.tsx:239`),
  and the named preset layouts in `applyLayout` (`src/editor/Overview.tsx:319`, presets in
  `src/editor/layouts.ts`).

Both have optimistic client mutators in `shared/app-def.ts` **and** authoritative server twins in
`server/rindle-api.ts`, and both already flow through `useHistory()` (`src/editor/UndoProvider.tsx`).

**Therefore the LLM is just another producer of these mutations.** We do not build an apply engine. The
model returns a *plan*; we translate it into `reorderSlide` + `applyLayout`/`setSlideTransform` calls
and inherit sync, server-side permission gating, and undo for free. Wrapping the batch in a single
`history.push({ label: 'AI arrange', … })` entry makes the model's entire decision revertible in one
keystroke — this is what makes the feature safe to ship.

## Load-bearing decisions

- **The model emits semantics, not geometry.** Output is a slide-ID permutation plus a *grouping* and a
  choice among existing layout presets — never raw `x/y/rotateZ` floats. Geometry stays deterministic
  in `applyLayout`; the model does what it is good at (understanding slide content). See
  `ArrangementPlan` below.
- **Every returned ID is validated against the deck before anything is applied.** This is also the
  prompt-injection defense: untrusted slide text can, at worst, yield a bad *permutation* — which is one
  undo away — never an arbitrary mutation.
- **The LLM call happens server-side, in the `strut` Worker — never the browser.** CORS blocks
  browser-direct calls to most providers, and refresh tokens must not live in the browser.
- **Credentials never touch Rindle.** Rindle is a local-first replicated store — anything in it syncs to
  every client. OAuth/API tokens live only in a separate encrypted server-side store (new binding).
- **Preview is plain client state, applied only on commit.** The proposed arrangement is held in React
  state and rendered as a ghost overlay in the Overview; nothing hits Rindle until the user clicks
  Apply. (A Rindle *local-only* table — the `notes.md` framing — is a later refinement, not required.)
- **Real authentication is a prerequisite, not a nice-to-have** (see Phase 0). Attaching paid LLM
  credentials to today's spoofable identity would let anyone burn anyone else's tokens.

## The two arrangement surfaces + the plan shape

The Overview shows spatial cards with camera-order badges; "arrange" touches both. The model returns:

```ts
// shared/arrange.ts (new) — shared client/server contract
export type ArrangementPlan = {
  order: string[];                    // slide ids, desired reading order → keysBetween → reorderSlide
  groups?: { label: string; slideIds: string[] }[];
  layout?: 'keep' | 'grid' | 'spiral' | 'timeline' | 'cluster'; // → applyLayout preset
  rationale?: string;                 // short human-readable "why", shown in the preview
};
```

- `order` → regenerate a clean key set with `keysBetween(null, null, order.length)` (`src/lib/order.ts`)
  and issue one `reorderSlide` per slide, rather than pairwise thrash.
- `layout` + `groups` → feed the existing `applyLayout` path (it already pushes its own undo entry;
  the AA batch wraps or replaces that).

## Credential strategy — "Connect your model"

"OAuth with the LLM of your choice" is **not** uniform across providers, so frame the UI as
**"Connect your model,"** not "OAuth":

| Provider | Mechanism | Notes |
|---|---|---|
| **OpenRouter** | OAuth PKCE | One flow, many models → this *is* "LLM of choice." **Default path.** |
| **Anthropic** | OAuth (Claude Code / MCP-connector style) | Most "native"; least documented for 3rd-party API use — verify current terms. |
| **OpenAI** | BYOK (API key) | No consumer OAuth grants API access to a ChatGPT plan. |
| **Google / Gemini** | OAuth or API key | Leans toward API keys / GCP. |

All paths converge to **one per-user credential the Worker can call.** BYOK is the universal fallback and
ships in days; OAuth is better UX but drags in token custody + the real-auth prerequisite.

## Sequencing

Phase 0 is a hard prerequisite. Phase 1–4 is a shippable MVP (BYOK, order + preset layout, preview,
apply). Phase 5+ layers on OAuth breadth and richness.

---

## Phase 0 — Real authentication (prerequisite)

Specced separately in **[`AUTH_PLAN.md`](./AUTH_PLAN.md)**: Better-Auth on a new Cloudflare **D1**
binding, GitHub/Google (+ Apple) social sign-in, and the cutover from the spoofable `x-user` header
(`src/rindle/user.ts`, `src/rindle/client.ts:42`) to a server-verified session principal in
`server/rindle-api.ts`. A server-issued session (guest or social-linked) is unforgeable, which is the
actual security requirement here — you cannot attach paid LLM credentials to a spoofable identity.

Net effect for this plan: an unforgeable per-user id, and a **D1 database now exists** in the Worker
(reused by Phase 1 below).

## Phase 1 — Credential store + "Connect your model" (BYOK first)

- **Encrypted per-user token store — a table in the D1 database added by `AUTH_PLAN.md`** (no separate
  KV needed). Store `{ user_id, provider, ciphertext }`, envelope-encrypted with a new Worker secret
  `MODEL_CRED_KEY` (`wrangler secret put`). **Not** in Rindle, **not** returned to the browser.
- **Routes** (TanStack Start, mirroring `src/routes/api.rindle.*`):
  - `src/routes/api.model.connect.tsx` — POST: accept a BYOK key (Phase 1) or start OAuth (Phase 5);
    encrypt + store; return only `{ connected: true, provider }`.
  - `src/routes/api.model.status.tsx` — GET: whether the current user has a connected model (no secret).
  - `src/routes/api.model.disconnect.tsx` — POST: delete the stored credential.
- **UI:** a small "Connect your model" panel (settings / deck menu) — provider picker + key field,
  connected/disconnected state.

## Phase 2 — Arrange endpoint

- `shared/arrange.ts` — the `ArrangementPlan` type + a JSON Schema for tool/structured output.
- `server/arrange.ts` — provider adapter behind one interface:
  `arrange(deckContext, instruction, cred) → ArrangementPlan`. One adapter per provider (Anthropic
  Messages + tool use / OpenAI function-calling / OpenRouter passthrough); consider the Vercel AI SDK to
  collapse provider differences. Force structured output against the schema.
- `src/routes/api.arrange.tsx` — POST `{ deckId, instruction }`:
  1. resolve session user (Phase 0), load the deck via the gated server query twin (`server/queries.ts`,
     `deckDetailBody` shape from `shared/queries.ts`);
  2. build a **compact digest** per slide: `{ id, title, text }` from `slide.markdown` / `slide.doc`
     (excerpt; thumbnails are a Phase 5 multimodal add — costly);
  3. load + decrypt the user's credential; call the adapter;
  4. **validate**: drop any id not in the deck; ensure `order` is a permutation of deck slide ids;
  5. return the `ArrangementPlan` (no credential, no raw model output).
- **Guardrails:** per-user rate limit + a token/credit ceiling on this endpoint (spending the user's
  money). Log usage.

## Phase 3 — Apply path (client)

- `src/editor/aiArrange.ts` — `applyPlan(plan, mutate, slides, history)`:
  - `order` → `keysBetween(null, null, plan.order.length)` → one `reorderSlide({ id, sort })` per slide;
  - `layout` → route through the existing `applyLayout` preset with `groups` as the clustering hint;
  - wrap the whole thing in a single `history.push({ label: 'AI arrange', undo, redo })` so it reverts
    as one unit (mirror the existing undo entries in `SlideWell.tsx` `drop()` and `Overview.tsx`
    `applyLayout`).

## Phase 4 — Overview UX (preview → apply)

- Add an **"✨ Arrange"** control to the Overview toolbar beside the existing preset layouts
  (`src/editor/Overview.tsx`), with a natural-language instruction box.
- On submit → call `/api/arrange`; hold the returned plan in React state.
- **Preview**: render proposed positions/order as a ghost overlay + reordered badges + the `rationale`.
- **Apply** → `applyPlan` (Phase 3). **Discard** → drop the state. Nothing touches Rindle until Apply.

## Phase 5+ — Breadth & richness

- OAuth flows: OpenRouter PKCE (default), then Anthropic; refresh-token handling in the Worker.
- Multimodal: send slide thumbnails for layout that reads visual weight, not just text.
- Stream the proposal + rationale (SSE) for perceived speed.
- Optional: move preview into a Rindle **local-only** table (the `notes.md` vision) for richer,
  multi-step "suggest edits" beyond arrangement.
- Foundation for the `notes.md` "next step": AI editing slide *content*, not just arrangement.

---

## Open questions / forks

- **Scope of v1 "arrange":** reading order only (fastest ship) vs. order + spatial layout (fuller). This
  plan does both but order-only is a valid smaller Phase 1–4.
- **OAuth vs. BYOK for v1:** BYOK-first ships in days and works with every provider; committing to OAuth
  up front improves UX but pulls Phase 0 (real auth) + token custody onto the critical path.
- **Credential store:** resolved → a table in the D1 database from `AUTH_PLAN.md`, envelope-encrypted,
  never returned to the browser. (Was: separate KV — dropped now that D1 exists.)
- **Preview substrate:** React state (recommended) vs. a Rindle local-only table (matches `notes.md`,
  more infra).

## Out of scope (for this plan)

- AI editing slide *content* (markdown/components) — the `notes.md` "next step"; arrangement first.
- AI image/SVG generation (separate `notes.md` item).
- Multi-editor realtime for AI sessions.

## Quick file map

- Order: `src/lib/order.ts`, `src/editor/SlideWell.tsx` (`drop`).
- Spatial layout / presets: `src/editor/Overview.tsx` (`setSlideTransform`, `applyLayout`),
  `src/editor/layouts.ts`.
- Mutation contract: `shared/app-def.ts` (client) ↔ `server/rindle-api.ts` (server twins).
- Queries / schema: `shared/queries.ts`, `shared/fragments.ts`, `shared/schema.ts`, `server/queries.ts`.
- Identity (to replace): `src/rindle/user.ts`, `src/rindle/client.ts:42`, `server/rindle-api.ts`.
- Worker config / bindings: `wrangler.jsonc`, `src/routes/api.rindle.*`.
- Undo: `src/editor/UndoProvider.tsx`.
- New in this plan: `shared/arrange.ts`, `server/arrange.ts`, `src/editor/aiArrange.ts`,
  `src/routes/api.arrange.tsx`, `src/routes/api.model.*.tsx`.
</content>
</invoke>
