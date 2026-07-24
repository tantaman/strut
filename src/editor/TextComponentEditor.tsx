// The shared TipTap surface for a text component. Its editable element carries the same `.strut-md`
// scope as static render/Present/export, so switching between doc-first and precision changes only the
// interaction chrome, never the authored document or typography.

import { EditorContent } from '@tiptap/react'
import { useTextComponentEditor } from './useTextComponentEditor'
import type { TextComponentEditorOptions } from './useTextComponentEditor'
import type { AnyComponent } from './types'

export function TextComponentEditor({
  component,
  primary = false,
  autoFocus = false,
  isolatePointer = true,
  className = '',
  onFocus,
  onBlur,
}: {
  component: AnyComponent
  primary?: boolean
  autoFocus?: boolean
  /** Precision owns drag/select gestures on the component wrapper, so its writer isolates pointer
   *  events. Doc-first has no competing spatial gesture and leaves the native contenteditable hit path
   *  untouched — coordinate-level clicks can place the caret directly. */
  isolatePointer?: boolean
  className?: string
  onFocus?: TextComponentEditorOptions['onFocus']
  onBlur?: TextComponentEditorOptions['onBlur']
}) {
  const editor = useTextComponentEditor(component, {
    onFocus,
    onBlur,
    autoFocus,
  })

  return (
    <div
      className={`text-component-editor${primary ? ' is-primary' : ''}${className ? ` ${className}` : ''}`}
      onPointerDown={
        isolatePointer ? (event) => event.stopPropagation() : undefined
      }
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        // TipTap's blur command schedules the DOM blur. Blur synchronously as well so Escape always
        // seals the typing session before an outer editor shortcut can react to the same keypress.
        editor?.view.dom.blur()
        editor?.commands.blur()
      }}
    >
      <EditorContent editor={editor} className="text-component-editor__host" />
      {editor?.isEmpty && (
        <div className="strut-md strut-md__placeholder" aria-hidden="true">
          Start writing…
        </div>
      )}
    </div>
  )
}
