// @vitest-environment node
import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import {
  ARRANGE_DAILY_LIMIT,
  GENERATE_DAILY_LIMIT,
  IMAGE_DAILY_LIMIT,
  consumeAiQuota,
  consumeArrangeQuota,
  consumeGenerateQuota,
  consumeImageQuota,
  makeSqliteStore,
  refundAiQuota,
  refundArrangeQuota,
  refundGenerateQuota,
  refundImageQuota,
  utcDay,
  utcMonth,
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

// The pooled monthly allowance shares ONE table across all inference features (mirrors
// migrations-d1/0009_ai_pool_usage.sql). consumeAiQuota with window:'month' bumps this via the passed store.
function poolStore() {
  const db = new Database(':memory:')
  db.exec(
    'create table ai_pool_usage (user_id text not null, day text not null, count integer not null default 0, primary key (user_id, day))',
  )
  return makeSqliteStore(
    db as unknown as Parameters<typeof makeSqliteStore>[0],
    'ai_pool_usage',
  )
}

const T0 = Date.parse('2026-07-06T12:00:00Z') // → day 2026-07-06, month 2026-07
const NEXT_DAY = Date.parse('2026-07-07T00:30:00Z') // → day 2026-07-07, month 2026-07
const NEXT_MONTH = Date.parse('2026-08-02T00:30:00Z') // → month 2026-08

describe('utcDay', () => {
  it('keys by UTC calendar day', () => {
    expect(utcDay(T0)).toBe('2026-07-06')
    expect(utcDay(NEXT_DAY)).toBe('2026-07-07')
  })
})

describe('utcMonth', () => {
  it('keys by UTC calendar month', () => {
    expect(utcMonth(T0)).toBe('2026-07')
    expect(utcMonth(NEXT_DAY)).toBe('2026-07') // same month as T0
    expect(utcMonth(NEXT_MONTH)).toBe('2026-08')
  })
})

describe('consumeAiQuota — pooled monthly window', () => {
  const month = { window: 'month', limit: 3 } as const

  it('shares ONE allowance across features (arrange/generate/chat/image pool together)', async () => {
    const store = poolStore()
    // Three different features, three calls — all draw from the same pool.
    expect((await consumeAiQuota('u1', T0, 'chat', month, store)).allowed).toBe(
      true,
    )
    expect(
      (await consumeAiQuota('u1', T0, 'arrange', month, store)).allowed,
    ).toBe(true)
    const third = await consumeAiQuota('u1', T0, 'image', month, store)
    expect(third.allowed).toBe(true)
    expect(third.used).toBe(3)
    expect(third.window).toBe('month')
    // Fourth call (any feature) tips over the shared limit.
    const over = await consumeAiQuota('u1', T0, 'generate', month, store)
    expect(over.allowed).toBe(false)
    expect(over.used).toBe(4)
  })

  it('refund frees a pooled unit', async () => {
    const store = poolStore()
    for (let i = 0; i < 3; i++)
      await consumeAiQuota('u1', T0, 'chat', month, store)
    expect((await consumeAiQuota('u1', T0, 'chat', month, store)).allowed).toBe(
      false,
    )
    await refundAiQuota('u1', T0, 'chat', 'month', store)
    const r = await consumeAiQuota('u1', T0, 'chat', month, store)
    expect(r.used).toBe(4)
    expect(r.allowed).toBe(false)
  })

  it('shares the pool within a month but resets on a new UTC month', async () => {
    const store = poolStore()
    for (let i = 0; i < 3; i++)
      await consumeAiQuota('u1', T0, 'chat', month, store)
    // Same calendar month, a LATER day → still the same pool (over the limit, not reset).
    const sameMonth = await consumeAiQuota('u1', NEXT_DAY, 'chat', month, store)
    expect(sameMonth.used).toBe(4)
    expect(sameMonth.allowed).toBe(false)
    // A new UTC month → fresh pool.
    const nextMonth = await consumeAiQuota(
      'u1',
      NEXT_MONTH,
      'chat',
      month,
      store,
    )
    expect(nextMonth.allowed).toBe(true)
    expect(nextMonth.used).toBe(1)
  })

  it('counts each user independently', async () => {
    const store = poolStore()
    for (let i = 0; i < 3; i++)
      await consumeAiQuota('u1', T0, 'chat', month, store)
    const other = await consumeAiQuota('u2', T0, 'chat', month, store)
    expect(other.allowed).toBe(true)
    expect(other.used).toBe(1)
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
