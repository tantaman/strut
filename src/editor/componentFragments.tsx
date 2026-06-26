import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { fragmentKey, useFragment } from '@rindle/react'
import type { FragmentRef } from '@rindle/react'
import {
  ImageFragment,
  ShapeFragment,
  TextFragment,
  VideoFragment,
  WebframeFragment,
} from '../../shared/fragments'
import { KIND_TO_TABLE } from './types'
import type { AnyComponent, ComponentKind, SpatialBase } from './types'

export type ComponentRef =
  | {
      kind: 'text'
      ref: FragmentRef<typeof TextFragment>
    }
  | {
      kind: 'image'
      ref: FragmentRef<typeof ImageFragment>
    }
  | {
      kind: 'shape'
      ref: FragmentRef<typeof ShapeFragment>
    }
  | {
      kind: 'video'
      ref: FragmentRef<typeof VideoFragment>
    }
  | {
      kind: 'webframe'
      ref: FragmentRef<typeof WebframeFragment>
    }

export function componentRefKey(component: ComponentRef): string {
  return fragmentKey(component.ref)
}

export function mergeComponentRefs({
  texts,
  images,
  shapes,
  videos,
  webframes,
}: {
  texts: readonly FragmentRef<typeof TextFragment>[]
  images: readonly FragmentRef<typeof ImageFragment>[]
  shapes: readonly FragmentRef<typeof ShapeFragment>[]
  videos: readonly FragmentRef<typeof VideoFragment>[]
  webframes: readonly FragmentRef<typeof WebframeFragment>[]
}): ComponentRef[] {
  return [
    ...texts.map((ref): ComponentRef => ({ kind: 'text', ref })),
    ...images.map((ref): ComponentRef => ({ kind: 'image', ref })),
    ...shapes.map((ref): ComponentRef => ({ kind: 'shape', ref })),
    ...videos.map((ref): ComponentRef => ({ kind: 'video', ref })),
    ...webframes.map((ref): ComponentRef => ({ kind: 'webframe', ref })),
  ]
}

function toAnyComponent<T extends SpatialBase>(
  data: T,
  kind: ComponentKind,
): AnyComponent {
  return { ...data, kind, table: KIND_TO_TABLE[kind] }
}

function ComponentData({
  data,
  kind,
  onData,
  onRemove,
  children,
}: {
  data: SpatialBase
  kind: ComponentKind
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const component = useMemo(() => toAnyComponent(data, kind), [data, kind])

  useEffect(() => {
    onData?.(component)
  }, [component, onData])

  useEffect(() => {
    return () => onRemove?.(component.id)
  }, [component.id, onRemove])

  return <>{children(component)}</>
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
  switch (component.kind) {
    case 'text':
      return (
        <TextComponentData
          component={component}
          onData={onData}
          onRemove={onRemove}
        >
          {children}
        </TextComponentData>
      )
    case 'image':
      return (
        <ImageComponentData
          component={component}
          onData={onData}
          onRemove={onRemove}
        >
          {children}
        </ImageComponentData>
      )
    case 'shape':
      return (
        <ShapeComponentData
          component={component}
          onData={onData}
          onRemove={onRemove}
        >
          {children}
        </ShapeComponentData>
      )
    case 'video':
      return (
        <VideoComponentData
          component={component}
          onData={onData}
          onRemove={onRemove}
        >
          {children}
        </VideoComponentData>
      )
    case 'webframe':
      return (
        <WebframeComponentData
          component={component}
          onData={onData}
          onRemove={onRemove}
        >
          {children}
        </WebframeComponentData>
      )
  }
}

function TextComponentData({
  component,
  onData,
  onRemove,
  children,
}: {
  component: Extract<ComponentRef, { kind: 'text' }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(TextFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData data={data} kind="text" onData={onData} onRemove={onRemove}>
      {children}
    </ComponentData>
  )
}

function ImageComponentData({
  component,
  onData,
  onRemove,
  children,
}: {
  component: Extract<ComponentRef, { kind: 'image' }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(ImageFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData data={data} kind="image" onData={onData} onRemove={onRemove}>
      {children}
    </ComponentData>
  )
}

function ShapeComponentData({
  component,
  onData,
  onRemove,
  children,
}: {
  component: Extract<ComponentRef, { kind: 'shape' }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(ShapeFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData data={data} kind="shape" onData={onData} onRemove={onRemove}>
      {children}
    </ComponentData>
  )
}

function VideoComponentData({
  component,
  onData,
  onRemove,
  children,
}: {
  component: Extract<ComponentRef, { kind: 'video' }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(VideoFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData data={data} kind="video" onData={onData} onRemove={onRemove}>
      {children}
    </ComponentData>
  )
}

function WebframeComponentData({
  component,
  onData,
  onRemove,
  children,
}: {
  component: Extract<ComponentRef, { kind: 'webframe' }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}) {
  const data = useFragment(WebframeFragment, component.ref)
  if (!data) return null
  return (
    <ComponentData
      data={data}
      kind="webframe"
      onData={onData}
      onRemove={onRemove}
    >
      {children}
    </ComponentData>
  )
}
