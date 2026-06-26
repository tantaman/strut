// Types for the composed deck query. The one-shot/export path reads full materialized query data,
// while React roots read slide component relationships as fragment refs through `useRoot`.
import type { FragmentData, QueryData } from '@rindle/react'
import type { SlideFragment } from '../../shared/fragments'
import type { deckDetailQuery } from '../../shared/queries'

export type DeckDetail = NonNullable<
  QueryData<ReturnType<typeof deckDetailQuery>>
>
export type DeckDetailSlide = DeckDetail['slides'][number]
export type SlideDetail = FragmentData<typeof SlideFragment>
export type DeckRoot = Omit<DeckDetail, 'slides'> & {
  slides: SlideDetail[]
}
