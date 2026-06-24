# Strut

An HTML5 GUI authoring tool for **spatial presentations** — build a deck of slides, place rich
content on each, arrange the slides in 3-D space, and play the deck as a camera flight through that
world (the impress.js model, made visual and editable).

This repository is a **ground-up rewrite**. The authoritative description of what Strut is and how it
behaves lives in **[`docs/STRUT_SPEC.md`](docs/STRUT_SPEC.md)** — a framework-agnostic behavior +
data-model spec reverse-engineered from the feature-complete 2012 build. Treat it as the source of
truth; this app implements it.

## Stack

- **React 19** + **[TanStack Start](https://tanstack.com/start)** (file-based routing, SSR) on **Vite**.
- **[Rindle](https://rindle.sh)** for the data layer (wired): SQL migrations as source of truth →
  generated TypeScript schema → optimistic local store + live windowed queries + named mutators, with
  a `rindled` daemon and a stateless API server. See `RINDLE_NOTES.md` for the integration write-up.
- Plain CSS for the editor chrome (`src/strut.css`); Tailwind is available for one-offs.

## Architecture

Three tiers (Rindle):

- **`rindled` daemon** — owns the SQLite DB + the live-query WebSocket (`:7600` control, `:7601` ws).
- **API server** (`server/rindle-api.ts`, `:7700`) — stateless; validates args, runs authoritative SQL
  mutators, registers the named queries. Mirrors the predicted client mutators in `shared/app-def.ts`.
- **Browser client** (`src/rindle/*`) — the optimistic store (`@rindle/optimistic` + WASM), `useQuery`
  live reads, and `app.mutate.*` writes. The Vite dev server proxies `/api/rindle/*` → `:7700`.

Schema lives in `migrations/`; `shared/` holds the generated schema, query builder, named queries, and
client mutators (imported by both browser and server). App code is in `src/` (`routes/`, `editor/`,
`rindle/`).

## Getting started

```bash
pnpm install

# Terminal 1 — daemon + API server + web (all three, via concurrently):
pnpm dev                  # web on http://localhost:3000

# Terminal 2 — first run only, while the daemon is up: apply migrations + regen schema
pnpm setup
```

Then open http://localhost:3000. Other scripts:

```bash
pnpm build            # production build (client + SSR)
pnpm daemon           # just the rindled daemon
pnpm dev:api          # just the API server (tsx watch)
pnpm dev:web          # just vite
pnpm generate-routes  # regenerate src/routeTree.gen.ts
pnpm test             # vitest
```

After editing `migrations/`, re-run `pnpm setup` to apply + regenerate `shared/schema.ts`.

## History

The prior in-progress React + cr-sqlite (vlcn.io) rewrite is archived at branch
`archive/cr-sqlite-rewrite` (tag `rewrite-archive-v1`) for reference. The feature-complete original
lives at `origin/old-master`.
