import { describe, expect, it } from 'vitest'
import {
  MAX_CHAT_ACT_REQUEST_BYTES,
  parseChatActPayload,
} from '../../server/chatActPayload'
import {
  MAX_STYLE_REFERENCE_BYTES,
  MAX_STYLE_REFERENCES,
  MAX_STYLE_REFERENCES_TOTAL_BYTES,
} from '../../shared/styleReferences'

const requestBody = {
  deckId: 'd1',
  messages: [{ role: 'user' as const, content: 'Match this look' }],
  deckContext: '',
  slideIds: [],
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG = new Uint8Array([0xff, 0xd8, 0xff])
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])

function imageBytes(type: string, size?: number): Uint8Array<ArrayBuffer> {
  const signature =
    type === 'image/jpeg' ? JPEG : type === 'image/webp' ? WEBP : PNG
  const bytes = new Uint8Array(
    new ArrayBuffer(
      Math.max(size ?? signature.byteLength, signature.byteLength),
    ),
  )
  bytes.set(signature)
  return bytes
}

function multipart(
  files: Array<{ type: string; data?: Uint8Array }>,
  customize?: (form: FormData) => void,
): Request {
  const form = new FormData()
  form.append('request', JSON.stringify(requestBody))
  files.forEach((file, index) => {
    const bytes = file.data ?? imageBytes(file.type)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer
    form.append(
      'reference',
      new Blob([buffer], { type: file.type }),
      `ref-${index}.png`,
    )
  })
  customize?.(form)
  return new Request('http://localhost/api/chat/act', {
    method: 'POST',
    body: form,
  })
}

describe('parseChatActPayload', () => {
  it('preserves JSON chat requests with no images', async () => {
    const parsed = await parseChatActPayload(
      new Request('http://localhost/api/chat/act', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
    )
    expect(parsed.body.deckId).toBe('d1')
    expect(parsed.images).toEqual([])
  })

  it('reads ephemeral raster references from multipart without URLs', async () => {
    const parsed = await parseChatActPayload(
      multipart([
        { type: 'image/jpeg' },
        { type: 'image/png' },
        { type: 'image/webp' },
      ]),
    )
    expect(parsed.images.map((image) => image.mediaType)).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    expect(parsed.images[1].bytes).toHaveLength(PNG.length)
  })

  it('rejects files whose bytes do not match their declared image type', async () => {
    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png', data: new Uint8Array([1, 2, 3, 4]) }]),
      ),
    ).rejects.toMatchObject({ status: 415 })
  })

  it('rejects unsupported and empty files', async () => {
    await expect(
      parseChatActPayload(multipart([{ type: 'image/svg+xml' }])),
    ).rejects.toMatchObject({ status: 415 })

    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png', data: new Uint8Array() }]),
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects more than five references', async () => {
    await expect(
      parseChatActPayload(
        multipart(
          Array.from({ length: MAX_STYLE_REFERENCES + 1 }, () => ({
            type: 'image/png',
          })),
        ),
      ),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('enforces per-file and aggregate reference byte limits', async () => {
    await expect(
      parseChatActPayload(
        multipart([
          {
            type: 'image/png',
            data: imageBytes('image/png', MAX_STYLE_REFERENCE_BYTES + 1),
          },
        ]),
      ),
    ).rejects.toMatchObject({ status: 413 })

    // Two exactly-max files plus one tiny valid image exceed the aggregate by only a few bytes, while the
    // complete multipart body remains under its separate framing/request allowance.
    await expect(
      parseChatActPayload(
        multipart([
          {
            type: 'image/png',
            data: imageBytes('image/png', MAX_STYLE_REFERENCE_BYTES),
          },
          {
            type: 'image/jpeg',
            data: imageBytes('image/jpeg', MAX_STYLE_REFERENCE_BYTES),
          },
          { type: 'image/webp' },
        ]),
      ),
    ).rejects.toMatchObject({ status: 413 })
    expect(MAX_STYLE_REFERENCE_BYTES * 2).toBe(MAX_STYLE_REFERENCES_TOTAL_BYTES)
  })

  it('caps JSON request fields in both transports', async () => {
    const oversized = JSON.stringify({
      ...requestBody,
      deckContext: 'x'.repeat(MAX_CHAT_ACT_REQUEST_BYTES),
    })
    await expect(
      parseChatActPayload(
        new Request('http://localhost/api/chat/act', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: oversized,
        }),
      ),
    ).rejects.toMatchObject({ status: 413 })

    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png' }], (form) => {
          form.delete('request')
          form.append('request', 'x'.repeat(MAX_CHAT_ACT_REQUEST_BYTES + 1))
        }),
      ),
    ).rejects.toMatchObject({ status: 413 })
  })

  it('rejects duplicate, missing, and unexpected multipart fields', async () => {
    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png' }], (form) => {
          form.append('request', JSON.stringify(requestBody))
        }),
      ),
    ).rejects.toMatchObject({ status: 400 })

    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png' }], (form) => form.delete('request')),
      ),
    ).rejects.toMatchObject({ status: 400 })

    await expect(
      parseChatActPayload(
        multipart([{ type: 'image/png' }], (form) =>
          form.append('surprise', 'nope'),
        ),
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('bounds a chunked multipart stream with no Content-Length before parsing', async () => {
    const chunk = new Uint8Array(new ArrayBuffer(256 * 1024))
    let remaining =
      MAX_STYLE_REFERENCES_TOTAL_BYTES +
      MAX_CHAT_ACT_REQUEST_BYTES +
      1024 * 1024
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (remaining <= 0) {
          controller.close()
          return
        }
        const size = Math.min(chunk.byteLength, remaining)
        controller.enqueue(chunk.subarray(0, size))
        remaining -= size
      },
    })
    const request = new Request('http://localhost/api/chat/act', {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=bounded-test',
      },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })
    expect(request.headers.get('content-length')).toBeNull()

    await expect(parseChatActPayload(request)).rejects.toMatchObject({
      status: 413,
    })
  })
})
