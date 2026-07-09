// DEV-only lazy mount for the Extension Lab (issue #438). Statically importable and cheap: in a
// production build `import.meta.env.DEV` is false, so the effect never runs and the panel module (which
// pulls in the AssemblyScript compiler on demand) is never even fetched. Mirrors RindleDevtoolsMount in
// src/rindle/RindleProvider.tsx.

import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

export function ExtensionLabMount() {
  const [Lab, setLab] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    let live = true
    void import('./ExtensionLab')
      .then((m) => {
        if (live) setLab(() => m.default)
      })
      .catch((e) => console.error('[ext-lab] failed to load:', e))
    return () => {
      live = false
    }
  }, [])

  if (!Lab) return null
  return <Lab />
}
