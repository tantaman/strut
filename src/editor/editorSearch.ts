export interface EditorSearch {
  slide?: string
}

export interface SlideRef {
  id: string
}

type SlideLike = string | SlideRef

/** Keep only the editor's durable location. Legacy mode/search data is intentionally discarded. */
export function parseEditorSearch(raw: Record<string, unknown>): EditorSearch {
  return typeof raw.slide === 'string' ? { slide: raw.slide } : {}
}

/** Resolve the slide a presentation opens on, falling back to the first slide. */
export function playStartIndex(
  slides: readonly SlideLike[],
  slide?: string,
): number {
  if (slide === undefined) return 0
  const index = slides.findIndex((candidate) => slideId(candidate) === slide)
  return index >= 0 ? index : 0
}

/** Return from Play to the slide currently being presented, with no editor-mode state. */
export function playExitSearch(
  slides: readonly SlideLike[],
  currentIndex: number,
  fallbackSlide?: string,
): EditorSearch {
  const slide =
    currentIndex >= 0 && currentIndex < slides.length
      ? slideId(slides[currentIndex])
      : fallbackSlide
  return slide === undefined ? {} : { slide }
}

function slideId(slide: SlideLike): string {
  return typeof slide === 'string' ? slide : slide.id
}
