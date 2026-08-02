// The single model seam for every ✨ feature. Strut is BYOK-only: each request resolves the caller's
// connected OpenRouter credential and spends their credits. There is deliberately no deployment-funded
// fallback, provider binding, entitlement path, or inference meter to operate.

import { getCredential } from './modelCred.ts'

// OpenRouter's auto-router when the user didn't pin a specific model id.
const OPENROUTER_DEFAULT_MODEL = 'openrouter/auto'
const OPENROUTER_STYLE_MODEL = 'openai/gpt-5.4-mini'
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type ModelChoice = {
  kind: 'openrouter'
  model: string
  apiKey: string
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelImage {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
  bytes: Uint8Array
}

export interface CallInput {
  messages: ModelMessage[]
  /** Strut's historical `{ type: 'json_schema', json_schema: <rawSchema> }` shape (or undefined),
   *  rewrapped into OpenAI-compatible form for OpenRouter. */
  response_format?: unknown
  max_tokens?: number
}

/** Thrown when OpenRouter can't be reached or a call fails before any output. */
export class ModelUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelUnavailableError'
  }
}

/** Shared 402 response for a caller who has not connected an OpenRouter key. */
export function modelRequired(): { error: string; message: string } {
  return {
    error: 'ai_key_required',
    message: 'Connect your OpenRouter key to turn on AI.',
  }
}

/** Resolve the user's connected OpenRouter model, or null when they have not connected one. Photo-driven
 *  style turns select a known multimodal default only when the user left their model unpinned. */
export async function resolveModel(
  userId: string,
  options: { purpose?: 'general' | 'style' } = {},
): Promise<ModelChoice | null> {
  try {
    const cred = await getCredential(userId)
    if (cred && cred.provider === 'openrouter' && cred.apiKey) {
      return {
        kind: 'openrouter',
        model:
          cred.model ||
          (options.purpose === 'style'
            ? OPENROUTER_STYLE_MODEL
            : OPENROUTER_DEFAULT_MODEL),
        apiKey: cred.apiKey,
      }
    }
  } catch (err) {
    console.error(
      '[llm] credential resolution failed:',
      err instanceof Error ? err.message : err,
    )
  }
  return null
}

// OpenRouter returns structured output as a JSON string. A provider that ignored `response_format` may
// wrap it in a ```json fence or stray prose, so normalize it before the adapters' validation boundary.
function extractJson(resp: unknown): unknown {
  if (resp && typeof resp === 'object') return resp
  if (typeof resp === 'string') return parseJsonLoose(resp) ?? {}
  return {}
}

// Parse a model's JSON reply that may be bare, fenced (```json … ```), or wrapped in stray prose. Tries the
// whole string, then the first brace-balanced object inside it. Null if nothing parses. This lets the
// structured endpoints survive an OpenRouter provider that returns JSON-as-prose instead of honoring
// response_format.
function parseJsonLoose(s: string): unknown {
  const trimmed = s.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const obj = firstJsonObject(trimmed)
    if (!obj) return null
    try {
      return JSON.parse(obj)
    } catch {
      return null
    }
  }
}

// Extract the first brace-balanced `{ … }` substring, respecting strings/escapes, or null. (Mirrors the
// same helper in server/chatAct.ts — kept local so the seam doesn't import upward from a route adapter.)
function firstJsonObject(s: string): string | null {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
    } else if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

/** One-shot structured completion (Arrange, Generate). Returns the model's JSON as a parsed object.
 *  Throws ModelUnavailableError if the backend is unreachable or the call fails. */
export async function callModel(
  choice: ModelChoice,
  input: CallInput,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: choice.model,
    messages: input.messages,
  }
  const rf = toOpenRouterResponseFormat(input.response_format)
  if (rf) body.response_format = rf
  if (typeof input.max_tokens === 'number') body.max_tokens = input.max_tokens

  const res = await openrouterFetch(choice, body)
  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new ModelUnavailableError('OpenRouter returned a non-JSON response.')
  }
  const content = (
    payload as {
      choices?: Array<{ message?: { content?: unknown } }>
    } | null
  )?.choices?.[0]?.message?.content
  return extractJson(content)
}

