// Export / import wiring. `gatherDeckBundle` does a one-shot read of a whole deck (deck + slides +
// every component + custom colors) off the live store; `importDeck` rebuilds a deck from a parsed
// `.strut` file via the named mutators. Pure orchestration over Rindle — no React.

import { generateKeyBetween } from 'fractional-indexing'
import { newId } from '../config'
import type { StrutApp } from '../rindle/client'
import { deckDetailQuery } from '../../shared/queries'
import { componentsFromRows } from './types'
import { insertComponent } from './componentOps'
import type { DeckDetail } from './deckDetail'
import { deserializeDeck, serializeDeck } from './serialize'
import type { DeckBundle, ImportedDeck } from './serialize'
import { toImpressHTML } from './impressExport'

type Store = StrutApp['store']
type Mutate = StrutApp['mutate']

/** Materialize a named query, wait until it's server-authoritative, read it once, then release it.
 *  (Verified: `materialize` drives the lease without a subscriber — see RINDLE_NOTES #11.) */
async function readOnce<T>(
  store: Store,
  query: unknown,
  timeoutMs = 5000,
): Promise<T> {
  const view = store.materialize(query as never) as {
    data: T
    resultType: string
    destroy: () => void
  }
  const start = Date.now()
  while (view.resultType !== 'complete' && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 30))
  }
  const data = view.data
  view.destroy()
  return data
}

export async function gatherDeckBundle(
  store: Store,
  deckId: string,
): Promise<DeckBundle | null> {
  // One composed read of the whole deck subtree (was deck + slides + 5×N component reads — #12).
  const detail = await readOnce<DeckDetail | null>(
    store,
    deckDetailQuery({ deckId }),
  )
  if (!detail) return null

  const componentsBySlide: DeckBundle['componentsBySlide'] = {}
  for (const s of detail.slides) {
    componentsBySlide[s.id] = componentsFromRows(s.components)
  }
  return {
    deck: detail,
    slides: detail.slides,
    componentsBySlide,
    customBackgrounds: detail.customBackgrounds,
  }
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'deck'

function triggerDownload(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportDeckJSON(
  store: Store,
  deckId: string,
): Promise<boolean> {
  const bundle = await gatherDeckBundle(store, deckId)
  if (!bundle) return false
  triggerDownload(
    `${slug(bundle.deck.title)}.strut`,
    JSON.stringify(serializeDeck(bundle), null, 2),
    'application/json',
  )
  return true
}

export async function exportDeckHTML(
  store: Store,
  deckId: string,
): Promise<boolean> {
  const bundle = await gatherDeckBundle(store, deckId)
  if (!bundle) return false
  triggerDownload(
    `${slug(bundle.deck.title)}.html`,
    toImpressHTML(bundle),
    'text/html',
  )
  return true
}

/** Rebuild a deck from a parsed import. Returns the new deck id. `initialVisibility` seeds the deck's
 *  visibility (free-tier decks are public; default private) — see index.tsx newDeckVisibility(). */
export function importDeck(
  mutate: Mutate,
  imported: ImportedDeck,
  initialVisibility: {
    visibility: 'private' | 'public-read'
    share_token: string
  } = { visibility: 'private', share_token: '' },
): string {
  const now = Date.now()
  const deckId = newId()
  mutate.createDeck({
    id: deckId,
    title: imported.title,
    now,
    ...initialVisibility,
  })
  mutate.setDeckTheme({
    id: deckId,
    background: imported.background,
    surface: imported.surface,
    heading_font: imported.heading_font,
    heading_color: imported.heading_color,
    body_font: imported.body_font,
    body_color: imported.body_color,
    text_align: imported.text_align,
    default_slide_mode:
      imported.default_slide_mode === 'markdown' ? 'markdown' : '',
    custom_stylesheet: imported.custom_stylesheet,
    canned_transition: imported.canned_transition,
    now,
  })
  for (const b of imported.customBackgrounds)
    mutate.mintCustomColor({
      id: newId(),
      deckId,
      klass: b.klass,
      style: b.style,
    })

  let prevSort: string | null = null
  for (const s of imported.slides) {
    const slideId = newId()
    const sort = generateKeyBetween(prevSort, null)
    prevSort = sort
    mutate.addSlide({
      id: slideId,
      deckId,
      sort,
      x: s.x,
      y: s.y,
      // Imported render_mode is an open string; coerce to the SlideMode union addSlide expects.
      render_mode: s.render_mode === 'markdown' ? 'markdown' : '',
      now,
    })
    mutate.setSlideTransform({
      id: slideId,
      x: s.x,
      y: s.y,
      z: s.z,
      rotate_x: s.rotate_x,
      rotate_y: s.rotate_y,
      rotate_z: s.rotate_z,
      imp_scale: s.imp_scale,
      now,
    })
    if (
      s.background ||
      s.surface ||
      s.text_align ||
      s.body_region ||
      s.layout ||
      s.pad
    )
      mutate.setSlideTheme({
        id: slideId,
        background: s.background,
        surface: s.surface,
        text_align: s.text_align,
        body_region: s.body_region,
        layout: s.layout,
        pad: s.pad,
        now,
      })
    if (s.doc) mutate.setSlideDoc({ id: slideId, doc: s.doc, now })
    if (s.cells) mutate.setSlideCells({ id: slideId, cells: s.cells, now })
    for (const c of s.components)
      insertComponent(mutate, { id: newId(), slideId }, c)
  }
  return deckId
}

/** Read a File (from an <input type=file>) and parse it into a normalized deck. */
export async function readDeckFile(file: File): Promise<ImportedDeck> {
  const text = await file.text()
  return deserializeDeck(JSON.parse(text))
}
