import { createFileRoute } from '@tanstack/react-router'

// "✨ add image → search" endpoint. Proxies a stock-photo search to Openverse (server/imageSearch.ts) and
// returns { results: string[] } of direct https image URLs. It spends NO inference — just an outbound
// query — so it's gated only by a session (guests OK) + a per-isolate burst throttle, no daily quota.
// GET with `?q=<query>`.

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
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

export const Route = createFileRoute('/api/image-search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { resolveSessionAccount } = await import('../../server/session')
        const account = await resolveSessionAccount(request)
        if (!account) {
          return json({ error: 'sign_in_required' }, 401)
        }
        if (throttled(account.id)) {
          return json({ error: 'rate_limited' }, 429)
        }

        const q = new URL(request.url).searchParams.get('q') ?? ''
        if (!q.trim()) return json({ results: [] }, 200)

        const { searchImages, ImageSearchError } =
          await import('../../server/imageSearch')
        try {
          const results = await searchImages(q)
          return json({ results }, 200)
        } catch (err) {
          if (err instanceof ImageSearchError) {
            return json({ error: 'search_unavailable', message: err.message }, err.status)
          }
          console.error('[image-search] failed:', err)
          return json({ error: 'internal' }, 500)
        }
      },
    },
  },
})
