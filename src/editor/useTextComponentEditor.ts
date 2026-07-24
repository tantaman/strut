// The single rich-text write model for a spatial text component. Doc-first and precision both mount
// this hook, but never at the same time: entering precision suspends the card editor first. Keystrokes
// stream through the folded component mutation while the first dirty update records one mutable undo
// command; blur/unmount seals that session with an authoritative plain write.

import { useEffect, useRef } from 'react'
import { useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { useMutate } from '../rindle/RindleProvider'
import { useHistory } from './UndoProvider'
import { strutExtensions } from './tiptapSchema'
import { SlashCommand } from './slashCommand'
import { parseDoc } from './tiptapDoc'
import type { AnyComponent } from './types'

export interface TextComponentEditorOptions {
  onFocus?: () => void
  onBlur?: () => void
  autoFocus?: boolean
}

/** Replace the whole document without creating a TipTap-native undo event. `emitUpdate:false` keeps
 *  the replacement out of our streamed write/session callbacks; `addToHistory:false` is separate and
 *  keeps Cmd/Ctrl+Z inside the contenteditable from undoing a global-history or remote replay. */
function replaceEditorContent(editor: Editor, content: string): void {
  editor
    .chain()
    .setContent(parseDoc(content), { emitUpdate: false })
    .setMeta('addToHistory', false)
    .run()
}

export function useTextComponentEditor(
  component: AnyComponent,
  options?: TextComponentEditorOptions,
): Editor | null {
  const mutate = useMutate()
  const history = useHistory()
  const optionsRef = useRef(options)
  optionsRef.current = options
  const liveEditorRef = useRef<Editor | null>(null)
  const external = JSON.stringify(parseDoc(component.doc))
  // Unlike the sync effect below, this ref advances during render. A remote fragment update can land
  // while TipTap owns focus and the effect must defer it; blur can still read the newest rendered value
  // even though that effect's dependency will not change a second time merely because focus ended.
  const latestExternalRef = useRef(external)
  latestExternalRef.current = external
  const baselineRef = useRef(external)
  const sessionActiveRef = useRef(false)
  const blurNotifiedRef = useRef(false)
  const sessionRef = useRef<null | {
    before: string
    after: string
    externalAtStart: string
    recorded: boolean
    dirty: boolean
  }>(null)

  const write = (content: string) =>
    mutate.setTextContent({ id: component.id, content })

  const stream = (content: string) =>
    mutate.setTextContent.folded(
      { key: component.id },
      { id: component.id, content },
    )

  // History can replay while this card/precision editor is still mounted. Rindle remains the persisted
  // source of truth, but waiting for its fragment echo leaves TipTap visibly stale in the meantime (and
  // the editor deliberately ignores external content while a session is active). Converge both targets
  // synchronously; `emitUpdate:false` prevents the replay from opening a new typing session.
  const applyHistory = (content: string) => {
    const normalized = JSON.stringify(parseDoc(content))
    baselineRef.current = normalized
    sessionRef.current = null
    sessionActiveRef.current = false
    const instance = liveEditorRef.current
    if (instance && JSON.stringify(instance.getJSON()) !== normalized) {
      replaceEditorContent(instance, normalized)
    }
    write(normalized)
  }

  const beginSession = () => {
    sessionActiveRef.current = true
    if (!sessionRef.current) {
      sessionRef.current = {
        before: baselineRef.current,
        after: baselineRef.current,
        externalAtStart: latestExternalRef.current,
        recorded: false,
        dirty: false,
      }
    }
    return sessionRef.current
  }

  // Record on the FIRST dirty update, not at blur. Besides making Undo available while the caret is
  // still active, this prevents the optimistic component echo from rebasing `baselineRef` before a
  // browser-specific/missed focus event can establish the session. The command deliberately closes
  // over the mutable session: later keystrokes extend its redo value without adding more stack entries.
  const recordSession = (session: NonNullable<typeof sessionRef.current>) => {
    if (session.recorded || session.after === session.before) return
    session.recorded = true
    history.push({
      label: 'Edit text',
      redo: () => applyHistory(session.after),
      undo: () => applyHistory(session.before),
    })
  }

  const finishSession = (editor: Editor) => {
    const after = JSON.stringify(editor.getJSON())
    const session = sessionRef.current ?? beginSession()
    session.after = after

    // A clean focused editor yielded temporarily to local caret/selection state, but authored nothing.
    // If an external document arrived meanwhile, accept it now instead of leaving the mounted TipTap
    // instance stale forever. Once ANY local transaction occurred, local content wins this close — even
    // if native undo brought it back to the baseline — so a delayed optimistic echo can never resurrect
    // text the user intentionally removed. Compare with the prop at session start (not the local
    // baseline): the fragment can still be echoing the preceding session when focus returns quickly.
    const latestExternal = latestExternalRef.current
    if (!session.dirty && latestExternal !== session.externalAtStart) {
      if (after !== latestExternal) replaceEditorContent(editor, latestExternal)
      baselineRef.current = latestExternal
      sessionRef.current = null
      return
    }

    recordSession(session)
    if (after !== session.before) write(after)
    baselineRef.current = after
    sessionRef.current = null
  }

  const editor = useEditor({
    extensions: [...strutExtensions, SlashCommand],
    content: parseDoc(component.doc),
    immediatelyRender: false,
    autofocus: options?.autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: 'strut-md', spellcheck: 'false' },
    },
    onCreate: ({ editor: instance }) => {
      liveEditorRef.current = instance
    },
    onUpdate: ({ editor: instance }) => {
      const content = JSON.stringify(instance.getJSON())
      const session = beginSession()
      session.dirty = true
      session.after = content
      stream(content)
      recordSession(session)
    },
    onFocus: () => {
      beginSession()
      blurNotifiedRef.current = false
      optionsRef.current?.onFocus?.()
    },
    onBlur: ({ editor: instance }) => {
      finishSession(instance)
      sessionActiveRef.current = false
      if (!blurNotifiedRef.current) optionsRef.current?.onBlur?.()
      blurNotifiedRef.current = true
    },
    onDestroy: () => {
      const instance = liveEditorRef.current
      if (instance) finishSession(instance)
      sessionActiveRef.current = false
      liveEditorRef.current = null
      if (!blurNotifiedRef.current) optionsRef.current?.onBlur?.()
      blurNotifiedRef.current = true
    },
  })

  // AI, undo, or another collaborator may replace this component while its card stays mounted. Never
  // interrupt an active local typing session; otherwise make the shared editor converge immediately.
  useEffect(() => {
    if (!editor || sessionActiveRef.current) return
    const current = JSON.stringify(editor.getJSON())
    if (current === external) return
    baselineRef.current = external
    replaceEditorContent(editor, external)
  }, [component.doc, editor, external])

  return editor
}
