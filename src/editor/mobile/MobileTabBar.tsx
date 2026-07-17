// The mobile bottom tab bar (touch-first editor, phones ≤768px): the primary navigation that the
// desktop header can't fit under a thumb. It owns the editor modes (Slides / Doc / Overview /
// Research), the AI Advisor toggle, and Present — the same actions the header exposes on desktop, which
// the mobile stylesheet hides there (.hdr__mode / .hdr__chat / .hdr__present) so this bar is their
// single home.
//
// Rendered on every viewport but `display:none` above the mobile breakpoint (see strut.css), so there's
// no JS width branch — the layout is correct from first paint on both desktop and mobile (no hydration
// flash). The bar sits as the last flex child of `.editor`, so `position:fixed` sheets (Inspector, Chat)
// anchor just above it via `--m-tabbar-h`.

import { useNavigate } from '@tanstack/react-router'
import {
  FileText,
  Film,
  LayoutGrid,
  NotebookPen,
  Play,
  Sparkles,
} from 'lucide-react'
import { useEditor } from '../EditorState'

export function MobileTabBar({
  deck,
  chatOpen,
  onToggleChat,
}: {
  deck: { id: string } | null
  chatOpen: boolean
  onToggleChat: () => void
}) {
  const editor = useEditor()
  const navigate = useNavigate()

  return (
    <nav className="m-tabbar" aria-label="Editor">
      <button
        className={'m-tab' + (editor.mode === 'slide' ? ' is-active' : '')}
        onClick={() => editor.setMode('slide')}
        aria-pressed={editor.mode === 'slide'}
      >
        <span className="m-tab__ic">
          <Film size={20} />
        </span>
        <span className="m-tab__lbl">Slides</span>
      </button>

      <button
        className={'m-tab' + (editor.mode === 'doc' ? ' is-active' : '')}
        onClick={() => editor.setMode('doc')}
        aria-pressed={editor.mode === 'doc'}
      >
        <span className="m-tab__ic">
          <FileText size={20} />
        </span>
        <span className="m-tab__lbl">Doc</span>
      </button>

      <button
        className={'m-tab' + (editor.mode === 'overview' ? ' is-active' : '')}
        onClick={() => editor.setMode('overview')}
        aria-pressed={editor.mode === 'overview'}
      >
        <span className="m-tab__ic">
          <LayoutGrid size={20} />
        </span>
        <span className="m-tab__lbl">Overview</span>
      </button>

      <button
        className={'m-tab' + (editor.mode === 'research' ? ' is-active' : '')}
        onClick={() => editor.setMode('research')}
        aria-pressed={editor.mode === 'research'}
      >
        <span className="m-tab__ic">
          <NotebookPen size={20} />
        </span>
        <span className="m-tab__lbl">Research</span>
      </button>

      <button
        className={'m-tab' + (chatOpen ? ' is-active' : '')}
        onClick={onToggleChat}
        aria-pressed={chatOpen}
      >
        <span className="m-tab__ic">
          <Sparkles size={20} />
        </span>
        <span className="m-tab__lbl">Advisor</span>
      </button>

      <button
        className="m-tab m-tab--present"
        disabled={!deck}
        onClick={() =>
          deck &&
          navigate({
            to: '/deck/$deckId/play',
            params: { deckId: deck.id },
            // Carry the current view + slide so Esc drops back into exactly this spot (mirrors Header).
            search: {
              view: editor.mode,
              slide: editor.activeSlideId ?? undefined,
            },
          })
        }
      >
        <span className="m-tab__ic">
          <Play size={19} />
        </span>
        <span className="m-tab__lbl">Present</span>
      </button>
    </nav>
  )
}
