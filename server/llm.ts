// server/llm.ts — the ONE model seam (OPENROUTER_PLAN.md Phase 3). Every ✨ feature's inference flows
// through here, and the backend is chosen PER REQUEST from the caller's connected credential:
//   • BYO — the user connected an OpenRouter key (server/modelCred.ts): call OpenRouter with THEIR key,
//     THEY pay. OpenRouter is OpenAI-compatible, so it's a plain fetch — no binding, and it works under
//     `pnpm dev` (Node) too, unlike the Workers AI object binding.
//   • default — no connected key: Cloudflare Workers AI (the app pays), exactly as before.
//
// This folds together the three formerly-duplicated loadAi()/AiBinding/extractJson copies that lived in
// server/{arrange,generate,chat}.ts. Those adapters now just build messages + schema and call callModel /
// streamModel; the ROUTE resolves the choice (resolveModel) and passes it in, and reads choice.kind for
// its pay/guest/quota branching (a BYO call skips the app quota and is open to guests — the user pays).

import { getCredential } from './modelCred.ts'

// The Workers AI instruct model used when the app pays (unchanged from the adapters): structured JSON +
// streaming, a small bounded call, so an instruct model is plenty.
const WORKERS_AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
// OpenRouter's auto-router when the user didn't pin a specific model id.
const OPENROUTER_DEFAULT_MODEL = 'openrouter/auto'
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type ModelChoice =
  | { kind: 'workers-ai'; model: string }
  | { kind: 'openrouter'; model: string; apiKey: string }

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CallInput {
  messages: ModelMessage[]
  /** A Workers-AI-shaped `{ type: 'json_schema', json_schema: <rawSchema> }` (or undefined). Rewrapped
   *  into OpenAI form for the OpenRouter path; passed through untouched to Workers AI. */
  response_format?: unknown
  max_tokens?: number
}

/** Thrown when the chosen backend can't be reached, or the call failed before any output. Adapters catch
 *  this and rethrow as their feature-specific *UnavailableError (route → 503; app-paid quota refunded). */
export class ModelUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelUnavailableError'
  }
}

/** Pick the backend for a user: their connected OpenRouter key if present, else app-paid Workers AI. A
 *  credential read/decrypt failure falls back to Workers AI (logged) so a misconfigured MODEL_CRED_KEY
 *  never hard-fails the ✨ features. */
export async function resolveModel(userId: string): Promise<ModelChoice> {
  try {
    const cred = await getCredential(userId)
    if (cred && cred.provider === 'openrouter' && cred.apiKey) {
      return {
        kind: 'openrouter',
        model: cred.model || OPENROUTER_DEFAULT_MODEL,
        apiKey: cred.apiKey,
      }
    }
  } catch (err) {
    console.error(
      '[llm] credential resolution failed; falling back to Workers AI:',
      err instanceof Error ? err.message : err,
    )
  }
  return { kind: 'workers-ai', model: WORKERS_AI_MODEL }
}

// ---- Workers AI binding (single copy; was duplicated in all three adapters) ----

// The sliver of the Workers AI binding we call — typed structurally so we don't pull
// @cloudflare/workers-types (whose globals shadow the DOM lib) into the build graph.
interface AiBinding {
  run: (model: string, input: unknown) => Promise<unknown>
}

let cachedAi: AiBinding | null | undefined
async function loadAi(): Promise<AiBinding | null> {
  if (cachedAi !== undefined) return cachedAi
  try {
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as {
      env?: Record<string, unknown>
    }
    cachedAi = (mod.env?.AI as AiBinding | undefined) ?? null
  } catch {
    cachedAi = null
  }
  return cachedAi
}

// Workers AI returns `{ response: obj|string }` for json_schema output; OpenRouter returns the content as
// a JSON string. Normalize both to a parsed object (or {} if unparseable — the adapters' normalize* is the
// trust boundary and tolerates junk). Was the per-adapter extractJson().
function extractJson(resp: unknown): unknown {
  if (resp && typeof resp === 'object') return resp
  if (typeof resp === 'string') {
    try {
      return JSON.parse(resp)
    } catch {
      return {}
    }
  }
  return {}
}

/** One-shot structured completion (Arrange, Generate). Returns the model's JSON as a parsed object.
 *  Throws ModelUnavailableError if the backend is unreachable or the call fails. */
