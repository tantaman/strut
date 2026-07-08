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

// The user-facing ✨ features (artifact usage is internal, so it's left off the panel).
const FEATURES: Array<AiFeature> = ['arrange', 'generate', 'chat', 'image']

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

        const { peekUsage, FEATURE_DEFAULT_LIMIT } =
          await import('../../server/quota')
        const features = await Promise.all(
          FEATURES.map(async (key) => ({
            key,
            used: ent.aiUnlimited ? 0 : await peekUsage(account.id, now, key),
            limit: ent.aiUnlimited
              ? null
              : (ent.aiDailyLimits?.[key] ?? FEATURE_DEFAULT_LIMIT[key]),
          })),
        )

        let storageUsed = 0
        if (ent.storageLimitBytes != null) {
          const { getStorageUsed } = await import('../../server/storage')
          storageUsed = await getStorageUsed(account.id)
        }

        // Daily quotas roll over at UTC midnight.
        const reset = new Date(now)
        reset.setUTCHours(24, 0, 0, 0)

        return json(
          {
            isPro: ent.pro,
            upgradeUrl: entitlementSummary(ent).upgradeUrl,
            resetsAt: reset.toISOString(),
            storage: { used: storageUsed, limit: ent.storageLimitBytes },
            ai: { unlimited: ent.aiUnlimited, features },
          },
          200,
        )
      },
    },
  },
})
