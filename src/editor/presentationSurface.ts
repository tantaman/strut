import { backgroundImage, composeBackground, resolveSurface } from './types'

/** Resolve the world behind a presented slide, including an inherited deck/slide image layer. */
export function presentationSurfaceBackground(
  slideSurface: string | null | undefined,
  deckSurface: string | null | undefined,
): string {
  const slide = slideSurface ?? undefined
  const deck = deckSurface ?? undefined
  return composeBackground(
    resolveSurface(slide, deck),
    backgroundImage(slide, deck),
  )
}
