# Rindle integration notes — confusion log

Building Strut on Rindle (https://rindle.sh/docs/synced-app-quickstart.md), recording every point
of friction so the Rindle tooling / API / docs can be improved. Newest issues at the bottom of each
section. "FYI" = minor; "🔴" = cost real time / would block a newcomer.

## Architecture mapping (spec → Rindle)

- The Strut spec (§10.2) described a **per-deck SQLite DB + meta catalog** (the old cr-sqlite model).
  Rindle is a **single normalized DB with row-scoped sync** (one daemon, queries window by
  `deck_id`/`slide_id`). The spec explicitly blesses "the equivalent row-scoped sync" (§13), so this
  is fine — but a one-liner in the Rindle docs on "how do I model "one document = a subtree of rows"
  / multi-tenant scoping" would have shortened the mapping step.

## Data-model decisions made (for the rewrite, recorded here so they're not silent)

- Slide space **1280×720** (spec §13.5 recommends 16:9 over the old 1024×768).
- **Per-type component tables** (text/image/shape/video/webframe) sharing a spatial base, rather than
  one polymorphic table — to exercise Rindle's typed queries (spec §13.1).
- Explicit **`z_order` INTEGER** for stacking (spec §13.1; old "last touched wins" was non-deterministic).
- Slide order = **fractional index** TEXT column `sort` (see "Ordering" friction below).
- Selection kept **ephemeral** (client React state), not in the DB.
- Per-slide markdown body **dropped**; text lives in text components (spec §13.5).

## Friction encountered

### 🔴 1. Migration applier chokes on inline `-- comments`

`rindle migrate apply` failed with `daemon error 400: sqlite error during exec_ddl: incomplete
input` — no line number, no offending statement echoed. Cause: I had inline trailing comments after
column defs, e.g. `id TEXT, -- the id`. The "one statement per ';'" splitter evidently mishandles
inline `--` comments. Removing them (full-line comments only) fixed it.

- **Ask:** either support inline comments, or have the applier report WHICH statement failed (echo
  the statement text / index). "incomplete input" with no locator is very hard to debug on a 9-table
  migration.

### 🔴 2. Quickstart's `api.url: "/api"` double-prefixes the route → 404

The browser client builds request URLs as `api.url + routes.query`, and `routes.query` defaults to
the **absolute** `/api/rindle/query`. So the quickstart's `api: { url: "/api" }` resolves to
`/api/api/rindle/query`. Correct value is `api: { url: "" }` (same origin) — or set `routes` to
relative suffixes. Found by reading `@rindle/optimistic/dist/client.js`.

- **Ask:** fix the quickstart example, and/or make the client detect/normalize the double prefix, or
  document the `url`+`routes` join rule explicitly (it's `base.replace(/\/$/,"") + path`).

### FYI 3. `defineQuery` / `.where` API not shown in the quickstart

The quickstart query example only used `.orderBy().limit().countAs()`. I needed `.where` (filter
slides by `deck_id`, components by `slide_id`) — found `q.t.where.col(value)` (proxy, bare value =
`eq`) and operators `eq/ne/gt/.../inList` + `and/or` by reading `query.d.ts`/`operators.d.ts`. Worth
a `.where` example in the quickstart (filtering is table stakes for any real app).

### FYI 4. Codegen header is genuinely helpful

`rindle schema gen` emits a header explaining the TEXT→string()/INTEGER|REAL→number() mapping and
that `json<T>()`/literal-union refinements must be re-applied after each regen. Good DX.

### ✅ Verified end-to-end (data layer)

Before any UI: started daemon (`rindle up`) + API server (`tsx server/rindle-api.ts`) and exercised
the raw HTTP contract with curl. All worked first try once #1/#2 were fixed:

- `query` (decks) → returns a lease (`materializationId`, `leaseToken`, `queryKey`) ⇒ daemon
  materialized the AST.
- `authorizeQuery` rejects a missing `x-user` (`forbidden`).
- `mutate` createDeck + addSlide → `{accepted:true, output:{applied:true, cv, lmid…}}`.
- `read` (decks) → the deck row WITH `slideCount: 1` — the `countAs(rels.deckSlides)` relationship
  aggregate computed correctly through the daemon.
- `mutate` deleteDeck → authoritative cascade emptied slides+deck.
  The split predicted/authoritative mutator model + named queries are pleasant once the shapes click.

### ✅ `.folded` mutations are a perfect fit for drag

`mutate.foo.folded({ key: id }, args)` (debounced, last-value-wins) maps exactly onto the spec's
"high-frequency drags should fold to the last value" (§13.3). Move/resize/rotate on the canvas and
card drags in the overview all use it with `key` = component/slide id. No custom throttling needed.
This is a genuinely nice piece of the API.

### FYI 6. Polymorphic "all components on a slide" = N subscriptions

Strut components are 5 per-type tables (typed, per spec §13.1). To render one slide I run 5 live
queries (`useSlideComponents`) and merge by `z_order` in JS — and each live thumbnail/overview card
does the same, so a 12-slide deck opens ~60+ subscriptions. There's no UNION / polymorphic-set query
in the builder I could find, so the cost is inherent to the normalized choice.

- **Ask:** a documented pattern for "fetch a heterogeneous child set" (UNION view, or a recommended
  single polymorphic table with a typed `json<T>()` payload column) would help. Also: guidance on the
  practical ceiling for concurrent `useQuery` subscriptions.

### FYI 7. `.one()` → `useQuery` returns `R | null` — clean

`q.deck.where.id(x).one()` makes `useQuery(deckQuery(...))` return a single row or null, no array
unwrapping. Worked as hoped.

### ✅ RESOLVED (no Rindle change needed) — FYI 8. Casting `useQuery` rows to hand-written interfaces

The inferred row type from a `defineQuery` value is great inside the file that builds it, but passing
results across module boundaries into presentational components I ended up using `as unknown as
MyRow[]` rather than importing the inferred type. Likely my own ergonomics gap — a documented
"export this query's row type" recipe (e.g. `type Row = QueryData<typeof slidesQuery>[number]`) would
remove the casts.

**Update (0.1.6): the casts were never necessary — the extraction works cross-module, no Rindle fix
needed.** The recipe guessed above is _almost_ right; the exact form is:

```ts
import type { QueryData } from '@rindle/react'
type DeckDetail = NonNullable<QueryData<ReturnType<typeof deckDetailQuery>>>
type DeckDetailSlide = DeckDetail['slides'][number] // nested `.sub`/`.include` shapes included
```

Note `ReturnType<…>`: a `defineQuery` value is a CALLABLE `NamedQuery`, not a `Query`, so you extract
the `Query` from its return type, then `QueryData<Q>` (= `ReturnType<Q['materialize']>['data']`). The
FULL composed shape survives — deck row → `slides[]` → `texts[]/images[]/…` → columns — typed straight
off the schema + fragment composition, and `const d: DeckDetail | null = useQuery(query)` needs **no
cast** (works even for the `private | public` union the provider passes). Verified real (not silently
`any`) with negative type probes: assigning `string`→`number`, reading a non-existent column, etc. all
fail to compile as they should. `src/editor/DeckData.tsx` now uses derived types; the per-route
hand-written row interfaces (DeckRow/FullSlide/PlaySlide/…) are the same pattern and can be deleted the
same way. Net: delete the manual interfaces and the `as unknown as` casts; keep the schema as the one
source of truth.

### ✅ RESOLVED in 0.1.2 — 🔴 9. `@rindle/wasm@0.1.1` `rindle_bg.wasm` was broken: `__wbindgen_externrefs` exported the WRONG table

**Fixed in `@rindle/wasm@0.1.2`** (whole `@rindle/*` suite bumped to 0.1.2). Verified at the artifact
level (parsed `rindle_bg.wasm`): `__wbindgen_externrefs` now exports **table index 1 (externref,
growable=YES)** instead of index 0 (the non-growable funcref table). New wasm hash `06afe628…` ≠ broken
`c450acb0…`. Then verified the full runtime headlessly in Node (Node 24 has global `WebSocket`+`fetch`)
by driving the real `@rindle/optimistic` client against a live daemon+API: `createRindleClient()`
(auto-`initWasm`) → named live query reaches `resultType=complete` → optimistic `createDeck` applies
instantly (0→1) → WS sync confirms the row (with the `slideCount` countAs aggregate) → `deleteDeck`
cascades + syncs back. The browser uses this identical path. Original 0.1.1 diagnosis kept below.

Publish-visibility friction (minor): right after 0.1.2 was published, the public npm registry returned
HTTP 404 for the 0.1.2 manifest for ~a few minutes (CDN/propagation) while `npm view`/registry-API still
listed 0.1.1 as latest; a cache-busted `curl` (`?<nonce>` + `Cache-Control: no-cache`) eventually
surfaced it. Lesson: don't trust a first 404 as "not published" — re-probe with a cache-buster.

---

_Original 0.1.1 diagnosis (for the record):_
The published wasm fails to initialize in **every** engine (my Node smoke test AND the browser),
throwing on `createRindleClient` → `initWasm()`:

```
RangeError: WebAssembly.Table.grow(): failed to grow table by 4
  at __wbindgen_init_externref_table (@rindle/wasm/pkg/rindle.js:656)   // wasm.__wbindgen_externrefs.grow(4)
```

**Confirmed root cause** by parsing `rindle_bg.wasm` directly:

- The module defines two tables: `table[0]` = **funcref** (`min=max=307`, NOT growable — the
  call_indirect table) and `table[1]` = **externref** (`min=1024`, no max → growable).
- But the export `__wbindgen_externrefs` → **table index 0** (the funcref table). So the glue grows the
  non-growable funcref table instead of the growable externref table → deterministic RangeError.
- Browsers don't "handle it" (my earlier guess was wrong) — it fails identically in the browser. The
  reason rindle.sh works is that it must serve a **different/correctly-built** wasm than npm 0.1.1.
- Only `0.1.0-rc.5/rc.6/0.1.1` are on npm; nothing newer to upgrade to. This is a build/packaging bug
  in the published artifact (looks like a wasm-bindgen/wasm-opt table-export indexing issue).
- **This fully blocks the browser app** — the editor reaches "Connecting…" then throws. Everything
  ELSE (data layer, queries, mutators, API, SSR, build) is verified independently of wasm.
- **Ask / fix:** republish `@rindle/wasm` built so `__wbindgen_externrefs` points at the externref
  table (or matching the build that rindle.sh serves). Repro: `node` parse of the Table + Export
  sections (script in scratchpad) shows the index-0 mismatch.

### ✅ RESOLVED in 0.1.2 — 10. Browser runtime (WASM + WS sync) now verified end-to-end

Previously blocked by #9. With 0.1.2 the full optimistic runtime is verified (see #9): wasm engine +
WS sync + optimistic apply + server rebase, driven through the real `@rindle/optimistic` client. This
is the same code path the browser runs, so the in-browser editor is unblocked. (SSR remains safe by
construction: the client is lazy + dynamic-imported, and the SSR build confirms no wasm import leaks
server-side.)

### FYI 5. Routes constant is exported but the join rule isn't documented

`DEFAULT_RINDLE_API_ROUTES` (`/api/rindle/{query,read,mutate}`) is exported from `@rindle/api-server`
and mirrored privately in the client — handy, but see #2: the client `url`+`routes` composition is
the actual contract and it's only discoverable by reading the compiled JS.

### ✅ 11. Adding new mutators + headless verification: smooth

Building the selection inspector (text font/size/color, shape fill, z-order, css classes) added no new
friction — the predicted/authoritative twin pattern is mechanical once the shapes click, and a
client↔server twin parity check is just `grep` (every client mutator name must have a server twin or
the mutation is silently rejected → optimistic snap-back; a missing twin is the #1 footgun, so a
`rindle check` that diffs client `ClientRegistry` keys vs `defineApiMutators` keys would be a great
lint).

- **Recipe worth documenting:** the whole optimistic runtime can be exercised **headlessly in Node**
  (Node ≥22 has global `WebSocket`+`fetch`): `createRindleClient({api:{url:"http://127.0.0.1:7700"},
daemon:{wsUrl:"ws://127.0.0.1:7601"}})` against a live daemon+API, then
  `store.materialize(namedQuery(args))`, `view.subscribe(()=>{})`, poll `view.resultType` to
  `"complete"`, fire `mutate.*`, and assert on `view.data` after a short sleep. This caught nothing
  broken this round (good) and is how #9/#10 were verified. A `@rindle/testing` harness wrapping this
  would make app authors' integration tests trivial. (Verified: `store.materialize(q)` drives the
  remote lease on its own — it reaches `resultType="complete"` with data even with no `.subscribe()`
  listener, so a one-shot script read is just materialize + poll. `subscribe` is only needed to react
  to later changes.)

### ✅ 13. Undo/redo is clean as a pure client-side command stack — two small frictions

Implemented spec §3.7 (bounded-20 `{label,undo,redo}` history, atomic `batch()`) entirely on the
client: every editor op records an inverse built from the SAME named mutators (move↔move,
add↔removeComponent, delete↔reinsert, edit↔edit-with-old-value). No Rindle primitive needed, and it
composes with optimistic sync for free — undo just fires another optimistic mutation. Verified in real
headless Chrome (Cmd+Z removes an added component, Cmd+Shift+Z restores it). Two friction points:

- **Re-inserting a deleted row needs add\* + transformComponent + setComponentClasses (3 mutators).**
  The `add*` mutators only take position + type fields and reset the spatial base (scale/rotate/skew/
  z) via `spatialBase`, so restoring a moved/rotated/resized component on undo (or on import/duplicate)
  is a 3-call dance. An `upsert(table, fullRow)` or an add that accepts the whole spatial base would
  make undo/import/duplicate one call. (Re-inserting by the ORIGINAL id after a delete works fine —
  insert of a previously-deleted id is accepted, which is what makes redo-of-delete / undo-of-delete
  stable.)
- **Undo of a slide delete must snapshot the slide's components first** (the server cascades component
  rows by slide_id, so they're gone after delete). That's the polymorphic 5-query read again (#6/#12)
  on a hot path (every slide delete now does a `readSlideComponents` before deleting). A
  `store.readOnce(query)` (#12) plus a cascade that's _reversible_ (or a delete that returns the
  deleted subtree) would remove the snapshot boilerplate. Net: undo/redo didn't need anything FROM
  Rindle, but a full-row upsert + a one-shot subtree read would make the surrounding code much smaller.

### FYI 12. Export amplifies the polymorphic-component cost (#6)

JSON / standalone-HTML export needs a one-shot read of the _whole_ deck subtree. With 5 per-type
component tables that's `slides × 5 + 3` materializations (one per component query per slide, plus
deck/slides/customBackgrounds). The `materialize → poll resultType → read → destroy` one-shot pattern
(no subscriber) made this clean and it's fast locally, but a `store.readOnce(query): Promise<data>`
convenience (or a documented subtree/batch read) would remove the boilerplate and the N-query
amplification. Cross-ref #6 (no polymorphic/UNION set query).

### FYI 14. Server-side authorization can't read the DB _from the authorize hook_ — two gaps

Adding per-user ownership + sharing (decks scoped by `owner_id`, `deck_share` collaborators) meant
figuring out where row-level checks live. The authorize hooks turn out to be coarse-grained by design,
and the right enforcement points are query-scoping (reads) and mutators (writes). Two ergonomic gaps
surfaced while wiring it:

- **The authorize input has no daemon / no `read(query)` helper.** `authorizeQuery` gets
  `{user, name, args, context}` and `authorizeMutation` gets `{user, envelope, context}`, where
  `context = ApiContext = {user, request}` — no DB handle. Mutators, by contrast, get
  `MutationContext = {user, envelope, daemon, request}`. So a _self-contained, unit-testable_
  authorizer can't look anything up; you'd have to close over the module-scope `HttpRindleDaemonClient`
  we construct (works, since `Authorizer` may be async, but it's not a first-class affordance).
  **Ask:** pass `daemon` (or a `read(namedQuery)` helper) into `AuthorizeQueryInput`/`AuthorizeMutationInput`
  for symmetry with `MutationContext`.
- **No raw-SQL read-with-rows from server code.** The only daemon read is AST-based —
  `daemon.query({ast}): {rows}` — so checking one column's value (e.g. `deck.owner_id`) means building
  a whole query AST (`q.deck.where.id(deckId).select('owner_id').one()` → extract AST → `daemon.query`).
  Raw SQL only exists as `tx.exec` (void, write-side) inside a mutation and `executeSqlTxn` (returns
  apply metadata — `cv`/`lmid` — not SELECT rows). **Ask:** a `daemon.selectSql(sql, params): rows`
  (or a way for a mutator to read back through `tx`) would turn an ownership check into a one-liner.
- **Net (not a blocker):** reads are best secured by _scoping the query itself_ (context injection +
  `existsNoSync` permission gates — server-only, pruned from the client footprint), so you never read
  in `authorizeQuery`; writes are enforced inside the mutator (which has `ctx.daemon` + `tx`). The two
  asks above would mainly help when you _want_ a symmetric authorize-hook policy layer.

### 🔴 15. `existsNoSync` in a SHARED `defineQuery` returns empty on the client — you must split client/server twins

Cost real time. Implementing read-gating, I scoped each deck-subtree query with `existsNoSync` inside
the ONE `defineQuery` that both tiers import. Result: every gated query returned **empty on the client**
— even for the owner, even for their own rows. The deck/dashboard queries _appeared_ to work only
because their gate was `or(fieldCondition('owner_id', user), existsNoSync(deckShares…))` and the owner
matched the plain `fieldCondition` branch; the pure-`existsNoSync` child queries (slides/components)
returned 0 for everyone.

- **Root cause:** `existsNoSync` is a _server-only_ gate — its witness rows are pruned from the client
  footprint, so the client can't evaluate it (it has no witnesses) and the predicate collapses to false.
  The d.ts even says "use this when building the **server's** query; the client holds its own un-gated
  query." The trap: a `defineQuery` is used by BOTH tiers by default, so "the client holds its own
  un-gated query" actually means **define the query TWICE** — an un-gated client version and a gated
  server version under the SAME `queryName` — not once-and-shared. That's not obvious from the API shape.
- **Fix that works (verified):** `shared/queries.ts` = un-gated client queries (the local store only ever
  holds what the server synced, so reading it un-gated is correct + safe); `server/queries.ts` = gated
  twins (same names, `existsNoSync` + `ctx.user`) registered via `registerQueries`. The daemon
  materializes the server twin, so a client can't widen its scope. Verified end-to-end: owner/editor/
  viewer see a shared deck + its slides/components; a stranger sees nothing; `existsNoSync` nests fine
  server-side (component → slide → deck, 3 levels deep).
- **Asks:** (a) make the split a first-class concept — e.g. `defineQuery(name, validate, clientBuild,
{ serverBuild })` or `clientQuery.gated(serverBuild)` — so the wire name can't drift and the intent is
  legible; (b) have `existsNoSync` THROW (or warn) if it's ever evaluated on the client/optimistic store
  instead of silently returning empty — the silent-empty cost the most time; (c) one worked example in
  the docs of "un-gated client query + gated server twin under the same name".

### FYI 16. Write-enforcement via conditional SQL is clean; silent 0-row drop is the caveat

Role-based write-enforcement (owner/editor may write, viewer/stranger may not) is done entirely with
access-guarded SQL in the mutators: `INSERT … SELECT … WHERE <deck/slide is editable by ctx.user>` and
`UPDATE/DELETE … WHERE id = ? AND <editable>` (helpers `EDITABLE_DECKS`/`EDITABLE_SLIDES`,
`insertIf`/`updateIf`). No daemon read needed (cross-ref #14). Verified: an editor's edit persists; a
viewer's / stranger's identical edit changes 0 rows; a stranger can't inject a component or self-add as
a collaborator. **Caveat:** an unauthorized write is a silent 0-row no-op — the server still "accepts"
the mutation (no rejection), so the actor's optimistic overlay lingers until a rebase rather than
snapping back. Fine here because the editor UI gates editing by role (a viewer never fires writes), so
the guards are defense-in-depth. A `tx.exec`-with-rowcount (reject when 0 rows touched) or a way to
signal "forbidden" from a guarded write would let the client snap back immediately.

### ✅ 17. Public (bearer-token) read links: gate on a row field, not the principal

The public read-only share link (`/share/:deckId?t=<token>`) reuses the split-twin pattern from #15,
but the _gate_ is a bearer credential rather than the principal. The server twins
(`publicDeck`/`publicSlides`/`public<Type>Components`) take the token as a **query arg** and gate with a
plain field match on the deck — `and(fieldCondition('visibility','public-read'), fieldCondition('share_token', token))`
— climbing child→deck via `existsNoSync` for slides/components exactly like the owner/collab twins. No
`ctx.user` appears in these queries at all, so a stranger (any non-empty principal) syncs the deck subtree
purely by holding the link. Three things that made it safe + clean:

- **Required, non-empty token** in the arg parser (both tiers) so a private deck's empty `share_token`
  can never be matched, and both clauses must hold so flipping visibility back to `private` (token `''`)
  instantly kills every outstanding link.
- **The token rides in the subscription identity.** `defineQuery('publicSlides', {deckId, token})` makes
  the public subscription a _distinct_ wire identity from the authenticated `slides` one — same daemon
  materialization machinery, no special-casing.
- **One render path.** Threading an optional `token` through `useSlideComponents`/`SlideThumb` (it just
  picks the `public*` query variant) let the existing present-mode renderer serve the public viewer with
  zero duplication. Verified end-to-end with two isolated browser principals: stranger views via link,
  is denied the normal deck route until added as a collaborator, then gets a live read-only editor.

### ✅ 18. The server access gates can be CAST-FREE — the `Cond<unknown>`/`as never` was self-inflicted

Earlier critique was wrong and is retracted here: the predicate API is NOT weakly typed. The
`Cond<unknown>` / `as never` / `(s: any)` cascade in `server/queries.ts` came entirely from reaching for
`fieldCondition(field: string, arg: unknown)` on **static** field names.

- **Root cause:** `Cond<R>` is `Condition & { readonly __row?: R }` — phantom-**branded** to the row it
  filters, which is what lets `.where(cond: Cond<RowOf<C>>)` reject a condition meant for another table.
  `fieldCondition` takes a bare string field, so it _cannot_ recover `R` and returns an **unbranded**
  `Condition`. One of those inside `or()`/`and()` poisons the inference → the whole gate widens to
  `Cond<unknown>` → not assignable to `.where(Cond<RowOf<deck>>)` → forced `as never`.
- **The typed path was there all along.** A `TableDef` doubles as a standalone, row-branded condition
  builder: `deck.owner_id(user)` ⇒ `Cond<RowOf<deckCols>>` (the value is typed via `Arg<ColT>`), and
  `existsNoSync`/`and`/`or` already preserve the brand. Rewriting the static names to it
  (`deck.visibility('public-read')`, `deck_share.user_id(user)`, …) made `deckAccess`/`publicAccess`
  infer the right `Cond<RowOf<…>>` and every gate `.where(...)` typecheck with **zero casts**; the
  `existsNoSync` callbacks also drop their gratuitous `(s: any)` (`s` is already `Query<CC>`).
  Behavior-identical — a bare value is `eq` sugar, the same simple condition `fieldCondition` built.
- **Takeaway:** use `fieldCondition` ONLY for genuinely dynamic (runtime-string) field names; for static
  columns use the table-def builder and the security-critical file stays cast-free. (Verified: `tsc`
  clean, client+SSR build green, eslint on the file 4→2 — the 2 left are unrelated `reqString`/`reqLimit`
  baseline.)

### FYI 19. `useFragment` masks; the raw `QueryData` node type does NOT — they're different reads

When deriving types from a composed query (`DeckDetail = NonNullable<QueryData<ReturnType<typeof
deckDetailQuery>>>`, then `DeckDetail['slides'][number]['texts'][number]`), the nested component node is
typed to the **full** included columns, not the fragment's `.select()` mask. A throwaway probe confirmed
`texts[0].image_type` (an image column) is **accepted** on a text node from the raw query data, while
`images[0].text` and `shapes[0].nonsense` are correctly rejected — so the type is concrete (not `any`),
just not masked. The strict projection mask only applies through `useFragment(TextFragment, node)`, which
returns `Pick<RowOf, Sel>`. Practical rule: lean on `useFragment` (the read path) when you want masking
enforced; don't assume `QueryData` of an `.include()`d subtree gives you the same narrowing. Not
necessarily a bug — `Pick` only ever removes fields, so a wider node type is still sound against the
runtime row — but worth knowing before you treat a raw query-data node as if it were masked.

### 🟡 20. SSR seed→live handoff flashes EMPTY for one daemon round-trip — the seed is dropped on `hello`, not `snapshot` — PARTIALLY addressed in @rindle 0.4.4, workaround STILL required

**0.4.4 restructured seed handling but the dashboard flash STILL reproduces — the `src/routes/index.tsx`
workaround stays.** Verified by runtime A/B (headless Chrome, hard-reload `/`, sample the deck grid every
animation frame across the seed→live swap):

| `index.tsx` | dashboard first paint |
| --- | --- |
| `useQueryStatus`/`lastComplete` bridge PRESENT (shipped) | cards=1 steady — **no flash** |
| bridge REMOVED (plain `useQuery`) | cards 1 → 0 (`.dash__empty` "No decks yet") → 1 — **flash ~40ms** |

- **What 0.4.4 changed.** The seed now lives in the Store's `seeds` map (not `view.seeded` as the trace
  below described) and is retired on the first live `snapshot`, not `hello` (`@rindle/client/dist/store.js`
  seeds-map + `onEvent`). That closes the gap for an **async ws** backend (seed shows until snapshot).
- **Why the flash persists for STRUT anyway.** Strut's live client is the **synchronous wasm** backend.
  In `registerMaterialized` (`store.js:309-314`) the wasm engine resets the view to its LOCAL result
  *inside* `registerQuery`, BEFORE `view.seed(seed.rows)` runs — and the code's own comment says so: "A
  synchronous backend (wasm) already reset the view above, so its live data wins and **the seed is inert**."
  `decksQuery` can't be computed locally at that instant (its rows + the `slideCount` `countAs` aggregate
  aren't synced yet — they arrive a WS round-trip later), so the wasm view reads `[]` for that window → the
  empty flash. The seeds-map retirement fix never gets a chance to bridge it because the seed was already
  overridden at register time.
- **Bottom line.** `index.tsx`'s `lastComplete` bridge is still load-bearing. The other `useQueryStatus`
  gates (`deck.$deckId.tsx` `accessResolved`, `ResearchView.tsx` `notesResolved`) are a DIFFERENT concern
  ("wait for authoritative data before judging access / seeding un-rebasing editors") and were never about
  this flash. The real fix still belongs in `@rindle`: make `view.seed()` authoritative over a
  synchronous-backend register-time reset (don't let an un-synced local `[]` win over a present seed), and
  retire it on the first real snapshot. Original write-up (pre-0.4.4 trace) preserved below.



Cost real time (and one wrong first fix). Symptom: a route that SSR-seeds its first paint (dashboard
`decksQuery`) visibly flashes its empty state ("No decks yet" + "0 presentations") for a beat on load,
THEN the seeded rows appear — the exact "splash→content" flicker `RindleSSR` is supposed to eliminate.

- **NOT a server/seed bug — the seed is provably correct.** Created a deck via `/api/rindle/mutate` for
  a fresh anon session, then `GET /`: the first-paint HTML contains the `deck-card__name` AND the
  dehydrated seed row (matching `owner_id`), `No decks yet` count 0. Also confirmed the SSR read
  (`readNamedQuery` → daemon :7600) and the live WS (:7601) hit the SAME daemon `rindle.db`, so it isn't
  staleness. The flash is 100% client-side, in the `@rindle/react` seed→live handoff.
- **Root cause (traced through the compiled client).** At the swap, `RindleSSR` hydrates the live store's
  seeds map then flips `store: liveStore ?? seedStore` (`@rindle/react/dist/index.js:71,78`). `useQuery`
  re-materializes on the wasm store → `store.registerMaterialized` calls `backend.registerQuery`
  (`@rindle/client/dist/store.js:291`), which fires a `hello` → `view.reset()` sets `_schema` and
  **NULLS `seeded`** (`view.js:146,149`). The follow-up `view.seed(seed.rows)` (`store.js:303`) is then
  **INERT**, because `get data()` only returns `seeded` while `_schema === null` (`view.js:197-199`) —
  after the reset it returns the live projected `top`, which is `[]`. The real rows don't arrive until a
  LATER `snapshot` event, one daemon round-trip after the `hello` that already cleared the seed. **That
  gap is the empty frame.** So the "seed the live views so the swap doesn't flash empty" comment at
  `index.js:71` is not actually true for a wasm backend that resets-on-register: the reset beats the seed.
- **Why prior verification missed it.** The seed was verified via SSR HTML / curl, which shows the seed
  is embedded but says nothing about the post-hydration client timing — the flash only exists in the
  browser, in the swap→first-snapshot window.
- **App-side workaround (shipped in strut `src/routes/index.tsx`).** Gate on `useQueryStatus(decksQuery)`:
  hold the last `'complete'` result (which starts as the SSR seed) through the post-swap `'unknown'`
  window, and only trust the live result once it reports `'complete'`. Degrades cleanly (empty stays
  empty; daemon-down keeps showing the seed). This is per-component boilerplate that every seeded route
  would otherwise need (the editor `deck.$deckId.tsx` has the same gap, un-worked-around).
- **Ask / fix (belongs in `@rindle`):** keep the SSR seed authoritative until the first live **snapshot**,
  not the `hello`. Concretely: don't null `view.seeded` in `reset()` and have `get data()` fall back to
  `seeded` while a freshly-reset view is still empty-and-un-hydrated (`resultType === 'unknown'`); retire
  the seed only when the first snapshot lands (`store.js:324-327` currently deletes it on `hello`). Then
  `RindleSSR`'s live-store hydrate would actually bridge the gap and NO app would need the `useQueryStatus`
  dance. (Secondary: if the reset-on-register is intended, the `index.js:71` "doesn't flash empty" comment
  is misleading and should be corrected.)

### FYI 21. `writeLocal`'s `edit` wants the FULL old row — for a streamed local update, let `old` be just the PK

Found spiking a memory-only `chat_message` table (`table(name,{local:true})` + `extendSchema` + a local
`useQuery`) for an "chat with an LLM about your deck" panel: the streamed assistant turn is one row whose
`content` column grows per token. `store.writeLocal(tx => …)` (the direct-commit path for local tables,
`201-LOCAL-ONLY-TABLES-DESIGN.md` §6) is the right primitive — no sync, no rebase, no `.folded` needed —
but the write shape makes the hot path awkward:

- `WriteTx.edit<N>(table, oldRow: RowOf, newRow: RowOf)` requires the **complete** old row (every column,
  per the store.d.ts note "they identify an EXISTING row, so every column must be present"). So bumping one
  column per token means holding/reconstructing the entire previous row every chunk:
  `tx.edit('chat_message', prev, { ...prev, content: next })` — and threading `prev` through the stream
  loop purely to satisfy the signature.
- For a **local** table this is redundant: the row is untracked and already authoritative in the local
  engine (that's the whole point of `writeLocal` — "moves on its own"), so `edit` could look the current
  row up internally from the PK. The full-old-row contract exists for the synced/optimistic diff path; the
  direct-commit local path doesn't need it.
- **Ask:** for `writeLocal`, let `edit` accept just the primary key on `old` (engine reads the rest), or add
  a local `update(table, pkPlusPartialCols)` / `upsert(table, fullRow)`. This is the same underlying wish as
  #13's `upsert(table, fullRow)` ask (re-inserting a moved/rotated component took 3 calls) — a partial/PK-
  keyed local write would collapse both the undo-restore dance and per-chunk streaming into one call. Net:
  not a blocker (holding `prev` is trivial for a small chat row), but a per-token `edit` that needs the full
  prior row reads as accidental friction for the canonical local-table use case (draft/scratch text).
