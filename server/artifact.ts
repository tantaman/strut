// Runnable "artifact" blocks — the author writes JS/HTML that imports libraries (e.g. from esm.sh) and
// it RUNS inside a slide. Because that code executes in a *viewer's* browser, the whole design is about
// isolation: the built HTML is uploaded to R2 and embedded by URL, and the editor/renderer frames it in a
// `<iframe sandbox="allow-scripts">` (NEVER with allow-same-origin) — which forces a unique opaque origin,
// so it can't read the app's cookies/storage/DOM. Serving from a separate ARTIFACT_ORIGIN + the CSP header
// below is defense-in-depth on top of that. Mirrors server/upload.ts's storage shape (R2 binding → local
// disk dev fallback); the S3-compat host path is intentionally not supported for artifacts.
//
//   POST /api/artifact   (api.artifact.tsx)  — store code, return { url }
//   GET  /a/<hash>.html  (a.$key.tsx)        — serve the built HTML with text/html + CSP + nosniff

import type { R2BucketLike } from './cf-env.ts'

const LOCAL_DIR = '.uploads'
const ARTIFACT_PREFIX = 'artifacts/' // R2 key prefix / local subdir; keeps runnable HTML out of the image namespace
const MAX_CODE_BYTES = 512 * 1024 // 512 KB of source per artifact
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

// A bare content-addressed key on the wire: 64 hex chars + .html. Rejects path traversal / image keys.
const KEY_RE = /^[a-f0-9]{64}\.html$/

class ArtifactError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// ---- CSP -----------------------------------------------------------------------------------------

// The app origin allowed to FRAME an artifact (clickjacking / embedding control). Derived from the
// deployed origin so it tracks prod vs. dev without a second knob; localhost:* covers dev ports.
function frameAncestors(): string {
  const app = (process.env.BETTER_AUTH_URL || '').replace(/\/+$/, '')
  return `${app || "'self'"} http://localhost:*`
}

// Network policy for the running artifact (user decision): allow importing libraries AND fetching any
// HTTPS API — useful for live demos, and safe because the frame is opaque-origin with no cookies/secrets
// to exfiltrate. default-src 'none' still blocks plugins/nested frames; the sandbox attribute is the
// primary boundary. `blob:`/`data:` are allowed for the common worker/asset patterns viz libs use.
function cspDirectives(): string[] {
  return [
    "default-src 'none'",
    "script-src 'unsafe-inline' 'unsafe-eval' https: blob:",
    'connect-src https: data: blob:',
    'img-src data: https: blob:',
    "style-src 'unsafe-inline' https:",
    'font-src https: data:',
    'worker-src blob: https:',
    "base-uri 'none'",
    "form-action 'none'",
  ]
}

// Full CSP for the served HTTP response — includes frame-ancestors (which is IGNORED in a <meta> tag, so
// it can only be enforced here, from the Worker).
function cspHeader(): string {
  return [...cspDirectives(), `frame-ancestors ${frameAncestors()}`].join('; ')
}

// The <meta> CSP baked into the document — a fallback that still applies if the object is ever fetched
// outside the /a route. Omits frame-ancestors (not valid in meta).
function cspMeta(): string {
  return cspDirectives().join('; ')
}

/** Wrap the author's source into a complete, self-contained sandbox document. `code` is the body of an ES
 *  module, with a `#root` element and `document.body` available — so `import x from "https://esm.sh/..."`
 *  and direct DOM work both just work. */
