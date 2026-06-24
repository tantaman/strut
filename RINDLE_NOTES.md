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

### FYI 8. Had to cast `useQuery` rows to hand-written interfaces in a couple spots
The inferred row type from a `defineQuery` value is great inside the file that builds it, but passing
results across module boundaries into presentational components I ended up using `as unknown as
MyRow[]` rather than importing the inferred type. Likely my own ergonomics gap — a documented
"export this query's row type" recipe (e.g. `type Row = QueryData<typeof slidesQuery>[number]`) would
remove the casts.

### 🔴 9. `@rindle/wasm@0.1.1` `rindle_bg.wasm` is broken: `__wbindgen_externrefs` exports the WRONG table
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

### ⚠️ 10. Browser runtime (WASM + WS sync) therefore unverified end-to-end here
Verified: data layer over HTTP (curl), client+SSR production build, SSR shell render, and the full
Vite→API→daemon proxy returning leases. NOT verified in this environment (per #9): the in-browser
wasm engine + ws sync + optimistic apply/rebase. Needs a manual `pnpm dev` + open localhost:3000.
(SSR is safe by construction: the client is lazy + dynamic-imported, and the SSR build confirms no
wasm import leaks server-side.)

### FYI 5. Routes constant is exported but the join rule isn't documented
`DEFAULT_RINDLE_API_ROUTES` (`/api/rindle/{query,read,mutate}`) is exported from `@rindle/api-server`
and mirrored privately in the client — handy, but see #2: the client `url`+`routes` composition is
the actual contract and it's only discoverable by reading the compiled JS.
