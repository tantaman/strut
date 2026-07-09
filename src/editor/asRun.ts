// Instantiate a compiled AssemblyScript/WASM module and run it — the second brick of issue #438.
//
// THE SANDBOX IS THE IMPORT OBJECT. A WebAssembly module has no ambient authority: it can only call the
// functions we place in its `imports` object, and can only read/write its own linear memory. It cannot
// touch the DOM, network, cookies or globals unless we hand it a function that does. So "what an
// extension is allowed to do" == "what host functions we pass here". Later phases grow this object
// toward the app's mutators/queries (issue #438); every entry added is a capability granted.
//
// AssemblyScript emits a few standard imports its runtime may reference (`env.abort`, `env.trace`,
// `env.seed`). We always supply safe defaults for them so instantiation never fails on a missing
// standard import — extra imports the module doesn't declare are simply ignored by WebAssembly, so this
// is harmless when they're unused. Caller-supplied host functions are merged on top.

/** Host functions granted to the module — the capability surface. `env` is merged over our safe
 *  defaults; any other namespace is passed through as-is. */
export type HostImports = WebAssembly.Imports

export interface WasmInstance {
  instance: WebAssembly.Instance
  /** The module's exported functions/memory — `instance.exports`, hoisted for convenience. */
  exports: WebAssembly.Exports
}

/** Standard imports AssemblyScript's runtime may reference. Kept deterministic on purpose (no
 *  Date.now/Math.random) — a sandboxed extension must not smuggle in nondeterminism through `seed`; if
 *  we ever want controlled randomness we'll inject it explicitly, not leak the ambient clock. */
function defaultEnv(): WebAssembly.ModuleImports {
  return {
    // Called when an AS `assert`/`unreachable` fires. Surface it as a JS error rather than a silent trap.
    abort(_message: number, _fileName: number, line: number, column: number) {
      throw new Error(`wasm aborted at ${line}:${column}`)
    },
    // AS `trace(...)` debug hook — no-op by default.
    trace(_message: number, _n: number) {},
    // Seeds AS's Math.random. Fixed value → deterministic sandbox.
    seed() {
      return 0
    },
  }
}

/** Instantiate a WASM binary with a controlled host import object.
 *
 *  `hostImports.env` is layered ON TOP of the safe defaults (so a caller can override `trace`, or add
 *  its own `env` host functions, without losing `abort`). Rejects only if the bytes aren't a valid
 *  module or a *declared* import is missing. */
export async function instantiateWasm(
  wasm: Uint8Array,
  hostImports: HostImports = {},
): Promise<WasmInstance> {
  const imports: WebAssembly.Imports = {
    ...hostImports,
    // `...undefined` is a safe no-op, so this also covers a caller that passes no `env` namespace.
    env: { ...defaultEnv(), ...hostImports.env },
  }
  const { instance } = await WebAssembly.instantiate(
    wasm as BufferSource,
    imports,
  )
  return { instance, exports: instance.exports }
}
