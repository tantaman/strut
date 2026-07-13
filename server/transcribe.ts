// The "🎙️ From a recording" transcription adapter: turn an uploaded audio recording into text via
// Cloudflare Workers AI Whisper. Speech-to-text is Workers-AI-only (there is no BYO-OpenRouter audio path
// here), so it is ALWAYS the app-paid path — the route gates it member-only + a daily quota, mirroring the
// cost posture of server/image.ts (the other Workers-AI-only, app-paid feature). This adapter only runs the
// model and pulls the text out; the ROUTE handles auth, quota, and size limits. The transcript then feeds
// the narrate form (the audio is never persisted — ephemeral in, text out).
// Dev-without-workerd: STRUT_TRANSCRIBE_STUB yields a deterministic transcript so the flow is exercisable
// under `pnpm dev` with no AI binding.

import { loadAi } from './llm.ts'

// whisper-large-v3-turbo: takes `audio` as a base64 string, returns a top-level `text` (the only required
// output field — see the model's schema-output.json). Newer/larger than the base @cf/openai/whisper (which
// wants a byte ARRAY), and it handles longer clips — so it's the right default for talk-length recordings.
const WHISPER_MODEL = '@cf/openai/whisper-large-v3-turbo'

/** Thrown when transcription can't be reached (no binding / the model call failed / no text back). The
 *  route maps it to a 503 with a user-facing message and refunds the app-paid quota unit. */
export class TranscribeUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscribeUnavailableError'
  }
}

/** Transcribe the audio bytes of a recording to text. Throws TranscribeUnavailableError when the Workers AI
 *  binding is unreachable or returns nothing usable (the route maps that to 503 + a quota refund). Returns
 *  the recognized text (may be empty for silence — the caller decides whether that's an error). */
export async function transcribeAudio(bytes: Uint8Array): Promise<string> {
  const ai = await loadAi()
  if (!ai) {
    // Dev-only escape hatch: no Workers AI binding under `pnpm dev` → deterministic transcript.
    if (process.env.STRUT_TRANSCRIBE_STUB) {
      return (
        'Thanks everyone for coming. Today I want to walk through three ideas. ' +
        'First, why this matters. Second, how it actually works under the hood. ' +
        'And third, where we go from here. Let me start with the why.'
      )
    }
    throw new TranscribeUnavailableError(
      'Workers AI binding is unavailable in this runtime.',
    )
  }

  let out: unknown
  try {
    out = await ai.run(WHISPER_MODEL, { audio: bytesToBase64(bytes) })
  } catch (err) {
    throw new TranscribeUnavailableError(
      err instanceof Error ? err.message : String(err),
    )
  }

  const text = extractText(out)
  if (text == null) {
    throw new TranscribeUnavailableError(
      'the transcription model returned no text',
    )
  }
  return text.trim()
}

// Pull the transcript out of Whisper's response defensively. whisper-large-v3-turbo returns a top-level
// `text`; we also fall back to joining `segments[].text`, then `transcription_info.text`, so a model/schema
// tweak (or swapping to another Whisper variant) doesn't silently break the feature. Returns null only when
// no text-shaped field exists at all (distinct from an empty-string transcript for silence).
function extractText(out: unknown): string | null {
  const o = (out ?? {}) as {
    text?: unknown
    segments?: unknown
    transcription_info?: { text?: unknown }
  }
  if (typeof o.text === 'string') return o.text
  if (Array.isArray(o.segments)) {
    const joined = o.segments
      .map((s) =>
        s &&
        typeof s === 'object' &&
        typeof (s as { text?: unknown }).text === 'string'
          ? (s as { text: string }).text
          : '',
      )
      .join('')
    if (joined) return joined
  }
  if (typeof o.transcription_info?.text === 'string')
    return o.transcription_info.text
  return null
}

// Base64-encode the audio bytes for Whisper's `audio` input. Chunked because `String.fromCharCode(...bytes)`
// on a multi-MB buffer blows the call-stack argument limit; 0x8000-byte windows stay well under it. `btoa`
// is a global in both the Workers runtime and Node 18+.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}
