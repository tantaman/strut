// Types for the composed deck query, derived straight from the query value (no hand-written
// interfaces, no casts — see RINDLE_NOTES #8). `DeckDetailSlide` is the per-slide node the relay
// render tree passes around as a fragment ref (it equals `FragmentRef<typeof SlideFragment>`).
import type { QueryData } from '@rindle/react'
import { deckDetailQuery } from '../../shared/queries'

export type DeckDetail = NonNullable<
  QueryData<ReturnType<typeof deckDetailQuery>>
>
export type DeckDetailSlide = DeckDetail['slides'][number]
