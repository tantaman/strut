// Custom stylesheet support (spec §8.4). The deck stores the user's CSS verbatim (un-scoped — what
// they typed); we scope it to `.strut-surface` at every render site (editor preview, present, export)
// so it can only style the presentation surface + components, never the editor chrome. Keeping the
// stored value un-scoped means the editor textarea round-trips cleanly (no prefix/un-prefix dance).

import { hasRemoteCssSource } from '../../shared/generatedThemeCss'

export const SURFACE_SCOPE = 'strut-surface'

/**
 * Prefix every top-level selector in `css` with `.${scope} `. Descends into grouping at-rules
 * (`@media`, `@supports`) and removes every other at-rule. Deliberately a small hand-rolled scanner
 * (no PostCSS dep) — handles the common cases user CSS will use here.
 */
export function scopeCss(css: string, scope = SURFACE_SCOPE): string {
  if (!css || !css.trim()) return ''
  // A style end-tag is parsed by HTML before CSS, so it can escape the <style> element in standalone
  // exports even when it appears inside a CSS comment/string. Reject the sheet at the common boundary.
  if (/<\s*\/\s*style\b/i.test(css)) return ''
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
      const close = css.indexOf('*/', i + 2)
      if (close === -1) break
      // Preserve a token boundary: `url/**/(` must become `url (` rather than `url(` by concatenation.
      out += ' '
      i = close + 1
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
    while (i < n && /\s/.test(css[i])) i++
    if (i >= n) break

    // Statement at-rules (@import, @charset, @namespace, …) have no braced body. None are needed for a
    // deck theme, and imports are an unscoped network/global-style escape, so discard the whole statement
    // while allowing the following ordinary rule to keep parsing.
    if (css[i] === '@') {
      const boundary = findStructural(css, i, ';{}')
      if (boundary !== -1 && css[boundary] === ';') {
        i = boundary + 1
        continue
      }
    }

    // read a chunk up to the next '{' (a selector list) or '}' (end of block)
    const j = findStructural(css, i, '{}')
    if (j === -1) break
    if (css[j] === '}') {
      // An unmatched closing brace is malformed top-level text. Drop it rather than passing it through.
      i = j + 1
      continue
    }
    const selector = css.slice(i, j).trim()
    const block = readBraced(css, j)
    i = block.end
    if (!block.closed) break
    const body = block.text
    if (!selector) {
      out += body
      continue
    }
    if (selector.startsWith('@')) {
      const at = selector.split(/\s/)[0].toLowerCase()
      if (
        (at === '@media' || at === '@supports') &&
        !hasRemoteCssSource(selector)
      ) {
        // recurse into the grouped block, scoping its inner rules
        const inner = body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'))
        out += `${selector} {\n${scopeBlock(inner, prefix)}\n}\n`
      }
      // Every other braced at-rule (@font-face, @keyframes, @layer, @container, unknown future syntax)
      // is discarded. Passing one through would either be global or contain selectors we did not scope.
      continue
    }
    // Resource-loading declarations are never rendered, including inside otherwise-safe media/supports.
    if (hasRemoteCssSource(selector) || hasRemoteCssSource(body)) continue
    const scoped = splitSelectorList(selector)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${prefix} ${s}`)
      .join(', ')
    out += `${scoped} ${body}\n`
  }
  return out
}

/** Find the first requested structural character outside CSS strings. */
function findStructural(css: string, start: number, chars: string): number {
  let quote = ''
  for (let i = start; i < css.length; i++) {
    const ch = css[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (chars.includes(ch)) return i
  }
  return -1
}

/** Read a balanced `{ ... }` block, ignoring braces inside strings. */
function readBraced(
  css: string,
  open: number,
): { text: string; end: number; closed: boolean } {
  let depth = 0
  let quote = ''
  for (let k = open; k < css.length; k++) {
    const ch = css[k]
    if (ch === '\\') {
      k++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
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
        const end = k + 1
        return { text: css.slice(open, end), end, closed: true }
      }
    }
  }
  return { text: css.slice(open), end: css.length, closed: false }
}

/** Split a selector list without treating commas in functions, attributes, or strings as separators. */
function splitSelectorList(selector: string): string[] {
  const selectors: string[] = []
  let start = 0
  let quote = ''
  let parens = 0
  let brackets = 0
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') parens++
    else if (ch === ')') parens = Math.max(0, parens - 1)
    else if (ch === '[') brackets++
    else if (ch === ']') brackets = Math.max(0, brackets - 1)
    else if (ch === ',' && parens === 0 && brackets === 0) {
      selectors.push(selector.slice(start, i))
      start = i + 1
    }
  }
  selectors.push(selector.slice(start))
  return selectors
}
