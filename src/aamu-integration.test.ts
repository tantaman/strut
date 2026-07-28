// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const daemon = vi.hoisted(() => ({
  executeSqlRead: vi.fn(),
  executeSqlTxn: vi.fn(),
}))

vi.mock('@rindle/daemon-client', () => ({
  HttpRindleDaemonClient: class {
    executeSqlRead = daemon.executeSqlRead
    executeSqlTxn = daemon.executeSqlTxn
  },
}))

import { readAamuDeckSnapshot, validAamuBearer } from '../server/aamu-decks'
import { drainAamuEventOutbox, emitAamuDeckEvent } from '../server/aamu-events'

const deck = {
  id: 'deck-1',
  title: 'Roadmap',
  created: 10,
  modified: 20,
  owner_id: 'user-1',
  cid: 'company-1',
  pid: 'project-1',
  slideCount: 3,
}

beforeEach(() => {
  daemon.executeSqlRead.mockReset()
  daemon.executeSqlTxn.mockReset().mockResolvedValue({ applied: true })
  process.env.AAMU_INTERNAL_URL = 'https://aamu.invalid'
  process.env.AAMU_SLIDES_SHARED_SECRET = 'shared-secret'
  delete process.env.AAMU_SLIDES_WEBHOOK_SECRET
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Aamu deck snapshot', () => {
  it('requires the configured bearer token', () => {
    expect(
      validAamuBearer(
        new Request('https://slides.invalid/api/aamu/decks', {
          headers: { authorization: 'Bearer shared-secret' },
        }),
      ),
    ).toBe(true)
    expect(
      validAamuBearer(
        new Request('https://slides.invalid/api/aamu/decks', {
          headers: { authorization: 'Bearer wrong-secret' },
        }),
      ),
    ).toBe(false)
  })

  it('maps the daemon result into the integration contract', async () => {
    daemon.executeSqlRead.mockResolvedValue({
      cols: [
        'id',
        'cid',
        'pid',
        'title',
        'owner_id',
        'created',
        'modified',
        'slide_count',
      ],
      rows: [
        ['deck-1', 'company-1', 'project-1', 'Roadmap', 'user-1', 10, 20, 3],
      ],
    })

    await expect(readAamuDeckSnapshot()).resolves.toEqual([
      {
        id: 'deck-1',
        cid: 'company-1',
        pid: 'project-1',
        title: 'Roadmap',
        ownerId: 'user-1',
        created: 10,
        modified: 20,
        slideCount: 3,
      },
    ])
    expect(daemon.executeSqlRead).toHaveBeenCalledWith(
      expect.objectContaining({ consistency: 'strong' }),
    )
  })
})

describe('Aamu event outbox', () => {
  it('persists an event before attempting delivery', async () => {
    daemon.executeSqlRead.mockResolvedValue({ cols: [], rows: [] })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await emitAamuDeckEvent('deck.created', deck)

    expect(daemon.executeSqlTxn).toHaveBeenCalledWith(
      expect.objectContaining({
        statements: [
          expect.objectContaining({
            sql: expect.stringContaining(
              'INSERT OR IGNORE INTO aamu_event_outbox',
            ),
          }),
        ],
      }),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps a failed delivery and schedules a retry', async () => {
    daemon.executeSqlRead.mockResolvedValue({
      cols: ['id', 'body', 'attempts'],
      rows: [['event-1', '{"id":"event-1"}', 0]],
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    )
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await emitAamuDeckEvent('deck.updated', deck)
    await drainAamuEventOutbox()

    expect(daemon.executeSqlTxn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        statements: [
          expect.objectContaining({
            sql: expect.stringContaining('UPDATE aamu_event_outbox'),
            params: expect.arrayContaining([
              1,
              'Aamu returned HTTP 503',
              'event-1',
            ]),
          }),
        ],
      }),
    )
  })
})
