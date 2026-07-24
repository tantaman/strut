import { useCallback, useEffect, useMemo, useRef } from 'react'
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
import { slideGroundingText } from './aiArrange'

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
  'text_align',
  'body_region',
  'layout',
  'pad',
  'valign',
]

const SLIDE_BODY_FIELDS = ['doc', 'markdown', 'cells']
const SLIDE_SPATIAL_FIELDS = [
  'sort',
  'x',
  'y',
  'z',
  'rotate_x',
  'rotate_y',
  'rotate_z',
  'imp_scale',
]
const SLIDE_STYLE_FIELDS = [
  'background',
  'surface',
  'text_align',
  'body_region',
  'layout',
  'pad',
  'valign',
]
const SLIDE_ALL_FIELDS = [...SLIDE_BODY_FIELDS, ...SLIDE_FIELDS]

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

const COMPONENT_SPATIAL_FIELDS = [
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
]

const COMPONENT_DETAIL_FIELDS = ['slide_id', 'type', 'custom_classes', 'fill']
const COMPONENT_ALL_FIELDS = [...COMPONENT_FIELDS, 'props']
const CUSTOM_BACKGROUND_FIELDS = ['klass', 'style']

type EditGroup = {
  name: string
  path: string
  fields: readonly string[]
  allFields: readonly string[]
  render: (
    row: NamedRow,
    old: NamedRow | undefined,
    parent?: NamedRow,
  ) => string | null
}

const EDIT_GROUPS: EditGroup[] = [
  {
    name: 'deck-fields',
    path: '',
    fields: DECK_FIELDS,
    allFields: DECK_FIELDS,
    render: renderDeckEdit,
  },
  {
    name: 'slide-body',
    path: 'slides',
    fields: SLIDE_BODY_FIELDS,
    allFields: SLIDE_ALL_FIELDS,
    render: renderSlideEdit,
  },
  {
    name: 'slide-spatial',
    path: 'slides',
    fields: SLIDE_SPATIAL_FIELDS,
    allFields: SLIDE_ALL_FIELDS,
    render: renderSlideEdit,
  },
  {
    name: 'slide-style',
    path: 'slides',
    fields: SLIDE_STYLE_FIELDS,
    allFields: SLIDE_ALL_FIELDS,
    render: renderSlideEdit,
  },
  {
    name: 'component-props',
    path: 'slides.components',
    fields: ['props'],
    allFields: COMPONENT_ALL_FIELDS,
    render: renderComponentEdit,
  },
  {
    name: 'component-spatial',
    path: 'slides.components',
    fields: COMPONENT_SPATIAL_FIELDS,
    allFields: COMPONENT_ALL_FIELDS,
    render: renderComponentEdit,
  },
  {
    name: 'component-detail',
    path: 'slides.components',
    fields: COMPONENT_DETAIL_FIELDS,
    allFields: COMPONENT_ALL_FIELDS,
    render: renderComponentEdit,
  },
  {
    name: 'custom-background',
    path: 'customBackgrounds',
    fields: CUSTOM_BACKGROUND_FIELDS,
    allFields: CUSTOM_BACKGROUND_FIELDS,
    render: renderCustomBackgroundEdit,
  },
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
      remove: ({ row }) =>
        `Deck removed: id=${s(row.id)} title=${q(row.title)}.`,
      edit: ({ row, old }) => renderDeckEdit(row, old),
    },
    related: {
      slides: {
        salience: 'info',
        add: ({ row }) => `Slide snapshot/add: ${slideSummary(row)}.`,
        remove: ({ row }) => `Slide removed: ${slideSummary(row)}.`,
        edit: ({ row, old }) => renderSlideEdit(row, old),
      },
      'slides.components': {
        salience: 'info',
        add: ({ row, parent }) =>
          `Component snapshot/add: ${componentSummary(row, parent)}.`,
        remove: ({ row, parent }) =>
          `Component removed: ${componentSummary(row, parent)}.`,
        edit: ({ row, old, parent }) => renderComponentEdit(row, old, parent),
      },
      customBackgrounds: {
        salience: 'ambient',
        add: ({ row }) =>
          `Custom background snapshot/add: ${customBackground(row)}.`,
        remove: ({ row }) =>
          `Custom background removed: ${customBackground(row)}.`,
        edit: ({ row, old }) => renderCustomBackgroundEdit(row, old),
      },
    },
  },
}

