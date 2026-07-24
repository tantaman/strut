import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keysBetween } from '../lib/order'
import type { StrutApp } from '../rindle/client'
import { markdownToDoc } from './aiGenerate'
import { slideText } from './aiArrange'
import { gatherDeckBundle } from './deckIO'
import type { AnyComponent } from './types'
import type {
  GeneratedVariant,
  VariantRequest,
  VariantSourceSlide,
} from '../../shared/variant'
import { appPath } from '../../shared/appPath'

export interface DeckVisibilitySeed {
  visibility: 'private' | 'public-read'
  share_token: string
}

export interface CreateDeckVariantArgs {
  app: StrutApp
  sourceDeckId: string
  audience: string
  instructions: string
  initialVisibility: DeckVisibilitySeed
}

/** Source text for one variant slide comes from the same canonical text layers every editor surface uses. */
export function variantSlideText(
  _slide: unknown,
  components: AnyComponent[],
): string {
  return slideText(components)
}

function sourceSlides(
  bundle: NonNullable<Awaited<ReturnType<typeof gatherDeckBundle>>>,
): VariantSourceSlide[] {
  return bundle.slides.map((s, i) => {
    const text = variantSlideText(s, bundle.componentsBySlide[s.id] ?? [])
    return { index: i + 1, text }
  })
}

async function requestVariant(req: VariantRequest): Promise<GeneratedVariant> {
  const res = await fetch(appPath('/api/variant'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  })
  const body = (await res.json().catch(() => ({}))) as {
    error?: string
    message?: string
  }
  if (!res.ok) {
    throw new Error(body.message || body.error || 'Variant generation failed')
  }
  return body as GeneratedVariant
}

function fallbackTitle(
  sourceTitle: string,
  audience: string,
  label: string,
): string {
  const suffix = label || audience || 'Variant'
  return `${sourceTitle || 'Untitled'} - ${suffix}`
}

export async function createDeckVariant({
  app,
  sourceDeckId,
  audience,
  instructions,
  initialVisibility,
}: CreateDeckVariantArgs): Promise<string> {
  const source = await gatherDeckBundle(app.store, sourceDeckId)
  if (!source) throw new Error('Source deck not found')

  const req: VariantRequest = {
    sourceDeckId,
    sourceTitle: source.deck.title || 'Untitled',
    audience,
    instructions,
    slides: sourceSlides(source),
  }
  const variant = await requestVariant(req)
  if (!variant.slides.length) throw new Error('No slides were generated')

  const deckId = newId()
  const now = Date.now()
  const label = (variant.label || audience || 'Variant').trim()
  const title = (
    variant.title || fallbackTitle(source.deck.title, audience, label)
  ).trim()
  const mutate = app.mutate

  mutate.createDeck({
    id: deckId,
    title,
    now,
    ...initialVisibility,
    source_deck_id: sourceDeckId,
    variant_label: label,
    variant_prompt: [audience, instructions].filter(Boolean).join('\n\n'),
  })
  mutate.setDeckTheme({
    id: deckId,
    background: source.deck.background,
    surface: source.deck.surface,
    heading_font: source.deck.heading_font ?? '',
    heading_color: source.deck.heading_color ?? '',
    body_font: source.deck.body_font ?? '',
    body_color: source.deck.body_color ?? '',
    text_align: source.deck.text_align ?? '',
    custom_stylesheet: source.deck.custom_stylesheet,
    chosen_presenter: source.deck.chosen_presenter,
    canned_transition: source.deck.canned_transition,
    now,
  })
  for (const b of source.customBackgrounds) {
    mutate.mintCustomColor({
      id: newId(),
      deckId,
      klass: b.klass,
      style: b.style,
    })
  }

  const keys = keysBetween(null, null, variant.slides.length)
  for (const [i, slide] of variant.slides.entries()) {
    const slideId = newId()
    mutate.addSlide({
      id: slideId,
      deckId,
      sort: keys[i],
      x: i * OVERVIEW_CARD_GAP,
      y: 0,
      content: markdownToDoc(slide.markdown),
      now,
    })
  }

  return deckId
}
