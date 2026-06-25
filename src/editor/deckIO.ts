// Export / import wiring. `gatherDeckBundle` does a one-shot read of a whole deck (deck + slides +
// every component + custom colors) off the live store; `importDeck` rebuilds a deck from a parsed
// `.strut` file via the named mutators. Pure orchestration over Rindle — no React.

import { generateKeyBetween } from 'fractional-indexing'
import { newId } from '../config'
import { currentUser } from '../rindle/user'
import type { StrutApp } from '../rindle/client'
import { deckDetailQuery } from '../../shared/queries'
import { mergeComponents, SHAPES, type SpatialBase } from './types'
import {
  deserializeDeck,
  serializeDeck,
  type DeckBundle,
  type DeckRowLike,
  type ImportedComponent,
  type ImportedDeck,
  type SlideRowLike,
} from './serialize'
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
    destroy(): void
  }
  const start = Date.now()
  while (view.resultType !== 'complete' && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 30))
  }
  const data = view.data
  view.destroy()
  return data
}

/** A slide as it arrives nested in the composed deckDetail read (full rows under per-type aliases). */
type SlideSubtreeRow = SlideRowLike & {
  texts: SpatialBase[]
  images: SpatialBase[]
  shapes: SpatialBase[]
  videos: SpatialBase[]
  webframes: SpatialBase[]
}
type DeckDetailRow = DeckRowLike & {
  slides: SlideSubtreeRow[]
  customBackgrounds: { klass: string; style: string }[]
}

export async function gatherDeckBundle(
  store: Store,
  deckId: string,
): Promise<DeckBundle | null> {
  // One composed read of the whole deck subtree (was deck + slides + 5×N component reads — #12).
  const detail = await readOnce<DeckDetailRow | null>(
    store,
    deckDetailQuery({ deckId }),
  )
  if (!detail) return null

  const componentsBySlide: DeckBundle['componentsBySlide'] = {}
  for (const s of detail.slides) {
    componentsBySlide[s.id] = mergeComponents(
      s.texts,
      s.images,
      s.shapes,
      s.videos,
      s.webframes,
    )
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

function addComponent(mutate: Mutate, slideId: string, c: ImportedComponent) {
  const id = newId()
  const common = { id, slideId, x: c.x, y: c.y, z_order: c.z_order }
  switch (c.kind) {
    case 'text':
      mutate.addText({
        ...common,
        text: c.text ?? 'Text',
        size: c.size ?? 72,
        color: c.color ?? '111111',
        font_family: c.font_family ?? 'Lato',
      })
      break
    case 'image':
      mutate.addImage({
        ...common,
        src: c.src ?? '',
        image_type: c.image_type ?? '',
        scale_w: c.scale_w || 400,
        scale_h: c.scale_h || 300,
      })
      break
    case 'shape':
      mutate.addShape({
        ...common,
        shape: c.shape ?? 'square',
        markup: c.markup || SHAPES[c.shape ?? 'square'] || '',
        fill: c.fill ?? '3498db',
      })
      break
    case 'video':
      mutate.addVideo({
        ...common,
        src: c.src ?? '',
        video_type: c.video_type ?? 'html5',
        src_type: c.src_type ?? '',
        short_src: c.short_src ?? '',
      })
      break
    case 'webframe':
      mutate.addWebframe({ ...common, src: c.src ?? '' })
      break
  }
  // Restore non-default geometry + classes (the add* mutators only take position + type fields).
  if (
    c.rotate ||
    c.skew_x ||
    c.skew_y ||
    c.scale_w ||
    c.scale_h ||
    c.scale_x !== 1 ||
    c.scale_y !== 1
  ) {
    mutate.transformComponent({
      table: c.table,
      id,
      scale_x: c.scale_x || 1,
      scale_y: c.scale_y || 1,
      scale_w: c.scale_w || 0,
      scale_h: c.scale_h || 0,
      rotate: c.rotate || 0,
      skew_x: c.skew_x || 0,
      skew_y: c.skew_y || 0,
    })
  }
  if (c.custom_classes)
    mutate.setComponentClasses({
      table: c.table,
      id,
      custom_classes: c.custom_classes,
    })
}

/** Rebuild a deck from a parsed import. Returns the new deck id. */
export function importDeck(mutate: Mutate, imported: ImportedDeck): string {
  const now = Date.now()
  const deckId = newId()
  mutate.createDeck({
    id: deckId,
    title: imported.title,
    ownerId: currentUser(),
    now,
  })
  mutate.setDeckTheme({
    id: deckId,
    background: imported.background,
    surface: imported.surface,
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
    mutate.addSlide({ id: slideId, deckId, sort, x: s.x, y: s.y, now })
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
    if (s.background || s.surface)
      mutate.setSlideTheme({
        id: slideId,
        background: s.background,
        surface: s.surface,
        now,
      })
    for (const c of s.components) addComponent(mutate, slideId, c)
  }
  return deckId
}

/** Read a File (from an <input type=file>) and parse it into a normalized deck. */
export async function readDeckFile(file: File): Promise<ImportedDeck> {
  const text = await file.text()
  return deserializeDeck(JSON.parse(text))
}
