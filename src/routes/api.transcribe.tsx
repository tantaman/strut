import { createFileRoute } from '@tanstack/react-router'
import { TRANSCRIBE_LIMITS } from '../../shared/transcript'

// "🎙️ From a recording" — the TRANSCRIBE endpoint. Takes the raw bytes of an audio recording (POSTed as the
// request body with the file's content-type, like /api/rindle/upload), returns { text } transcribed by
// Workers AI Whisper (server/transcribe.ts). Speech-to-text is Workers-AI-only (no BYO path), so it is
// ALWAYS app-paid — hence the same two boundaries as /api/image applied to EVERY caller:
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can trigger the
//      control but can't spend the app's inference budget.
//   2. COST BOUND — a cheap per-isolate burst throttle plus the AUTHORITATIVE durable daily quota in
//      server/quota.ts (transcribe_usage, D1), consumed before the model call and refunded if it fails.
// The audio is never persisted — ephemeral in, text out.

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()
function throttled(userId: string): boolean {
  const now = Date.now()
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent)
    return true
  }
  recent.push(now)
  hits.set(userId, recent)
  return false
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/transcribe')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account || account.isAnonymous) {
          return json({ error: 'sign_in_required' }, 401)
        }
        if (throttled(account.id)) {
          return json({ error: 'rate_limited' }, 429)
        }

        // Reject an oversized recording BEFORE reading the whole body when the header is trustworthy — the
        // paste-a-transcript path handles anything longer. (We re-check the actual byte length below.)
        const declared = Number(request.headers.get('content-length') ?? '')
        if (
          Number.isFinite(declared) &&
          declared > TRANSCRIBE_LIMITS.maxAudioBytes
        ) {
          return json({ error: 'too_large', message: tooLargeMessage() }, 413)
        }

        let bytes: Uint8Array
        try {
          bytes = new Uint8Array(await request.arrayBuffer())
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        if (bytes.byteLength === 0) {
          return json({ error: 'bad_request' }, 400)
        }
        if (bytes.byteLength > TRANSCRIBE_LIMITS.maxAudioBytes) {
          return json({ error: 'too_large', message: tooLargeMessage() }, 413)
        }

        // Durable daily quota — consumed BEFORE the model call so concurrent calls can't race past the cap.
        // `ai.meter === false` (unlimited plan) skips it.
        const now = Date.now()
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'transcribe')
        const { consumeAiQuota, refundAiQuota } =
          await import('../../server/quota')
        if (ai.meter) {
          let quota
          try {
            quota = await consumeAiQuota(account.id, now, 'transcribe', ai)
          } catch (err) {
            console.error('[transcribe] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message:
                  quota.window === 'month'
                    ? `You've used all ${quota.limit} AI messages in your plan this month. They reset at the start of next month.`
                    : `Daily audio-transcription limit reached (${quota.limit}/day). Paste a transcript instead, or try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { transcribeAudio, TranscribeUnavailableError } =
          await import('../../server/transcribe')
        try {
          const text = await transcribeAudio(bytes)
          return json({ text }, 200)
        } catch (err) {
          // The work didn't happen — refund the consumed unit (only if we metered it).
          if (ai.meter)
            await refundAiQuota(account.id, now, 'transcribe', ai.window).catch(
              () => {},
            )
          if (err instanceof TranscribeUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[transcribe] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})

function tooLargeMessage(): string {
  const mb = Math.round(TRANSCRIBE_LIMITS.maxAudioBytes / (1024 * 1024))
  return `That recording is too large (max ${mb} MB). For a longer talk, paste the transcript instead.`
}
