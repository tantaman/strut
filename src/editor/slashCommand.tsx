// The `/` command menu — block formatting on demand, Notion-style. Type `/` on an empty-ish spot and a
// filtered menu of block types appears at the caret; ↑/↓ move, ↵/Tab picks, Esc dismisses. This plus the
// markdown input rules StarterKit already ships (`# `, `- `, `> `, ``` ```, `**bold**`) replaces the old
// always-resident format bar: formatting is something you REACH FOR mid-sentence, not chrome you steer.
//
// Deliberately NOT part of `strutExtensions` (tiptapSchema.ts). That array is a data contract shared with
// the SSR static renderer and `aiGenerate`'s `generateJSON`, and is kept React-free/DOM-free; this is
// editor-only chrome that pulls in React and touches `document`. It defines no nodes or marks, so a doc
// authored through this menu is byte-identical to one typed in markdown — nothing here reaches storage.
//
// Each item advertises its markdown shorthand in the right-hand hint column, so the menu doubles as the
// discoverability surface for the hotkeys — you learn `##` by reaching for Heading 2 a few times, then
// stop opening the menu. The menu's job is to make itself unnecessary.

import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from 'lucide-react'
import type { Editor, Range } from '@tiptap/core'
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from '@tiptap/suggestion'

interface SlashItem {
  title: string
  // The markdown shorthand for the same block, shown right-aligned — the menu teaching its own exit.
  hint: string
  icon: typeof Type
  // Extra strings the filter matches on, so `/bullet`, `/ul`, and `/li` all find Bulleted list.
  keywords: string[]
  run: (editor: Editor, range: Range) => void
}

// `deleteRange(range)` first, always: `range` covers the `/` and whatever was typed after it, which is
// query text, not content. Then the block command runs on the now-clean block.
const ITEMS: SlashItem[] = [
  {
    title: 'Text',
    hint: '',
    icon: Type,
    keywords: ['paragraph', 'plain', 'body'],
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
  },
  {
    title: 'Heading 1',
    hint: '#',
    icon: Heading1,
    keywords: ['title', 'h1', 'big'],
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    hint: '##',
    icon: Heading2,
    keywords: ['subtitle', 'h2'],
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    hint: '###',
    icon: Heading3,
    keywords: ['h3', 'small'],
    run: (e, r) =>
      e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bulleted list',
    hint: '-',
    icon: List,
    keywords: ['bullet', 'unordered', 'ul', 'li', 'point'],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    hint: '1.',
    icon: ListOrdered,
    keywords: ['ordered', 'ol', 'number'],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    hint: '>',
    icon: Quote,
    keywords: ['blockquote', 'cite', 'pull'],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    hint: '```',
    icon: Code2,
    keywords: ['code', 'pre', 'snippet', 'mono'],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    hint: '---',
    icon: Minus,
    keywords: ['hr', 'rule', 'separator', 'line', 'break'],
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
]

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return ITEMS
  // Title-prefix hits rank above keyword hits, so `/c` offers Code block before it offers anything that
  // merely lists "code" as a keyword.
  const prefix = ITEMS.filter((i) => i.title.toLowerCase().startsWith(q))
  const rest = ITEMS.filter(
    (i) =>
      !prefix.includes(i) &&
      (i.title.toLowerCase().includes(q) ||
        i.keywords.some((k) => k.startsWith(q))),
  )
  return [...prefix, ...rest]
}

interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const SlashMenu = forwardRef<SlashMenuRef, SuggestionProps<SlashItem>>(
  function SlashMenu(props, ref) {
    const [sel, setSel] = useState(0)
    // A narrowing query re-ranks the list under a selection index that meant something else; reset so
    // ↵ always takes what's highlighted now.
    useEffect(() => setSel(0), [props.items])

    const pick = (i: number) => {
      if (i < 0 || i >= props.items.length) return
      props.command(props.items[i])
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        // Escape: the plugin tears the menu down itself and stops here, but ProseMirror only
        // preventDefaults a handled key — it still bubbles. Stage listens for a bare Escape on window,
        // so swallow it: Escape with the menu open means "close the menu", nothing more.
        if (event.key === 'Escape') {
          event.stopPropagation()
          return false
        }
        const n = props.items.length
        if (!n) return false
        if (event.key === 'ArrowUp') {
          setSel((s) => (s + n - 1) % n)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSel((s) => (s + 1) % n)
          return true
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          pick(sel)
          return true
        }
        return false
      },
    }))

    // No hits: render nothing, but stay mounted — the next keystroke may be a backspace back into a
    // match, and the plugin owns the teardown.
    if (!props.items.length) return null

    return (
      <div className="popover popover--menu slash-menu">
        {props.items.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              type="button"
              className={
                'menu-item menu-item--icon' + (i === sel ? ' is-active' : '')
              }
              // Commit on mousedown, before the editor can blur: blur commits the edit session and tears
              // the suggestion down, so a click handler would fire against an already-dead range.
              onMouseDown={(e) => {
                e.preventDefault()
                pick(i)
              }}
              onMouseEnter={() => setSel(i)}
            >
              <Icon size={15} />
              {item.title}
              {item.hint && (
                <span className="menu-item__hint">{item.hint}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  },
)

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem>({
        editor: this.editor,
        char: '/',
        // Suggestion's default `allowedPrefixes: [' ']` already means a `/` mid-word never triggers, so
        // typing a URL or a fraction stays inert; this only adds: never inside code, where `/` is code.
        allow: ({ state, range }) =>
          !state.doc.resolve(range.from).parent.type.spec.code,
        items: ({ query }) => filterItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuRef, SuggestionProps<SlashItem>>
          let unmount: (() => void) | undefined

          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              })
              // Managed mount: the plugin portals the element to <body>, anchors it to the caret, flips
              // it above the line when the bottom is tight, and dismisses on an outside click. Body-level
              // means the Stage's fit-to-slide `scale()` never reaches the menu — it stays crisp at any
              // zoom, unlike the counter-scaled bar it replaces. `animationFrame` because BOTH surfaces
              // move the anchor under a transform the observers can't see: Stage scales the canvas, Doc
              // mode scales its cards and FLIP-animates them.
              unmount = props.mount(renderer.element as HTMLElement, {
                autoUpdate: { animationFrame: true },
              })
            },
            onUpdate: (props) => renderer.updateProps(props),
            onKeyDown: (props) => renderer.ref?.onKeyDown(props) ?? false,
            onExit: () => {
              unmount?.()
              unmount = undefined
              renderer.destroy()
            },
          }
        },
      }),
    ]
  },
})
