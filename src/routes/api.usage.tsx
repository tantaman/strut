import { createFileRoute } from '@tanstack/react-router'
import type { AiFeature } from '../../shared/commercial'

// Usage snapshot for the dashboard's usage meter (src/rindle/UsageMeter.tsx): today's app-paid AI counts
// + stored bytes, each with the viewer's effective limit. Session-gated; all reads come from the auth D1
// (quota + storage tables). Pro / unlimited features report `limit: null` and skip the D1 reads.

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// The user-facing ✨ features (artifact + transcribe usage are internal precursors, so they're left off the
// panel; narrate is the user-facing "recording → slides" action).
const FEATURES: Array<AiFeature> = [
  'arrange',
  'generate',
  'chat',
  'image',
  'narrate',
]

export const Route = createFileRoute('/api/usage')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) return json({ error: 'sign_in_required' }, 401)

        const { getEntitlements, entitlementSummary } =
          await import('../../server/entitlements')
        const ent = await getEntitlements(account.id)
        const now = Date.now()

        // A connected BYO OpenRouter key lifts the app-paid cap for the features that HAVE a BYO path
        // (arrange/generate/chat run on the user's own credits). Image is Workers-AI-only, so it stays
        // capped even with a key — mirroring the `if (!byo)` gating in the AI routes.
        const { resolveModel } = await import('../../server/llm')
        const byo = (await resolveModel(account.id)).kind === 'openrouter'
        const BYO_UNLIMITED: Record<AiFeature, boolean> = {
          arrange: true,
          generate: true,
          chat: true,
          image: false,
          artifact: false,
          // narrate runs through the shared model seam, so a BYO key lifts its cap (like generate); transcribe
          // is Workers-AI-only (Whisper), so it stays capped even with a key (like image).
          narrate: true,
          transcribe: false,
        }

        // A pooled plan (Pro) reports ONE shared monthly counter instead of the per-feature daily buckets;
        // the free tier reports each daily bucket. (aiUnlimited short-circuits both to "Unlimited".)
        const pooled = !ent.aiUnlimited && ent.aiMonthlyPool != null
        let pool: { used: number; limit: number } | null = null
        let features: Array<{
          key: AiFeature
          used: number
          limit: number | null
        }> = []
        if (pooled) {
          const { peekPool } = await import('../../server/quota')
          pool = {
            used: await peekPool(account.id, now),
            limit: ent.aiMonthlyPool as number,
          }
        } else {
          const { peekUsage, FEATURE_DEFAULT_LIMIT } =
            await import('../../server/quota')
          features = await Promise.all(
            FEATURES.map(async (key) => {
              const unlimited = ent.aiUnlimited || (byo && BYO_UNLIMITED[key])
              return {
                key,
                used: unlimited ? 0 : await peekUsage(account.id, now, key),
                limit: unlimited
                  ? null
                  : (ent.aiDailyLimits?.[key] ?? FEATURE_DEFAULT_LIMIT[key]),
              }
            }),
          )
        }

        let storageUsed = 0
        if (ent.storageLimitBytes != null) {
          const { getStorageUsed } = await import('../../server/storage')
          storageUsed = await getStorageUsed(account.id)
        }

        // Pooled allowance rolls over at the start of next UTC month; daily quotas at the next UTC midnight.
        const reset = new Date(now)
        if (pooled) {
          reset.setUTCMonth(reset.getUTCMonth() + 1, 1)
          reset.setUTCHours(0, 0, 0, 0)
        } else {
          reset.setUTCHours(24, 0, 0, 0)
        }

        return json(
          {
            isPro: ent.pro,
            byo,
            upgradeUrl: entitlementSummary(ent).upgradeUrl,
            resetsAt: reset.toISOString(),
            storage: { used: storageUsed, limit: ent.storageLimitBytes },
            ai: { unlimited: ent.aiUnlimited, pool, features },
          },
          200,
        )
      },
    },
  },
})
