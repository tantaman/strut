import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { JSONContent } from '@tiptap/core'
import { useNarration } from '@rindle/react'
import { salienceRank } from '@rindle/narrator'
import type {
  NamedRow,
  NarratorRegistry,
  Salience,
  SemanticEvent,
} from '@rindle/narrator'
import type { ChangePhase } from '@rindle/client'
import { parseProps } from '../../shared/componentProps'
import type { ComponentProps } from '../../shared/componentProps'
import { CHAT_LIMITS } from '../../shared/chat'
import { deckDetailQuery } from '../../shared/queries'
import { parseDoc } from './tiptapDoc'

const MAX_EVENTS = 300
const MAX_FIELD = 220
const MAX_BODY = 700
const MAX_PROPS = 900
const MAX_CONTEXT = CHAT_LIMITS.maxDeckContext

const PHASES: ChangePhase[] = ['snapshot', 'batch']
const SALIENCE_LABEL: Record<Salience, string> = {
  alert: 'alert',
  info: 'info',
  ambient: 'ambient',
}

const DECK_FIELDS = [
  'title',
  'background',
  'surface',
  'heading_font',
  'heading_color',
  'body_font',
  'body_color',
  'default_slide_mode',
  'text_align',
  'custom_stylesheet',
  'chosen_presenter',
  'canned_transition',
  'visibility',
]

const SLIDE_FIELDS = [
  'sort',
  'x',
  'y',
  'z',
  'rotate_x',
  'rotate_y',
  'rotate_z',
  'imp_scale',
  'background',
  'surface',
  'render_mode',
  'text_align',
]

const COMPONENT_FIELDS = [
  'slide_id',
  'type',
  'z_order',
  'x',
  'y',
  'scale_x',
  'scale_y',
  'scale_w',
  'scale_h',
  'rotate',
  'skew_x',
  'skew_y',
  'custom_classes',
  'fill',
]

export interface DeckChatContext {
  /** Drain new narration into the cumulative context and return the full bounded prompt prefix. */
  take: () => string
  /** Clear accumulated prompt text and pending narration events for this deck. */
  clear: () => void
}

/** Semantic narration templates for the live editor's full deck-detail tree. These produce compact,
 *  id-forward lines because they are model context, not user-facing prose. */
export const CHAT_NARRATORS: NarratorRegistry = {
  deckDetail: {
    salience: 'info',
    root: {
      add: ({ row }) => `Deck snapshot: ${deckSummary(row)}.`,
      remove: ({ row }) => `Deck removed: id=${s(row.id)} title=${q(row.title)}.`,
      edit: ({ row, old }) => {
        const fields = changedFields(row, old, DECK_FIELDS, formatDeckField)
        return fields.length ? `Deck updated: ${fields.join(', ')}.` : null
      },
    },
    related: {
      slides: {
        salience: 'info',
        add: ({ row }) => `Slide snapshot/add: ${slideSummary(row)}.`,
        remove: ({ row }) => `Slide removed: ${slideSummary(row)}.`,
        edit: ({ row, old }) => {
          const fields = changedSlideFields(row, old)
          return fields.length
            ? `Slide ${s(row.id)} updated: ${fields.join(', ')}.`
            : null
        },
      },
      'slides.components': {
        salience: 'info',
        add: ({ row, parent }) =>
          `Component snapshot/add: ${componentSummary(row, parent)}.`,
        remove: ({ row, parent }) =>
          `Component removed: ${componentSummary(row, parent)}.`,
        edit: ({ row, old, parent }) => {
          const fields = changedComponentFields(row, old)
          return fields.length
            ? `Component ${s(row.id)} on slide ${slideId(row, parent)} updated: ${fields.join(', ')}.`
            : null
        },
      },
      customBackgrounds: {
        salience: 'ambient',
        add: ({ row }) => `Custom background snapshot/add: ${customBackground(row)}.`,
        remove: ({ row }) => `Custom background removed: ${customBackground(row)}.`,
        edit: ({ row, old }) => {
          const fields = changedFields(row, old, ['klass', 'style'], (k, v) =>
            k === 'style' ? `style=${q(cap(s(v), MAX_FIELD))}` : `${k}=${q(v)}`,
          )
          return fields.length
            ? `Custom background ${s(row.id)} updated: ${fields.join(', ')}.`
            : null
        },
      },
    },
  },
}