export function digestChatNarration(events: SemanticEvent[]): string {
  const rendered = coalesceBufferedEvents(events)
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

function coalesceBufferedEvents(events: SemanticEvent[]): SemanticEvent[] {
  const out: SemanticEvent[] = []
  const byKey = new Map<
    string,
    { group: EditGroup; index: number; old: NamedRow | undefined }
  >()
  for (const event of events) {
    const target = coalesceTarget(event)
    if (!target) {
      out.push(event)
      continue
    }
    const existing = byKey.get(target.key)
    if (existing === undefined) {
      byKey.set(target.key, {
        group: target.group,
        index: out.length,
        old: event.resolved.old,
      })
      out.push(renderCoalescedEdit(event, event.resolved.old, target.group))
    } else {
      out[existing.index] = renderCoalescedEdit(
        event,
        existing.old,
        existing.group,
      )
    }
  }
  return out
}

function coalesceTarget(
  event: SemanticEvent,
): { key: string; group: EditGroup } | null {
  if (event.phase !== 'batch') return null
  const r = event.resolved
  if (r.op !== 'edit' || !r.old) return null
  const path = r.aliasChain.join('.')
  const id = s(r.row.id)
  if (!id) return null
  for (const group of EDIT_GROUPS) {
    if (group.path !== path) continue
    if (!isOnlyGroupFieldsChanged(r.row, r.old, group)) continue
    return { key: `${event.query}:${path}:${group.name}:${id}`, group }
  }
  return null
}

function renderCoalescedEdit(
  event: SemanticEvent,
  old: NamedRow | undefined,
  group: EditGroup,
): SemanticEvent {
  const resolved = { ...event.resolved, old }
  return {
    ...event,
    resolved,
    text: group.render(resolved.row, old, resolved.parent),
  }
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
    `align=${q(row.text_align)}`,
    `presenter=${q(row.chosen_presenter)}`,
    `transition=${q(row.canned_transition)}`,
  ].join(' ')
}

function slideSummary(row: NamedRow): string {
  return [
    `id=${s(row.id)}`,
    `sort=${q(row.sort)}`,
    `body=${q(slideBody(row))}`,
    `transform=${slideTransform(row)}`,
    `background=${q(row.background)}`,
    `surface=${q(row.surface)}`,
    `align=${q(row.text_align)}`,
    `region=${q(row.body_region)}`,
    `layout=${q(row.layout)}`,
    `pad=${q(row.pad)}`,
    `valign=${q(row.valign)}`,
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

function renderDeckEdit(row: NamedRow, old?: NamedRow): string | null {
  const fields = changedFields(row, old, DECK_FIELDS, formatDeckField)
  return fields.length ? `Deck updated: ${fields.join(', ')}.` : null
}

function renderSlideEdit(row: NamedRow, old?: NamedRow): string | null {
  const fields = changedSlideFields(row, old)
  return fields.length
    ? `Slide ${s(row.id)} updated: ${fields.join(', ')}.`
    : null
}

function renderComponentEdit(
  row: NamedRow,
  old?: NamedRow,
  parent?: NamedRow,
): string | null {
  const fields = changedComponentFields(row, old)
  return fields.length
    ? `Component ${s(row.id)} on slide ${slideId(row, parent)} updated: ${fields.join(', ')}.`
    : null
}

function renderCustomBackgroundEdit(
  row: NamedRow,
  old?: NamedRow,
): string | null {
  const fields = changedFields(row, old, CUSTOM_BACKGROUND_FIELDS, (k, v) =>
    k === 'style' ? `style=${q(cap(s(v), MAX_FIELD))}` : `${k}=${q(v)}`,
  )
  return fields.length
    ? `Custom background ${s(row.id)} updated: ${fields.join(', ')}.`
    : null
}

function changedSlideFields(row: NamedRow, old?: NamedRow): string[] {
  const out = changedFields(
    row,
    old,
    SLIDE_FIELDS,
    (k, v, prev) => `${k} ${formatScalar(prev)} -> ${formatScalar(v)}`,
  )
  if (
    old &&
    (row.doc !== old.doc ||
      row.markdown !== old.markdown ||
      !same(row.cells, old.cells) ||
      row.layout !== old.layout)
  ) {
    out.push(`body=${q(slideBody(row))}`)
  }
  return out
}

function changedComponentFields(row: NamedRow, old?: NamedRow): string[] {
  const out = changedFields(
    row,
    old,
    COMPONENT_FIELDS,
    (k, v, prev) => `${k} ${formatScalar(prev)} -> ${formatScalar(v)}`,
  )
  if (old && !same(row.props, old.props)) {
    out.push(`props={${propsSummary(parseProps(row.props))}}`)
  }
  return out
}

function isOnlyGroupFieldsChanged(
  row: NamedRow,
  old: NamedRow,
  group: EditGroup,
): boolean {
  const changed = changedFieldNames(row, old, group.allFields)
  return (
    changed.length > 0 && changed.every((field) => group.fields.includes(field))
  )
}

function changedFieldNames(
  row: NamedRow,
  old: NamedRow,
  fields: readonly string[],
): string[] {
  return fields.filter((field) => !same(row[field], old[field]))
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
    if (!same(row[field], old[field]))
      out.push(format(field, row[field], old[field]))
  }
  return out
}

function formatDeckField(
  field: string,
  value: unknown,
  previous: unknown,
): string {
  if (field === 'custom_stylesheet') {
    return `custom_stylesheet len ${s(previous).length} -> ${s(value).length}`
  }
  return `${field} ${formatScalar(previous)} -> ${formatScalar(value)}`
}

function slideBody(row: NamedRow): string {
  return cap(slideGroundingText(row), MAX_BODY)
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
  if (props.short_src)
    parts.push(`short_src=${q(cap(props.short_src, MAX_FIELD))}`)
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
