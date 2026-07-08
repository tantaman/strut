# Rindle consolidation — code in Strut that belongs in the framework

Strut is built entirely on Rindle. In the course of building it, several pieces of
genuinely framework-level code got hand-rolled in the app, and several app-side
workarounds exist only because Rindle is missing a fix. This document inventories both,
so they can be upstreamed into the `@rindle/*` packages and then deleted here.

Companion to `RINDLE_NOTES.md` (the running friction log). The `#N` references below point
at the numbered entries there.

Legend:

- **Lift** = generic code to move into a Rindle package roughly as-is.
- **Fix-then-delete** = a Rindle bug/gap; the fix goes upstream and the Strut workaround is removed.
- **Tooling** = a proven gap that wants new Rindle tooling (not liftable app code).

---

## Tier 1 — primitives to lift into Rindle

### 1. `readOnce(store, query)` — one-shot authoritative read  ·  Lift
- **Where:** `src/editor/deckIO.ts` (`readOnce`, ~L25).
- **What:** `materialize → poll resultType === 'complete' → read data → destroy`. Zero Strut
  in it. Used by export, import, and undo-snapshots.
- **Target:** `store.readOnce(query): Promise<data>` in `@rindle/client`.
- **Deletes here:** the local helper in `deckIO.ts`; simplifies every one-shot subtree read
  (cross-ref #11/#12).

### 2. Undo/redo `History` command stack  ·  Lift
- **Where:** `src/editor/history.ts` (whole file, 117 lines).
- **What:** bounded `{label, undo, redo}` stack with `batch()`, `perform()`, `push()`, and a
  `subscribe()` for React. Already documented as "framework-agnostic"; nothing references a
  slide/deck. Composes with optimistic mutations for free (#13).
- **Target:** `@rindle/history` (plain class) and/or a `useHistory()` in `@rindle/react`.
- **Stays in Strut:** construction of inverse commands from named mutators (app-specific).

### 3. Deferred-mutate proxy  ·  Lift
- **Where:** `src/rindle/RindleProvider.tsx` (`deferredMutate`, ~L43).
- **What:** buffers `app.mutate.*` calls fired before the lazy-WASM client boots and replays
  them on resolve. Inherent to Rindle's SSR + dynamic-import boot, not to Strut.
- **Target:** `@rindle/react` — so no app re-implements a Proxy to dodge a null-app throw.

### 4. Fractional-index ordering helpers  ·  Lift
- **Where:** `src/lib/order.ts` (`keyAfter`/`keyBetween`/`keysBetween`).
- **What:** thin wrapper over `fractional-indexing`, present because "Rindle has no built-in
  ordering primitive" (RINDLE_NOTES "Ordering"). Ordering is table-stakes for any list.
- **Target:** `@rindle/order`, or a first-class `sort` column type / `orderBetween` mutator
  helper.

---

## Tier 2 — framework fixes that delete Strut boilerplate

### 5. SSR seed → live empty-flash bridge  ·  Fix-then-delete
- **Where:** `src/routes/index.tsx` (`lastComplete` / `useQueryStatus` dance, ~L39-41).
- **Root cause (#20, confirmed):** `@rindle/react` drops the SSR seed on the `hello` event
  instead of the first `snapshot`, so a seeded route flashes empty for one daemon round-trip.
- **Cost:** per-route boilerplate every seeded route needs; the editor route
  (`deck.$deckId.tsx`) still lacks it and flashes.
- **Fix:** keep the seed authoritative until the first live snapshot (don't null `view.seeded`
  in `reset()`; have `get data()` fall back to `seeded` while a freshly-reset view is still
  `resultType === 'unknown'`; retire the seed on first snapshot). Then delete this block and
  the un-worked-around gap in the editor route disappears too.

### 6. Split client/server query twins  ·  Fix-then-delete (make first-class)
- **Where:** `shared/queries.ts` (un-gated client) + `server/queries.ts` (gated server twins,
  same wire names).
- **Root cause (#15):** `existsNoSync` is server-only; a shared gated `defineQuery` returns
  empty on the client. Every multi-tenant app must therefore define each query twice under one
  name — non-obvious and silently wrong when missed.
- **Fix:** (a) make the split first-class — `defineQuery(name, validate, clientBuild, {
  serverBuild })` or `clientQuery.gated(serverBuild)` — so the wire name can't drift; (b) make
  `existsNoSync` **throw** on the client instead of collapsing to empty.

### 7. Read-then-throw access-guard wrappers  ·  Lift (harness) + keep predicates
- **Where:** `server/rindle-api.ts` (`guarded` + `withDeckEditable` / `withSlideEditable` /
  `withComponentEditable` / `withDeckOwner` / `withShareOwner`, ~L81-197).
- **What:** a generic multi-tenant authz harness — *parse args → evaluate a boolean access
  predicate inside the txn → throw `forbidden` (optimistic snap-back) → `runSharedMutation`*.
- **Target:** `guardMutator(gen, predicate)` in `@rindle/api-server`. Strut's specific
  predicates (`deckEditableBy`, etc.) stay app-side. Addresses the #14/#16 "where does
  row-level auth live" asks.

---

## Tier 3 — tooling gaps the Strut build proved out

- **`rindle check` twin-parity lint** — diff client `ClientRegistry` keys vs
  `defineApiMutators` keys; a missing server twin is the #1 footgun (#11).
- **`@rindle/testing`** — wrap the headless Node harness Strut uses to drive the real
  optimistic client against a live daemon (#11/#19).
- **`upsert(table, fullRow)` / PK-keyed local `update`** — collapses both the undo-restore
  3-call dance (#13) and per-token chat streaming (#21) into one call.

---

## Not candidates (recorded so they aren't re-litigated)

- `DecksKeepalive` (`src/rindle/DecksKeepalive.tsx`) already uses the Rindle `useSyncQuery`
  primitive — it's a documented recipe, not code to lift. Its existence points at the same
  cold-re-materialize flash as #5; fixing #5 may make it unnecessary.
- The per-type component tables, fragments, and named mutators in `shared/app-def.ts` are the
  app's domain model — Strut-specific by construction.
