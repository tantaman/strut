# OpenRouter — "Bring your own LLM to the ✨ features" — Implementation Plan

Status: **Phases 1–4 built & verified** on branch `open-router`: credential store, connect UI, the
`server/llm.ts` seam + adapter refactor, and the routes' pay/guest/quota branching. Remaining: Phase 5+
(OAuth PKCE, model discovery, cost surfacing) + a live browser click-through. Realizes the
deliberately-deferred
**BYOK path** the AI adapters already name — *"there is NO per-user credential to custody (that's the
BYOK path we deliberately deferred)"* (`server/arrange.ts:3-4`, `server/chat.ts:8-11`) — and
[`AI_ARRANGE_PLAN.md`](./AI_ARRANGE_PLAN.md) Phase 1 (credential store) + Phase 5 (OpenRouter OAuth,
called *"this **is** 'LLM of choice'… the default path"*).

## Goal

Let a signed-in user **connect their own OpenRouter account** and run the three ✨ features — Arrange
(`server/arrange.ts`), Generate (`server/generate.ts`), Chat (`server/chat.ts`) — on **the model they
choose and the credits they pay for**, instead of the app-paid Cloudflare Workers AI default. Workers AI
stays the **zero-config fallback** for anyone who hasn't connected a model, so nothing regresses for
today's users. "Connect your model" is a small settings panel; the LLM call moves from the app's binding
to the user's key with no change to prompts, schemas, undo, or the sync engine.

## The keystone: one model seam, two backends — everything else is unchanged

Inference is *already* isolated to a single call per feature (`ai.run(MODEL, …)`), and every adapter's
header comment promises *"swapping providers is a change ONLY to this file — the route and client are
model-agnostic."* Two facts make BYO a **transport swap**, not a rewrite:

- **OpenRouter is OpenAI-compatible.** Its `POST /api/v1/chat/completions` takes the exact `messages` +
  `response_format` + `stream` payloads the Workers AI calls already build. No provider matrix, no SDK.
- **The three adapters duplicate the *same* inline `loadAi()` / `AiBinding` / `extractJson` code** — there
  is no shared LLM module today. Introducing one is a net *reduction* in duplication.

**Therefore: add the seam the codebase never had (`server/llm.ts`), route all three adapters through it,
and add a per-user credential the seam reads.** Routes, prompt builders, JSON schemas, the `normalize*`
trust boundary, the client `fetch` calls, undo, and the quota *plumbing* are untouched. The only new
runtime behavior is *which* endpoint the seam calls, decided per request by whether the user has
connected a model.

## Load-bearing decisions

- **OpenRouter first, and OpenRouter alone in v1.** One OAuth/one key fronts hundreds of models — it *is*
  "bring your own LLM." The seam's `ModelChoice` union leaves room for Anthropic/OpenAI-direct later, but
  none is built now.
- **The BYO branch is a plain `fetch`, not an object binding.** Unlike `env.AI` / `DB` / `R2` (object
  bindings reachable only via `cloudflare:workers` under workerd), OpenRouter is an HTTPS call with a
  bearer token. It behaves **identically under `pnpm dev` (Node) and workerd** — so BYO users escape the
  "no AI binding under dev" cliff that forces the `STRUT_*_STUB` fallbacks today.
- **Credentials never touch Rindle and never reach the browser.** Rindle replicates every row to every
  client — the one store a key must never enter. The key lives **encrypted at rest in the auth D1**
  (`DB`), decrypted only server-side in the Worker. Mirrors `AI_ARRANGE_PLAN.md`'s credential decision;
  reuses the D1 that `AUTH_PLAN.md` already delivered.
