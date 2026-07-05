// Runtime-safe access to Cloudflare Worker bindings.
//
// On the Workers runtime (the `pnpm deploy` / CF=1 build), bindings live on the `env` exported by the
// virtual `cloudflare:workers` module — NOT on process.env. (nodejs_compat mirrors string vars +
// secrets onto process.env, but object bindings like R2 buckets are only reachable this way.)
//
// On Node — local `pnpm dev`, `pnpm build`, or any non-Cloudflare host — that module doesn't exist,
// so the dynamic import throws and we return null. Callers then fall back to the S3-compatible R2 API
// (R2_* creds) or the local-disk dev store. This keeps one codebase working across all three runtimes.

// Must match the r2_buckets[].binding name in wrangler.jsonc.
const R2_BINDING = 'STRUT_UPLOADS'

// Minimal structural type for the R2 operations upload.ts uses. We intentionally avoid the global
// `R2Bucket` type from `wrangler types`: its workerd runtime globals shadow the DOM lib and break
// browser-side type-checking (see tsconfig.json "exclude").
export interface R2BucketLike {
  put: (
    key: string,
    value: ArrayBuffer | Uint8Array | ReadableStream | string,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string }
    },
  ) => Promise<unknown>
  get: (key: string) => Promise<{
    body: ReadableStream
    httpMetadata?: { contentType?: string; cacheControl?: string }
  } | null>
}

let cached: R2BucketLike | null | undefined

// The uploads R2 bucket binding, or null when not running on Workers. Memoized: the binding lives at
// Worker global scope and is stable across requests.
export async function getUploadsBucket(): Promise<R2BucketLike | null> {
  if (cached !== undefined) return cached
  cached = await loadBinding()
  return cached
}

async function loadBinding(): Promise<R2BucketLike | null> {
  try {
    // Indirection + @vite-ignore so neither the Node SSR build nor the client bundle tries to resolve
    // this Workers-only module at build time. Under workerd it resolves; under Node it throws → null.
    const spec = 'cloudflare:workers'
    const mod = (await import(/* @vite-ignore */ spec)) as {
      env?: Record<string, unknown>
    }
    const bucket = mod.env?.[R2_BINDING]
    return (bucket as R2BucketLike | undefined) ?? null
  } catch {
    return null
  }
}
