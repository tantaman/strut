// Image upload endpoint (POST /api/rindle/upload). The browser sends the raw file bytes with the
// image mime in Content-Type; we store the object and return its public URL, which the client saves
// as the component's `src`. This replaces inlining images as base64 data URLs in the deck rows.
//
// Storage: Cloudflare R2 (S3-compatible) when the R2_* env vars are set; otherwise a local-disk
// fallback under public/uploads/ so uploads work in dev with zero config. See .env.example.

import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const UPLOAD_ROUTE = '/api/rindle/upload'
// Local-fallback files are served back by this same API server (Vite doesn't reliably serve
// files written into public/ at runtime). With R2 configured, URLs point at the bucket instead.
export const UPLOAD_SERVE_PREFIX = '/api/rindle/uploads/'
const LOCAL_DIR = join(process.cwd(), '.uploads')

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

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

function readRaw(req: IncomingMessage, max: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > max) {
        reject(new UploadError('image must be under 10 MB', 413))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

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

// Memoized S3 client (AWS SDK imported lazily so the local-fallback path needs nothing at runtime).
let s3Promise: Promise<{
  client: import('@aws-sdk/client-s3').S3Client
  PutObjectCommand: typeof import('@aws-sdk/client-s3').PutObjectCommand
}> | null = null
function getS3(cfg: R2Config) {
  s3Promise ??= (async () => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
    return { client, PutObjectCommand }
  })()
  return s3Promise
}

async function putR2(
  cfg: R2Config,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { client, PutObjectCommand } = await getS3(cfg)
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return `${cfg.publicBase.replace(/\/+$/, '')}/${key}`
}

async function putLocal(key: string, body: Buffer): Promise<string> {
  await mkdir(LOCAL_DIR, { recursive: true })
  await writeFile(join(LOCAL_DIR, key), body)
  // Served back by serveUpload() below (proxied to this server via /api/rindle).
  return `${UPLOAD_SERVE_PREFIX}${key}`
}

// GET /api/rindle/uploads/<key> — stream a locally-stored fallback image.
export async function serveUpload(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const key = decodeURIComponent((req.url ?? '').slice(UPLOAD_SERVE_PREFIX.length))
  // Only a bare filename — no path traversal.
  if (!/^[\w-]+\.[a-z0-9]+$/i.test(key)) {
    res.writeHead(400).end('bad key')
    return
  }
  const ext = key.split('.').pop()!.toLowerCase()
  const mime = Object.entries(EXT).find(([, e]) => e === ext)?.[0]
  try {
    const body = await readFile(join(LOCAL_DIR, key))
    res
      .writeHead(200, {
        'content-type': mime ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      })
      .end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}

export async function handleUpload(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const user = (req.headers['x-user'] as string) ?? ''
    if (!user) throw new UploadError('unauthorized', 401)

    const contentType = ((req.headers['content-type'] as string) || '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    const ext = EXT[contentType]
    if (!ext) throw new UploadError(`unsupported image type: ${contentType}`, 415)

    const body = await readRaw(req, MAX_BYTES)
    if (body.length === 0) throw new UploadError('empty upload', 400)

    const key = `${randomUUID()}.${ext}`
    const cfg = r2Config()
    const url = cfg
      ? await putR2(cfg, key, body, contentType)
      : await putLocal(key, body)

    res
      .writeHead(200, { 'content-type': 'application/json' })
      .end(JSON.stringify({ url }))
  } catch (err) {
    const status = err instanceof UploadError ? err.status : 500
    const message = err instanceof Error ? err.message : 'upload failed'
    if (!res.headersSent)
      res
        .writeHead(status, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: message }))
  }
}