export function digestChatNarration(events: SemanticEvent[]): string {
  const rendered = events
    .filter((e) => e.text !== null)
    .sort((a, b) => salienceRank(b.salience) - salienceRank(a.salience))

  if (rendered.length === 0) return ''
  const hasSnapshot = rendered.some((e) => e.phase === 'snapshot')
  const hasBatch = rendered.some((e) => e.phase === 'batch')
  const header =
    hasSnapshot && hasBatch
      ? 'Deck context snapshot and updates:'
      : hasSnapshot
        ? 'Deck context snapshot:'
        : 'Deck updates since last turn:'

  return [
    header,
    ...rendered.map((e) => `[${SALIENCE_LABEL[e.salience]}] ${e.text}`),
  ].join('\n')
}

export function useDeckChatContext(deckId: string): DeckChatContext {
  const query = useMemo(() => deckDetailQuery({ deckId }), [deckId])
  const narration = useNarration(query, CHAT_NARRATORS, {
    phases: PHASES,
    max: MAX_EVENTS,
  })
  const blocksRef = useRef<string[]>([])

  useEffect(() => {
    blocksRef.current = []
  }, [deckId])

  const take = useCallback((): string => {
    const block = digestChatNarration(narration.take())
    if (block) blocksRef.current.push(block)
    blocksRef.current = capBlocks(blocksRef.current)
    return blocksRef.current.join('\n\n')
  }, [narration])

  const clear = useCallback(() => {
    blocksRef.current = []
    narration.clear()
  }, [narration])

  return useMemo(() => ({ take, clear }), [take, clear])
}

function capBlocks(blocks: string[]): string[] {
  while (blocks.length > 1 && blocks.join('\n\n').length > MAX_CONTEXT) {
    blocks.shift()
  }
  const joined = blocks.join('\n\n')
  if (joined.length <= MAX_CONTEXT) return blocks
  return [`[earlier deck context omitted]\n${joined.slice(-MAX_CONTEXT)}`]
}

function deckSummary(row: NamedRow): string {
  return [
    `id=${s(row.id)}`,
    `title=${q(row.title)}`,
    `background=${q(row.background)}`,
    `surface=${q(row.surface)}`,
    `heading=(${fontColor(row.heading_font, row.heading_color)})`,
    `body=(${fontColor(row.body_font, row.body_color)})`,
    `mode=${q(row.default_slide_mode)}`,
    `align=${q(row.text_align)}`,
    `presenter=${q(row.chosen_presenter)}`,
    `transition=${q(row.canned_transition)}`,
  ].join(' ')
}

function slideSummary(row: NamedRow): string {
  return [
    `id=${s(row.id)}`,
    `sort=${q(row.sort)}`,
    `mode=${q(row.render_mode)}`,
    `body=${q(slideBody(row))}`,
    `transform=${slideTransform(row)}`,
    `background=${q(row.background)}`,
    `surface=${q(row.surface)}`,
    `align=${q(row.text_align)}`,
  ].join(' ')
}

function componentSummary(row: NamedRow, parent?: NamedRow): string {
  const props = propsSummary(parseProps(row.props))
  return [
    `id=${s(row.id)}`,
    `slide=${slideId(row, parent)}`,
    `type=${q(row.type)}`,
    `spatial=${componentSpatial(row)}`,
    `fill=${q(row.fill)}`,
    `classes=${q(row.custom_classes)}`,
    props ? `props={${props}}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function customBackground(row: NamedRow): string {
  return [
    `id=${s(row.id)}`,
    `klass=${q(row.klass)}`,
    `style=${q(cap(s(row.style), MAX_FIELD))}`,
  ].join(' ')
}

function changedSlideFields(row: NamedRow, old?: NamedRow): string[] {
  const out = changedFields(row, old, SLIDE_FIELDS, (k, v, prev) =>
    `${k} ${formatScalar(prev)} -> ${formatScalar(v)}`,
  )
  if (old && (row.doc !== old.doc || row.markdown !== old.markdown)) {
    out.push(`body=${q(slideBody(row))}`)
  }
  return out
}

function changedComponentFields(row: NamedRow, old?: NamedRow): string[] {
  const out = changedFields(row, old, COMPONENT_FIELDS, (k, v, prev) =>
    `${k} ${formatScalar(prev)} -> ${formatScalar(v)}`,
  )
  if (old && !same(row.props, old.props)) {
    out.push(`props={${propsSummary(parseProps(row.props))}}`)
  }
  return out
}

function changedFields(
  row: NamedRow,
  old: NamedRow | undefined,
  fields: readonly string[],
  format: (field: string, value: unknown, previous: unknown) => string,
): string[] {
  if (!old) return []
  const out: string[] = []
  for (const field of fields) {
    if (!same(row[field], old[field])) out.push(format(field, row[field], old[field]))
  }
  return out
}

function formatDeckField(field: string, value: unknown, previous: unknown): string {
  if (field === 'custom_stylesheet') {
    return `custom_stylesheet len ${s(previous).length} -> ${s(value).length}`
  }
  return `${field} ${formatScalar(previous)} -> ${formatScalar(value)}`
}

function slideBody(row: NamedRow): string {
  const fromDoc = docText(s(row.doc))
  if (fromDoc) return cap(fromDoc, MAX_BODY)
  return cap(
    s(row.markdown)
      .replace(/[#*_>`~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    MAX_BODY,
  )
}

