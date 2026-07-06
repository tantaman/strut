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
