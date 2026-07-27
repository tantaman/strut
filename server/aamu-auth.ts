import { APP_BASEPATH, appPath } from '../shared/appPath.ts'

const COOKIE_NAME = 'aamu_slides_session'
const MAX_SESSION_SECONDS = 8 * 60 * 60

export interface AamuSessionPrincipal {
  id: string
  source: 'aamu'
  cid: string
  pids: string[]
  name: string
  email: string
}

interface SessionPayload extends AamuSessionPrincipal {
  v: 1
  exp: number
}

interface ExchangeResponse {
  user?: { id?: unknown; name?: unknown; email?: unknown }
  cid?: unknown
  pids?: unknown
  expiresAt?: unknown
}

function env(name: string): string {
  return process.env[name]?.trim() ?? ''
}

export function isAamuAuthEnabled(): boolean {
  return Boolean(
    env('AAMU_INTERNAL_URL') &&
    env('AAMU_SLIDES_SHARED_SECRET') &&
    env('AAMU_SLIDES_SESSION_SECRET'),
  )
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function signingKey(): Promise<CryptoKey> {
  const secret = env('AAMU_SLIDES_SESSION_SECRET')
  if (!secret) throw new Error('AAMU_SLIDES_SESSION_SECRET is not configured')
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await signingKey(),
    new TextEncoder().encode(value),
  )
  return bytesToBase64Url(new Uint8Array(signature))
}

function cookieValue(request: Request): string {
  const cookies = request.headers.get('cookie') ?? ''
  for (const part of cookies.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }
  return ''
}

function validId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    !/[\u0000-\u001f]/.test(value)
  )
}

export async function resolveAamuPrincipal(
  request: Request,
): Promise<AamuSessionPrincipal | null> {
  if (!isAamuAuthEnabled()) return null
  try {
    const token = cookieValue(request)
    const separator = token.lastIndexOf('.')
    if (separator < 1) return null
    const encoded = token.slice(0, separator)
    const suppliedSignature = base64UrlToBytes(token.slice(separator + 1))
    const signatureBuffer = suppliedSignature.buffer.slice(
      suppliedSignature.byteOffset,
      suppliedSignature.byteOffset + suppliedSignature.byteLength,
    ) as ArrayBuffer
    const verified = await crypto.subtle.verify(
      'HMAC',
      await signingKey(),
      signatureBuffer,
      new TextEncoder().encode(encoded),
    )
    if (!verified) return null
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encoded)),
    ) as Partial<SessionPayload>
    if (
      payload.v !== 1 ||
      payload.source !== 'aamu' ||
      !validId(payload.id) ||
      !validId(payload.cid) ||
      !Array.isArray(payload.pids) ||
      payload.pids.length === 0 ||
      !payload.pids.every(validId) ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    )
      return null
    return {
      id: payload.id,
      source: 'aamu',
      cid: payload.cid,
      pids: [...new Set(payload.pids)],
      name: typeof payload.name === 'string' ? payload.name : '',
      email: typeof payload.email === 'string' ? payload.email : '',
    }
  } catch {
    return null
  }
}

export async function exchangeAamuCode(
  code: string,
  request: Request,
): Promise<{ principal: AamuSessionPrincipal; expiresAt: number }> {
  if (!isAamuAuthEnabled())
    throw new Error('Aamu authentication is not configured')
  if (!validId(code)) throw new Error('invalid Aamu authorization code')

  const response = await fetch(
    `${env('AAMU_INTERNAL_URL').replace(/\/+$/, '')}/api/integrations/slides/auth/exchange`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env('AAMU_SLIDES_SHARED_SECRET')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code,
        audience: new URL(request.url).origin,
      }),
    },
  )
  if (!response.ok) throw new Error('Aamu authorization code was rejected')
  const result = (await response.json()) as ExchangeResponse
  const userId = result.user?.id
  const pids = Array.isArray(result.pids)
    ? [...new Set(result.pids.filter(validId))]
    : []
  if (!validId(userId) || !validId(result.cid) || pids.length === 0)
    throw new Error('Aamu returned an invalid Slides principal')

  const now = Math.floor(Date.now() / 1000)
  const requestedExpiry =
    typeof result.expiresAt === 'number'
      ? Math.floor(result.expiresAt / (result.expiresAt > 1e12 ? 1000 : 1))
      : now + MAX_SESSION_SECONDS
  return {
    principal: {
      id: `aamu:${result.cid}:${userId}`,
      source: 'aamu',
      cid: result.cid,
      pids,
      name: typeof result.user?.name === 'string' ? result.user.name : '',
      email: typeof result.user?.email === 'string' ? result.user.email : '',
    },
    expiresAt: Math.min(requestedExpiry, now + MAX_SESSION_SECONDS),
  }
}

export async function aamuSessionCookie(
  principal: AamuSessionPrincipal,
  expiresAt: number,
  request: Request,
): Promise<string> {
  const payload: SessionPayload = {
    ...principal,
    v: 1,
    exp: expiresAt,
  }
  const encoded = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  const path = APP_BASEPATH || '/'
  return `${COOKIE_NAME}=${encoded}.${await sign(encoded)}; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, expiresAt - Math.floor(Date.now() / 1000))}${secure}`
}

export function safeAamuReturnPath(value: string | null): string {
  if (!value) return appPath('/')
  if (!value.startsWith(`${APP_BASEPATH || ''}/`) || value.startsWith('//'))
    return appPath('/')
  return value
}
