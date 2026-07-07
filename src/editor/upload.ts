// Client side of image upload: POST the raw file to the API server, which stores it (R2 or a local
// dev fallback) and returns a public URL we save as the component's `src`. See server/upload.ts.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // keep in sync with server/upload.ts

export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Image must be under 10 MB')
  const res = await fetch('/api/rindle/upload', {
    method: 'POST',
    // Identity rides the session cookie (same-origin) — the server resolves the principal from it
    // (server/session.ts), not a spoofable x-user header.
    credentials: 'same-origin',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-filename': file.name,
    },
    body: file,
  })
  if (!res.ok) {
    const msg = await res
      .json()
      .then((j) => j?.error)
      .catch(() => null)
    throw new Error(msg || `Upload failed (${res.status})`)
  }
  const { url } = (await res.json()) as { url: string }
  return url
}

// keep in sync with MAX_CODE_BYTES in server/artifact.ts
export const MAX_ARTIFACT_BYTES = 512 * 1024

// Build a runnable artifact: POST the author's source to the API, which wraps it in a sandboxed HTML doc,
// stores it (R2 / local dev fallback), and returns the URL we save as the component's `src`. The iframe
// that loads this URL is sandboxed (opaque origin) — see server/artifact.ts / render.tsx.
export async function uploadArtifact(code: string): Promise<string> {
  if (new TextEncoder().encode(code).byteLength > MAX_ARTIFACT_BYTES)
    throw new Error('Artifact source must be under 512 KB')
  const res = await fetch('/api/artifact', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: code,
  })
  if (!res.ok) {
    const msg = await res
      .json()
      .then((j) => j?.error)
      .catch(() => null)
    throw new Error(msg || `Artifact build failed (${res.status})`)
  }
  const { url } = (await res.json()) as { url: string }
  return url
}
