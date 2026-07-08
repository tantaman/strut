// Canonical Strut dimensions & editor constants. See docs/STRUT_SPEC.md §2 (we pick the modern
// 16:9 1280×720 over the old 1024×768 — §13.5).

export const SLIDE_W = 1280;
export const SLIDE_H = 720;

// Overview "world" units. The impress exporter scales these up to slide space (§9.2).
export const OVERVIEW_CARD_GAP = 360;

// Gesture snaps (§11): move snaps to a 20px grid, rotate to 22.5°, skew to 15° (with shift).
export const GRID_SNAP = 20;
export const ROTATE_SNAP = Math.PI / 8;
export const SKEW_SNAP = Math.PI / 12;
// Skew drag feel: world-px the pointer travels to reach 45° of shear (atan2 baseline).
export const SKEW_BASE = 100;

// Text fonts (§6.3). A curated, role-organized typeface set loaded from Google Fonts.
// `FONTS` is the single source of truth: the picker options, their category grouping, AND the
// Google Fonts <link> URL (googleFontsHref — consumed in routes/__root.tsx and the impress export)
// all derive from it, so the loaded fonts can never drift out of sync with the chooser.
export type FontCategory = "sans" | "serif" | "display" | "mono" | "fun";

export interface FontDef {
  /** Display name — also the exact Google Fonts family name. */
  name: string;
  /** Weights to request from Google Fonts (first is the default). */
  weights: number[];
  category: FontCategory;
}

export const FONTS: FontDef[] = [
  // Sans — neutral workhorses for headings and body
  { name: "Inter", weights: [400, 600, 700], category: "sans" },
  { name: "Lato", weights: [400, 700], category: "sans" },
  { name: "DM Sans", weights: [400, 500, 700], category: "sans" },
  { name: "Space Grotesk", weights: [400, 500, 700], category: "sans" },
  // Serif — editorial and elegant
  { name: "Fraunces", weights: [400, 600, 700], category: "serif" },
  { name: "Playfair Display", weights: [400, 700], category: "serif" },
  { name: "Lora", weights: [400, 700], category: "serif" },
  // Display — big-impact headlines
  { name: "Anton", weights: [400], category: "display" },
  { name: "Archivo Black", weights: [400], category: "display" },
  // Monospace — code and technical
  { name: "JetBrains Mono", weights: [400, 700], category: "mono" },
  // Playful — personality
  { name: "Fredoka", weights: [400, 600], category: "fun" },
  { name: "Press Start 2P", weights: [400], category: "fun" },
];

export const DEFAULT_FONT = "Lato";
export const DEFAULT_FONT_SIZE = 72;

/** Flat list of family names — the shape the pickers historically consumed. */
export const FONT_FAMILIES = FONTS.map((f) => f.name);

/** Category labels + display order; the pickers render one <optgroup> per entry. */
export const FONT_CATEGORIES: { category: FontCategory; label: string }[] = [
  { category: "sans", label: "Sans-serif" },
  { category: "serif", label: "Serif" },
  { category: "display", label: "Display" },
  { category: "mono", label: "Monospace" },
  { category: "fun", label: "Playful" },
];

/** Fonts grouped by category (empty groups dropped), in picker display order. */
export const FONTS_BY_CATEGORY = FONT_CATEGORIES.map(({ category, label }) => ({
  category,
  label,
  fonts: FONTS.filter((f) => f.category === category),
})).filter((g) => g.fonts.length > 0);

/** The Google Fonts css2 stylesheet URL for the whole set, derived from `FONTS` so the loaded
 *  fonts always match the picker. Families are sorted for a stable, cache-friendly URL. */
export function googleFontsHref(): string {
  const families = [...FONTS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => `family=${f.name.replace(/ /g, "+")}:wght@${f.weights.join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export const FONT_SIZES = [144, 96, 72, 64, 48, 36, 24, 16, 12, 8];

export const newId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.floor(performance.now())}-${Math.floor(Math.random() * 1e9)}`;
