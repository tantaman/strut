// The relay boundary for a single component: read its `ComponentFragment` ref, decode the row (props
// blob → flat fields), and hand a typed `AnyComponent` to the child render fn. One table, one fragment
// — so this is a single reader now (no per-type wrappers / no `kind` switch).

import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { fragmentKey, useFragment } from '@rindle/react'
import type { FragmentRef } from '@rindle/react'
import { ComponentFragment } from '../../shared/fragments'
import { componentFromRow } from './types'
import type { AnyComponent, ComponentRow } from './types'

export interface ComponentRef {
  ref: FragmentRef<typeof ComponentFragment>
}

export function componentRefKey(component: ComponentRef): string {
  return fragmentKey(component.ref)
}

/** A slide's components as fragment refs, already z-ordered by the query (SlideFragment orders the
 *  `components` sub by z_order). */
export function mergeComponentRefs(slide: {
  components: readonly FragmentRef<typeof ComponentFragment>[]
}): ComponentRef[] {
  return slide.components.map((ref) => ({ ref }))
}

export function ComponentDataReader({
  component,
  onData,
  onRemove,
  children,
}: {
  component: ComponentRef
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(ComponentFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData data={data} onData={onData} onRemove={onRemove}>
      {children}
    </ComponentData>
  )
}

function ComponentData({
  data,
  onData,
  onRemove,
  children,
}: {
  data: ComponentRow
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const component = useMemo(() => componentFromRow(data), [data])

  useEffect(() => {
    onData?.(component)
  }, [component, onData])

  useEffect(() => {
    return () => onRemove?.(component.id)
  }, [component.id, onRemove])

  return <>{children(component)}</>
}
