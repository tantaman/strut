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

export async function emitAamuDeckEvent(
  type: 'deck.created' | 'deck.updated' | 'deck.deleted',
  deck: DeckMirror,
): Promise<void> {
  const url = webhookUrl()
  const secret =
    process.env.AAMU_SLIDES_WEBHOOK_SECRET ??
    process.env.AAMU_SLIDES_SHARED_SECRET ??
    ''
  if (!url || !secret || !deck.cid || !deck.pid) return

  const body = JSON.stringify({
    id: crypto.randomUUID(),
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
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-slides-signature': await signature(body, secret),
      },
      body,
    })
    if (!response.ok) throw new Error(`Aamu returned HTTP ${response.status}`)
  } catch (error) {
    // Deck writes remain available if Aamu is temporarily unavailable. A reconciliation
    // endpoint/outbox can replay these in the deployment follow-up.
    console.error('[aamu-events] delivery failed:', error)
  }
}