function docText(raw: string): string {
  if (!raw) return ''
  const parts: string[] = []
  const walk = (node: JSONContent) => {
    if (typeof node.text === 'string') parts.push(node.text)
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(parseDoc(raw))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function propsSummary(props: ComponentProps): string {
  const parts: string[] = []
  if (props.text) parts.push(`text=${q(cap(props.text, MAX_FIELD))}`)
  if (props.size !== undefined) parts.push(`size=${n(props.size)}`)
  if (props.color) parts.push(`color=${q(props.color)}`)
  if (props.font_family) parts.push(`font=${q(props.font_family)}`)
  if (props.text_type) parts.push(`text_type=${q(props.text_type)}`)
  if (props.src) parts.push(`src=${q(cap(props.src, MAX_FIELD))}`)
  if (props.image_type) parts.push(`image_type=${q(props.image_type)}`)
  if (props.shape) parts.push(`shape=${q(props.shape)}`)
  if (props.markup) parts.push(`markup=${q(cap(props.markup, MAX_FIELD))}`)
  if (props.video_type) parts.push(`video_type=${q(props.video_type)}`)
  if (props.src_type) parts.push(`src_type=${q(props.src_type)}`)
  if (props.short_src) parts.push(`short_src=${q(cap(props.short_src, MAX_FIELD))}`)
  if (props.code) {
    parts.push(
      `code=len:${props.code.length} preview=${q(cap(props.code, MAX_FIELD))}`,
    )
  }
  return cap(parts.join(', '), MAX_PROPS)
}

function slideTransform(row: NamedRow): string {
  return [
    `pos=(${n(row.x)},${n(row.y)},${n(row.z)})`,
    `rot=(${n(row.rotate_x)},${n(row.rotate_y)},${n(row.rotate_z)})`,
    `imp=${n(row.imp_scale)}`,
  ].join(' ')
}

function componentSpatial(row: NamedRow): string {
  return [
    `z=${n(row.z_order)}`,
    `pos=(${n(row.x)},${n(row.y)})`,
    `scale=(${n(row.scale_x)},${n(row.scale_y)})`,
    `size=(${n(row.scale_w)},${n(row.scale_h)})`,
    `rotate=${n(row.rotate)}`,
    `skew=(${n(row.skew_x)},${n(row.skew_y)})`,
  ].join(' ')
}

function fontColor(font: unknown, color: unknown): string {
  return `font=${q(font)}, color=${q(color)}`
}

function slideId(row: NamedRow, parent?: NamedRow): string {
  return s(row.slide_id || parent?.id || '')
}

function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

function formatScalar(v: unknown): string {
  if (typeof v === 'number') return n(v)
  return q(v)
}

function s(v: unknown): string {
  return typeof v === 'string'
    ? v
    : typeof v === 'number' || typeof v === 'boolean'
      ? String(v)
      : ''
}

function n(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v)
    ? String(Math.round(v * 1000) / 1000)
    : s(v)
}

function q(v: unknown): string {
  return JSON.stringify(cap(s(v), MAX_FIELD))
}

function cap(v: string, max: number): string {
  return v.length <= max ? v : `${v.slice(0, max)}...`
}
