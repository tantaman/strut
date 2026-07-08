// Stock-photo search for "✨ add image → search": proxy a query to Openverse (openverse.org) — a free,
// no-API-key aggregator of openly-licensed images — and return a few direct image URLs. Done server-side
// so there's no browser CORS dance and we can validate/shape the results (https-only). It spends no
// inference, so the route guards it with just a burst throttle (no daily quota). Swap the upstream for
// Unsplash/Pexels if an API key is ever added — only this file changes.

const OPENVERSE = 'https://api.openverse.org/v1/images/'
const MAX_RESULTS = 6
const MAX_QUERY = 200

export class ImageSearchError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ImageSearchError'
  }
}

/** Return up to MAX_RESULTS direct https image URLs for `query` (empty array when nothing matches).
 *  Throws ImageSearchError(502) if the upstream is unreachable or misbehaves. */
export async function searchImages(queryRaw: unknown): Promise<string[]> {
  const query = String(queryRaw ?? '')
    .slice(0, MAX_QUERY)
    .trim()
  if (!query) return []

  const url =
    `${OPENVERSE}?q=${encodeURIComponent(query)}` +
    `&page_size=${MAX_RESULTS}&license_type=commercial&mature=false`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'strut.io/image-search' },
    })
  } catch {
    throw new ImageSearchError('image search unavailable', 502)
  }
  if (!res.ok) throw new ImageSearchError('image search unavailable', 502)

  const body = (await res.json().catch(() => null)) as {
    results?: Array<{ url?: unknown }>
  } | null
  const results = Array.isArray(body?.results) ? body.results : []
  return results
    .map((r) => (typeof r.url === 'string' ? r.url : ''))
    .filter((u) => /^https:\/\//.test(u))
    .slice(0, MAX_RESULTS)
}
