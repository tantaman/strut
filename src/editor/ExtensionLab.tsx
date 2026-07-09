// Extension Lab — a DEV-ONLY harness for issue #438. It closes the loop the headless tests can't: type
// AssemblyScript, click Run, and watch a real component appear on the active slide and persist through
// Rindle (reload and it's still there). It is the visible end-to-end proof of Phases A–C.
//
// It wires the sandbox to the LIVE app: the compiled module's single capability (`strut.addText`) is
// bound to the editor's real `mutate` and active slide, so running an extension is indistinguishable
// from the toolbar's Add Text — same mutator, same sync, same persistence. Never mounted in production
// (see ExtensionLabMount).

import { useState } from 'react'
import { useEditor } from './EditorState'
import { useMutate } from '../rindle/RindleProvider'
import { zNow } from './componentOps'
import { compileAssemblyScript } from './asCompile'
import { runTextExtension } from './extensionHost'

// A starter extension. `render()` runs on Run; `strut.addText` is the one capability the host grants
// (extensionHost.ts). Doubles as inline docs for the tiny surface an extension sees today.
const STARTER = `// A trivial extension. render() runs when you click Run.
// strut.addText is the only capability granted (see extensionHost.ts).
@external("strut", "addText")
declare function addText(text: string, x: f64, y: f64): void

export function render(): void {
  addText("Hello from a WASM extension", 440, 280)
  addText("second box, stacked above", 520, 380)
}
`

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; note: string }
  | { kind: 'ok'; note: string }
  | { kind: 'error'; note: string }

export default function ExtensionLab() {
  const editor = useEditor()
  const mutate = useMutate()
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState(STARTER)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const slideId = editor.activeSlideId
  const canRun = editor.canEdit && !!slideId && status.kind !== 'busy'

  async function run() {
    if (!slideId) {
      setStatus({ kind: 'error', note: 'No active slide — open a slide first.' })
      return
    }
    try {
      setStatus({ kind: 'busy', note: 'Compiling…' })
      // exportRuntime → the loader can read strings back out of WASM memory (extensionHost).
      const compiled = await compileAssemblyScript(source, {
        exportRuntime: true,
      })
      if (!compiled.ok) {
        setStatus({ kind: 'error', note: compiled.error })
        return
      }

      setStatus({ kind: 'busy', note: 'Running…' })
      const { added } = await runTextExtension(compiled.wasm, {
        mutate,
        slideId,
        z_order: zNow(),
      })
      setStatus({
        kind: 'ok',
        note: `Added ${added} component${added === 1 ? '' : 's'} to the slide.`,
      })
    } catch (err) {
      setStatus({
        kind: 'error',
        note: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...pill, top: 64, right: 12 }}
        title="Open the extension lab (dev only)"
      >
        🧩 Ext Lab
      </button>
    )
  }

  return (
    <div style={panel} aria-label="Extension Lab (dev)">
      <div style={head}>
        <strong style={{ fontSize: 12 }}>🧩 Extension Lab</strong>
        <span style={{ fontSize: 11, opacity: 0.6 }}>dev only</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={iconBtn}
          title="Close"
        >
          ✕
        </button>
      </div>

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        style={editorArea}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => void run()}
          disabled={!canRun}
          style={{ ...runBtn, opacity: canRun ? 1 : 0.5 }}
          title={
            !editor.canEdit
              ? 'Read-only deck'
              : !slideId
                ? 'No active slide'
                : 'Compile & run'
          }
        >
          {status.kind === 'busy' ? status.note : 'Compile & Run'}
        </button>
        {!editor.canEdit && (
          <span style={{ fontSize: 11, opacity: 0.7 }}>read-only deck</span>
        )}
      </div>

      {(status.kind === 'ok' || status.kind === 'error') && (
        <pre
          style={{
            ...output,
            color: status.kind === 'error' ? '#b42318' : '#067647',
          }}
        >
          {status.note}
        </pre>
      )}

      <p style={hint}>
        Added text is a spatial component. It's directly editable only while the
        slide is in <strong>Objects</strong> mode — in <strong>Markdown</strong>
        mode (the default for new slides) objects render locked on top of the
        doc. Switch the slide to Objects mode in the header to select, move, or
        double-click-edit it.
      </p>
    </div>
  )
}

// ---- inline styles (dev tool: kept self-contained, no strut.css coupling) ------------------------

const pill: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #d0d5dd',
  background: '#fff',
  boxShadow: '0 1px 4px rgba(0,0,0,.15)',
  fontSize: 12,
  cursor: 'pointer',
}

const panel: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  // Top-right, below the header: keeps clear of the TanStack devtools (bottom-left) and the
  // "powered by rindle" credit / Overview controls (bottom-right).
  top: 64,
  right: 12,
  width: 380,
  maxWidth: 'calc(100vw - 24px)',
  background: '#fff',
  border: '1px solid #d0d5dd',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,.18)',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  font: '13px/1.4 system-ui, sans-serif',
  color: '#18181b',
}

const head: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const iconBtn: React.CSSProperties = {
  marginLeft: 'auto',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13,
  color: '#667085',
}

const editorArea: React.CSSProperties = {
  width: '100%',
  height: 180,
  resize: 'vertical',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1.45,
  padding: 8,
  border: '1px solid #e4e7ec',
  borderRadius: 6,
  boxSizing: 'border-box',
}

const runBtn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #7f56d9',
  background: '#7f56d9',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const hint: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.4,
  color: '#667085',
}

const output: React.CSSProperties = {
  margin: 0,
  padding: 8,
  background: '#f9fafb',
  border: '1px solid #eaecf0',
  borderRadius: 6,
  fontSize: 11,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: 160,
  overflow: 'auto',
}
