// Custom stylesheet support (spec §8.4). The deck stores the user's CSS verbatim (un-scoped — what
// they typed); we scope it to `.strut-surface` at every render site (editor preview, present, export)
// so it can only style the presentation surface + components, never the editor chrome. Keeping the
// stored value un-scoped means the editor textarea round-trips cleanly (no prefix/un-prefix dance).

export const SURFACE_SCOPE = 'strut-surface'

/**
 * Prefix every top-level selector in `css` with `.${scope} `. Descends into grouping at-rules
 * (`@media`, `@supports`) and leaves keyframes / `@font-face` / `@import` untouched. Deliberately a
 * small hand-rolled scanner (no PostCSS dep) — handles the common cases user CSS will use here.
 */
export function scopeCss(css: string, scope = SURFACE_SCOPE): string {
  if (!css || !css.trim()) return ''
  return scopeBlock(stripComments(css), `.${scope}`)
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function scopeBlock(css: string, prefix: string): string {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    // read a chunk up to the next '{' (a selector list) or '}' (end of block)
    let j = i
    while (j < n && css[j] !== '{' && css[j] !== '}') j++
    if (j >= n) {
      out += css.slice(i)
      break
    }
    if (css[j] === '}') {
      out += css.slice(i, j + 1)
      i = j + 1
      continue
    }
    const selector = css.slice(i, j).trim()
    const body = readBraced(css, j) // includes the braces
    i = j + body.length
    if (!selector) {
      out += body
      continue
    }
    if (selector.startsWith('@')) {
      const at = selector.split(/\s/)[0].toLowerCase()
      if (at === '@media' || at === '@supports') {
        // recurse into the grouped block, scoping its inner rules
        const inner = body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'))
        out += `${selector} {\n${scopeBlock(inner, prefix)}\n}\n`
      } else {
        // @keyframes / @font-face / @import etc. — pass through unscoped
        out += `${selector} ${body}\n`
      }
      continue
    }
    const scoped = selector
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${prefix} ${s}`)
      .join(', ')
    out += `${scoped} ${body}\n`
  }
  return out
}

/** Read a `{ ... }` block (balanced) starting at the index of `{`. Returns the substring incl. braces. */
function readBraced(css: string, open: number): string {
  let depth = 0
  let k = open
  for (; k < css.length; k++) {
    if (css[k] === '{') depth++
    else if (css[k] === '}') {
      depth--
      if (depth === 0) {
        k++
        break
      }
    }
  }
  return css.slice(open, k)
}
