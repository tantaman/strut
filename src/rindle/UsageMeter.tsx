// The usage meter in the dashboard brandbar: a small progress RING whose fill = the most-consumed limit
// (green→amber→red), clickable to open a breakdown popover (storage + each app-paid AI feature, with
// reset time and an Upgrade CTA). Reads /api/usage (server/quota peek + server/storage). Unlimited
// features (Pro / self-host storage) render as "Unlimited" with no bar. Renders nothing until it loads,
// so it's inert when there's no session.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiFeature } from '../../shared/commercial'
import { USAGE_CHANGED } from '../lib/usage'

interface Usage {
  isPro: boolean
  upgradeUrl: string | null
  resetsAt: string
  storage: { used: number; limit: number | null }
  ai: {
    unlimited: boolean
    features: Array<{ key: AiFeature; used: number; limit: number | null }>
  }
}

const LABEL: Record<AiFeature, string> = {
  arrange: 'AI Arrange',
  generate: 'Generate slides',
  chat: 'AI Chat',
  image: 'AI Images',
  artifact: 'Artifacts',
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function fmtReset(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (!(ms > 0)) return 'soon'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// coral (normal) → amber (getting close) → red (at the limit)
function color(frac: number): string {
  if (frac >= 0.9) return 'var(--danger)'
  if (frac >= 0.7) return '#e0a63a'
  return 'var(--coral)'
}

type Meter = {
  id: string
  label: string
  used: number
  limit: number | null
  unit: 'bytes' | 'count'
}

export function UsageMeter() {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    fetch('/api/usage', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: (Usage & { error?: string }) | null) => {
        if (d && !d.error) setUsage(d)
      })
      .catch(() => {})
  }, [])

  // First paint, whenever the panel opens (always-fresh numbers), and after any quota/storage-consuming
  // action fires USAGE_CHANGED (the ring ticks up live).
  useEffect(() => load(), [load])
  useEffect(() => {
    if (open) load()
  }, [open, load])
  useEffect(() => {
    window.addEventListener(USAGE_CHANGED, load)
    return () => window.removeEventListener(USAGE_CHANGED, load)
  }, [load])

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  if (!usage) return null

  const meters: Array<Meter> = [
    {
      id: 'storage',
      label: 'Storage',
      used: usage.storage.used,
      limit: usage.storage.limit,
      unit: 'bytes',
    },
  ]
  if (usage.ai.unlimited) {
    meters.push({
      id: 'ai',
      label: 'AI features',
      used: 0,
      limit: null,
      unit: 'count',
    })
  } else {
    for (const f of usage.ai.features)
      meters.push({
        id: f.key,
        label: LABEL[f.key],
        used: f.used,
        limit: f.limit,
        unit: 'count',
      })
  }

  const fmt = (n: number, unit: Meter['unit']) =>
    unit === 'bytes' ? fmtBytes(n) : String(n)

  // Ring fill = the most-consumed finite meter.
  const overall = meters.reduce(
    (max, m) => (m.limit ? Math.max(max, m.used / m.limit) : max),
    0,
  )
  const pct = Math.min(1, overall)
  const C = 2 * Math.PI * 8

  return (
    <div className="usage" ref={wrap}>
      <button
        className="usage__btn"
        onClick={() => setOpen((o) => !o)}
        title="Usage"
        aria-label="Usage"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle
            cx="11"
            cy="11"
            r="8"
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="3"
          />
          <circle
            cx="11"
            cy="11"
            r="8"
            fill="none"
            stroke={color(pct)}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 11 11)"
          />
        </svg>
      </button>
      {open && (
        <div className="popover usage__panel" style={{ top: '110%', right: 0 }}>
          <div className="usage__head">
            <span>Usage</span>
            {usage.isPro && <span className="usage__pro">Pro</span>}
          </div>

          {meters.map((m) => {
            const frac = m.limit ? Math.min(1, m.used / m.limit) : 0
            return (
              <div className="usage__row" key={m.id}>
                <div className="usage__line">
                  <span className="usage__label">{m.label}</span>
                  <span className="usage__val">
                    {m.limit == null
                      ? 'Unlimited'
                      : `${fmt(m.used, m.unit)} / ${fmt(m.limit, m.unit)}`}
                  </span>
                </div>
                {m.limit != null && (
                  <div className="usage__bar">
                    <div
                      className="usage__fill"
                      style={{
                        width: `${frac * 100}%`,
                        background: color(frac),
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {!usage.ai.unlimited && (
            <div className="usage__reset">
              AI limits reset in {fmtReset(usage.resetsAt)}
            </div>
          )}

          {!usage.isPro && usage.upgradeUrl && (
            <a
              className="btn btn--primary usage__upgrade"
              href={usage.upgradeUrl}
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      )}
    </div>
  )
}
