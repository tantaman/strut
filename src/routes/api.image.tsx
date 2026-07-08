import { createFileRoute } from '@tanstack/react-router'

// "✨ add image → generate" endpoint. Takes { prompt }, returns { url } of a Workers-AI-generated image
// stored in R2 (server/image.ts). Image generation is Workers-AI-only (there's no BYO-OpenRouter image
// path), so it is ALWAYS app-paid — hence the same two boundaries as /api/generate applied to EVERY
// caller (not just the app-paid path):
//   1. LOGIN GATE — anonymous (guest) sessions and no-session requests are rejected. Guests can trigger
//      the control but can't spend the app's inference budget.
//   2. COST BOUND — a cheap per-isolate burst throttle plus the AUTHORITATIVE durable daily quota in
//      server/quota.ts (image_usage, D1), consumed before the model call and refunded if it fails.

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

export const Route = createFileRoute('/api/image')({
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

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return json({ error: 'bad_request' }, 400)
        }
        const prompt = (body as { prompt?: unknown } | null)?.prompt
        if (typeof prompt !== 'string' || !prompt.trim()) {
          return json({ error: 'bad_request' }, 400)
        }

        // Durable daily quota — consumed BEFORE the model call so concurrent calls can't race past the cap.
        // Pro accounts are unlimited (`ai.meter === false`) and skip the cap.
        const now = Date.now()
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ent = await getEntitlements(account.id)
        const ai = aiMetering(ent, 'image')
        // Per-plan storage ceiling (free tier). null (self-host / Pro) skips it. Reject before spending
        // inference when there's no headroom; the generated image's bytes are recorded after a success.
        if (ent.storageLimitBytes != null) {
          const { getStorageUsed } = await import('../../server/storage')
          if ((await getStorageUsed(account.id)) >= ent.storageLimitBytes) {
            return json(
              {
                error: 'storage_exceeded',
                message:
                  'Storage limit reached — upgrade to Pro for more storage.',
              },
              413,
            )
          }
        }
        const { consumeImageQuota, refundImageQuota } =
          await import('../../server/quota')
        if (ai.meter) {
          let quota
          try {
            quota = await consumeImageQuota(
              account.id,
              now,
              undefined,
              ai.limit,
            )
          } catch (err) {
            console.error('[image] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message: `Daily AI image limit reached (${quota.limit}/day). Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { generateImage, ImageUnavailableError } =
          await import('../../server/image')
        const { getUploadsBucket } = await import('../../server/cf-env')
        try {
          const { url, bytes } = await generateImage(
            prompt,
            await getUploadsBucket(),
          )
          if (ent.storageLimitBytes != null) {
            const { recordStorage } = await import('../../server/storage')
            await recordStorage(account.id, bytes).catch(() => {})
          }
          return json({ url }, 200)
        } catch (err) {
          // The work didn't happen — refund the consumed unit (only if we metered it).
          if (ai.meter) await refundImageQuota(account.id, now).catch(() => {})
          if (err instanceof ImageUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[image] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
