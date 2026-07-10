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
  let out = ''
  let quote = ''
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      out += ch
      if (ch === '\\' && i + 1 < css.length) out += css[++i]
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      out += ch
      continue
    }
    if (ch === '/' && css[i + 1] === '*') {
      i += 2
      while (i < css.length && !(css[i] === '*' && css[i + 1] === '/')) i++
      i++
      continue
    }
    out += ch
  }
  return out
}

function scopeBlock(css: string, prefix: string): string {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    // read a chunk up to the next '{' (a selector list) or '}' (end of block)
    const j = nextBrace(css, i)
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
    const scoped = splitSelectorList(selector)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${prefix} ${s}`)
      .join(', ')
    out += `${scoped} ${body}\n`
  }
  return out
}

/** Find the next structural brace, ignoring braces inside quoted selector/at-rule arguments. */
function nextBrace(css: string, start: number): number {
  let quote = ''
  for (let i = start; i < css.length; i++) {
    const ch = css[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '{' || ch === '}') return i
  }
  return css.length
}

/** Split only selector-list commas, not commas inside :is(), :where(), attributes, or quoted values. */
function splitSelectorList(selector: string): string[] {
  const out: string[] = []
  let start = 0
  let round = 0
  let square = 0
  let quote = ''
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') round++
    else if (ch === ')') round = Math.max(0, round - 1)
    else if (ch === '[') square++
    else if (ch === ']') square = Math.max(0, square - 1)
    else if (ch === ',' && round === 0 && square === 0) {
      out.push(selector.slice(start, i))
      start = i + 1
    }
  }
  out.push(selector.slice(start))
  return out
}

/** Read a `{ ... }` block (balanced) starting at the index of `{`. Returns the substring incl. braces. */
function readBraced(css: string, open: number): string {
  let depth = 0
  let quote = ''
  let k = open
  for (; k < css.length; k++) {
    const ch = css[k]
    if (quote) {
      if (ch === '\\') k++
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        k++
        break
      }
    }
  }
  return css.slice(open, k)
}
