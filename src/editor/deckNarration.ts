// Feeds the "✨ Chat" advisor a per-turn CHANGELOG of what the author did to the deck since they last
// spoke — so the model can react to edits ("I moved the pricing slide up") without us re-sending a full
// spatial snapshot every turn. Built on @rindle/narrator: we subscribe to the deck's live slide-change
// stream (subscribeChanges), let the narrator resolve each FlatChange → named row and render it via the
// per-op templates below, BUFFER the rendered events between chat turns, and NET-COLLAPSE them at send
// time (aiChat.ts drains via takeDeckChanges). See the design discussion for why a diff beats a snapshot.
//
// Three things the narrator does NOT do that we own here:
//   1. Coalescing. The narrator is per-op (drag → many `sort` edits; type → many `doc` edits). We buffer
//      and collapse by slide id at the turn boundary — keep the last event per slide, cancel an add that
//      was also removed in the window (a transient slide), so N raw ops become one net line.
//   2. Provenance. The narrator (and Rindle's principal) can't tell a USER edit from the assistant's own
//      AI Arrange / AI Generate edits — both write through the same session principal. So the two apply
//      paths call `suppressDeckNarration(deckId)` around their writes (Overview.tsx / SlideWell.tsx): a
//      short window during which we drop change frames, so the model isn't told the user did what IT did.
//   3. Scoped source. `deckDetailQuery` nests slides under a `.one()` deck, which doesn't map to the
//      narrator's ROOT-entity template model. So we drive off an AD-HOC LOCAL query whose root IS the
//      slide (`store.query.slide.where.deck_id`) — local-only (reads already-synced rows, no new server
//      subscription) and ordered by `id` (a STABLE key, so a reorder shows as a `sort` EDIT, not a
//      remove+add move). Phased scope: slide add / remove / reorder / content edit — transforms, z, and
//      components are deferred (their edit template returns null today).

import { createNarrator } from '@rindle/narrator'
import type { NarratorRegistry, SemanticEvent } from '@rindle/narrator'
import type { JSONContent } from '@tiptap/core'
import type { NamedRow } from '@rindle/client'
import { parseDoc } from './tiptapDoc'
import type { StrutStore } from '../rindle/client'

// ---- title extraction (mirrors aiArrange.slideText — slides have no title column) ------------------

const asStr = (v: NamedRow[string] | undefined): string =>
  typeof v === 'string' ? v : ''

