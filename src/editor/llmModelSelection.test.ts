// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveModel } from '../../server/llm'

const mocks = vi.hoisted(() => ({
  getCredential: vi.fn(),
}))

vi.mock('../../server/modelCred.ts', () => ({
  getCredential: mocks.getCredential,
}))

beforeEach(() => {
  mocks.getCredential.mockReset().mockResolvedValue(null)
})

describe('resolveModel · BYOK only', () => {
  it('returns no model without the caller’s connected credential', async () => {
    await expect(resolveModel('u1')).resolves.toBeNull()
    await expect(resolveModel('u1', { purpose: 'style' })).resolves.toBeNull()
  })

  it('uses the caller’s connected OpenRouter key', async () => {
    mocks.getCredential.mockResolvedValue({
      provider: 'openrouter',
      apiKey: 'user-key',
      model: '',
    })

    await expect(resolveModel('u1')).resolves.toEqual({
      kind: 'openrouter',
      model: 'openrouter/auto',
      apiKey: 'user-key',
    })
  })

  it('uses a multimodal default for an unpinned visual-style turn', async () => {
    mocks.getCredential.mockResolvedValue({
      provider: 'openrouter',
      apiKey: 'user-key',
      model: '',
    })

    await expect(resolveModel('u1', { purpose: 'style' })).resolves.toEqual({
      kind: 'openrouter',
      model: 'openai/gpt-5.4-mini',
      apiKey: 'user-key',
    })
  })

  it('respects an explicitly pinned model for every turn', async () => {
    mocks.getCredential.mockResolvedValue({
      provider: 'openrouter',
      apiKey: 'user-key',
      model: 'google/gemini-2.5-flash',
    })

    await expect(resolveModel('u1', { purpose: 'style' })).resolves.toEqual({
      kind: 'openrouter',
      model: 'google/gemini-2.5-flash',
      apiKey: 'user-key',
    })
  })
})
