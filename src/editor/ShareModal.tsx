// Share panel (spec §12): the one place to manage who can see/edit a deck.
//   • Identity — set your display name + copy your Strut ID (the handle others add you by).
//   • Public link (owner) — flip the deck to "anyone with the link can view" and copy the link.
//   • Collaborators (owner) — add by Strut ID as editor/viewer, see them by name, remove them.
// All writes go through the access-guarded mutators; non-owners only get the identity section.

import { useEffect, useState } from 'react'
import { Check, Copy, Link2, Trash2, X } from 'lucide-react'
import { useQuery } from '@rindle/react'
import type { QueryData } from '@rindle/react'
import { deckSharesQuery, profileQuery } from '../../shared/queries'
import { useMutate } from '../rindle/RindleProvider'
import { currentUser } from '../rindle/user'
import { newId } from '../config'
import type { CollaboratorRole } from '../../shared/app-def'

interface ShareDeck {
  id: string
  owner_id: string
  visibility: string
  share_token: string
}
// Derived from the query — a `deck_share` row, no hand-written interface (see RINDLE_NOTES #8).
type ShareRow = QueryData<ReturnType<typeof deckSharesQuery>>[number]

function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(t)
  }, [copied])
  return [
    copied,
    (text: string) => {
      navigator.clipboard?.writeText(text).then(
        () => setCopied(true),
        () => {},
      )
    },
  ]
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, copy] = useCopy()
  return (
    <button
      className="btn btn--ghost share__copy"
      onClick={() => copy(value)}
      title="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label ? ` ${copied ? 'Copied' : label}` : ''}
    </button>
  )
}

export function ShareModal({
  deck,
  onClose,
}: {
  deck: ShareDeck
  onClose: () => void
}) {
  const mutate = useMutate()
  const me = currentUser()
  const isOwner = deck.owner_id === me
  const isPublic = deck.visibility === 'public-read' && !!deck.share_token

  const myProfile = useQuery(profileQuery({ userId: me }))
  const [name, setName] = useState('')
  useEffect(() => {
    setName(myProfile?.display_name ?? '')
  }, [myProfile?.display_name])

  function saveName() {
    const v = name.trim()
    if (v === (myProfile?.display_name ?? '')) return
    mutate.setDisplayName({ id: me, display_name: v, now: Date.now() })
  }

  const shares = useQuery(deckSharesQuery({ deckId: deck.id }))
  const myShare = shares.find((s) => s.user_id === me)

  function togglePublic(on: boolean) {
    mutate.setDeckVisibility({
      id: deck.id,
      visibility: on ? 'public-read' : 'private',
      share_token: on ? deck.share_token || newId() : '',
      now: Date.now(),
    })
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareLink = `${origin}/share/${deck.id}?t=${deck.share_token}`

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--share" onClick={(e) => e.stopPropagation()}>
        <div className="share__head">
          <h3>Share</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Identity — everyone */}
        <section className="share__section">
          <label className="share__label">Your display name</label>
          <input
            className="share__input"
            value={name}
            placeholder="e.g. Ada Lovelace"
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
          <label className="share__label" style={{ marginTop: 12 }}>
            Your Strut ID — others add you by this
          </label>
          <div className="share__row">
            <code className="share__code">{me}</code>
            <CopyButton value={me} label="Copy" />
          </div>
        </section>

        {!isOwner && (
          <section className="share__section">
            <p className="share__note">
              This deck is shared with you as{' '}
              <strong>{myShare?.role ?? 'viewer'}</strong>. Only the owner can
              change sharing.
            </p>
          </section>
        )}

        {isOwner && (
          <>
            {/* Public link */}
            <section className="share__section">
              <label className="share__toggle">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => togglePublic(e.target.checked)}
                />
                <span>
                  <Link2 size={15} /> Anyone with the link can view
                </span>
              </label>
              {isPublic && (
                <div className="share__row" style={{ marginTop: 8 }}>
                  <code className="share__code share__code--link">
                    {shareLink}
                  </code>
                  <CopyButton value={shareLink} label="Copy link" />
                </div>
              )}
            </section>

            {/* Collaborators */}
            <section className="share__section">
              <label className="share__label">Collaborators</label>
              {shares.length === 0 ? (
                <p className="share__empty">No collaborators yet.</p>
              ) : (
                <ul className="share__list">
                  {shares.map((s) => (
                    <CollaboratorRow
                      key={s.id}
                      share={s}
                      onRemove={() => mutate.removeCollaborator({ id: s.id })}
                    />
                  ))}
                </ul>
              )}
              <AddCollaborator
                onAdd={(userId, role) =>
                  mutate.addCollaborator({
                    id: newId(),
                    deckId: deck.id,
                    userId,
                    role,
                    now: Date.now(),
                  })
                }
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function CollaboratorRow({
  share,
  onRemove,
}: {
  share: ShareRow
  onRemove: () => void
}) {
  const profile = useQuery(profileQuery({ userId: share.user_id }))
  const name = profile?.display_name?.trim()
  return (
    <li className="share__collab">
      <div className="share__collab-id">
        <span className="share__collab-name">{name || share.user_id}</span>
        {name && <span className="share__collab-sub">{share.user_id}</span>}
      </div>
      <span className={`share__badge share__badge--${share.role}`}>
        {share.role}
      </span>
      <button
        className="icon-btn icon-btn--danger"
        onClick={onRemove}
        aria-label="Remove collaborator"
        title="Remove"
      >
        <Trash2 size={15} />
      </button>
    </li>
  )
}

function AddCollaborator({
  onAdd,
}: {
  onAdd: (userId: string, role: CollaboratorRole) => void
}) {
  const [id, setId] = useState('')
  const [role, setRole] = useState<CollaboratorRole>('viewer')
  function submit() {
    const v = id.trim()
    if (!v) return
    onAdd(v, role)
    setId('')
    setRole('viewer')
  }
  return (
    <div className="share__add">
      <input
        className="share__input"
        value={id}
        placeholder="Add by Strut ID…"
        onChange={(e) => setId(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <select
        className="share__select"
        value={role}
        onChange={(e) => setRole(e.target.value as CollaboratorRole)}
      >
        <option value="viewer">viewer</option>
        <option value="editor">editor</option>
      </select>
      <button
        className="btn btn--primary"
        disabled={!id.trim()}
        onClick={submit}
      >
        Add
      </button>
    </div>
  )
}