// Plain text of a TipTap doc (markdown-mode slides store content as doc JSON) by walking text nodes.
function docText(raw: string): string {
  if (!raw) return ''
  const parts: string[] = []
  const walk = (n: JSONContent) => {
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  walk(parseDoc(raw))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

// A short readable label for a slide row: its doc text (default markdown-mode), else its raw markdown.
function titleOf(row: NamedRow): string {
  const fromDoc = docText(asStr(row.doc))
  if (fromDoc) return fromDoc.slice(0, 80).trim()
  const md = asStr(row.markdown)
  return md
    ? md
        .replace(/[#*_>`~-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)
    : ''
}

const label = (row: NamedRow): string => titleOf(row) || 'untitled'

// ---- the narrator registry -------------------------------------------------------------------------

// Keyed by the query name we pass to narrate() below ('deckSlides'). The templates render one line per
// op; the net-collapse in `collapse()` decides which survive. `edit` distinguishes a content change from
// a pure reorder, and returns null for anything else (transform/z/component edits — deferred scope).
const REGISTRY: NarratorRegistry = {
  deckSlides: {
    salience: 'info',
    root: {
      add: ({ row }) => `Added slide “${label(row)}”`,
      remove: ({ row }) => `Removed slide “${label(row)}”`,
      edit: ({ row, old }) => {
        const contentChanged =
          !!old && (old.doc !== row.doc || old.markdown !== row.markdown)
        if (contentChanged) return `Edited slide “${label(row)}”`
        const sortChanged = !!old && old.sort !== row.sort
        if (sortChanged) return `Moved slide “${label(row)}”`
        return null // transform / component / other column — out of the phased scope
      },
    },
  },
}

const narrator = createNarrator(REGISTRY)

// Render an "added" line directly from a net row — used when a slide was added AND then edited within the
// window: we keep the ADD verb but the FRESHEST title (the last row we saw), which the per-op text can't.
function renderAdd(row: NamedRow): string | null {
  return REGISTRY.deckSlides.root!.add!({ row, sub: () => null, context: {} })
}

// ---- net-collapse ----------------------------------------------------------------------------------

/** Collapse a window of per-op events into one net line per slide, newest-title-wins. Returns a bullet
 *  block ("- Added slide …\n- Edited slide …") or '' when nothing net changed. */
function collapse(events: SemanticEvent[]): string {
  const byId = new Map<
    string,
    { sawAdd: boolean; lastOp: string; last: SemanticEvent }
  >()
  for (const e of events) {
    const raw = e.resolved.row.id
    const id = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
    if (!id) continue
    const cur = byId.get(id)
    if (cur) {
      cur.sawAdd = cur.sawAdd || e.resolved.op === 'add'
      cur.lastOp = e.resolved.op
      cur.last = e
    } else {
      byId.set(id, {
        sawAdd: e.resolved.op === 'add',
        lastOp: e.resolved.op,
        last: e,
      })
    }
  }

  const lines: string[] = []
  for (const { sawAdd, lastOp, last } of byId.values()) {
    if (sawAdd && lastOp === 'remove') continue // added and removed within the window — net no-op
    if (sawAdd) {
      const txt = renderAdd(last.resolved.row) // keep "Added" verb with the latest title
      if (txt) lines.push(txt)
    } else if (last.text) {
      lines.push(last.text)
    }
  }
  return lines.map((l) => `- ${l}`).join('\n')
}

// ---- per-deck instance -----------------------------------------------------------------------------

// Cap the buffer so a long editing session with the panel open but no sends can't grow without bound.
// It's drained every send, so this only bites in pathological cases; oldest events drop first.
const MAX_BUFFERED = 1000

class DeckNarration {
  private buffer: SemanticEvent[] = []
  private suppressedUntil = 0
  private readonly teardown: () => void

  constructor(store: StrutStore, deckId: string) {
    // Ad-hoc LOCAL view rooted at the slide (see header): ordered by a stable key so a reorder is an
    // `edit`, not a remove+add. We consume its change stream, not its rows.
    const view = store.query.slide.where
      .deck_id(deckId)
      .orderBy('id', 'asc')
      .materialize()

    const off = store.subscribeChanges((qid, ev) => {
      if (qid !== view.qid || ev.type !== 'batch') return // ignore hello/snapshot + other queries
      if (Date.now() < this.suppressedUntil) return // an AI apply is in flight — not the user's edit
      const schema = view.schema
      if (!schema) return
      try {
        const events = narrator.narrate('deckSlides', schema, ev.events, 'batch')
        for (const e of events) if (e.text) this.buffer.push(e)
        if (this.buffer.length > MAX_BUFFERED) {
          this.buffer.splice(0, this.buffer.length - MAX_BUFFERED)
        }
      } catch {
        // Narration is best-effort context — a render failure must never break editing.
      }
    })

    this.teardown = () => {
      off()
      view.destroy()
    }
  }

  /** Drop change frames for the next `ms` — used around an AI apply so its edits aren't narrated as the
   *  author's (extends an existing window rather than shortening it). */
  suppress(ms = 2500): void {
    this.suppressedUntil = Math.max(this.suppressedUntil, Date.now() + ms)
  }

  /** The net changelog since the last take, then clear. '' when nothing net changed. */
  take(): string {
    const out = collapse(this.buffer)
    this.buffer = []
    return out
  }

  destroy(): void {
    this.teardown()
  }
}

// ---- module registry (so the always-mounted apply paths can suppress a panel-owned instance) --------

const instances = new Map<string, DeckNarration>()

/** Start (or reuse) narration for a deck. Owned by the chat panel's lifecycle (useChat). */
export function ensureDeckNarration(store: StrutStore, deckId: string): void {
  if (!instances.has(deckId)) {
    instances.set(deckId, new DeckNarration(store, deckId))
  }
}

/** The net changelog for a deck since the last call, then clear. '' if no instance / no changes. */
export function takeDeckChanges(deckId: string): string {
  return instances.get(deckId)?.take() ?? ''
}

/** Suppress narration for a deck briefly — called by AI Arrange / AI Generate around their own writes so
 *  the model isn't told the author made the change the assistant made. No-op if the panel is closed. */
export function suppressDeckNarration(deckId: string, ms?: number): void {
  instances.get(deckId)?.suppress(ms)
}

/** Tear down a deck's narration (chat panel unmount / deck change). */
export function destroyDeckNarration(deckId: string): void {
  const inst = instances.get(deckId)
  if (inst) {
    inst.destroy()
    instances.delete(deckId)
  }
}
