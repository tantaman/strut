import { createFileRoute } from '@tanstack/react-router'
import type { VariantRequest } from '../../shared/variant'

// "Create variant" endpoint. Like /api/generate, this spends inference but does not persist anything
// directly; the returned variant plan is applied through normal Rindle mutations on the client.

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

export const Route = createFileRoute('/api/variant')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) return json({ error: 'sign_in_required' }, 401)

        const { resolveModel } = await import('../../server/llm')
        const choice = await resolveModel(account.id)
        const byo = choice.kind === 'openrouter'

        if (!byo && account.isAnonymous) {
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
        if (typeof body !== 'object' || body === null) {
          return json({ error: 'bad_request' }, 400)
        }
        const b = body as Partial<VariantRequest>
        if (
          typeof b.sourceDeckId !== 'string' ||
          typeof b.sourceTitle !== 'string' ||
          typeof b.audience !== 'string' ||
          typeof b.instructions !== 'string' ||
          !Array.isArray(b.slides)
        ) {
          return json({ error: 'bad_request' }, 400)
        }

        const now = Date.now()
        const { getEntitlements, aiMetering } =
          await import('../../server/entitlements')
        const ai = aiMetering(await getEntitlements(account.id), 'generate')
        if (!byo && ai.meter) {
          const { consumeGenerateQuota } = await import('../../server/quota')
          let quota
          try {
            quota = await consumeGenerateQuota(
              account.id,
              now,
              undefined,
              ai.limit,
            )
          } catch (err) {
            console.error('[variant] quota check failed:', err)
            return json({ error: 'internal' }, 500)
          }
          if (!quota.allowed) {
            return json(
              {
                error: 'quota_exceeded',
                message: `Daily AI slide-generation limit reached (${quota.limit}/day). Try again tomorrow.`,
              },
              429,
            )
          }
        }

        const { generateVariant, VariantUnavailableError } =
          await import('../../server/variant')
        try {
          const variant = await generateVariant(b as VariantRequest, choice)
          return json(variant, 200)
        } catch (err) {
          if (!byo && ai.meter) {
            const { refundGenerateQuota } = await import('../../server/quota')
            await refundGenerateQuota(account.id, now).catch(() => {})
          }
          if (err instanceof VariantUnavailableError) {
            return json({ error: 'ai_unavailable', message: err.message }, 503)
          }
          console.error('[variant] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
