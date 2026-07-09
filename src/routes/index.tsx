import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useQuery, useQueryStatus } from '@rindle/react'
import { Plus, Upload, X } from 'lucide-react'
import { decksQuery, DECKS_LIMIT } from '../../shared/queries'
import { DEFAULT_SLIDE_MODE } from '../../shared/app-def'
import { useMutate } from '../rindle/RindleProvider'
import { preloadDecks } from '../rindle/appSsr'
import { AccountControl } from '../rindle/AccountControl'
import { ModelControl } from '../rindle/ModelControl'
import { UsageMeter } from '../rindle/UsageMeter'
import { PoweredByRindle } from '../editor/PoweredByRindle'
import { newId } from '../config'
import { importDeck, readDeckFile } from '../editor/deckIO'

export const Route = createFileRoute('/')({
  component: Dashboard,
  // SSR seed: read the viewer's decks on the server so the dashboard first-paints with content instead
  // of the "Connecting…" splash. RindleProvider renders against `loaderData.rindle` until the live
  // client boots (then swaps with no flash). Best-effort — a null seed just falls back to the live query.
  loader: () => preloadDecks(),
})

function Dashboard() {
  // Server-authoritative read (NOT a local `useRoot` read): `slideCount` is a server-computed `countAs`
  // aggregate and the decks coverage doesn't sync the underlying slide rows, so a purely-local read would
  // count them as 0. `<DecksKeepalive>` (mounted at the root) holds this same coverage warm across the
  // session, so returning from the editor re-materializes against resident rows — no flash — while the
  // counts stay correct.
  const liveDecks = useQuery(decksQuery({ limit: DECKS_LIMIT }))
  const decksStatus = useQueryStatus(decksQuery({ limit: DECKS_LIMIT }))
  // Bridge the SSR-seed → live-client handoff on INITIAL load (the keepalive covers back-nav, but on a
  // cold first paint nothing is warm yet). The seed correctly first-paints the decks, but when the live
  // wasm store swaps in, its decks view resets (schema set) one daemon round-trip BEFORE its first
  // snapshot lands — and the seed can't cover that window (a reset view no longer reads its seed), so
  // `useQuery` transiently reads [] and the grid flashes "No decks". Keep showing the last AUTHORITATIVE
  // ('complete') result — which starts as the SSR seed and is the viewer's real data — through that
  // `unknown` window; once the live view is hydrated it's the source of truth. (The underlying fix
  // belongs in @rindle's SSR handoff — keep the seed until the first live snapshot, not just the hello.)
  const lastComplete = useRef(liveDecks)
  if (decksStatus === 'complete') lastComplete.current = liveDecks
  const decks = decksStatus === 'complete' ? liveDecks : lastComplete.current
  // The account resolved server-side (appSsr.ts) seeds AccountControl's first paint so the sign-in
  // pill doesn't pop in after the client's useSession() resolves.
  const { account, entitlement } = Route.useLoaderData()
  const mutate = useMutate()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Free-tier accounts (canKeepPrivate === false) create PUBLIC, link-shareable decks; everyone else
  // (self-host / Pro) creates private. The server (rindle-api createDeckGuarded) is authoritative — this
  // just keeps the optimistic row in sync so it doesn't snap on confirm.
  const makesPublic = entitlement?.canKeepPrivate === false
  function newDeckVisibility(): {
    visibility: 'private' | 'public-read'
    share_token: string
  } {
    return makesPublic
      ? { visibility: 'public-read', share_token: newId() }
      : { visibility: 'private', share_token: '' }
  }

  function createDeck(title: string) {
    const id = newId()
    const now = Date.now()
    mutate.createDeck({ id, title, now, ...newDeckVisibility() })
    // Seed the deck with one blank slide so the editor opens onto something. Match the deck's default
    // render mode (markdown-first) so the first slide isn't an odd spatial exception to the deck default.
    mutate.addSlide({
      id: newId(),
      deckId: id,
      sort: 'a0',
      x: 0,
      y: 0,
      render_mode: DEFAULT_SLIDE_MODE,
      now,
    })
    setCreating(false)
    navigate({ to: '/deck/$deckId', params: { deckId: id } })
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    try {
      const deckId = importDeck(
        mutate,
        await readDeckFile(file),
        newDeckVisibility(),
      )
      navigate({ to: '/deck/$deckId', params: { deckId } })
    } catch (err) {
      alert(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return (
    <div className="dash">
      <div className="brandbar">
        {/* Plain anchor (not a router Link) so it navigates to the site root `/` — the marketing home
            served by the commercial overlay, which lives OUTSIDE the app's /app basepath. */}
        <a className="brandbar__home" href="/" title="Strut home">
          <img className="brandbar__logo" src="/strut-logo.png" alt="Strut" />
        </a>
        <span className="brandbar__tag">Spatial presentations</span>
        <PoweredByRindle variant="inline" />
        <ModelControl />
        <UsageMeter />
        <AccountControl initial={account} entitlement={entitlement} />
      </div>
      <div className="dash__head">
        <div>
          <h1 className="dash__title">Your decks</h1>
          <p className="dash__sub">
            {decks.length} presentation{decks.length === 1 ? '' : 's'},
            local-first on Rindle.
          </p>
        </div>
        <div className="dash__actions">
          <input
            ref={fileRef}
            type="file"
            accept=".strut,.json,application/json"
            style={{ display: 'none' }}
            onChange={onImportFile}
          />
          <button
            className="btn"
            onClick={() => fileRef.current?.click()}
            title="Import a .strut file"
          >
            <Upload size={16} /> Import
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> New deck
          </button>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="dash__empty">
          No decks yet — create one to get started.
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((d) => (
            <button
              key={d.id}
              className="deck-card"
              onClick={() =>
                navigate({ to: '/deck/$deckId', params: { deckId: d.id } })
              }
            >
              <div className="deck-card__preview">
                {(d.title || '?').slice(0, 1).toUpperCase()}
                {d.source_deck_id && (
                  <span className="deck-card__badge">
                    {d.variant_label || 'Variant'}
                  </span>
                )}
              </div>
              <div className="deck-card__meta">
                <p className="deck-card__name">{d.title || 'Untitled'}</p>
                <p className="deck-card__info">
                  {d.slideCount} slide{d.slideCount === 1 ? '' : 's'} ·{' '}
                  {new Date(d.modified).toLocaleDateString()}
                </p>
              </div>
              <span
                className="deck-card__del"
                role="button"
                aria-label="Delete deck"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${d.title}"? This cannot be undone.`))
                    mutate.deleteDeck({ id: d.id })
                }}
              >
                <X size={16} />
              </span>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <NewDeckModal
          makesPublic={makesPublic}
          upgradeUrl={entitlement?.upgradeUrl ?? null}
          onCancel={() => setCreating(false)}
          onCreate={createDeck}
        />
      )}
    </div>
  )
}

function NewDeckModal({
  makesPublic,
  upgradeUrl,
  onCancel,
  onCreate,
}: {
  // Free tier: new decks are public/link-shareable (private is Pro) — surface that before they create.
  makesPublic: boolean
  upgradeUrl: string | null
  onCancel: () => void
  onCreate: (title: string) => void
}) {
  const [title, setTitle] = useState('')
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New deck</h3>
        <input
          type="text"
          autoFocus
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCreate(title.trim() || 'Untitled')
            if (e.key === 'Escape') onCancel()
          }}
        />
        {makesPublic && (
          <p className="dash__sub" style={{ margin: '2px 0 0', fontSize: 13 }}>
            On the free plan this deck is shareable by link.{' '}
            {upgradeUrl ? (
              <a href={upgradeUrl}>Upgrade to Pro</a>
            ) : (
              'Upgrade to Pro'
            )}{' '}
            for private decks.
          </p>
        )}
        <div className="modal__row">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onCreate(title.trim() || 'Untitled')}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
