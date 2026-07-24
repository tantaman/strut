// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveModel } from '../../server/llm'

const mocks = vi.hoisted(() => ({
  getCredential: vi.fn(),
}))

vi.mock('../../server/modelCred.ts', () => ({
  getCredential: mocks.getCredential,
}))

beforeEach(() => {
  mocks.getCredential.mockReset().mockResolvedValue(null)
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
})

afterEach(() => {
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
})

describe('resolveModel · visual styling', () => {
  it('defaults only visual style turns to GPT-5.4 mini', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    await expect(resolveModel('u1', { purpose: 'style' })).resolves.toEqual({
      kind: 'openai',
      model: 'gpt-5.4-mini',
      apiKey: 'openai-key',
    })
    await expect(resolveModel('u1')).resolves.toMatchObject({
      kind: 'anthropic',
      apiKey: 'anthropic-key',
    })
  })

  it('uses GPT-5.4 mini through an unpinned connected OpenRouter account', async () => {
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

  it('respects an explicitly pinned connected model', async () => {
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
