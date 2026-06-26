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

type ComponentFragmentMap = {
  text: typeof TextFragment
  image: typeof ImageFragment
  shape: typeof ShapeFragment
  video: typeof VideoFragment
  webframe: typeof WebframeFragment
}

type ComponentReaderProps<TKind extends ComponentKind> = {
  component: Extract<ComponentRef, { kind: TKind }>
  onData?: (component: AnyComponent) => void
  onRemove?: (id: string) => void
  children: (component: AnyComponent) => ReactNode
}

const COMPONENT_DATA_DISPLAY_NAMES: Record<ComponentKind, string> = {
  text: 'TextComponentData',
  image: 'ImageComponentData',
  shape: 'ShapeComponentData',
  video: 'VideoComponentData',
  webframe: 'WebframeComponentData',
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

function makeComponentDataReader<TKind extends keyof ComponentFragmentMap>(
  kind: TKind,
  fragment: ComponentFragmentMap[TKind],
) {
  function TypedComponentData({
    component,
    onData,
    onRemove,
    children,
  }: ComponentReaderProps<TKind>) {
    const data = useFragment(
      fragment,
      component.ref as FragmentRef<ComponentFragmentMap[TKind]>,
    )
    if (!data) return null
    return (
      <ComponentData
        data={data}
        kind={kind}
        onData={onData}
        onRemove={onRemove}
      >
        {children}
      </ComponentData>
    )
  }

  Object.assign(TypedComponentData, {
    displayName: COMPONENT_DATA_DISPLAY_NAMES[kind],
  })

  return TypedComponentData
}

const TextComponentData = makeComponentDataReader('text', TextFragment)
const ImageComponentData = makeComponentDataReader('image', ImageFragment)
const ShapeComponentData = makeComponentDataReader('shape', ShapeFragment)
const VideoComponentData = makeComponentDataReader('video', VideoFragment)
const WebframeComponentData = makeComponentDataReader(
  'webframe',
  WebframeFragment,
)

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
