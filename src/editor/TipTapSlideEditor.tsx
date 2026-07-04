// WYSIWYG markdown-mode editing, directly on the slide (replaces the old split textarea-below-preview).
// A TipTap editor is mounted INTO the same `.strut-md` scope the read-only surface uses, at the same
// fit-to-slide scale, so what you edit is literally what renders. The stored `doc` (TipTap JSON) is the
// source of truth; the editor streams it via Rindle's `.folded` (debounced, last-value-wins) on every
// keystroke for live sync, and commits ONE undo step per edit session on blur — mirroring how the
// textarea behaved. Per-slide alignment (`text_align`) stays a slide-level override (it aligns the whole
// surface via `--strut-text-align`), driven by the chips on the format bar — distinct from per-block
// alignment, which we don't do here.

import { useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react'
import { SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { useFitScale } from './useFitScale'
import { strutExtensions } from './tiptapSchema'
import { parseDoc } from './tiptapDoc'
import { themeVars } from './render'
import {
  backgroundImage,
  composeBackground,
  resolveBackground,
  resolveTextAlign,
} from './types'
import type { DeckThemeFields, TextAlign } from './types'
import type { SlideDetail } from './deckDetail'

type MdDeck = (DeckThemeFields & { background?: string | null }) | null

export function TipTapSlideEditor({
  slide,
  deck,
}: {
  slide: SlideDetail
  deck: MdDeck
}) {
  const mutate = useMutate()
  const history = useHistory()
  const previewRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(previewRef, SLIDE_W, SLIDE_H)
  // The doc JSON at the start of this edit session — one coarse undo step is pushed on blur (the
  // per-keystroke stream is a live-preview write, not an undo boundary). Keyed by slide id at the call
  // site so the editor remounts per slide and this baseline reseeds.
  const baselineRef = useRef(slide.doc)

  const editor = useEditor({
    extensions: strutExtensions,
    content: parseDoc(slide.doc),
    // The editable element IS the `.strut-md` surface, so it inherits the exact theme/typography the
    // renderer uses. `immediatelyRender: false` keeps it SSR-safe (no DOM at first render).
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'strut-md', spellcheck: 'false' },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON())
      mutate.setSlideDoc.folded(
        { key: slide.id },
        { id: slide.id, doc: json, now: Date.now() },
      )
    },
    onBlur: () => commit(),
  })

  // Commit the edit session as one undoable step (undo/redo swap the whole doc).
  function commit() {
    if (!editor) return
    const after = JSON.stringify(editor.getJSON())
    const before = baselineRef.current
    if (after === before) return
    baselineRef.current = after
    const apply = (doc: string) =>
      mutate.setSlideDoc({ id: slide.id, doc, now: Date.now() })
    apply(after)
    history.push({
      label: 'Edit slide',
      redo: () => apply(after),
      undo: () => apply(before),
    })
  }

  const align = resolveTextAlign(slide.text_align, deck?.text_align)
  function setAlign(next: TextAlign) {
    mutate.setSlideTheme({ id: slide.id, text_align: next, now: Date.now() })
  }

  const background = composeBackground(
    resolveBackground(slide.background, deck?.background ?? undefined),
    backgroundImage(slide.background, deck?.background ?? undefined),
  )

  return (
    <>
      <FormatBar editor={editor} align={align} onAlign={setAlign} />
      <div className="md-preview" ref={previewRef}>
        <div
          className="slide-surface"
          style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}
        >
          <div
            className="slide-canvas strut-surface"
            style={{
              width: SLIDE_W,
              height: SLIDE_H,
              transform: `scale(${scale})`,
              background,
              ...themeVars(deck, slide),
            }}
          >
            <EditorContent editor={editor} className="strut-md-host" />
          </div>
        </div>
      </div>
    </>
  )
}

// The floating format toolbar. Marks/blocks are driven through the editor's command chain; the three
// alignment chips write the per-slide `text_align` override (not a TipTap command). Re-renders with the
// editor on every transaction, so the active-state highlights track the selection.
function FormatBar({
  editor,
  align,
  onAlign,
}: {
  editor: Editor | null
  align: TextAlign
  onAlign: (a: TextAlign) => void
}) {
  if (!editor) return null

  const marks: Array<{
    icon: typeof Bold
    title: string
    active: boolean
    run: () => void
  }> = [
    {
      icon: Bold,
      title: 'Bold (⌘B)',
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      title: 'Italic (⌘I)',
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      title: 'Strikethrough',
      active: editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      title: 'Inline code',
      active: editor.isActive('code'),
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: Heading1,
      title: 'Heading 1',
      active: editor.isActive('heading', { level: 1 }),
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      title: 'Heading 2',
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      title: 'Bullet list',
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      title: 'Numbered list',
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      title: 'Quote',
      active: editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ]

  const aligns: Array<{ value: TextAlign; icon: typeof Bold; title: string }> = [
    { value: 'left', icon: AlignLeft, title: 'Align left' },
    { value: 'center', icon: AlignCenter, title: 'Align center' },
    { value: 'right', icon: AlignRight, title: 'Align right' },
  ]

  return (
    <div
      className="md-format-bar"
      // Keep the editor selection alive when a button is pressed (a click would otherwise blur the
      // editor and commit the edit before the command runs).
      onMouseDown={(e) => e.preventDefault()}
    >
      {marks.map(({ icon: Icon, title, active, run }) => (
        <button
          key={title}
          className={'md-format-bar__btn' + (active ? ' is-active' : '')}
          title={title}
          onClick={run}
          type="button"
        >
          <Icon size={16} />
        </button>
      ))}
      <span className="md-format-bar__sep" />
      {aligns.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          className={'md-format-bar__btn' + (align === value ? ' is-active' : '')}
          title={title}
          onClick={() => onAlign(value)}
          type="button"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
