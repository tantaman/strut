// Inline rich-text toolbar (spec §6.3 — the old "Etch" toolbar). Floats above a TextBox while it's
// being edited (contentEditable). Uses the legacy `document.execCommand` family with `styleWithCSS`
// OFF so formatting serializes as `<b>/<i>/<font>` tags — exactly what the renderer expects (it dumps
// `text` via dangerouslySetInnerHTML). Buttons preventDefault on mousedown so the editor keeps its
// selection (a click would otherwise blur the box and commit the edit).

import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Link2,
  Eraser,
} from 'lucide-react'

// execCommand is deprecated-but-universally-supported and is the only practical way to mutate a
// contentEditable selection with legacy tags. Centralized here so the deprecation is contained.
function exec(cmd: string, value?: string) {
  try {
    document.execCommand(cmd, false, value)
  } catch {
    /* no-op: some browsers throw on unsupported commands */
  }
}

function addLink() {
  const url = prompt('Link URL')
  if (!url) return
  const href = /^(https?:|mailto:|#|\/)/i.test(url) ? url : `http://${url}`
  exec('createLink', href)
}

const BTN: Array<{ icon: typeof Bold; title: string; run: () => void }> = [
  { icon: Bold, title: 'Bold (⌘B)', run: () => exec('bold') },
  { icon: Italic, title: 'Italic (⌘I)', run: () => exec('italic') },
  { icon: List, title: 'Bullet list', run: () => exec('insertUnorderedList') },
  {
    icon: ListOrdered,
    title: 'Numbered list',
    run: () => exec('insertOrderedList'),
  },
  { icon: AlignLeft, title: 'Align left', run: () => exec('justifyLeft') },
  {
    icon: AlignCenter,
    title: 'Align center',
    run: () => exec('justifyCenter'),
  },
  { icon: Link2, title: 'Link', run: addLink },
  { icon: Eraser, title: 'Clear formatting', run: () => exec('removeFormat') },
]

export function RichTextToolbar({ scale }: { scale: number }) {
  return (
    <div
      className="rtt"
      // Counter-scale so the toolbar stays readable regardless of the stage fit-zoom.
      style={{
        transform: `translate(-50%, -10px) scale(${1 / scale})`,
        transformOrigin: 'bottom center',
      }}
      // Keep the contentEditable selection alive when a button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {BTN.map(({ icon: Icon, title, run }) => (
        <button
          key={title}
          className="rtt__btn"
          title={title}
          onClick={run}
          type="button"
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}
