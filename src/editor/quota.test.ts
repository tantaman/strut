// @vitest-environment node
import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import {
  ARRANGE_DAILY_LIMIT,
  GENERATE_DAILY_LIMIT,
  IMAGE_DAILY_LIMIT,
  consumeArrangeQuota,
  consumeGenerateQuota,
  consumeImageQuota,
  makeSqliteStore,
  refundArrangeQuota,
  refundGenerateQuota,
  refundImageQuota,
  utcDay,
} from '../../server/quota'

// Exercise the durable-quota enforcement SQL (upsert-increment / refund / day rollover) against a real
// in-memory SQLite — the same store shape server/quota.ts uses in dev. The table DDL mirrors
// migrations-d1/0003_arrange_usage.sql.
function memStore() {
  const db = new Database(':memory:')
  db.exec(
    'create table arrange_usage (user_id text not null, day text not null, count integer not null default 0, primary key (user_id, day))',
  )
  // better-sqlite3's concrete Statement types (`get(p: {})`) don't structurally match makeSqliteStore's
  // deliberately-minimal LocalDb param typing — cast to that param type (the runtime shape is identical).
  return makeSqliteStore(db as unknown as Parameters<typeof makeSqliteStore>[0])
}

// Same, but for the separate generate_usage bucket (a second table, same store logic + shape).
function genStore() {
  const db = new Database(':memory:')
  db.exec(
    'create table generate_usage (user_id text not null, day text not null, count integer not null default 0, primary key (user_id, day))',
  )
  return makeSqliteStore(
    db as unknown as Parameters<typeof makeSqliteStore>[0],
    'generate_usage',
  )
}

// And the image_usage bucket (mirrors migrations-d1/0005_image_usage.sql).
function imgStore() {
  const db = new Database(':memory:')
  db.exec(
    'create table image_usage (user_id text not null, day text not null, count integer not null default 0, primary key (user_id, day))',
  )
  return makeSqliteStore(
    db as unknown as Parameters<typeof makeSqliteStore>[0],
    'image_usage',
  )
}

const T0 = Date.parse('2026-07-06T12:00:00Z') // → day 2026-07-06
const NEXT_DAY = Date.parse('2026-07-07T00:30:00Z') // → day 2026-07-07

describe('utcDay', () => {
  it('keys by UTC calendar day', () => {
    expect(utcDay(T0)).toBe('2026-07-06')
    expect(utcDay(NEXT_DAY)).toBe('2026-07-07')
  })
})

describe('consumeArrangeQuota', () => {
  it('allows exactly the limit, then rejects — atomically', async () => {
    const store = memStore()
    for (let i = 1; i <= ARRANGE_DAILY_LIMIT; i++) {
      const r = await consumeArrangeQuota('u1', T0, store)
      expect(r.allowed).toBe(true)
      expect(r.used).toBe(i)
      expect(r.limit).toBe(ARRANGE_DAILY_LIMIT)
    }
    const over = await consumeArrangeQuota('u1', T0, store)
    expect(over.allowed).toBe(false)
    expect(over.used).toBe(ARRANGE_DAILY_LIMIT + 1)
  })

  it('refund frees a unit so the next call is allowed again', async () => {
    const store = memStore()
    for (let i = 0; i < ARRANGE_DAILY_LIMIT; i++) {
      await consumeArrangeQuota('u1', T0, store)
    }
    expect((await consumeArrangeQuota('u1', T0, store)).allowed).toBe(false)
    await refundArrangeQuota('u1', T0, store) // e.g. the model was unavailable
    // back at the limit exactly → the next consume tips over again
    const r = await consumeArrangeQuota('u1', T0, store)
    expect(r.used).toBe(ARRANGE_DAILY_LIMIT + 1)
    expect(r.allowed).toBe(false)
  })

  it('refund never goes below zero', async () => {
    const store = memStore()
    await refundArrangeQuota('u1', T0, store)
    const r = await consumeArrangeQuota('u1', T0, store)
    expect(r.used).toBe(1)
    expect(r.allowed).toBe(true)
  })

  it('resets on a new UTC day', async () => {
    const store = memStore()
    for (let i = 0; i < ARRANGE_DAILY_LIMIT; i++) {
      await consumeArrangeQuota('u1', T0, store)
    }
    expect((await consumeArrangeQuota('u1', T0, store)).allowed).toBe(false)
    const tomorrow = await consumeArrangeQuota('u1', NEXT_DAY, store)
    expect(tomorrow.allowed).toBe(true)
    expect(tomorrow.used).toBe(1)
  })

  it('counts each user independently', async () => {
    const store = memStore()
    for (let i = 0; i < ARRANGE_DAILY_LIMIT; i++) {
      await consumeArrangeQuota('u1', T0, store)
    }
    const other = await consumeArrangeQuota('u2', T0, store)
    expect(other.allowed).toBe(true)
    expect(other.used).toBe(1)
  })
})

describe('consumeGenerateQuota', () => {
  it('enforces its own (smaller) daily limit', async () => {
    const store = genStore()
    for (let i = 1; i <= GENERATE_DAILY_LIMIT; i++) {
      const r = await consumeGenerateQuota('u1', T0, store)
      expect(r.allowed).toBe(true)
      expect(r.used).toBe(i)
      expect(r.limit).toBe(GENERATE_DAILY_LIMIT)
    }
    const over = await consumeGenerateQuota('u1', T0, store)
    expect(over.allowed).toBe(false)
    expect(over.used).toBe(GENERATE_DAILY_LIMIT + 1)
  })

  it('refund frees a unit', async () => {
    const store = genStore()
    for (let i = 0; i < GENERATE_DAILY_LIMIT; i++) {
      await consumeGenerateQuota('u1', T0, store)
    }
    expect((await consumeGenerateQuota('u1', T0, store)).allowed).toBe(false)
    await refundGenerateQuota('u1', T0, store)
    const r = await consumeGenerateQuota('u1', T0, store)
    expect(r.used).toBe(GENERATE_DAILY_LIMIT + 1)
    expect(r.allowed).toBe(false)
  })
})

describe('consumeImageQuota', () => {
  it('enforces its own daily limit and a refund frees a unit', async () => {
    const store = imgStore()
    for (let i = 1; i <= IMAGE_DAILY_LIMIT; i++) {
      const r = await consumeImageQuota('u1', T0, store)
      expect(r.allowed).toBe(true)
      expect(r.limit).toBe(IMAGE_DAILY_LIMIT)
    }
    expect((await consumeImageQuota('u1', T0, store)).allowed).toBe(false)
    await refundImageQuota('u1', T0, store)
    const r = await consumeImageQuota('u1', T0, store)
    expect(r.used).toBe(IMAGE_DAILY_LIMIT + 1)
    expect(r.allowed).toBe(false)
  })
})
