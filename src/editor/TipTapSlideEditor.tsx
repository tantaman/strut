// WYSIWYG markdown-mode editing, directly on the slide (replaces the old split textarea-below-preview).
// A TipTap editor is mounted INTO the same `.strut-md` scope the read-only surface uses, at the same
// fit-to-slide scale, so what you edit is literally what renders. The stored `doc` (TipTap JSON) is the
// source of truth; the write model lives in `useSlideDocEditor` (shared with Doc mode) — it streams via
// Rindle's `.folded` on every keystroke and commits ONE undo step per edit session on blur. Formatting
// is per-selection, like a document: the format bar drives real TipTap commands — marks/blocks,
// per-block alignment (TextAlign), and font-family/color on the `textStyle` mark — all stored inline in
// the doc. The deck theme still supplies the defaults these override.
//
// This is the STAGE's editor: one slide, fit to the viewport, owning its own format bar. Doc mode
// composes the same pieces differently (N scaled cards, one hoisted bar) — see DocView.

import { useEffect, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { EditorContent } from '@tiptap/react'
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
  SquareCode,
  Strikethrough,
} from 'lucide-react'
import { FONT_FAMILIES, SLIDE_H, SLIDE_W } from '../config'
import { useFitScale } from './useFitScale'
import { useSlideDocEditor } from './useSlideDocEditor'
import {
  BackgroundImageLayer,
  cssFontFamily,
  FontOptions,
  themeVars,
} from './render'
import { ColorField } from './ColorField'
import { resolveBackground, resolveBackgroundImage } from './types'
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
  const previewRef = useRef<HTMLDivElement>(null)
  const scale = useFitScale(previewRef, SLIDE_W, SLIDE_H)
  // Keyed by slide id at the call site so the editor remounts per slide and its baseline reseeds.
  const editor = useSlideDocEditor(slide)

  const background = resolveBackground(
    slide.background,
    deck?.background ?? undefined,
  )
  const bgImage = resolveBackgroundImage(
    slide.background,
    deck?.background ?? undefined,
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
            <BackgroundImageLayer image={bgImage} />
            <EditorContent editor={editor} className="strut-md-host" />
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// The floating format toolbar. Everything is a TipTap command on the current selection — marks/blocks,
// per-block alignment, and font-family/color (via the shared font select + ColorField).
//
// It subscribes to its editor's transactions itself rather than riding the parent's re-render, so the
// active-state highlights track the selection even when the bar is mounted AWAY from the editor it
// drives — which is exactly Doc mode, where one hoisted bar serves whichever of N cards has focus.
export function FormatBar({
  editor,
  deck,
}: {
  editor: Editor | null
  deck: MdDeck
}) {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!editor) return
    editor.on('transaction', bump)
    return () => {
      editor.off('transaction', bump)
    }
  }, [editor])

  // A card can unmount (scrolled out of Doc mode's window) while still the bar's editor; commands on a
  // destroyed editor throw, so drop the bar instead.
  if (!editor || editor.isDestroyed) return null

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
      icon: SquareCode,
      title: 'Code block',
      active: editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
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
        <FontOptions />
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
