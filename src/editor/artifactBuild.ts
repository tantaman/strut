// Build an author's artifact source into the ES-module body that runs inside the sandbox iframe.
//
// Two flavors of source are supported:
//   1. Plain ES module (the original contract) — imports full https URLs, renders into `#root` /
//      `document.body` itself. These pass through UNCHANGED.
//   2. "Raw React component" — a default-exported component written with JSX, bare `react` imports and
//      (optionally) Tailwind utility classes, i.e. exactly what an LLM or a CodeSandbox hands you. We:
//        • transpile JSX (+ TS) → JS with Sucrase (loaded lazily; editor-only, never shipped to viewers),
//        • rewrite bare npm specifiers (`react`, `react-dom/client`, `framer-motion`, …) to esm.sh URLs
//          so they resolve with no import map,
//        • append a bootstrap that pulls in the Tailwind Play CDN and mounts the default export into #root.
//
// Detection, transpilation and the mount shim all happen at AUTHOR time (on Run), so the stored artifact
// is plain pre-built JS — viewers only pay for React + Tailwind, never for the transpiler. The original
// source is kept as `component.code`; only the built module is uploaded.

// Pin one React version everywhere so the component's own `react` import, the JSX runtime and our mount
// shim all resolve to the SAME esm.sh module instance (mismatched copies break hooks).
const REACT_VERSION = '18.3.1'
const ESM = 'https://esm.sh'
const TAILWIND_CDN = 'https://cdn.tailwindcss.com'

/** A React-component source needs the JSX/mount pipeline. A bare `react` import can't run through the
 *  legacy path at all (bare specifier, no import map), and a default export would otherwise be defined
 *  but never rendered — in both cases the React build is strictly the right call. */
export function isReactArtifact(source: string): boolean {
  return (
    /^\s*import\b[^\n]*\bfrom\s*['"]react(?:\/[^'"]*)?['"]/m.test(source) ||
    /^\s*export\s+default\b/m.test(source) ||
    /\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/.test(source)
  )
}

/** Map a bare npm specifier to an esm.sh URL. React and react-dom are version-pinned to match the mount
 *  shim; every other package is asked to resolve its own react against that same pin (`?deps=…`) so a
 *  React UI library shares our single React instance instead of bundling a second one. */
function specifierToUrl(spec: string): string {
  if (spec === 'react' || spec.startsWith('react/'))
    return `${ESM}/react@${REACT_VERSION}${spec.slice('react'.length)}`
  if (spec === 'react-dom' || spec.startsWith('react-dom/'))
    return `${ESM}/react-dom@${REACT_VERSION}${spec.slice('react-dom'.length)}`
  return `${ESM}/${spec}?deps=react@${REACT_VERSION},react-dom@${REACT_VERSION}`
}

function isBareSpecifier(spec: string): boolean {
  return !/^(?:\.{0,2}\/|https?:|blob:|data:)/.test(spec)
}

/** Rewrite bare specifiers in static `import … from '…'` / `export … from '…'` and dynamic `import('…')`
 *  to esm.sh URLs. String literals that merely contain the word "from" are unaffected — the anchors are
 *  the `from`/`import(` keywords immediately preceding the quote. */
function rewriteImports(code: string): string {
  const swap = (spec: string) => (isBareSpecifier(spec) ? specifierToUrl(spec) : spec)
  return code
    .replace(
      /(\bfrom\s*)(['"])([^'"]+)\2/g,
      (_m, pre, q, spec) => `${pre}${q}${swap(spec)}${q}`,
    )
    .replace(
      /(\bimport\s*\(\s*)(['"])([^'"]+)\2/g,
      (_m, pre, q, spec) => `${pre}${q}${swap(spec)}${q}`,
    )
}

const DEFAULT_LOCAL = '__StrutArtifactDefault__'

/** Turn the module's default export into a plain local binding we can reference from the mount shim.
 *  Handles `export default <expr|function|class>` and `export { X as default }`. Returns null if there
 *  is no default export (then the module is expected to render itself, legacy-style). */
function captureDefaultExport(code: string): string | null {
  if (/^\s*export\s+default\b/m.test(code))
    return code.replace(/^(\s*)export\s+default\s+/m, `$1const ${DEFAULT_LOCAL} = `)

  const named = code.match(/\bexport\s*\{([^}]*)\}/)
  if (named) {
    const asDefault = named[1].match(/([A-Za-z_$][\w$]*)\s+as\s+default/)
    if (asDefault)
      return `${code}\nconst ${DEFAULT_LOCAL} = ${asDefault[1]};`
  }
  return null
}

/** Bootstrap appended to the transpiled module: load Tailwind (best-effort — an unstyled mount still
 *  beats a blank frame), size #root to fill the sandbox so `h-full`/`w-full` roots work, then render the
 *  captured default export. Runs as top-level module code, so the `await` is legal. */
function mountEpilogue(): string {
  return `
import { createElement as __cE } from '${ESM}/react@${REACT_VERSION}';
import { createRoot as __cR } from '${ESM}/react-dom@${REACT_VERSION}/client';
await new Promise((resolve) => {
  const s = document.createElement('script');
  s.src = '${TAILWIND_CDN}';
  s.onload = resolve;
  s.onerror = resolve;
  document.head.appendChild(s);
});
const __root = document.getElementById('root');
__root.style.width = '100%';
__root.style.height = '100%';
__cR(__root).render(__cE(${DEFAULT_LOCAL}));
`
}

/** Build the runnable module body from the author's source. Non-React sources are returned verbatim
 *  (the legacy contract is untouched); React component sources are transpiled, rewired and given a mount
 *  shim. Sucrase is imported lazily so it only lands in the editor chunk that actually needs it. */
export async function buildArtifactModule(source: string): Promise<string> {
  if (!isReactArtifact(source)) return source

  const { transform } = await import('sucrase')
  const transpiled = transform(source, {
    transforms: ['typescript', 'jsx'],
    jsxRuntime: 'automatic',
    production: true,
    filePath: 'artifact.tsx',
  }).code

  const captured = captureDefaultExport(transpiled)
  // No default export — treat as a self-rendering module (still rewrite bare imports so a JSX module that
  // draws into #root on its own keeps working).
  const withLocal = captured ?? transpiled
  const rewired = rewriteImports(withLocal)
  return captured ? `${rewired}\n${mountEpilogue()}` : rewired
}
