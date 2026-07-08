// The "Connect your model" control in the dashboard chrome (brandbar), beside AccountControl. Bring your
// own LLM via OpenRouter: paste a key (validated + envelope-encrypted server-side, never returned) and the
// ✨ features run on YOUR OpenRouter credits instead of the app's Workers AI. Available to guests too — a
// connected key is what unlocks AI without an account (OPENROUTER_PLAN.md "Decisions"). Status is fetched
// client-side (no SSR seed needed for a secondary control); initial paint shows "Connect model" and flips
// to the connected model once /api/model/status resolves.

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { connectModel, disconnectModel, useModelStatus } from './modelClient'
import type { ModelStatus } from './modelClient'
import { track } from '../lib/analytics'

export function ModelControl() {
  const { status, refresh } = useModelStatus()
  const [open, setOpen] = useState(false)

  const label = status.connected ? status.model || 'Your model' : 'Connect model'
  const title = status.connected
    ? `Connected: ${status.provider ?? 'model'}${status.model ? ` · ${status.model}` : ''}`
    : 'Bring your own LLM via OpenRouter'

  return (
    <>
      <button
        className={`btn btn--ghost${status.connected ? ' is-active' : ''}`}
        onClick={() => setOpen(true)}
        title={title}
      >
        <Sparkles size={15} />
        <span className="model-conn__label">{label}</span>
      </button>
      {open && (
        <ModelModal
          status={status}
          onChanged={refresh}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function ModelModal({
  status,
  onChanged,
  onClose,
}: {
  status: ModelStatus
  onChanged: () => void
  onClose: () => void
}) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(status.model ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const key = apiKey.trim()
    if (!key || busy) return
    setBusy(true)
    setError(null)
    const result = await connectModel(key, model.trim() || null)
    setBusy(false)
    if (!result.ok) {
      setError(result.message ?? 'Could not connect that model.')
      return
    }
    track('model:connect', { model: model.trim() || 'auto' })
    setApiKey('')
    onChanged()
    onClose()
  }

  async function disconnect() {
    if (busy) return
    setBusy(true)
    await disconnectModel()
    track('model:disconnect')
    setBusy(false)
    onChanged()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--model"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="model-conn__head">
          <h3>Connect your model</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="modal__note">
          Bring your own LLM via{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
            OpenRouter
          </a>
          . The ✨ features (Arrange, Generate, Chat) run on your OpenRouter
          credits. Your key is encrypted on the server, shown to no one, and
          never leaves it.
        </p>

        {status.connected && (
          <p className="model-conn__status">
            Connected to <strong>{status.provider}</strong>
            {status.model ? (
              <>
                {' · '}
                <code>{status.model}</code>
              </>
            ) : (
              ' · auto'
            )}
            . Paste a new key below to replace it.
          </p>
        )}

        <label className="model-conn__field" htmlFor="or-key">
          OpenRouter API key
        </label>
        <input
          id="or-key"
          type="password"
          value={apiKey}
          placeholder="sk-or-…"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />

        <label className="model-conn__field" htmlFor="or-model">
          Model{' '}
          <span className="model-conn__muted">
            — optional; blank = OpenRouter auto
          </span>
        </label>
        <input
          id="or-model"
          type="text"
          value={model}
          placeholder="anthropic/claude-3.5-sonnet"
          spellCheck={false}
          onChange={(e) => setModel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />

        {error && <p className="modal__error">{error}</p>}

        <div className="modal__row" style={{ marginTop: 12 }}>
          {status.connected && (
            <button
              className="btn btn--ghost"
              disabled={busy}
              onClick={disconnect}
            >
              Disconnect
            </button>
          )}
          <button
            className="btn btn--primary"
            disabled={busy || !apiKey.trim()}
            onClick={submit}
          >
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
