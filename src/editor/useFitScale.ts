// Fit-to-container scale: observe a container and return the largest scale (capped at 0.1 min) that
// fits a `w`×`h` slide inside it, minus `pad`. Extracted from Stage so other slide surfaces can reuse it
// without a circular import.

import { useLayoutEffect, useState } from 'react'

export function useFitScale(
  ref: React.RefObject<HTMLElement | null>,
  w: number,
  h: number,
  pad = 56,
): number {
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setScale(
        Math.max(0.1, Math.min((r.width - pad) / w, (r.height - pad) / h)),
      )
    }
    // Measure synchronously before the browser paints so a freshly-mounted surface never shows a
    // frame at the placeholder 0.5 scale. Without this, a freshly mounted canvas would pop from 0.5 to
    // the fitted scale on the next frame. The observer handles later container resizes.
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, w, h, pad])
  return scale
}
