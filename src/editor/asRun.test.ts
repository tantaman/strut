import { describe, expect, it } from 'vitest'
import { compileAssemblyScript } from './asCompile'
import { instantiateWasm } from './asRun'

// Phase B of issue #438: prove the JS <-> WASM boundary works in BOTH directions, driven entirely by the
// host import object (the sandbox surface). Runs headlessly in Node — asc compiles and WebAssembly
// instantiates there just like the browser will.

async function compileOrThrow(source: string): Promise<Uint8Array> {
  const result = await compileAssemblyScript(source)
  if (!result.ok) throw new Error(`compile failed: ${result.error}`)
  return result.wasm
}

describe('instantiateWasm', () => {
  it('JS -> WASM: calls an exported function', async () => {
    const wasm = await compileOrThrow(
      `export function add(a: i32, b: i32): i32 { return a + b }`,
    )
    const { exports } = await instantiateWasm(wasm)
    const add = exports.add as (a: number, b: number) => number
    expect(add(2, 3)).toBe(5)
  }, 30_000)

  it('WASM -> JS: calls a host function we grant via the import object', async () => {
    // `@external("env", "hostLog")` pins the import to env.hostLog so the namespace is deterministic —
    // exactly how we'll pin real host capabilities later. The module can ONLY reach hostLog because we
    // put it in the import object; that's the whole sandbox model.
    const wasm = await compileOrThrow(`
      @external("env", "hostLog")
      declare function hostLog(value: i32): void

      export function run(): void {
        hostLog(42)
        hostLog(7)
      }
    `)

    const seen: number[] = []
    const { exports } = await instantiateWasm(wasm, {
      env: { hostLog: (value: number) => seen.push(value) },
    })

    expect(seen).toEqual([])
    ;(exports.run as () => void)()
    expect(seen).toEqual([42, 7])
  }, 30_000)

  it('does not need the caller to provide env.abort (safe defaults are supplied)', async () => {
    // A module that can trap must still instantiate without the caller wiring up env.abort themselves.
    const wasm = await compileOrThrow(
      `export function ok(): i32 { assert(true); return 1 }`,
    )
    const { exports } = await instantiateWasm(wasm)
    expect((exports.ok as () => number)()).toBe(1)
  }, 30_000)
})
