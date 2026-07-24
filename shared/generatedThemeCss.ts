// A deliberately small CSS firewall for model-authored deck themes. User-authored custom CSS remains
// flexible, but AI output is untrusted: it may style presentation content, never fetch resources, escape
// the <style> element, hide the deck, or introduce viewport-sized overlays. Render sites still run the
// surviving rules through scopeCss(), so selectors remain inside `.strut-surface`.

export const MAX_GENERATED_THEME_CSS = 8_000

const SAFE_PROPERTY =
  /^(?:color|background(?:-color|-image|-position|-size|-repeat)?|border(?:-(?:top|right|bottom|left))?(?:-(?:color|style|width|radius))?|border-radius|box-shadow|text-shadow|font(?:-family|-size|-style|-weight)?|line-height|letter-spacing|text-transform|text-decoration(?:-color|-line|-style|-thickness)?|text-align|margin(?:-(?:top|right|bottom|left))?|padding(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap|list-style(?:-type|-position)?|accent-color)$/i

const FORBIDDEN_SOURCE =
  /(?:[<>]|\\|@|expression\s*\(|behavior\s*:|-moz-binding|!\s*important)/i
const REMOTE_SOURCE =
  /(?:\\|\b(?:url|src|image|image-set)\s*\(|(?:https?|ftp|file|data|blob|javascript|vbscript)\s*:|(?:^|[\s("'=,:])\/\/)/i
const FORBIDDEN_SELECTOR =
  /(?:^|[\s,>+~])(?:html|body|:root|#root)(?:$|[\s,>+~.#:[\]])|\.(?:editor|chat|hdr|modal|brandbar)(?:$|[\s,>+~.#:[\]])/i

/** True when CSS can resolve or fetch an external resource. Shared with the final render-time boundary so
 *  manually edited CSS and model-authored CSS obey the same no-phone-home rule. */
export function hasRemoteCssSource(value: string): boolean {
  return REMOTE_SOURCE.test(value)
}

/**
 * Normalize a flat, visual-only stylesheet emitted by the model. Returns `undefined` when the source is
 * structurally unsafe or contains no usable declarations. `''` is preserved as an explicit reset.
 */
export function sanitizeGeneratedThemeCss(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const source = value.slice(0, MAX_GENERATED_THEME_CSS).trim()
  if (!source) return ''

  const css = source.replace(/\/\*[\s\S]*?\*\//g, '')
  if (FORBIDDEN_SOURCE.test(css) || hasRemoteCssSource(css)) return undefined
  const rule = /([^{}]+)\{([^{}]*)\}/g
  const rules: string[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = rule.exec(css))) {
    if (css.slice(cursor, match.index).trim()) return undefined
    cursor = rule.lastIndex

    const selector = match[1].trim()
    if (!selector || FORBIDDEN_SELECTOR.test(selector)) continue

    const declarations: string[] = []
    for (const raw of match[2].split(';')) {
      const colon = raw.indexOf(':')
      if (colon === -1) continue
      const property = raw.slice(0, colon).trim().toLowerCase()
      const valueText = raw.slice(colon + 1).trim()
      if (!property || !valueText || !SAFE_PROPERTY.test(property)) continue
      if (FORBIDDEN_SOURCE.test(valueText) || valueText.length > 320) continue
      declarations.push(`${property}: ${valueText}`)
    }
    if (declarations.length)
      rules.push(`${selector} { ${declarations.join('; ')}; }`)
  }

  if (css.slice(cursor).trim()) return undefined
  return rules.length ? rules.join('\n') : undefined
}
