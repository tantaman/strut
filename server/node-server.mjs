import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { Readable } from 'node:stream'
import start from '../dist/server/server.js'

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '0.0.0.0'
const basepath = normalizeBasepath(process.env.STRUT_APP_BASEPATH)
const clientDir = '/app/dist/client'

const mime = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
}

function normalizeBasepath(value) {
  if (!value || value === '/') return ''
  return `/${value.replace(/^\/+|\/+$/g, '')}`
}

async function serveStatic(pathname, response) {
  if (basepath && !pathname.startsWith(`${basepath}/`)) return false
  const relative = decodeURIComponent(
    pathname.slice(basepath.length).replace(/^\/+/, ''),
  )
  if (!relative || relative.includes('\0')) return false
  const normalized = normalize(relative)
  if (normalized.startsWith('..')) return false
  const filename = join(clientDir, normalized)
  try {
    const info = await stat(filename)
    if (!info.isFile()) return false
    response.writeHead(200, {
      'content-type':
        mime[extname(filename).toLowerCase()] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': relative.startsWith('assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300',
    })
    createReadStream(filename).pipe(response)
    return true
  } catch {
    return false
  }
}

createServer(async (incoming, outgoing) => {
  try {
    const origin = `http://${incoming.headers.host || 'localhost'}`
    const url = new URL(incoming.url || '/', origin)
    if (
      (incoming.method === 'GET' || incoming.method === 'HEAD') &&
      (await serveStatic(url.pathname, outgoing))
    )
      return

    const hasBody = incoming.method !== 'GET' && incoming.method !== 'HEAD'
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers,
      ...(hasBody ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}),
    })
    const response = await start.fetch(request)
    const headers = Object.fromEntries(response.headers)
    const cookies = response.headers.getSetCookie?.()
    if (cookies?.length) headers['set-cookie'] = cookies
    outgoing.writeHead(response.status, headers)
    if (!response.body) return outgoing.end()
    Readable.fromWeb(response.body).pipe(outgoing)
  } catch (error) {
    console.error('[node-server]', error)
    if (!outgoing.headersSent) outgoing.writeHead(500)
    outgoing.end('Internal server error')
  }
}).listen(port, host, () => {
  console.log(`[slides] listening on http://${host}:${port}${basepath || '/'}`)
})
