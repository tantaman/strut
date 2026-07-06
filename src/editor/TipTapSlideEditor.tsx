// WYSIWYG markdown-mode editing, directly on the slide (replaces the old split textarea-below-preview).
// A TipTap editor is mounted INTO the same `.strut-md` scope the read-only surface uses, at the same
// fit-to-slide scale, so what you edit is literally what renders. The stored `doc` (TipTap JSON) is the
// source of truth; the editor streams it via Rindle's `.folded` (debounced, last-value-wins) on every
// keystroke for live sync, and commits ONE undo step per edit session on blur — mirroring how the
// textarea behaved. Formatting is per-selection, like a document: the format bar drives real TipTap
// commands — marks/blocks, per-block alignment (TextAlign), and font-family/color on the `textStyle`
// mark — all stored inline in the doc. The deck theme still supplies the defaults these override.

import { useRef } from 'react'
import type { ReactNode } from 'react'
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
import { FONT_FAMILIES, SLIDE_H, SLIDE_W } from '../config'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { useFitScale } from './useFitScale'
import { strutExtensions } from './tiptapSchema'
import { parseDoc } from './tiptapDoc'
import { cssFontFamily, themeVars } from './render'
import { ColorField } from './ColorField'
import { backgroundImage, composeBackground, resolveBackground } from './types'
import type { DeckThemeFields } from './types'
import type { SlideDetail } from './deckDetail'

type MdDeck = (DeckThemeFields & { background?: string | null }) | null

export function TipTapSlideEditor({
  slide,
  deck,
  children,
}: {
  slide: SlideDetail
  deck: MdDeck
  // The locked Objects overlay (LockedObjects) — the slide's positioned components, shown on top of
  // the editable body but inert, so what you see while editing the body matches what renders.
  children?: ReactNode
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

  const background = composeBackground(
    resolveBackground(slide.background, deck?.background ?? undefined),
    backgroundImage(slide.background, deck?.background ?? undefined),
  )

  return (
    <>
      <FormatBar editor={editor} deck={deck} />
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
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// The floating format toolbar. Everything is a TipTap command on the current selection — marks/blocks,
// per-block alignment, and font-family/color (via the shared font select + ColorField). Re-renders with
// the editor on every transaction, so the active-state highlights track the selection.
function FormatBar({ editor, deck }: { editor: Editor | null; deck: MdDeck }) {
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

  // Per-block alignment via the TextAlign extension (was a slide-wide override). An unaligned block
  // reports no active alignment, so no chip highlights until you set one — and it keeps inheriting the
  // deck's `--strut-text-align` default.
  const aligns: Array<{ value: string; icon: typeof Bold; title: string }> = [
    { value: 'left', icon: AlignLeft, title: 'Align left' },
    { value: 'center', icon: AlignCenter, title: 'Align center' },
    { value: 'right', icon: AlignRight, title: 'Align right' },
  ]

  // Selection-level font + color, stored on the `textStyle` mark. Empty = inherit the deck theme.
  const activeFont = editor.getAttributes('textStyle').fontFamily as
    | string
    | undefined
  const currentFontName =
    FONT_FAMILIES.find((f) => cssFontFamily(f) === activeFont) ?? ''
  const currentColor = (
    (editor.getAttributes('textStyle').color as string | undefined) ?? ''
  ).replace(/^#/, '')

  return (
    <div
      className="md-format-bar"
      // Keep the editor selection alive when a button is pressed (a click would otherwise blur the
      // editor and commit the edit before the command runs). The font <select> and the color picker's
      // native OS input opt out of this (they need real focus) via their own stopPropagation.
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
      <select
        className="md-format-bar__font"
        title="Font"
        value={currentFontName}
        // Let the native select open despite the bar's preventDefault; the ProseMirror selection
        // survives the blur and chain().focus() restores it before the font is applied.
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const name = e.target.value
          if (name)
            editor.chain().focus().setFontFamily(cssFontFamily(name)).run()
          else editor.chain().focus().unsetFontFamily().run()
        }}
      >
        <option value="">Theme font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f} value={f} style={{ fontFamily: cssFontFamily(f) }}>
            {f}
          </option>
        ))}
      </select>
      <ColorField
        value={currentColor}
        themeDefault={{
          color: deck?.body_color ?? '',
          title: 'Theme text color',
        }}
        onChange={(hex) => {
          if (hex)
            editor
              .chain()
              .focus()
              .setColor('#' + hex)
              .run()
          else editor.chain().focus().unsetColor().run()
        }}
      />
      <span className="md-format-bar__sep" />
      {aligns.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          className={
            'md-format-bar__btn' +
            (editor.isActive({ textAlign: value }) ? ' is-active' : '')
          }
          title={title}
          onClick={() => editor.chain().focus().setTextAlign(value).run()}
          type="button"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