/** Streamed completion (Chat + the Edit lane). Returns an SSE byte stream of Strut's historical
 *  `data: {"response":"…"}` frames + `data: [DONE]` — the shape the client already parses (src/editor/
 *  aiChat.ts parseSseDelta). OpenRouter's OpenAI-style frames are normalized. The Edit lane prompts for a
 *  fenced JSON block in prose and parses it in server/chatAct.ts. Messages may additionally carry the
 *  turn's ephemeral reference images. */
export async function streamModel(
  choice: ModelChoice,
  input: {
    messages: ModelMessage[]
    images?: ModelImage[]
    max_tokens?: number
  },
): Promise<ReadableStream<Uint8Array>> {
  const res = await openrouterFetch(choice, {
    model: choice.model,
    messages: attachImagesToOpenAiMessages(input.messages, input.images),
    max_tokens: input.max_tokens,
    stream: true,
  })
  if (!res.body) {
    throw new ModelUnavailableError('OpenRouter returned no stream body.')
  }
  return normalizeOpenRouterSse(res.body)
}

// ---- OpenRouter transport ----

/** Attach ephemeral image bytes to the final user turn in the OpenAI-compatible multimodal shape. */
export function attachImagesToOpenAiMessages(
  messages: ModelMessage[],
  images: ModelImage[] | undefined,
): unknown[] {
  if (!images?.length) return messages
  const target = findLastUserMessage(messages)
  if (target === -1) return messages
  return messages.map((message, index) =>
    index === target
      ? {
          ...message,
          content: [
            { type: 'text', text: message.content },
            ...images.map((image) => ({
              type: 'image_url',
              image_url: {
                url: `data:${image.mediaType};base64,${base64(image.bytes)}`,
                detail: 'auto',
              },
            })),
          ],
        }
      : message,
  )
}

function findLastUserMessage(messages: ModelMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index--)
    if (messages[index].role === 'user') return index
  return -1
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size)
    binary += String.fromCharCode(...bytes.subarray(index, index + size))
  return btoa(binary)
}

