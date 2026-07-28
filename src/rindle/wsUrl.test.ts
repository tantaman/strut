import { describe, expect, it } from 'vitest'

import { rindleWsUrl } from './wsUrl.ts'

describe('rindleWsUrl', () => {
  it('keeps the Rindle socket on the tenant origin', () => {
    expect(
      rindleWsUrl(
        new Request('https://ile.aamu.app/slides/api/rindle/config'),
        '',
        '/slides/rindle',
      ),
    ).toBe('wss://ile.aamu.app/slides/rindle')
  })

  it('retains an explicit standalone deployment override', () => {
    expect(
      rindleWsUrl(
        new Request('https://ile.aamu.app/slides/api/rindle/config'),
        'wss://rindle.example.test/socket',
        '/slides/rindle',
      ),
    ).toBe('wss://rindle.example.test/socket')
  })
})
