import type { ComponentType } from '../../shared/componentProps'
import type { AnyComponent } from './types'

export const COMPONENT_CLIPBOARD_MIME = 'application/x-strut-components+json'
export const COMPONENT_CLIPBOARD_TEXT_PREFIX = 'strut:components:'
export const COMPONENT_PASTE_OFFSET = 24

const CLIPBOARD_FORMAT = 'strut.components'
const CLIPBOARD_VERSION = 1
const COMPONENT_KINDS = new Set<ComponentType>([
  'text',
  'image',
  'shape',
  'video',
  'webframe',
  'artifact',
])
const NUMBER_FIELDS = [
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
] as const

export type ComponentClipboardSpec = Omit<AnyComponent, 'id' | 'slide_id'>

export interface ComponentClipboardPayload {
  format: typeof CLIPBOARD_FORMAT
  version: typeof CLIPBOARD_VERSION
  components: ComponentClipboardSpec[]
}

export function buildComponentClipboardPayload(
  components: readonly AnyComponent[],
): ComponentClipboardPayload | null {
  if (components.length === 0) return null
  const specs = components
    .map(componentToSpec)
    .sort((a, b) => a.z_order - b.z_order)
  return {
    format: CLIPBOARD_FORMAT,
    version: CLIPBOARD_VERSION,
    components: specs,
  }
}

export function stringifyComponentClipboard(
  payload: ComponentClipboardPayload,
): string {
  return JSON.stringify(payload)
}

export function stringifyComponentClipboardText(
  payload: ComponentClipboardPayload,
): string {
  return `${COMPONENT_CLIPBOARD_TEXT_PREFIX}${stringifyComponentClipboard(
    payload,
  )}`
}

export function parseComponentClipboard(
  raw: string,
): ComponentClipboardPayload | null {
  if (!raw) return null
  try {
    return normalizePayload(JSON.parse(raw))
  } catch {
    return null
  }
}

export function parseComponentClipboardText(
  raw: string,
): ComponentClipboardPayload | null {
  if (!raw.startsWith(COMPONENT_CLIPBOARD_TEXT_PREFIX)) return null
  return parseComponentClipboard(raw.slice(COMPONENT_CLIPBOARD_TEXT_PREFIX.length))
}

export function writeComponentClipboardData(
  data: Pick<DataTransfer, 'setData'>,
  payload: ComponentClipboardPayload,
): void {
  const json = stringifyComponentClipboard(payload)
  data.setData(COMPONENT_CLIPBOARD_MIME, json)
  data.setData('text/plain', `${COMPONENT_CLIPBOARD_TEXT_PREFIX}${json}`)
}

export function readComponentClipboardData(
  data: Pick<DataTransfer, 'getData'> | null | undefined,
): ComponentClipboardPayload | null {
  if (!data) return null
  return (
    parseComponentClipboard(data.getData(COMPONENT_CLIPBOARD_MIME)) ??
    parseComponentClipboardText(data.getData('text/plain'))
  )
}

export function componentClipboardKey(
  payload: ComponentClipboardPayload,
): string {
  return stringifyComponentClipboard(payload)
}

export function instantiateComponentClipboard(
  payload: ComponentClipboardPayload,
  {
    slideId,
    offset,
    zStart,
    newId,
  }: {
    slideId: string
    offset: number
    zStart: number
    newId: () => string
  },
): AnyComponent[] {
  return payload.components.map((c, i) => ({
    ...c,
    id: newId(),
    slide_id: slideId,
    x: c.x + offset,
    y: c.y + offset,
    z_order: zStart + i,
  }))
}

function componentToSpec(c: AnyComponent): ComponentClipboardSpec {
  const { id: _id, slide_id: _slideId, ...spec } = c
  return { ...spec }
}

function normalizePayload(v: unknown): ComponentClipboardPayload | null {
  if (!isRecord(v)) return null
  if (v.format !== CLIPBOARD_FORMAT || v.version !== CLIPBOARD_VERSION)
    return null
  if (!Array.isArray(v.components) || v.components.length === 0) return null
  const components = v.components.map(normalizeSpec)
  if (components.some((c) => !c)) return null
  return {
    format: CLIPBOARD_FORMAT,
    version: CLIPBOARD_VERSION,
    components: components as ComponentClipboardSpec[],
  }
}

function normalizeSpec(v: unknown): ComponentClipboardSpec | null {
  if (!isRecord(v) || typeof v.kind !== 'string') return null
  if (!COMPONENT_KINDS.has(v.kind as ComponentType)) return null

  for (const field of NUMBER_FIELDS) {
    if (!isFiniteNumber(v[field])) return null
  }

  const base: ComponentClipboardSpec = {
    kind: v.kind as ComponentType,
    z_order: v.z_order as number,
    x: v.x as number,
    y: v.y as number,
    scale_x: v.scale_x as number,
    scale_y: v.scale_y as number,
    scale_w: v.scale_w as number,
    scale_h: v.scale_h as number,
    rotate: v.rotate as number,
    skew_x: v.skew_x as number,
    skew_y: v.skew_y as number,
    custom_classes:
      typeof v.custom_classes === 'string' ? v.custom_classes : '',
  }

  copyOptionalString(v, base, 'fill')
  switch (base.kind) {
    case 'text':
      copyOptionalString(v, base, 'text')
      copyOptionalNumber(v, base, 'size')
      copyOptionalString(v, base, 'color')
      copyOptionalString(v, base, 'font_family')
      copyOptionalString(v, base, 'text_type')
      break
    case 'image':
      copyOptionalString(v, base, 'src')
      copyOptionalString(v, base, 'image_type')
      break
    case 'shape':
      copyOptionalString(v, base, 'shape')
      copyOptionalString(v, base, 'markup')
      break
    case 'video':
      copyOptionalString(v, base, 'src')
      copyOptionalString(v, base, 'video_type')
      copyOptionalString(v, base, 'src_type')
      copyOptionalString(v, base, 'short_src')
      break
    case 'webframe':
      copyOptionalString(v, base, 'src')
      break
    case 'artifact':
      copyOptionalString(v, base, 'code')
      copyOptionalString(v, base, 'src')
      break
  }

  return base
}

function copyOptionalString<TKey extends keyof ComponentClipboardSpec>(
  src: Record<string, unknown>,
  dst: ComponentClipboardSpec,
  key: TKey,
) {
  const v = src[key]
  if (typeof v === 'string') dst[key] = v as ComponentClipboardSpec[TKey]
}

function copyOptionalNumber<TKey extends keyof ComponentClipboardSpec>(
  src: Record<string, unknown>,
  dst: ComponentClipboardSpec,
  key: TKey,
) {
  const v = src[key]
  if (isFiniteNumber(v)) dst[key] = v as ComponentClipboardSpec[TKey]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}
