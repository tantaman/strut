// The "✨ add image → generate" server adapter: turn a text prompt into an image via Cloudflare Workers
// AI text-to-image, store it in R2 (or the local-disk dev fallback), and return its public URL for the
// component's `src`. Image generation is Workers-AI-only (there is no BYO-OpenRouter image path here), so
// it is ALWAYS the app-paid path — the route gates it member-only + a daily quota, mirroring the cost
// posture of /api/generate. Dev-without-workerd: STRUT_IMAGE_STUB yields a deterministic placeholder so
// the add-image flow is exercisable under `pnpm dev` with no AI binding.

import { loadAi } from './llm.ts'
import { storeImageBytes } from './upload.ts'
import type { R2BucketLike } from './cf-env.ts'

// Fast, cheap distilled text-to-image (few-step). Workers AI returns `{ image: <base64 JPEG> }`.
const IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell'
const MAX_PROMPT = 600

/** Thrown when image generation can't be reached (no binding / the model call failed / no image back).
 *  The route maps it to a 503 with a user-facing message and refunds the app-paid quota unit. */
export class ImageUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageUnavailableError'
  }
}

// A self-contained inline SVG so the dev stub returns a valid <img> src with no R2/AI dependency.
const STUB_URL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
      '<text x="50%" y="50%" font-family="system-ui" font-size="16" fill="#6b7280" ' +
      'text-anchor="middle" dominant-baseline="middle">AI image (dev stub)</text></svg>',
  )

/** Generate an image for `prompt` and return its stored public URL. Throws ImageUnavailableError when the
 *  Workers AI binding is unreachable or returns nothing usable (the route maps that to 503 + a refund). */
export async function generateImage(
  promptRaw: unknown,
  r2: R2BucketLike | null,
): Promise<string> {
  const prompt = String(promptRaw ?? '')
    .slice(0, MAX_PROMPT)
    .trim()
  if (!prompt) throw new ImageUnavailableError('empty prompt')

  const ai = await loadAi()
  if (!ai) {
    // Dev-only escape hatch: no Workers AI binding under `pnpm dev` → deterministic placeholder.
    if (process.env.STRUT_IMAGE_STUB) return STUB_URL
    throw new ImageUnavailableError(
      'Workers AI binding is unavailable in this runtime.',
    )
  }

  let out: unknown
  try {
    out = await ai.run(IMAGE_MODEL, { prompt })
  } catch (err) {
    throw new ImageUnavailableError(
      err instanceof Error ? err.message : String(err),
    )
  }
  const b64 = (out as { image?: unknown } | null)?.image
  if (typeof b64 !== 'string' || !b64)
    throw new ImageUnavailableError('the image model returned no image')

  return storeImageBytes(r2, base64ToBytes(b64), 'image/jpeg')
}

// atob is a global in both the Workers runtime and Node 18+.
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
