import { describe, expect, it } from 'vitest'
import { componentClassName, customClassTokens } from './componentClasses'

describe('component custom classes', () => {
  it('normalizes safe CSS tokens and removes duplicates', () => {
    expect(
      customClassTokens(' hero  callout hero -compact --accent _private '),
    ).toEqual(['hero', 'callout', '-compact', '--accent', '_private'])
  })

  it('drops attribute-shaped and invalid tokens', () => {
    expect(
      customClassTokens('hero bad" onload=alert(1) <script> dotted.name'),
    ).toEqual(['hero'])
  })

  it('combines stable kind, custom, and transient state classes', () => {
    expect(
      componentClassName(
        { kind: 'text', custom_classes: 'hero hero is-selected' },
        ['is-selected'],
      ),
    ).toBe('cmp cmp--text hero is-selected')
  })
})
