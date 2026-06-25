// One composed subscription for a whole deck (rindle.sh fragments — see shared/fragments.ts).
//
// The editor, presenter and share viewer each mount ONE <DeckDataProvider> near the top of the deck
// view. It runs a single `deckDetailQuery` (or its token-gated public twin) and exposes the deck row,
// its slides, the merged+z-ordered components per slide, and custom backgrounds. Descendants — the
// stage, every well thumbnail, every overview card — read from this context instead of opening their
// own per-type live queries, so a deck is ONE subscription instead of `deck + slides + 5×N + …`.
//
// Tradeoff: a single composed view is a coarser reactivity unit than the old per-slide queries — any
// edit anywhere in the deck invalidates it, so all consumers re-render (vs. only the touched slide
// before). Strut slides are cheap DOM (scaled divs), so this is fine in practice; if a very large
// deck ever needs finer granularity, layer per-slide memo/selectors on `componentsBySlide` here
// without touching call sites.

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery, useQueryStatus } from '@rindle/react'
import type { QueryData, ResultType } from '@rindle/react'
import { deckDetailQuery, publicDeckDetailQuery } from '../../shared/queries'
import { mergeComponents, type AnyComponent } from './types'

// Derived straight from the composed query — no hand-written interface to drift from the schema or the
// fragment composition, and `useQuery` returns it WITHOUT a cast. `QueryData<Q>` is the data a query's
// view yields; the NamedQuery is callable, so `ReturnType<typeof …>` is the Query `Q`. (Verified that
// this cross-module extraction is real, not `any`, with negative type probes — see RINDLE_NOTES #8.)
export type DeckDetail = NonNullable<
  QueryData<ReturnType<typeof deckDetailQuery>>
>
export type DeckDetailSlide = DeckDetail['slides'][number]

interface DeckDataValue {
  deck: DeckDetail | null
  slides: DeckDetailSlide[]
  componentsBySlide: Map<string, AnyComponent[]>
  customBackgrounds: DeckDetail['customBackgrounds']
  status: ResultType
}

const EMPTY_SLIDES: DeckDetailSlide[] = []
const EMPTY_BG: DeckDetail['customBackgrounds'] = []

const DeckDataContext = createContext<DeckDataValue | null>(null)

export function DeckDataProvider({
  deckId,
  token,
  children,
}: {
  deckId: string
  // When present, read through the public read-only link query (the /share viewer carries the token).
  token?: string
  children: ReactNode
}) {
  const query = token
    ? publicDeckDetailQuery({ deckId, token })
    : deckDetailQuery({ deckId })
  const detail: DeckDetail | null = useQuery(query)
  const status = useQueryStatus(query)

  const componentsBySlide = useMemo(() => {
    const map = new Map<string, AnyComponent[]>()
    for (const s of detail?.slides ?? EMPTY_SLIDES) {
      map.set(
        s.id,
        mergeComponents(s.texts, s.images, s.shapes, s.videos, s.webframes),
      )
    }
    return map
  }, [detail])

  const value = useMemo<DeckDataValue>(
    () => ({
      deck: detail,
      slides: detail?.slides ?? EMPTY_SLIDES,
      componentsBySlide,
      customBackgrounds: detail?.customBackgrounds ?? EMPTY_BG,
      status,
    }),
    [detail, componentsBySlide, status],
  )

  return (
    <DeckDataContext.Provider value={value}>
      {children}
    </DeckDataContext.Provider>
  )
}

export function useDeckData(): DeckDataValue {
  const v = useContext(DeckDataContext)
  if (!v) throw new Error('useDeckData() used outside <DeckDataProvider>')
  return v
}

const NO_COMPONENTS: AnyComponent[] = []

/** Components for one slide (merged + z-ordered), read from the deck's single composed view. */
export function useSlideComponents(slideId: string): AnyComponent[] {
  return useDeckData().componentsBySlide.get(slideId) ?? NO_COMPONENTS
}
