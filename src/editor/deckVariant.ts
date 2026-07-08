import type { JSONContent } from '@tiptap/core'
import { newId, OVERVIEW_CARD_GAP } from '../config'
import { keysBetween } from '../lib/order'
import type { StrutApp } from '../rindle/client'
import { markdownToDoc } from './aiGenerate'
import { gatherDeckBundle } from './deckIO'
import { parseDoc } from './tiptapDoc'
import type { AnyComponent } from './types'
import type {
  GeneratedVariant,
  VariantRequest,
  VariantSourceSlide,
} from '../../shared/variant'

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

function docText(raw: string | null | undefined): string {
  const parts: string[] = []
  const walk = (n: JSONContent) => {
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  walk(parseDoc(raw))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function markdownText(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function componentText(components: AnyComponent[]): string {
  return components
    .map((c) => (c.kind === 'text' ? (c.text ?? '') : ''))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceSlides(
  bundle: NonNullable<Awaited<ReturnType<typeof gatherDeckBundle>>>,
): VariantSourceSlide[] {
  return bundle.slides.map((s, i) => {
    const text = [
      docText(s.doc),
      markdownText(s.markdown),
      componentText(bundle.componentsBySlide[s.id] ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    return { index: i + 1, text }
  })
}

async function requestVariant(req: VariantRequest): Promise<GeneratedVariant> {
  const res = await fetch('/api/variant', {
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
    default_slide_mode: 'markdown',
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
      render_mode: 'markdown',
      now,
    })
    mutate.setSlideDoc({ id: slideId, doc: markdownToDoc(slide.markdown), now })
  }

  return deckId
}
