import { describe, expect, it } from 'vitest'
import type { AddTextArgs } from '../../shared/app-def'
import { DEFAULT_FONT_SIZE } from '../config'
import { compileAssemblyScript } from './asCompile'
import { runTextExtension } from './extensionHost'

// Phase C of issue #438: the full end-to-end path, headless. An extension written in AssemblyScript
// declares the `strut.addText` capability and calls it; we compile it, run it, and assert the host
// turned each call into a correct `addText` mutator invocation — including a real STRING marshaled out
// of WASM linear memory. The only thing not exercised here is the React render + Rindle persist, which
// need the running app (Phase D wires that up).

// An extension: adds two text components when run. `@external("strut", "addText")` pins the import so
// the module reaches exactly the capability we grant, under a deterministic name.
const EXTENSION_SOURCE = `
  @external("strut", "addText")
  declare function addText(text: string, x: f64, y: f64): void

  export function render(): void {
    addText("Hello from WASM", 100, 200)
    addText("second box", 300, 400)
  }
`

async function compileExtension(source: string): Promise<Uint8Array> {
  // exportRuntime → the loader can read strings back out of linear memory (__getString).
  const result = await compileAssemblyScript(source, { exportRuntime: true })
  if (!result.ok) throw new Error(`compile failed: ${result.error}`)
  return result.wasm
}

describe('runTextExtension', () => {
  it('turns each WASM addText call into a correct mutator call, with the string marshaled', async () => {
    const wasm = await compileExtension(EXTENSION_SOURCE)

    const calls: AddTextArgs[] = []
    const result = await runTextExtension(wasm, {
      mutate: { addText: (a) => calls.push(a) },
      slideId: 'slide-1',
    })

    expect(result.added).toBe(2)
    expect(calls).toHaveLength(2)

    // The string survived the trip through linear memory.
    expect(calls[0].text).toBe('Hello from WASM')
    expect(calls[1].text).toBe('second box')

    // Coordinates passed straight through.
    expect(calls[0].x).toBe(100)
    expect(calls[0].y).toBe(200)
    expect(calls[1].x).toBe(300)

    // z-order increments so the two boxes stack in call order.
    expect(calls[0].z_order).toBe(0)
    expect(calls[1].z_order).toBe(1)

    // Host-supplied invariants: bound to the target slide, ids minted host-side (not by the sandbox),
    // and the same theme-inheriting defaults a toolbar insert uses.
    expect(calls[0].slideId).toBe('slide-1')
    expect(calls[0].id).toBeTruthy()
    expect(calls[1].id).toBeTruthy()
    expect(calls[0].id).not.toBe(calls[1].id)
    expect(calls[0].size).toBe(DEFAULT_FONT_SIZE)
    expect(calls[0].color).toBe('')
    expect(calls[0].font_family).toBe('')
    expect(calls[0].text_type).toBe('body')
  }, 30_000)

  it('honors a custom starting z-order', async () => {
    const wasm = await compileExtension(EXTENSION_SOURCE)
    const calls: AddTextArgs[] = []
    await runTextExtension(wasm, {
      mutate: { addText: (a) => calls.push(a) },
      slideId: 's',
      z_order: 10,
    })
    expect(calls.map((c) => c.z_order)).toEqual([10, 11])
  }, 30_000)

  it('does nothing (no throw) when the module has no render entry', async () => {
    const wasm = await compileExtension(
      `export function noop(): void {}`,
    )
    const calls: AddTextArgs[] = []
    const result = await runTextExtension(wasm, {
      mutate: { addText: (a) => calls.push(a) },
      slideId: 's',
    })
    expect(result.added).toBe(0)
    expect(calls).toHaveLength(0)
  }, 30_000)
})
