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
- **Rindle** (incoming) for the data layer: a normalized SQL schema as source of truth → generated
  TypeScript → optimistic local store + live windowed queries + named mutators. Not yet wired up.
- Tailwind CSS is available; component-scoped CSS modules are also fine.

## Getting started

```bash
pnpm install
pnpm dev            # dev server on http://localhost:3000
pnpm build          # production build (client + SSR)
pnpm generate-routes # regenerate src/routeTree.gen.ts (also runs on dev/build)
pnpm test           # vitest
pnpm lint / format / check
```

Routes live in `src/routes` (file-based); the app shell is `src/routes/__root.tsx`.

## History

The prior in-progress React + cr-sqlite (vlcn.io) rewrite is archived at branch
`archive/cr-sqlite-rewrite` (tag `rewrite-archive-v1`) for reference. The feature-complete original
lives at `origin/old-master`.
