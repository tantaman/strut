import type { ComponentKind } from './types'

// Custom classes are authored as a whitespace-separated list. Keep only plain CSS identifiers: this
// makes the same persisted value safe to use through React's className and in the standalone HTML
// string, without letting quotes / angle brackets / attribute-shaped text become markup.
const SAFE_CLASS_TOKEN = /^(?:-?[_A-Za-z]|--[_A-Za-z0-9])[-_A-Za-z0-9]*$/

// These are renderer-owned state tokens. Persisted classes may style a component, but they must not be
// able to opt a freeform object into primary-document behavior or impersonate transient editor state.
const INTERNAL_STATE_CLASSES = new Set([
  'is-primary',
  'is-selected',
  'is-editing',
  'is-doc-editable',
])

export function customClassTokens(raw: string | null | undefined): string[] {
  const tokens = (raw ?? '')
    .split(/\s+/)
    .filter(
      (token) =>
        SAFE_CLASS_TOKEN.test(token) && !INTERNAL_STATE_CLASSES.has(token),
    )
  return [...new Set(tokens)]
}

/** The shared component wrapper classes for editor, read surfaces, and standalone export. */
export function componentClassName(
  component: { kind: ComponentKind; custom_classes?: string | null },
  state: readonly string[] = [],
): string {
  return [
    ...new Set([
      'cmp',
      `cmp--${component.kind}`,
      ...customClassTokens(component.custom_classes),
      ...state,
    ]),
  ].join(' ')
}
