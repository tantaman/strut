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
  a `rindled` daemon behind the app's own server routes. See `RINDLE_NOTES.md` for the write-up.
- Plain CSS for the editor chrome (`src/strut.css`); Tailwind is available for one-offs.

## Architecture

- **`rindled` daemon** — owns the SQLite DB + the live-query WebSocket (`:7600` control, `:7601` ws).
- **API** — TanStack Start server routes (`src/routes/api.rindle.*`) host the stateless Rindle API
  (`server/rindle-api.ts`): they validate args, run authoritative SQL mutators, and register the named
  queries. Same-origin, no separate process. Image uploads (`server/upload.ts`) go to Cloudflare R2
  when configured, else a local dev fallback. Mirrors the predicted client mutators in
  `shared/app-def.ts`.
- **Browser client** (`src/rindle/*`) — the optimistic store (`@rindle/optimistic` + WASM), `useQuery`
  live reads, and `app.mutate.*` writes, posting to `/api/rindle/*`. The live-query WebSocket connects
  directly to the daemon (`:7601`).

Schema lives in `migrations/`; `shared/` holds the generated schema, query builder, named queries, and
client mutators (imported by both browser and server). App code is in `src/` (`routes/`, `editor/`,
`rindle/`).

## Getting started

```bash
pnpm install

# Daemon + web (via concurrently; the API is served by the web app):
pnpm dev                  # applies migrations, regenerates schema, watches on http://localhost:3000
```

Then open http://localhost:3000. Other scripts:

```bash
pnpm build            # production build (client + SSR + API routes)
pnpm daemon           # rindled daemon + migration/schema watcher
pnpm dev:web          # just vite (web + API routes)
pnpm generate-routes  # regenerate src/routeTree.gen.ts
pnpm setup            # one-shot migrate + schema regen against a running daemon
pnpm test             # vitest
```

While `pnpm dev` or `pnpm daemon` is running, edits to `migrations/` are applied and
`shared/schema.ts` is regenerated automatically.

## History

The prior in-progress React + cr-sqlite (vlcn.io) rewrite is archived at branch
`archive/cr-sqlite-rewrite` (tag `rewrite-archive-v1`) for reference. The feature-complete original
lives at `origin/old-master`.
