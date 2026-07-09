// Run a compiled extension and grant it ONE real capability: add text to the current slide.
//
// This is the third brick of issue #438 and the first time a sandboxed WASM module reaches into the
// real app. The capability is the host import object (see asRun.ts): here it holds a single function,
// `strut.addText`, which the extension calls. That function is the seam where the maximally-restricted
// WASM world meets Strut's write API — it turns a call from inside the sandbox into the exact same
// `mutate.addText(...)` an editor button fires (Header.tsx). Growing this object toward the full mutator
// / query surface (issue #438) is how the extension's powers grow — one entry = one capability.
//
// String marshaling: AssemblyScript strings live as UTF-16 in the module's linear memory, so a string
// argument arrives at the host as a POINTER (a number). We use @assemblyscript/loader's `__getString`
// to read the actual text out of that memory. The module is compiled with `exportRuntime` so the loader
// can do this.

import { instantiate as loaderInstantiate } from '@assemblyscript/loader'
import type { AddTextArgs } from '../../shared/app-def'
import { DEFAULT_FONT_SIZE, newId } from '../config'

/** The slice of the live `mutate` facade an extension needs. Structural so the real facade (which has
 *  every mutator) stays assignable — and so tests can pass a fake. */
export interface ExtensionMutate {
  addText: (a: AddTextArgs) => unknown
}

export interface RunExtensionDeps {
  /** The write API the extension's capabilities call into (the real `mutate`, or a fake in tests). */
  mutate: ExtensionMutate
  /** The slide new components land on (the editor's active slide). */
  slideId: string
  /** Starting z-order; each added component takes the next value so they stack in call order. */
  z_order?: number
  /** The exported function to run. Extensions expose `render()` by convention. */
  entry?: string
}

export interface RunExtensionResult {
  /** How many components the extension added — handy for tests and a future "did it do anything?" hint. */
  added: number
}

/** The exports we care about: the loader's helpers (`__getString`) plus the extension's entry point. */
type ExtensionExports = { render?: () => void }

/** Instantiate a compiled extension with the `strut.addText` capability and run its entry point.
 *
 *  Every `addText` the module calls becomes a real `mutate.addText(...)` on `slideId`, with the same
 *  defaults an editor insert uses (theme-inherited color/font, body text). Deterministic ids come from
 *  `newId()` on the host side — never from the sandbox — so the extension can't forge or collide ids. */
export async function runTextExtension(
  wasm: Uint8Array,
  deps: RunExtensionDeps,
): Promise<RunExtensionResult> {
  // Set after instantiation; the host fn below only runs once the module is calling us, by which point
  // the loader helpers exist.
  let readString: ((ptr: number) => string) | null = null
  let z = deps.z_order ?? 0
  let added = 0

  const imports = {
    strut: {
      // The extension's view: `declare function addText(text: string, x: f64, y: f64): void`.
      // AS passes the string as a memory pointer; we read it back with the loader.
      addText(textPtr: number, x: number, y: number): void {
        const text = readString ? readString(textPtr) : ''
        deps.mutate.addText({
          id: newId(),
          slideId: deps.slideId,
          x,
          y,
          z_order: z++,
          text,
          size: DEFAULT_FONT_SIZE,
          // '' = inherit the deck theme's body defaults, exactly like the toolbar's Add Text.
          color: '',
          font_family: '',
          text_type: 'body',
        })
        added++
      },
    },
  }

  const { exports } = await loaderInstantiate<ExtensionExports>(wasm, imports)
  readString = exports.__getString

  const entryName = deps.entry ?? 'render'
  const entry = (exports as Record<string, unknown>)[entryName]
  if (typeof entry === 'function') (entry as () => void)()

  return { added }
}
