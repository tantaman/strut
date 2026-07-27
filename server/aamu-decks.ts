import { timingSafeEqual } from 'node:crypto'
import { HttpRindleDaemonClient } from '@rindle/daemon-client'

const DAEMON_URL = process.env.RINDLE_DAEMON_URL ?? 'http://127.0.0.1:7600'

export type AamuDeckSnapshot = {
  id: string
  cid: string
  pid: string
  title: string
  ownerId: string
  created: number
  modified: number
  slideCount: number
}

function daemonClient(): HttpRindleDaemonClient {
  return new HttpRindleDaemonClient({
    baseUrl: DAEMON_URL,
    headers: {
      authorization: `Bearer ${process.env.RINDLE_DAEMON_TOKEN ?? ''}`,
    },
  })
}

export function validAamuBearer(request: Request): boolean {
  const secret = process.env.AAMU_SLIDES_SHARED_SECRET ?? ''
  const authorization = request.headers.get('authorization') ?? ''
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const expected = Buffer.from(secret)
  const actual = Buffer.from(token)
  return (
    expected.length > 0 &&
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  )
}

export async function readAamuDeckSnapshot(): Promise<AamuDeckSnapshot[]> {
  const result = await daemonClient().executeSqlRead({
    sql: `SELECT
        d.id, d.cid, d.pid, d.title, d.owner_id, d.created, d.modified,
        COUNT(s.id) AS slide_count
      FROM deck d
      LEFT JOIN slide s ON s.deck_id = d.id
      WHERE d.cid <> '' AND d.pid <> ''
      GROUP BY d.id, d.cid, d.pid, d.title, d.owner_id, d.created, d.modified
      ORDER BY d.id`,
    consistency: 'strong',
  })

  return result.rows.map((row) => ({
    id: String(row[0]),
    cid: String(row[1]),
    pid: String(row[2]),
    title: String(row[3]),
    ownerId: String(row[4]),
    created: Number(row[5]),
    modified: Number(row[6]),
    slideCount: Number(row[7]) || 0,
  }))
}
