// Compile an author's AssemblyScript source into a WASM binary, in the browser.
//
// This is the first brick of the "malleable software" work (issue #438): an LLM-authored extension is
// written in AssemblyScript and compiled to WebAssembly so we can run it in a capability sandbox — the
// module can only call the host functions we hand it via its import object, and can only touch its own
// linear memory. It has no ambient access to the DOM, network or cookies.
//
// WHY AssemblyScript compiled HERE (client-side): the whole author → compile → run loop stays in the
// browser (no server round-trip, unlike artifacts which upload built HTML). The `asc` compiler is large
// (it bundles binaryen), so — exactly like the Sucrase load in artifactBuild.ts — we import it LAZILY:
// it only lands in the chunk that actually compiles an extension, never in the base bundle a viewer pays
// for.
//
// Phase A scope (this file): prove source → WASM compiles and surface diagnostics. Instantiation +
// host-import wiring + rendering a component live in later phases.

// Type-only — erased at build time, so importing from the heavy compiler here costs nothing at runtime
// (the actual compiler is still lazily `import()`ed inside the function below).
import type { compileString } from 'assemblyscript/asc'

/** A successful compile: the raw WASM module bytes, plus the optional emitted `.wat` text (handy for
 *  debugging / tests, null unless emitted). */
export interface CompileOk {
  ok: true
  wasm: Uint8Array
  text: string | null
}

/** A failed compile: `error` is the human-readable diagnostics (asc's stderr), e.g. a type error in the
 *  source. This is expected, recoverable output — surface it to the author, don't throw. */
export interface CompileErr {
  ok: false
  error: string
}

export type CompileResult = CompileOk | CompileErr

/** asc's own compiler-options type, derived from the module so it can't drift. Optional — defaults
 *  compile fine; callers that marshal strings/memory across the boundary pass e.g. `exportRuntime`. */
export type AscOptions = Parameters<typeof compileString>[1]

/** Compile a single AssemblyScript source string to a WASM binary.
 *
 *  Never throws for a *compile* failure (bad source) — those come back as `{ ok: false, error }` so the
 *  caller can show diagnostics. It only rejects if the compiler itself fails to load (e.g. a bundling /
 *  network problem loading the lazy chunk), which is a genuine environment error.
 *
 *  `asc` is dynamically imported so the compiler is code-split out of the base bundle. */
export async function compileAssemblyScript(
  source: string,
  options?: AscOptions,
): Promise<CompileResult> {
  const asc = (await import('assemblyscript/asc')).default

  // `compileString` is asc's convenience API: it parses + compiles in-memory (no virtual filesystem to
  // wire up) and captures stdout/stderr into memory streams it returns. Defaults compile fine; callers
  // that read strings/memory back out (via @assemblyscript/loader) pass `{ exportRuntime: true }`.
  const result = await asc.compileString(source, options)

  if (result.error || !result.binary) {
    const diagnostics = String(result.stderr).trim()
    return {
      ok: false,
      error: diagnostics || result.error?.message || 'unknown compile error',
    }
  }

  return { ok: true, wasm: result.binary, text: result.text }
}
