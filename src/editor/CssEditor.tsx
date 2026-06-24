// Deck custom-CSS editor (spec §8.4). A modal textarea over `deck.custom_stylesheet`. On save it
// writes the raw CSS to the deck (un-scoped); every render site scopes it to `.strut-surface` via
// `scopeCss` (see css.ts). `UserStyle` is the live `<style>` element used by the editor preview and
// present mode. (A full CodeMirror editor is the spec's ideal; a monospace textarea is the MVP.)

import { useState } from 'react'
import { useMutate } from '../rindle/RindleProvider'
import { scopeCss } from './css'

const PLACEHOLDER = `/* Custom CSS — auto-scoped to the slide surface. e.g.

.cmp--text { letter-spacing: .02em; }
.my-class { text-shadow: 0 2px 8px rgba(0,0,0,.4); }   (add "my-class" to a component in the inspector)
*/`

export function CssEditorModal({
  deckId,
  initial,
  onClose,
}: {
  deckId: string
  initial: string
  onClose: () => void
}) {
  const mutate = useMutate()
  const [css, setCss] = useState(initial)

  function save() {
    mutate.setDeckTheme({ id: deckId, custom_stylesheet: css, now: Date.now() })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Custom CSS</h3>
        <p className="modal__hint">
          Scoped to the presentation surface — your selectors can target
          components and custom classes, but won’t leak into the editor.
        </p>
        <textarea
          className="css-editor"
          autoFocus
          spellCheck={false}
          value={css}
          placeholder={PLACEHOLDER}
          onChange={(e) => setCss(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
            // Tab inserts a tab instead of moving focus.
            if (e.key === 'Tab') {
              e.preventDefault()
              const el = e.currentTarget
              const { selectionStart: s, selectionEnd: en } = el
              const next = css.slice(0, s) + '  ' + css.slice(en)
              setCss(next)
              requestAnimationFrame(
                () => (el.selectionStart = el.selectionEnd = s + 2),
              )
            }
          }}
        />
        <div className="modal__row">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save}>
            Save (⌘↵)
          </button>
        </div>
      </div>
    </div>
  )
}

/** Live `<style>` for the deck's custom CSS, scoped to `.strut-surface`. */
export function UserStyle({ css }: { css: string | undefined }) {
  const scoped = scopeCss(css ?? '')
  if (!scoped) return null
  return <style dangerouslySetInnerHTML={{ __html: scoped }} />
}
