import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useQuery } from '@rindle/react'
import { Plus, Upload, X } from 'lucide-react'
import { decksQuery } from '../../shared/queries'
import { useMutate } from '../rindle/RindleProvider'
import { currentUser } from '../rindle/user'
import { newId } from '../config'
import { importDeck, readDeckFile } from '../editor/deckIO'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const decks = useQuery(decksQuery({ limit: 200 }, { user: currentUser() }))
  const mutate = useMutate()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function createDeck(title: string) {
    const id = newId()
    const now = Date.now()
    mutate.createDeck({ id, title, ownerId: currentUser(), now })
    // Seed the deck with one blank slide so the editor opens onto something.
    mutate.addSlide({ id: newId(), deckId: id, sort: 'a0', x: 0, y: 0, now })
    setCreating(false)
    navigate({ to: '/deck/$deckId', params: { deckId: id } })
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    try {
      const deckId = importDeck(mutate, await readDeckFile(file))
      navigate({ to: '/deck/$deckId', params: { deckId } })
    } catch (err) {
      alert(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return (
    <div className="dash">
      <div className="dash__head">
        <div>
          <h1 className="dash__title">
            St<span>r</span>ut
          </h1>
          <p className="dash__sub">
            Spatial presentations, local-first on Rindle.
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
          onCancel={() => setCreating(false)}
          onCreate={createDeck}
        />
      )}
    </div>
  )
}

function NewDeckModal({
  onCancel,
  onCreate,
}: {
  onCancel: () => void
  onCreate: (title: string) => void
}) {
  const [title, setTitle] = useState('Untitled')
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New deck</h3>
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) onCreate(title.trim())
            if (e.key === 'Escape') onCancel()
          }}
        />
        <div className="modal__row">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={!title.trim()}
            onClick={() => onCreate(title.trim())}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