export async function callModel(
  choice: ModelChoice,
  input: CallInput,
): Promise<unknown> {
  if (choice.kind === 'openrouter') {
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

  const ai = await loadAi()
  if (!ai) {
    throw new ModelUnavailableError(
      'Workers AI binding is unavailable in this runtime.',
    )
  }
  let result: unknown
  try {
    result = await ai.run(choice.model, {
      messages: input.messages,
      response_format: input.response_format,
      max_tokens: input.max_tokens,
    })
  } catch (err) {
    throw new ModelUnavailableError(
      'AI request failed: ' + (err instanceof Error ? err.message : String(err)),
    )
  }
  const r = (result ?? {}) as { response?: unknown }
  return extractJson(r.response ?? result)
}

/** Streamed completion (Chat + the Edit lane). Returns an SSE byte stream of Workers-AI-shaped
 *  `data: {"response":"…"}` frames + `data: [DONE]` — the shape the client already parses (src/editor/
 *  aiChat.ts parseSseDelta). Workers AI passes through untouched; OpenRouter's OpenAI-style frames are
 *  normalized. Plain PROSE only — no `response_format`: Workers AI's JSON Mode is mutually exclusive with
 *  streaming (developers.cloudflare.com/workers-ai/features/json-mode), so a streaming feature that needs
 *  structure (the Edit lane) prompts for a fenced JSON block in the prose and parses it out (server/
 *  chatAct.ts) instead of relying on json_schema. Throws ModelUnavailableError if the backend is
 *  unreachable / fails before a stream exists. */
export async function streamModel(
  choice: ModelChoice,
  input: { messages: ModelMessage[] },
): Promise<ReadableStream<Uint8Array>> {
  if (choice.kind === 'openrouter') {
    const res = await openrouterFetch(choice, {
      model: choice.model,
      messages: input.messages,
      stream: true,
    })
    if (!res.body) {
      throw new ModelUnavailableError('OpenRouter returned no stream body.')
    }
    return normalizeOpenRouterSse(res.body)
  }

  const ai = await loadAi()
  if (!ai) {
    throw new ModelUnavailableError(
      'Workers AI binding is unavailable in this runtime.',
    )
  }
  let result: unknown
  try {
    result = await ai.run(choice.model, { messages: input.messages, stream: true })
  } catch (err) {
    throw new ModelUnavailableError(
      'AI request failed: ' + (err instanceof Error ? err.message : String(err)),
    )
  }
  if (!(result instanceof ReadableStream)) {
    throw new ModelUnavailableError('AI did not return a token stream.')
  }
  return result as ReadableStream<Uint8Array>
}

// ---- OpenRouter transport ----

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
      error?: { message?: unknown }
    } | null
    return typeof j?.error?.message === 'string' ? j.error.message : ''
  } catch {
    return ''
  }
}

// Workers AI accepts the raw JSON Schema directly under `json_schema`; OpenAI/OpenRouter want it wrapped as
// `{ name, schema }`. Rewrap the Workers-AI-shaped response_format for OpenRouter (strict:false — our
// schemas use optional fields, and OpenRouter ignores response_format for models that don't support it, so
// output still flows and the adapters' normalize* salvages it). Non-json_schema shapes pass through.
function toOpenRouterResponseFormat(rf: unknown): unknown {
  if (!rf || typeof rf !== 'object') return undefined
  const r = rf as { type?: unknown; json_schema?: unknown }
  if (r.type !== 'json_schema') return rf
  const schema = r.json_schema
  // Already in OpenAI `{ name, schema }` form → leave as-is (don't double-wrap).
  if (schema && typeof schema === 'object' && 'schema' in schema) {
    return rf
  }
  return {
    type: 'json_schema',
    json_schema: { name: 'response', strict: false, schema },
  }
}

// Transform OpenRouter's OpenAI-style SSE (`data: {"choices":[{"delta":{"content":"…"}}]}`) into the
// Workers-AI-shaped frames the client parses (`data: {"response":"…"}`), passing `[DONE]` through. Buffers
// partial lines across chunk boundaries.
function normalizeOpenRouterSse(
  src: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  let buffer = ''
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += dec.decode(chunk, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          controller.enqueue(enc.encode('data: [DONE]\n\n'))
          continue
        }
        try {
          const obj = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: unknown } }>
          }
          const delta = obj.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta.length) {
            controller.enqueue(
              enc.encode(`data: ${JSON.stringify({ response: delta })}\n\n`),
            )
          }
        } catch {
          // keep-alive / comment / partial frame — ignore
        }
      }
    },
  })
  return src.pipeThrough(transform)
}