async function openrouterFetch(
  choice: { apiKey: string },
  body: Record<string, unknown>,
): Promise<Response> {
  let res: Response
  try {
    res = await fetch(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${choice.apiKey}`,
        'content-type': 'application/json',
        // OpenRouter attribution (optional but recommended — shows the app on their dashboards).
        'HTTP-Referer': 'https://strut.io',
        'X-Title': 'Strut',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new ModelUnavailableError(
      'Could not reach OpenRouter: ' +
        (err instanceof Error ? err.message : String(err)),
    )
  }
  if (!res.ok) {
    // 401 = bad/expired key, 402 = out of credits, 429 = rate limited — surface OpenRouter's message.
    const detail = await readOpenRouterError(res)
    throw new ModelUnavailableError(
      `OpenRouter error ${res.status}${detail ? ': ' + detail : ''}`,
    )
  }
  return res
}

async function readOpenRouterError(res: Response): Promise<string> {
  try {
    const j = (await res.clone().json()) as {
      error?: {
        message?: unknown
        metadata?: { provider_name?: unknown; raw?: unknown }
      }
    } | null
    const err = j?.error
    const msg = typeof err?.message === 'string' ? err.message : ''
    // "Provider returned error" is opaque on its own — OpenRouter tucks the upstream provider's ACTUAL
    // rejection into error.metadata (provider_name + raw). Surface it (capped) so the failure is
    // diagnosable instead of a dead end.
    const meta = err?.metadata
    const provider =
      typeof meta?.provider_name === 'string' ? meta.provider_name : ''
    let raw =
      typeof meta?.raw === 'string'
        ? meta.raw
        : meta?.raw != null
          ? JSON.stringify(meta.raw)
          : ''
    if (raw.length > 300) raw = raw.slice(0, 300) + '…'
    const detail = raw && raw !== msg ? `${msg} (${raw})` : msg
    return provider ? `${detail} [provider: ${provider}]` : detail
  } catch {
    return ''
  }
}

// Rewrap the historical response_format shape as OpenRouter's `{ name, schema }` form (strict:false — our
// schemas use optional fields, and OpenRouter ignores response_format for models that don't support it, so
// output still flows and the adapters' normalize* salvages it). The inner schema is also SANITIZED
// because some providers' structured-output validators reject size/range constraint keywords.
function toOpenRouterResponseFormat(rf: unknown): unknown {
  if (!rf || typeof rf !== 'object') return undefined
  const r = rf as { type?: unknown; json_schema?: unknown }
  if (r.type !== 'json_schema') return rf
  const inner = r.json_schema
  // Already in OpenAI `{ name, schema }` form → sanitize its inner schema in place, don't double-wrap.
  if (inner && typeof inner === 'object' && 'schema' in inner) {
    const w = inner as Record<string, unknown>
    return {
      type: 'json_schema',
      json_schema: { ...w, schema: sanitizeSchema(w.schema) },
    }
  }
  return {
    type: 'json_schema',
    json_schema: {
      name: 'response',
      strict: false,
      schema: sanitizeSchema(inner),
    },
  }
}

// JSON Schema validation keywords that stricter upstream providers can reject outright. Our schemas use
// them only as soft hints — the adapters'
// normalize* is the real trust boundary — so we strip them for OpenRouter to keep the request portable
// across providers.
const UNSUPPORTED_SCHEMA_KEYS = new Set([
  'minItems',
  'maxItems',
  'uniqueItems',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minProperties',
  'maxProperties',
  'default',
])

// Deep-copy a JSON Schema with the unsupported constraint keywords removed at every level.
function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema)
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (UNSUPPORTED_SCHEMA_KEYS.has(k)) continue
      out[k] = sanitizeSchema(v)
    }
    return out
  }
  return node
}

// Transform OpenAI-compatible SSE (`data: {"choices":[{"delta":{"content":"…"}}]}`) into the
// Strut-shaped frames the client parses (`data: {"response":"…"}`), passing `[DONE]` through. Buffers
// partial lines across chunk boundaries and requires an explicit terminal marker: an HTTP 200 whose stream
// carries a provider error or simply stops mid-generation is a failed turn, not a successful partial edit.
export function normalizeOpenRouterSse(
  src: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  let buffer = ''
  let sawDone = false

  const consumeLine = (
    line: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:') || sawDone) return
    const payload = trimmed.slice(5).trim()
    if (!payload) return
    if (payload === '[DONE]') {
      sawDone = true
      controller.enqueue(enc.encode('data: [DONE]\n\n'))
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(payload) as unknown
    } catch {
      // Provider keep-alive / non-JSON extension — ignore. A missing terminal marker still fails in flush.
      return
    }
    if (!parsed || typeof parsed !== 'object') return
    const obj = parsed as {
      error?: unknown
      choices?: Array<{ delta?: { content?: unknown } }>
    }
    if ('error' in obj) {
      const raw = obj.error
      const message =
        typeof raw === 'string'
          ? raw
          : raw && typeof raw === 'object'
            ? (raw as { message?: unknown }).message
            : ''
      const detail =
        typeof message === 'string'
          ? message.length > 300
            ? message.slice(0, 300) + '…'
            : message
          : ''
      throw new ModelUnavailableError(
        `Model stream failed${detail ? ': ' + detail : '.'}`,
      )
    }
    const delta = obj.choices?.[0]?.delta?.content
    if (typeof delta === 'string' && delta.length) {
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ response: delta })}\n\n`),
      )
    }
  }

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += dec.decode(chunk, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 1)
        consumeLine(line, controller)
      }
    },
    flush(controller) {
      buffer += dec.decode()
      if (buffer.trim()) consumeLine(buffer, controller)
      if (!sawDone) {
        throw new ModelUnavailableError(
          'Model stream ended before its completion marker.',
        )
      }
    },
  })
  return src.pipeThrough(transform)
}