export function artifactHtml(code: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${cspMeta()}">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { font-family: system-ui, -apple-system, sans-serif; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
${code}
</script>
</body>
</html>`
}

// ---- storage -------------------------------------------------------------------------------------

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Web Crypto is global on both the Workers runtime and Node 20+. Re-wrap in a fresh Uint8Array so the
  // buffer is a plain ArrayBuffer (satisfies BufferSource; TextEncoder output is generic over ArrayBufferLike).
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function putLocal(key: string, html: string): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const dir = join(process.cwd(), LOCAL_DIR, ARTIFACT_PREFIX)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, key), html, 'utf8')
}

async function readLocal(key: string): Promise<string | null> {
  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  try {
    return await readFile(
      join(process.cwd(), LOCAL_DIR, ARTIFACT_PREFIX, key),
      'utf8',
    )
  } catch {
    return null
  }
}

// ---- upload (POST /api/artifact) -----------------------------------------------------------------

/** Store the request-body source as a built, sandboxed HTML doc; return `{ url }` for the component's
 *  `src`. `r2` is the native binding on Workers, else null (dev → local disk). Keys are content-addressed
 *  (sha256 of the wrapped HTML), so re-saving identical code dedupes and every object is immutable. */
export async function uploadArtifactFromRequest(
  request: Request,
  r2: R2BucketLike | null,
): Promise<Response> {
  try {
    // Any authenticated session (guests included) may create artifacts — mirrors the image-upload gate.
    // The durable per-user daily quota (server/quota.ts) is the real abuse ceiling; consumed here.
    const { resolveSessionUser } = await import('./session.ts')
    const user = await resolveSessionUser(request)
    if (!user) throw new ArtifactError('unauthorized', 401)

    const declared = Number(request.headers.get('content-length') || 0)
    if (declared > MAX_CODE_BYTES)
      throw new ArtifactError('artifact source must be under 512 KB', 413)

    const code = await request.text()
    if (new TextEncoder().encode(code).byteLength > MAX_CODE_BYTES)
      throw new ArtifactError('artifact source must be under 512 KB', 413)

    // Pro accounts can raise/lift this cap (the overlay decides; `ai.meter === false` = unlimited).
    const { getEntitlements, aiMetering } = await import('./entitlements.ts')
    const ai = aiMetering(await getEntitlements(user), 'artifact')
    const { consumeArtifactQuota, refundArtifactQuota } =
      await import('./quota.ts')
    const now = Date.now()
    if (ai.meter) {
      const quota = await consumeArtifactQuota(user, now, undefined, ai.limit)
      if (!quota.allowed)
        throw new ArtifactError(
          `Daily artifact limit reached (${quota.limit}/day). Try again tomorrow.`,
          429,
        )
    }

    try {
      const html = artifactHtml(code)
      const bytes = new TextEncoder().encode(html)
      const key = `${await sha256Hex(bytes)}.html`
      if (r2) {
        await r2.put(`${ARTIFACT_PREFIX}${key}`, bytes, {
          httpMetadata: {
            contentType: 'text/html; charset=utf-8',
            cacheControl: IMMUTABLE_CACHE,
          },
        })
      } else {
        await putLocal(key, html)
      }
      // Prefer the dedicated sandbox origin (real cross-origin isolation); else serve same-origin through
      // the Worker at /a/<key> (still opaque-origin via the iframe sandbox, just no second boundary).
      const base = (process.env.ARTIFACT_ORIGIN || '').replace(/\/+$/, '')
      const url = base ? `${base}/a/${key}` : `/a/${key}`
      return Response.json({ url })
    } catch (err) {
      // The store failed — refund the consumed quota unit so the user isn't charged for nothing
      // (only if we metered it).
      if (ai.meter) await refundArtifactQuota(user, now).catch(() => {})
      throw err
    }
  } catch (err) {
    const status = err instanceof ArtifactError ? err.status : 500
    const message =
      err instanceof Error ? err.message : 'artifact upload failed'
    return Response.json({ error: message }, { status })
  }
}

// ---- serve (GET /a/<key>) ------------------------------------------------------------------------

const SERVE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cache-control': IMMUTABLE_CACHE,
} as const

/** Serve a built artifact by its content-addressed key: from the R2 binding on Workers, else local disk
 *  (dev). Always `text/html` + the sandbox CSP + nosniff — NEVER routed through the image serve path. */
export async function serveArtifactByKey(
  key: string,
  r2: R2BucketLike | null,
): Promise<Response> {
  if (!KEY_RE.test(key)) return new Response('bad key', { status: 400 })
  const headers = { ...SERVE_HEADERS, 'content-security-policy': cspHeader() }

  if (r2) {
    const obj = await r2.get(`${ARTIFACT_PREFIX}${key}`)
    if (!obj) return new Response('not found', { status: 404 })
    return new Response(obj.body, { headers })
  }

  const html = await readLocal(key)
  if (html === null) return new Response('not found', { status: 404 })
  return new Response(html, { headers })
}
