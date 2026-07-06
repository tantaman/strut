---
name: verify
description: Build, launch, and drive the Strut app to observe a change at runtime (browser SPA). Use before committing nontrivial editor/render/export changes.
---

# Verifying Strut (browser SPA + Rindle live-sync + Better-Auth)

Strut is a React SPA (TanStack Start + Vite) backed by a local Rindle daemon and a
guest-first Better-Auth session. Verification = drive the real editor in a headless
browser and capture pixels, not run tests.

## Launch

```bash
pnpm dev            # concurrently: rindle daemon (7600/7601) + vite web on :3000
```

**Auth env is REQUIRED for local dev** (or every `/api/auth/*` 500s → no guest session →
`canEdit` is false → NO editing chrome at all: no slide toolbar, no inserters, no add-slide).
`docs/AUTH_SETUP.md` says plain `pnpm dev` 500s "by design," but `server/auth.ts` has a
`better-sqlite3` node fallback (`auth.db`, auto-migrated) that works with just two vars in a
gitignored `.env`:

```
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<openssl rand -base64 32>
```

Restart `pnpm dev` after writing `.env`. Confirm no 4xx/5xx on load and the header shows
Undo/Redo/Theme (that means `canEdit` resolved true).

## Drive (headless Chrome via puppeteer-core)

No browser driver ships in the repo. Install `puppeteer-core` in a scratch dir (NOT the repo —
`npm` fails in this pnpm repo) and point it at the system Chrome:

```
executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

### Flow gotchas (learned the hard way)
- **Each fresh browser profile mints a NEW anonymous user.** A deck is only editable in the
  SAME session that created it (`canEdit = deck.owner_id === me`). To verify export/editing,
  create AND drive the deck in one browser session, or reuse a `userDataDir`.
- **New deck's first slide defaults to Body/markdown** (`DEFAULT_SLIDE_MODE='markdown'`), so
  the header shows the markdown format bar, not the object inserters. Click the slide toolbar's
  "Edit objects" button first to insert components.
- **Header collapses labels to icons** at narrow-ish widths — match inserter buttons by
  `title` ("Text"/"Image"/"Shapes"), not innerText.
- Key selectors: `.slide-canvas` (editor ready), `.hdr button[title=...]` (inserters),
  `.slide-toolbar button` (Body/Objects layer switch, titles contain "objects"/"body"),
  `.strut-md-host` (TipTap editable body), `.cmp[data-id]` (interactive objects),
  `.slide-locked-layer` (inert composited layer), `.well__ins-btn` (add slide),
  `.popover--menu button` (Share→export items).
- **Marquee needs real `page.mouse` events** (not `.evaluate(el.click())`) — that's what
  exercises canvas hit-testing (e.g. that an inert body underlay doesn't steal pointer events).
- Read-only surfaces: `/deck/$id/play` (Present) and well thumbnails both go through `SlideView`.
- Standalone HTML export: Share&export menu → "Standalone HTML"; set CDP
  `Page.setDownloadBehavior` to capture the file, then open it `file://` and screenshot.

## Cleanup
`.env`, `auth.db`, and any test decks in `rindle.db` are local/gitignored — leave or discard.
