import type { ChatActRequest } from '../shared/chatAction.ts'
import {
  MAX_STYLE_REFERENCE_BYTES,
  MAX_STYLE_REFERENCES,
  MAX_STYLE_REFERENCES_TOTAL_BYTES,
  STYLE_REFERENCE_MIMES,
} from '../shared/styleReferences.ts'
import type { ModelImage } from './llm.ts'

// The clamped request contract tops out below 200 KiB (narration + recent turns + slide ids + active
// slide/theme grounding). Keep a little JSON framing headroom, but do not allow the request field to become
// a second arbitrary-size upload alongside the photos.
export const MAX_CHAT_ACT_REQUEST_BYTES = 256 * 1024
const MAX_MULTIPART_OVERHEAD_BYTES = 64 * 1024
const MAX_MULTIPART_BYTES =
  MAX_STYLE_REFERENCES_TOTAL_BYTES +
  MAX_CHAT_ACT_REQUEST_BYTES +
  MAX_MULTIPART_OVERHEAD_BYTES

export class ChatActPayloadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ChatActPayloadError'
  }
}

export interface ParsedChatActPayload {
  body: ChatActRequest
  images: ModelImage[]
}

export function isStyleReferenceRequest(request: Request): boolean {
  return (request.headers.get('content-type') ?? '')
    .toLowerCase()
    .startsWith('multipart/form-data')
}

/** Parse either the existing JSON chat body or an ephemeral multipart body with 1–5 raster references. */
export async function parseChatActPayload(
  request: Request,
): Promise<ParsedChatActPayload> {
  if (!isStyleReferenceRequest(request)) {
    let body: unknown
    try {
      body = await boundedRequest(
        request,
        MAX_CHAT_ACT_REQUEST_BYTES,
        'Chat request is too large.',
      ).then((bounded) => bounded.json())
    } catch (err) {
      if (err instanceof ChatActPayloadError) throw err
      throw new ChatActPayloadError('Invalid chat request.', 400)
    }
    return { body: validateBody(body), images: [] }
  }

  let form: FormData
  try {
    form = await boundedRequest(
      request,
      MAX_MULTIPART_BYTES,
      'Style reference upload is too large.',
    ).then((bounded) => bounded.formData())
  } catch (err) {
    if (err instanceof ChatActPayloadError) throw err
    throw new ChatActPayloadError('Invalid style reference upload.', 400)
  }

  for (const key of form.keys()) {
    if (key !== 'request' && key !== 'reference')
      throw new ChatActPayloadError('Unexpected style upload field.', 400)
  }

  const requestParts = form.getAll('request')
  if (requestParts.length !== 1)
    throw new ChatActPayloadError('Missing chat request.', 400)
  const requestPart = requestParts[0]
  if (typeof requestPart !== 'string')
    throw new ChatActPayloadError('Missing chat request.', 400)
  if (
    new TextEncoder().encode(requestPart).byteLength >
    MAX_CHAT_ACT_REQUEST_BYTES
  )
    throw new ChatActPayloadError('Chat request is too large.', 413)
  let body: unknown
  try {
    body = JSON.parse(requestPart)
  } catch {
    throw new ChatActPayloadError('Invalid chat request.', 400)
  }
  const validBody = validateBody(body)

  const entries = form.getAll('reference')
  if (entries.length === 0)
    throw new ChatActPayloadError('Add at least one style reference.', 400)
  if (entries.length > MAX_STYLE_REFERENCES)
    throw new ChatActPayloadError('Add up to 5 style references.', 413)

  const allowed = new Set<string>(STYLE_REFERENCE_MIMES)
  const images: ModelImage[] = []
  let total = 0
  for (const entry of entries) {
    if (typeof entry === 'string')
      throw new ChatActPayloadError('Invalid style reference.', 400)
    if (!allowed.has(entry.type))
      throw new ChatActPayloadError(
        'Style references must be JPEG, PNG, or WebP.',
        415,
      )
    if (entry.size === 0)
      throw new ChatActPayloadError('Style references cannot be empty.', 400)
    if (entry.size > MAX_STYLE_REFERENCE_BYTES)
      throw new ChatActPayloadError(
        'Each style reference must be under 4 MB.',
        413,
      )
    total += entry.size
    if (total > MAX_STYLE_REFERENCES_TOTAL_BYTES)
      throw new ChatActPayloadError(
        'Style references must be under 8 MB total.',
        413,
      )
    const bytes = new Uint8Array(await entry.arrayBuffer())
    const mediaType = entry.type as ModelImage['mediaType']
    if (!hasImageSignature(bytes, mediaType))
      throw new ChatActPayloadError(
        'A style reference did not match its image type.',
        415,
      )
    images.push({ mediaType, bytes })
  }

  return { body: validBody, images }
}

/** Buffer a body through a hard ACTUAL ceiling even when a chunked request omits Content-Length. The
 *  header is only an early reject; every received chunk is counted before JSON/FormData gets to parse it. */
async function boundedRequest(
  request: Request,
  maxBytes: number,
  tooLargeMessage: string,
): Promise<Request> {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const declared = Number(contentLength)
    if (Number.isFinite(declared) && declared > maxBytes)
      throw new ChatActPayloadError(tooLargeMessage, 413)
  }
  if (!request.body) throw new ChatActPayloadError('Missing request body.', 400)

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value.byteLength) continue
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel().catch(() => {})
        throw new ChatActPayloadError(tooLargeMessage, 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(new ArrayBuffer(total))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  )
  const headers = new Headers(request.headers)
  headers.set('content-length', String(total))
  return new Request(request.url, {
    method: request.method,
    headers,
    body,
  })
}

function hasImageSignature(
  bytes: Uint8Array,
  mediaType: ModelImage['mediaType'],
): boolean {
  if (mediaType === 'image/jpeg')
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
  if (mediaType === 'image/png')
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    )
  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  )
}

function validateBody(value: unknown): ChatActRequest {
  if (typeof value !== 'object' || value === null)
    throw new ChatActPayloadError('Invalid chat request.', 400)
  const body = value as Partial<ChatActRequest>
  if (
    typeof body.deckId !== 'string' ||
    !Array.isArray(body.messages) ||
    typeof body.deckContext !== 'string' ||
    !Array.isArray(body.slideIds)
  )
    throw new ChatActPayloadError('Invalid chat request.', 400)
  return body as ChatActRequest
}
