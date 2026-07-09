import { describe, expect, it } from 'vitest'
import { compileAssemblyScript } from './asCompile'

// Phase A of issue #438: prove the in-browser AssemblyScript → WASM compile path works and that the
// bytes it produces are a genuine, runnable WebAssembly module. asc runs in Node, so this verifies the
// whole thing headlessly — no browser/UI needed. (Loading + instantiating the large asc compiler makes
// these slower than a unit test; the generous timeout keeps them from flaking on a cold cache / CI.)

const TRIVIAL = `export function add(a: i32, b: i32): i32 { return a + b }`

describe('compileAssemblyScript', () => {
  it('compiles a trivial module to a non-empty WASM binary', async () => {
    const result = await compileAssemblyScript(TRIVIAL)

    expect(result.ok).toBe(true)
    if (!result.ok) return // narrow for TS + give a useful failure above
    // A real WASM binary starts with the magic bytes \0asm.
    expect(result.wasm.byteLength).toBeGreaterThan(8)
    expect(Array.from(result.wasm.slice(0, 4))).toEqual([0x00, 0x61, 0x73, 0x6d])
  }, 30_000)

  it('produces bytes that instantiate and run correctly', async () => {
    const result = await compileAssemblyScript(TRIVIAL)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // The strongest possible check: not just "some bytes came back" but "the module actually runs".
    const { instance } = await WebAssembly.instantiate(result.wasm as BufferSource)
    const add = instance.exports.add as (a: number, b: number) => number
    expect(add(2, 3)).toBe(5)
    expect(add(-4, 4)).toBe(0)
  }, 30_000)

  it('returns diagnostics (not a throw) for source that does not compile', async () => {
    // `return "x"` from an i32 function is a type error asc rejects — the recoverable "author wrote bad
    // code" path, which must surface as { ok: false, error } rather than crashing the caller.
    const result = await compileAssemblyScript(
      `export function bad(): i32 { return "not a number" }`,
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.length).toBeGreaterThan(0)
  }, 30_000)
})