- **The seam resolves the backend per request from the caller's credential.** `resolveModel(userId)`:
  connected → **OpenRouter (user pays)**; not connected → **Workers AI (app pays — today's behavior)**.
- **When the user pays, the app-cost ceiling disappears.** The durable daily quota (`server/quota.ts`)
  exists *because the app pays for inference*; for a BYO call it is **bypassed**. The cheap per-isolate
  burst throttle stays (it protects *your Worker's* CPU/abuse surface, not model cost).
- **Streaming is normalized server-side.** OpenRouter emits OpenAI `data: {"choices":[{"delta":
  {"content":"…"}}]}` SSE; the client parses Workers-AI `data: {"response":"…"}` frames
  (`src/editor/aiChat.ts:44` `parseSseDelta`). `streamModel` **re-emits BYO frames as `{response}`** so the
  client — and the two shipped SSE shapes — stay provider-agnostic. One translation point, in the seam.
- **The `normalize*` trust boundary makes model choice safe.** Not every OpenRouter model honors
  `response_format: json_schema`. `normalizePlan` / `normalizeGenerated` already re-derive `order` as a
  validated full permutation of the deck's own ids and clamp all geometry — so a sloppy model yields a
  *worse arrangement* (one undo away), never an arbitrary mutation or an id escape. Nothing new to defend.

## Sequencing

Phase 0 prerequisites are already met (guest-first auth + D1 shipped). Phase 1–4 is a shippable MVP:
paste-an-OpenRouter-key BYOK, all three features, Workers-AI fallback intact. Phase 5+ adds OAuth PKCE,
model discovery, and cost/usage polish.

## Decisions (locked 2026-07-07)

Three earlier forks are resolved and baked into the phases below:

1. **Guests with a connected key CAN use the ✨ features.** A BYO call costs the app nothing and every
   session (guest or member) is unforgeable, so the gate becomes "some session + a connected model,"
   not "member." App-paid calls stay member-only.
2. **No quota for BYO calls.** `consume*Quota` is skipped entirely when the user's own key is in use;
   only the per-isolate burst throttle remains (protects the Worker, not model cost).
3. **BYOK (paste an API key) ships first.** OpenRouter OAuth PKCE is a Phase 5 fast-follow; the
   credential-store shape is identical, so PKCE only swaps *how the key is obtained*.

Still open (do not block the MVP): one-model-vs-per-feature selection, encryption-key rotation, and the
structured-output fallback for models that reject `response_format` — see Open questions below.

---

## Phase 0 — Prerequisites (already satisfied)

- **Unforgeable principal + D1 both exist.** Better-Auth guest-first is shipped (`server/auth.ts`,
  `resolveSessionAccount` in `server/session.ts`), and the D1 `DB` binding is live (`wrangler.jsonc:52-62`,
  migrations in `migrations-d1/`, local better-sqlite3 in dev). You *cannot* attach paid credentials to a
  spoofable identity — that risk is already closed.
- **New secret only:** `MODEL_CRED_KEY` — a 32-byte base64 key for envelope-encrypting stored credentials
  (`wrangler secret put MODEL_CRED_KEY`). A dev default in `.env` (documented, non-secret) keeps `pnpm dev`
  working. This is the single new piece of setup.

## Phase 1 — Credential store (D1 + envelope encryption)

- **`migrations-d1/0007_model_credential.sql`** (NEW) — one connected model per user in v1:
  ```sql
  create table if not exists model_credential (
    user_id    text not null primary key references "user" ("id") on delete cascade,
    provider   text not null,          -- 'openrouter' in v1
    model      text,                   -- e.g. 'anthropic/claude-3.5-sonnet'; null = OpenRouter default
    ciphertext text not null,          -- AES-GCM(iv || key), keyed by MODEL_CRED_KEY — never the raw key
    created    text not null
  );
  ```
  Same D1 as Better-Auth + the `*_usage` quota tables; `on delete cascade` drops the credential when the
  account is deleted. Applied to prod with `wrangler d1 migrations apply strut-auth`; dev's local auth.db
  picks it up automatically via `server/auth.ts` `migrateLocalAuth`.
- **`server/modelCred.ts`** (NEW) — mirror `server/quota.ts`'s dual-store shape (`getStore` → D1 under
  workerd / better-sqlite3 in dev, both resolved the same way). API:
  - `putCredential(userId, { provider, model, apiKey })` — envelope-encrypt `apiKey` with WebCrypto
    `AES-GCM` under `MODEL_CRED_KEY` (random IV per write, stored `iv:ciphertext`), upsert.
  - `getCredential(userId): { provider, model, apiKey } | null` — decrypt; **server-only**, never
    serialized to a response.
  - `deleteCredential(userId)`.
  - `hasCredential(userId): { connected, provider, model }` — the safe, key-free status shape.

## Phase 2 — "Connect your model" routes + UI

- **Routes** (mirror `src/routes/api.arrange.tsx`'s session guard — `resolveSessionAccount` → 401 on
  no-session; a *member* gate is a fork, see below):
  - `src/routes/api.model.connect.tsx` — POST `{ apiKey, model? }`: **validate** the key by pinging
    OpenRouter `GET /api/v1/key` (cheap, returns the key's usage/limit) → `putCredential` → return
    `{ connected: true, provider: 'openrouter', model }`. **Never echoes the key.**
  - `src/routes/api.model.status.tsx` — GET: `hasCredential` → `{ connected, provider, model }`.
  - `src/routes/api.model.disconnect.tsx` — POST: `deleteCredential` → `{ connected: false }`.
- **Client:**
  - `src/rindle/modelClient.ts` (NEW) — thin `fetch` wrappers + a `useModelStatus()` hook (like
    `authClient` usage). Reactive so the ✨ controls can show "using your model."
  - A **"Connect your model"** panel next to `src/rindle/AccountControl.tsx` — the only account surface
    today (a sign-in/out popover in the dashboard chrome, `src/routes/index.tsx:88`). Model connection is
    an *account* setting, not a per-deck one, so it belongs with the identity UI, not the editor header.
    Provider = OpenRouter, an API-key field, an optional model field/picker, connected/disconnected state,
    a Disconnect button. Guests see a sign-in nudge unless the guest-BYO fork is taken.

## Phase 3 — The model seam (`server/llm.ts`)

The abstraction the repo lacks. Folds in the three duplicated `loadAi()` / `AiBinding` / `extractJson`
copies:

```ts
export type ModelChoice =
  | { kind: 'workers-ai'; model: string }                     // app pays — the current default/fallback
  | { kind: 'openrouter'; model: string; apiKey: string }     // user pays — BYO

/** Read the user's connected credential → OpenRouter; else the Workers AI default. */
export async function resolveModel(userId: string): Promise<ModelChoice>

/** One-shot structured/text completion — Arrange + Generate. */
export async function callModel(
  choice: ModelChoice,
  input: { messages: Msg[]; response_format?: unknown; max_tokens?: number },
): Promise<unknown>   // shape-compatible with today's ai.run(...) result → extractJson stays

/** SSE token stream — Chat. Normalizes OpenRouter's OpenAI frames to `{response}` so the client is untouched. */
export async function streamModel(
  choice: ModelChoice,
  input: { messages: Msg[] },
): Promise<ReadableStream<Uint8Array>>
```

- **Workers AI branch:** today's `loadAi()` + `ai.run(MODEL, …)`, unchanged, keyed by the default model
  const (moved here from the three adapters).
- **OpenRouter branch:** `fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST',
  headers: { Authorization: \`Bearer ${apiKey}\`, 'content-type': 'application/json', 'HTTP-Referer':
  'https://strut.io', 'X-Title': 'Strut' }, body })`. Pass `response_format`/`stream` straight through.
  Map OpenRouter's `choices[0].message.content` (one-shot) / `choices[].delta.content` (stream) into the
  shapes the adapters already consume.
- **Error mapping:** OpenRouter 401 (bad/expired key), 402 (out of credits), 429 (rate limited) → the
  adapters' existing `*UnavailableError`, so the routes still 503 with a friendly message (and, for
  app-paid calls only, refund quota). BYO errors get a "check your OpenRouter key/credits" message.

**Adapter refactor** (`server/arrange.ts`, `server/generate.ts`, `server/chat.ts`): replace each private
`loadAi()` + `ai.run(...)` with `callModel(choice, …)` / `streamModel(choice, …)`. Keep every prompt
builder, JSON schema, `normalize*`, and `STRUT_*_STUB` dev path. Thread `userId` in (the adapters take
only the request today; the routes already hold `account.id`) so `resolveModel` can run — a small
signature change: `arrange(req, userId)`, etc.

## Phase 4 — Wire the routes: pay-path + quota bypass

In each of `api.arrange.tsx` / `api.generate.tsx` / `api.chat.tsx`:

- Resolve the credential once; pass `account.id` to the adapter.
- **BYO → skip `consume*Quota`** (the user pays). **App-paid → unchanged** (consume + refund-on-failure).
  The per-isolate burst throttle runs in both cases.
- **Guest gate (DECIDED — guests-with-a-key allowed):** replace today's
  `if (!account || account.isAnonymous) return 401 sign_in_required` (`api.arrange.tsx:49`) with: **no
  session at all → 401**; **session + connected BYO key → allow** (guest or member); **session, no key →
  the current rule** (members run on app-paid Workers AI, guests get the sign-in nudge). So the anon check
  only bites when there's no key to pay with.
- **Client:** the features already `fetch('/api/…')` (`Overview.tsx:676` arrange, `SlideWell.tsx:504`
  generate, `aiChat.ts:138` chat) — no call-site change. Only surface "using your model" and a clearer
  error when a BYO call fails on key/credit.

## Phase 5+ — Breadth & richness

- **OpenRouter OAuth PKCE** ("Connect", not paste — the plan's original default path): redirect to
  `https://openrouter.ai/auth?callback_url=…&code_challenge=…&code_challenge_method=S256`, exchange the
  returned `code` at `POST https://openrouter.ai/api/v1/auth/keys` for a user-scoped key, store as in
  Phase 1. New route `src/routes/api.model.oauth.$.tsx`; the store shape is unchanged.
- **Model discovery:** populate the picker from OpenRouter `GET /api/v1/models` (id, context length,
  pricing) instead of a free-text field.
- **Per-provider breadth:** Anthropic / OpenAI-direct behind the same `ModelChoice` union — but OpenRouter
  alone already covers "LLM of choice."
- **Usage & cost:** surface OpenRouter's per-response cost headers / `GET /api/v1/key` balance in the
  panel; optional per-user spend cap.
- **Per-feature model:** let a user route Arrange to a cheap model and Chat (the most quality-visible
  surface) to a strong one.

---

## Open questions / forks

(Guest access, quota-under-BYO, and BYOK-vs-OAuth are resolved — see **Decisions (locked)** above.)

1. **One model vs many** — a single connected model (simplest; v1) vs per-feature selection (Phase 5).
2. **Encryption-key management** — single `MODEL_CRED_KEY` secret (simple) vs per-user derived keys; define
   the rotation story before GA.
3. **Structured-output fallback** — if a chosen model rejects `response_format`, do we retry with a
   prompt-only "return JSON" nudge, or just lean on `normalize*` to salvage whatever came back?

## Out of scope (for this plan)

- Non-OpenRouter providers (the `ModelChoice` union anticipates them; none is built in v1).
- Streaming for Arrange/Generate (they are one-shot structured calls by design).
- Team/shared connected models (a credential is strictly per-user).
- Multimodal (sending slide thumbnails) — orthogonal, tracked with the AI feature plans.
- An app-owned Claude key via AI Gateway (`AI_CHAT_PLAN.md`'s alternative) — a *different* lever (better
  default quality, app pays) than BYO (user pays, user chooses); not this plan.

## Quick file map

| File | New? | Role |
|---|---|---|
| `migrations-d1/0007_model_credential.sql` | new | Per-user encrypted credential table (auth D1) |
| `server/modelCred.ts` | new | Dual-store (D1/sqlite) + AES-GCM envelope encrypt/decrypt; `put/get/delete/hasCredential` |
| `server/llm.ts` | new | The model seam: `ModelChoice`, `resolveModel`, `callModel`, `streamModel` (SSE normalize) |
| `server/arrange.ts` | mod | Drop private `loadAi()`/`ai.run` → `callModel(resolveModel(userId), …)`; keep prompt/schema/normalize/stub |
| `server/generate.ts` | mod | Same refactor (one-shot structured) |
| `server/chat.ts` | mod | Same refactor via `streamModel` (client SSE shape unchanged by normalization) |
| `src/routes/api.model.connect.tsx` | new | POST validate + encrypt + store a key |
| `src/routes/api.model.status.tsx` | new | GET `{ connected, provider, model }` (never the key) |
| `src/routes/api.model.disconnect.tsx` | new | POST delete the credential |
| `src/routes/api.arrange.tsx`, `api.generate.tsx`, `api.chat.tsx` | mod | Pass `account.id`; bypass quota when BYO; guest-gate fork |
| `src/rindle/modelClient.ts` | new | Client fetch wrappers + `useModelStatus()` |
| `src/rindle/AccountControl.tsx` (+ `src/routes/index.tsx`) | mod | "Connect your model" panel beside the account popover |
| `wrangler.jsonc` | mod | Document `MODEL_CRED_KEY` secret (no new binding — OpenRouter is a `fetch`) |
| `server/llm.test.ts` | new | `streamModel` SSE normalization (OpenAI→`{response}`), `resolveModel` backend pick |

## Relevant existing anchors

- Adapters (the BYOK deferral + "change only this file" promise): `server/arrange.ts:1-25`,
  `server/generate.ts:1-17`, `server/chat.ts:1-18`.
- Route guard + quota flow to mirror/relax: `src/routes/api.arrange.tsx:46-110`.
- Session principal: `server/session.ts` `resolveSessionAccount` (`{ id, isAnonymous }`).
- Only account/settings UI today (the panel's home): `src/rindle/AccountControl.tsx`, mounted at
  `src/routes/index.tsx:88`. Auth client hooks: `src/rindle/authClient.ts` (`useSession`).
- D1 access pattern to clone for `server/modelCred.ts`: `server/quota.ts:163-237` (D1/sqlite dual-store).
- Durable quota to bypass under BYO: `server/quota.ts:27-32` (limits), consume/refund wrappers.
- Client SSE parser the normalization keeps valid: `src/editor/aiChat.ts:44` `parseSseDelta`.
- Bindings: `wrangler.jsonc` — `AI` (68-70), `DB` (52-62). Auth user table the FK targets:
  `migrations-d1/0001_better_auth.sql:1` (`"user"("id")`).
- Client call sites (unchanged): `src/editor/Overview.tsx:676`, `src/editor/SlideWell.tsx:504`,
  `src/editor/aiChat.ts:138`.
</content>
</invoke>
