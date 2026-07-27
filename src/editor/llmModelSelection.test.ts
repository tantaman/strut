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
  delete process.env.STRUT_APP_PAID_AI
})

afterEach(() => {
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.STRUT_APP_PAID_AI
})

// The app pays for nobody by default: without a connected key, an unentitled caller gets NO model, so the
// ✨ routes 402 instead of spending the deployment's provider budget. (COMMUNITY = pro:false here, since
// no commercial overlay is present in this repo.)
describe('resolveModel · app-paid gate', () => {
  it('refuses an app-paid model when the caller has neither a key nor a plan', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.ANTHROPIC_API_KEY = 'anthropic-key'

    await expect(resolveModel('u1')).resolves.toBeNull()
    await expect(resolveModel('u1', { purpose: 'style' })).resolves.toBeNull()
  })

  it('still refuses when no provider key is configured at all', async () => {
    await expect(resolveModel('u1')).resolves.toBeNull()
  })

  it('serves a connected key regardless of plan — the user pays', async () => {
    mocks.getCredential.mockResolvedValue({
      provider: 'openrouter',
      apiKey: 'user-key',
      model: '',
    })

    await expect(resolveModel('u1')).resolves.toMatchObject({
      kind: 'openrouter',
      apiKey: 'user-key',
    })
  })
})

describe('resolveModel · visual styling', () => {
  // A self-hosted instance running on the operator's OWN provider key opts in with STRUT_APP_PAID_AI=1;
  // that's the only way an unsubscribed caller reaches the app-paid defaults below.
  beforeEach(() => {
    process.env.STRUT_APP_PAID_AI = '1'
  })

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
