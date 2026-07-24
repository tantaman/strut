// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  attachImagesToOpenAiMessages,
  normalizeAnthropicSse,
  normalizeOpenRouterSse,
  streamModel,
} from '../../server/llm'

function byteStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attachImagesToOpenAiMessages', () => {
  it('attaches data URLs only to the final user turn', () => {
    const messages = attachImagesToOpenAiMessages(
      [
        { role: 'system', content: 'system' },
        { role: 'user', content: 'earlier' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'match this' },
      ],
      [
        {
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3]),
        },
      ],
    ) as Array<{ role: string; content: unknown }>

    expect(messages[1].content).toBe('earlier')
    expect(messages[3].content).toEqual([
      { type: 'text', text: 'match this' },
      {
        type: 'image_url',
        image_url: {
          url: 'data:image/png;base64,AQID',
          detail: 'auto',
        },
      },
    ])
  })
})

describe('normalizeOpenRouterSse', () => {
  it('accepts a buffered final completion line without a trailing newline', async () => {
    const stream = normalizeOpenRouterSse(
      byteStream([
        'data: {"choices":[{"delta":{"content":"Hel',
        'lo"}}]}\n\ndata: [DONE]',
      ]),
    )

    await expect(new Response(stream).text()).resolves.toBe(
      'data: {"response":"Hello"}\n\ndata: [DONE]\n\n',
    )
  })

  it('rejects provider error frames delivered inside a successful HTTP stream', async () => {
    const stream = normalizeOpenRouterSse(
      byteStream(['data: {"error":{"message":"provider overloaded"}}\n\n']),
    )

    await expect(new Response(stream).text()).rejects.toThrow(
      'Model stream failed: provider overloaded',
    )
  })

  it('rejects a stream that closes without an explicit completion marker', async () => {
    const stream = normalizeOpenRouterSse(
      byteStream(['data: {"choices":[{"delta":{"content":"partial"}}]}']),
    )

    await expect(new Response(stream).text()).rejects.toThrow(
      'Model stream ended before its completion marker',
    )
  })
})

describe('normalizeAnthropicSse', () => {
  it('normalizes text and a buffered terminal event', async () => {
    const stream = normalizeAnthropicSse(
      byteStream([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
        'data: {"type":"message_stop"}',
      ]),
    )

    await expect(new Response(stream).text()).resolves.toBe(
      'data: {"response":"Hello"}\n\ndata: [DONE]\n\n',
    )
  })

  it('rejects provider errors and truncated streams', async () => {
    await expect(
      new Response(
        normalizeAnthropicSse(
          byteStream([
            'data: {"type":"error","error":{"message":"overloaded"}}',
          ]),
        ),
      ).text(),
    ).rejects.toThrow('Anthropic stream failed: overloaded')

    await expect(
      new Response(
        normalizeAnthropicSse(
          byteStream([
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"partial"}}',
          ]),
        ),
      ).text(),
    ).rejects.toThrow('Anthropic stream ended before its completion marker')
  })
})

describe('streamModel visual output cap', () => {
  it('sends the requested cap to OpenAI while preserving streaming', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('data: [DONE]\n\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const stream = await streamModel(
      { kind: 'openai', model: 'gpt-5.4-mini', apiKey: 'test-key' },
      {
        messages: [{ role: 'user', content: 'Match these references.' }],
        max_tokens: 3000,
      },
    )
    await new Response(stream).text()

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init).toBeDefined()
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    expect(body).toMatchObject({
      model: 'gpt-5.4-mini',
      max_completion_tokens: 3000,
      store: false,
      stream: true,
    })
  })
})
