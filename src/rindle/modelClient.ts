// Client wrappers for the "Connect your model" (BYO LLM) routes (src/routes/api.model.*). Mirrors the ✨
// features' fetch conventions: `credentials: 'same-origin'`, JSON body, and defensive error parsing
// (read the server's `message`, fall back per status). The API key is only ever SENT (on connect) and is
// never returned by any route, so nothing here ever holds a key.

import { useCallback, useEffect, useState } from 'react'
import { appPath } from '../../shared/appPath'

export interface ModelStatus {
  connected: boolean
  provider: string | null
  model: string | null
}

const DISCONNECTED: ModelStatus = {
  connected: false,
  provider: null,
  model: null,
}

export interface ConnectResult {
  ok: boolean
  status?: ModelStatus
  /** A friendly, user-facing message when `ok` is false. */
  message?: string
}

/** Current connection status (never includes a key). Falls back to "disconnected" on any error. */
export async function getModelStatus(): Promise<ModelStatus> {
  try {
    const res = await fetch(appPath('/api/model/status'), {
      credentials: 'same-origin',
    })
    if (!res.ok) return DISCONNECTED
    return (await res.json()) as ModelStatus
  } catch {
    return DISCONNECTED
  }
}

/** Validate + store an OpenRouter key (+ optional model id). Returns a friendly message on failure. */
export async function connectModel(
  apiKey: string,
  model: string | null,
): Promise<ConnectResult> {
  let res: Response
  try {
    res = await fetch(appPath('/api/model/connect'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ apiKey, model }),
    })
  } catch {
    return { ok: false, message: 'Network error — try again.' }
  }
  const data = (await res.json().catch(() => null)) as
    | (ModelStatus & { message?: string })
    | null
  if (!res.ok) {
    return {
      ok: false,
      message:
        data?.message ??
        (res.status === 401
          ? 'Sign in to connect a model.'
          : 'Could not connect that model.'),
    }
  }
  return { ok: true, status: data ?? DISCONNECTED }
}

/** Forget the connected model. Best-effort — resolves even on error (the caller refreshes status). */
export async function disconnectModel(): Promise<void> {
  try {
    await fetch(appPath('/api/model/disconnect'), {
      method: 'POST',
      credentials: 'same-origin',
    })
  } catch {
    /* ignore — caller refreshes status */
  }
}

/** Reactive status hook: `{ status, loading, refresh }`. Fetches once on mount; `refresh()` re-reads
 *  (e.g. after connect/disconnect). Initial state is "disconnected" so SSR and first client paint agree. */
export function useModelStatus(): {
  status: ModelStatus
  loading: boolean
  refresh: () => void
} {
  const [status, setStatus] = useState<ModelStatus>(DISCONNECTED)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    setLoading(true)
    void getModelStatus().then((s) => {
      setStatus(s)
      setLoading(false)
    })
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])
  return { status, loading, refresh }
}
