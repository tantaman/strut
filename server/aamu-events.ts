import { HttpRindleDaemonClient } from '@rindle/daemon-client'

interface DeckMirror {
  id: string
  title: string
  created: number
  modified: number
  owner_id: string
  cid: string
  pid: string
  slideCount?: number
}

type AamuEventType = 'deck.created' | 'deck.updated' | 'deck.deleted'

type OutboxRow = {
  id: string
  body: string
  attempts: number
}

const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7600'
const MAX_DELIVERIES_PER_DRAIN = 50
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000

function daemonClient(): HttpRindleDaemonClient {
  return new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: {
      authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}`,
    },
  })
}

function webhookUrl(): string {
  const base = (
    process.env.AAMU_INTERNAL_URL ??
    process.env.AAMU_EVENT_URL ??
    ''
  ).replace(/\/+$/, '')
  return base ? `${base}/api/integrations/slides/events` : ''
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function signature(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const value = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body),
  )
  return `sha256=${bytesToHex(new Uint8Array(value))}`
}

function retryDelay(attempts: number): number {
  return Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** Math.min(attempts, 8))
}

async function enqueue(body: string, id: string): Promise<void> {
  const now = Date.now()
  await daemonClient().executeSqlTxn({
    idempotencyKey: `aamu-outbox:${id}`,
    statements: [
      {
        sql: `INSERT OR IGNORE INTO aamu_event_outbox
          (id, body, created_at, attempts, next_attempt_at, last_error)
          VALUES (?, ?, ?, 0, ?, '')`,
        params: [id, body, now, now],
      },
    ],
  })
}

async function dueEvents(): Promise<OutboxRow[]> {
  const result = await daemonClient().executeSqlRead({
    sql: `SELECT id, body, attempts
      FROM aamu_event_outbox
      WHERE next_attempt_at <= ?
      ORDER BY created_at, id
      LIMIT ?`,
    params: [Date.now(), MAX_DELIVERIES_PER_DRAIN],
    consistency: 'strong',
  })
  return result.rows.map((row) => ({
    id: String(row[0]),
    body: String(row[1]),
    attempts: Number(row[2]) || 0,
  }))
}

async function removeDelivered(id: string): Promise<void> {
  await daemonClient().executeSqlTxn({
    idempotencyKey: `aamu-outbox-delivered:${id}`,
    statements: [
      { sql: 'DELETE FROM aamu_event_outbox WHERE id = ?', params: [id] },
    ],
  })
}

async function deferDelivery(row: OutboxRow, error: unknown): Promise<void> {
  const attempts = row.attempts + 1
  const message =
    error instanceof Error
      ? error.message.slice(0, 500)
      : String(error).slice(0, 500)
  await daemonClient().executeSqlTxn({
    statements: [
      {
        sql: `UPDATE aamu_event_outbox
          SET attempts = ?, next_attempt_at = ?, last_error = ?
          WHERE id = ?`,
        params: [attempts, Date.now() + retryDelay(attempts), message, row.id],
      },
    ],
  })
}

let activeDrain: Promise<number> | null = null

async function runDrain(): Promise<number> {
  const url = webhookUrl()
  const secret =
    process.env.AAMU_SLIDES_WEBHOOK_SECRET ??
    process.env.AAMU_SLIDES_SHARED_SECRET ??
    ''
  if (!url || !secret) return 0

  let delivered = 0
  for (const row of await dueEvents()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-slides-signature': await signature(row.body, secret),
        },
        body: row.body,
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) throw new Error(`Aamu returned HTTP ${response.status}`)
      await removeDelivered(row.id)
      delivered++
    } catch (error) {
      await deferDelivery(row, error)
      console.error(`[aamu-events] delivery of ${row.id} failed:`, error)
      break
    }
  }
  return delivered
}

export function drainAamuEventOutbox(): Promise<number> {
  if (!activeDrain) {
    activeDrain = runDrain().finally(() => {
      activeDrain = null
    })
  }
  return activeDrain
}

export async function emitAamuDeckEvent(
  type: AamuEventType,
  deck: DeckMirror,
): Promise<void> {
  const url = webhookUrl()
  const secret =
    process.env.AAMU_SLIDES_WEBHOOK_SECRET ??
    process.env.AAMU_SLIDES_SHARED_SECRET ??
    ''
  if (!url || !secret || !deck.cid || !deck.pid) return

  const id = crypto.randomUUID()
  const body = JSON.stringify({
    id,
    type,
    occurredAt: Date.now(),
    deck: {
      id: deck.id,
      cid: deck.cid,
      pid: deck.pid,
      title: deck.title,
      ownerId: deck.owner_id,
      created: deck.created,
      modified: deck.modified,
      slideCount: Number(deck.slideCount) || 0,
    },
  })
  try {
    await enqueue(body, id)
    // Persistence is part of the mutation's completion boundary, but network
    // delivery is not: an Aamu outage must not stall Slides editing.
    void drainAamuEventOutbox().catch((error) => {
      console.error('[aamu-events] background outbox drain failed:', error)
    })
  } catch (error) {
    // The authoritative deck mutation has already committed. Never turn it
    // into an apparent failure: reconciliation can repair a missed enqueue.
    console.error('[aamu-events] outbox operation failed:', error)
  }
}
