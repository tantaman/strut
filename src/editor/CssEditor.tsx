// Deck CSS editor (spec §8.4). The AI-owned theme and user-authored override are separate tabs/layers;
// both store raw CSS and every render site scopes them to `.strut-surface` via `scopeCss` (see css.ts).

import { Fragment, useState } from 'react'
import { useMutate } from '../rindle/RindleProvider'
import { scopeCss } from './css'

const PLACEHOLDER = `/* Custom CSS — auto-scoped to the slide surface. e.g.

.cmp--text { letter-spacing: .02em; }
.my-class { text-shadow: 0 2px 8px rgba(0,0,0,.4); }   (add "my-class" to a component in the inspector)
*/`

const GENERATED_PLACEHOLDER = `/* Ask the Advisor for a custom theme, or author its replaceable layer here.
   The next AI theme request may replace this entire tab. */`

export function CssEditorModal({
  deckId,
  generatedInitial,
  userInitial,
  onClose,
}: {
  deckId: string
  generatedInitial: string
  userInitial: string
  onClose: () => void
}) {
  const mutate = useMutate()
  const [layer, setLayer] = useState<'generated' | 'user'>(
    generatedInitial ? 'generated' : 'user',
  )
  const [generatedCss, setGeneratedCss] = useState(generatedInitial)
  const [userCss, setUserCss] = useState(userInitial)
  const css = layer === 'generated' ? generatedCss : userCss
  const setCss = layer === 'generated' ? setGeneratedCss : setUserCss

  function save() {
    mutate.setDeckTheme({
      id: deckId,
      generated_stylesheet: generatedCss,
      custom_stylesheet: userCss,
      now: Date.now(),
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <h3>Deck CSS</h3>
        <p className="modal__hint">
          Both layers are scoped to the presentation surface. Custom overrides
          render last and always win over the AI theme.
        </p>
        <div
          className="seg css-editor__tabs"
          role="tablist"
          aria-label="CSS layer"
        >
          <button
            role="tab"
            aria-selected={layer === 'generated'}
            className={layer === 'generated' ? 'is-active' : ''}
            onClick={() => setLayer('generated')}
          >
            AI theme
          </button>
          <button
            role="tab"
            aria-selected={layer === 'user'}
            className={layer === 'user' ? 'is-active' : ''}
            onClick={() => setLayer('user')}
          >
            Custom overrides
          </button>
        </div>
        <textarea
          className="css-editor"
          autoFocus
          spellCheck={false}
          value={css}
          placeholder={
            layer === 'generated' ? GENERATED_PLACEHOLDER : PLACEHOLDER
          }
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

/** Deck cascade: the replaceable AI theme is deliberately first; hand-authored CSS remains the final
 * override layer. Separate style elements also make ownership obvious in browser devtools. */
export function DeckStyles({
  generatedCss,
  userCss,
}: {
  generatedCss: string | null | undefined
  userCss: string | null | undefined
}) {
  return (
    <Fragment>
      <UserStyle css={generatedCss ?? undefined} />
      <UserStyle css={userCss ?? undefined} />
    </Fragment>
  )
}
