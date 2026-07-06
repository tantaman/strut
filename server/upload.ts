// Image upload, hosted by the TanStack Start server routes in src/routes/api.rindle.upload.tsx and
// api.rindle.uploads.$key.tsx. The browser sends the raw file bytes with the image mime in
// Content-Type; we store the object and return its public URL, saved as the component's `src`. This
// replaces inlining images as base64 data URLs in the deck rows.
//
// Storage, in priority order (see docs/DEPLOY_CLOUDFLARE.md):
//   1. Native Cloudflare R2 binding — when deployed to Workers (env.STRUT_UPLOADS is passed in). No
//      S3 credentials needed. This is the production path on Cloudflare.
//   2. R2 over the S3-compatible API — when the R2_* env vars are set on a non-Workers host.
//   3. Local disk under .uploads/ — the zero-config dev fallback (served back by serveUploadByKey).

import type { S3Client as S3ClientT } from '@aws-sdk/client-s3'
import type { R2BucketLike } from './cf-env.ts'

// Local-fallback files are served back by serveUploadByKey (Vite/Start won't serve files written at
// runtime). With R2 (binding or S3) configured, URLs point at the bucket / a Worker-served path.
export const UPLOAD_SERVE_PREFIX = '/api/rindle/uploads/'
const LOCAL_DIR_NAME = '.uploads'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

// Allowed image mimes → file extension (also bounds what we accept).
const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

class UploadError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// ---- storage backend 1: native R2 binding (Cloudflare Workers) ----------------------------------

async function putR2Binding(
  r2: R2BucketLike,
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  await r2.put(key, body, {
    httpMetadata: { contentType, cacheControl: IMMUTABLE_CACHE },
  })
  // If a public bucket / custom domain is configured, hand back its CDN URL. Otherwise serve the
  // object back through the Worker (serveUploadByKey) so a private bucket works with no extra setup.
  const base = process.env.R2_PUBLIC_BASE_URL
  return base
    ? `${base.replace(/\/+$/, '')}/${key}`
    : `${UPLOAD_SERVE_PREFIX}${key}`
}

// ---- storage backend 2: R2 over the S3-compatible API (non-Workers host) ------------------------

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBase: string
}

function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_BASE_URL
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase)
    return null
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBase }
}

// Memoized S3 client (AWS SDK imported lazily so the binding/local paths need nothing at runtime; the
// dynamic import is ESM-cached, so re-importing PutObjectCommand per call in putS3 is free).
let s3ClientPromise: Promise<S3ClientT> | null = null
function getS3Client(cfg: R2Config): Promise<S3ClientT> {
  s3ClientPromise ??= import('@aws-sdk/client-s3').then(
    ({ S3Client }) =>
      new S3Client({
        region: 'auto',
        endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: cfg.accessKeyId,
          secretAccessKey: cfg.secretAccessKey,
        },
      }),
  )
  return s3ClientPromise
}

async function putS3(
  cfg: R2Config,
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  const [client, { PutObjectCommand }] = await Promise.all([
    getS3Client(cfg),
    import('@aws-sdk/client-s3'),
  ])
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: IMMUTABLE_CACHE,
    }),
  )
  return `${cfg.publicBase.replace(/\/+$/, '')}/${key}`
}

// ---- storage backend 3: local disk (dev fallback) -----------------------------------------------

// node:* imported lazily so this module loads clean on the Workers runtime (the local path is never
// reached there — a binding is always present).
async function putLocal(key: string, body: Uint8Array): Promise<string> {
  const { mkdir, writeFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  const dir = join(process.cwd(), LOCAL_DIR_NAME)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, key), body)
  // Served back by serveUploadByKey() (a Start server route).
  return `${UPLOAD_SERVE_PREFIX}${key}`
}

// ---- serve (GET /api/rindle/uploads/<key>) ------------------------------------------------------

// Streams a stored image back: from the R2 binding when present (private bucket, Workers), else from
// local disk (dev). With R2_PUBLIC_BASE_URL set, image src URLs point at the bucket and never hit this.
export async function serveUploadByKey(
  key: string,
  r2: R2BucketLike | null,
): Promise<Response> {
  // Only a bare filename — no path traversal.
  if (!/^[\w-]+\.[a-z0-9]+$/i.test(key))
    return new Response('bad key', { status: 400 })
  const ext = key.split('.').pop()!.toLowerCase()
  const mimeFromExt = Object.entries(EXT).find(([, e]) => e === ext)?.[0]

  if (r2) {
    const obj = await r2.get(key)
    if (!obj) return new Response('not found', { status: 404 })
    return new Response(obj.body, {
      headers: {
        'content-type':
          obj.httpMetadata?.contentType ??
          mimeFromExt ??
          'application/octet-stream',
        'cache-control': IMMUTABLE_CACHE,
      },
    })
  }

  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')
  try {
    const body = await readFile(join(process.cwd(), LOCAL_DIR_NAME, key))
    return new Response(body, {
      headers: {
        'content-type': mimeFromExt ?? 'application/octet-stream',
        'cache-control': IMMUTABLE_CACHE,
      },
    })
  } catch {
    return new Response('not found', { status: 404 })
  }
}

// ---- upload (POST /api/rindle/upload) -----------------------------------------------------------

// Store the request body image, return { url }. `r2` is the native binding on Workers, else null.
export async function uploadFromRequest(
  request: Request,
  r2: R2BucketLike | null,
): Promise<Response> {
  try {
    // Auth gate = the server-verified session (cookie), not the spoofable `x-user` header. Uploads
    // aren't user-scoped (random-UUID keys), so we only require SOME authenticated principal.
    const { resolveSessionUser } = await import('./session.ts')
    const user = await resolveSessionUser(request)
    if (!user) throw new UploadError('unauthorized', 401)

    const contentType = (request.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    const ext = EXT[contentType]
    if (!ext)
      throw new UploadError(`unsupported image type: ${contentType}`, 415)

    const declared = Number(request.headers.get('content-length') || 0)
    if (declared > MAX_BYTES)
      throw new UploadError('image must be under 10 MB', 413)

    const body = new Uint8Array(await request.arrayBuffer())
    if (body.byteLength === 0) throw new UploadError('empty upload', 400)
    if (body.byteLength > MAX_BYTES)
      throw new UploadError('image must be under 10 MB', 413)

    // crypto.randomUUID() is a global in both Node 20+ and the Workers runtime.
    const key = `${crypto.randomUUID()}.${ext}`
    const cfg = r2 ? null : r2Config()
    const url = r2
      ? await putR2Binding(r2, key, body, contentType)
      : cfg
        ? await putS3(cfg, key, body, contentType)
        : await putLocal(key, body)

    return Response.json({ url })
  } catch (err) {
    const status = err instanceof UploadError ? err.status : 500
    const message = err instanceof Error ? err.message : 'upload failed'
    return Response.json({ error: message }, { status })
  }
}
