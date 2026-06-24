// Canonical Strut dimensions & editor constants. See docs/STRUT_SPEC.md §2 (we pick the modern
// 16:9 1280×720 over the old 1024×768 — §13.5).

export const SLIDE_W = 1280;
export const SLIDE_H = 720;

// Overview "world" units. The impress exporter scales these up to slide space (§9.2).
export const OVERVIEW_CARD_GAP = 360;

// Gesture snaps (§11): move snaps to a 20px grid, rotate to 22.5°.
export const GRID_SNAP = 20;
export const ROTATE_SNAP = Math.PI / 8;

// Text font state (§6.3).
export const DEFAULT_FONT = "Lato";
export const DEFAULT_FONT_SIZE = 72;
export const FONT_FAMILIES = [
  "Lato",
  "League Gothic",
  "Droid Sans Mono",
  "Ubuntu",
  "Abril Fatface",
  "Hammersmith One",
  "Fredoka One",
  "Gorditas",
  "Press Start 2P",
];
export const FONT_SIZES = [144, 96, 72, 64, 48, 36, 24, 16, 12, 8];

export const newId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.floor(performance.now())}-${Math.floor(Math.random() * 1e9)}`;
