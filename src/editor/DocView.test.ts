import { describe, expect, it } from 'vitest'
import { isDocTextEditable } from './DocView'

describe('doc-first component editing', () => {
  it('keeps every text component writable, not only the full-slide primary', () => {
    expect(isDocTextEditable({ kind: 'text' }, true)).toBe(true)
  })

  it('keeps non-text objects inert', () => {
    expect(isDocTextEditable({ kind: 'image' }, true)).toBe(false)
    expect(isDocTextEditable({ kind: 'shape' }, true)).toBe(false)
  })

  it('mounts no writers while precision suspends doc-first editing', () => {
    expect(isDocTextEditable({ kind: 'text' }, false)).toBe(false)
  })
})
