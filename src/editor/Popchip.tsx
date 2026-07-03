// A collapsed color/background control (Figma-style progressive disclosure): the trigger shows only
// the CURRENT value as a small swatch chip; clicking it opens a floating sub-popover
// holding the full picker (`children`). The panel closes on Escape or a pointer-down outside its own
// root — the trigger is inside that root, so clicking it just toggles (no close-then-reopen race).
// Selecting inside the panel does NOT auto-close, so several swatches can be tried in one visit.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export function Popchip({
  swatch,
  title,
  children,
}: {
  swatch: string
  title?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    // Capture phase so we settle before other handlers (e.g. a parent popover's own dismiss).
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div className="popchip" ref={ref}>
      <button
        type="button"
        className={'popchip__trigger' + (open ? ' is-open' : '')}
        title={title}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="popchip__sw" style={{ background: swatch }} />
        {label != null && <span className="popchip__val">{label}</span>}
      </button>
      {open && <div className="popover popover--sub">{children}</div>}
    </div>
  )
}
