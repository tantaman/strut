// Live-load every component of a slide (one query per type) and merge them into z-ordered
// AnyComponent[]. Used by the stage, the well thumbnails, and overview cards — so each rendered
// slide is a real live snapshot (spec §5.1).

import { useMemo } from 'react'
import { useQuery } from '@rindle/react'
import {
  imageComponentsQuery,
  shapeComponentsQuery,
  textComponentsQuery,
  videoComponentsQuery,
  webframeComponentsQuery,
} from '../../shared/queries'
import { mergeComponents, type AnyComponent, type SpatialBase } from './types'

export function useSlideComponents(slideId: string): AnyComponent[] {
  const texts = useQuery(textComponentsQuery({ slideId })) as unknown as SpatialBase[]
  const images = useQuery(imageComponentsQuery({ slideId })) as unknown as SpatialBase[]
  const shapes = useQuery(shapeComponentsQuery({ slideId })) as unknown as SpatialBase[]
  const videos = useQuery(videoComponentsQuery({ slideId })) as unknown as SpatialBase[]
  const webframes = useQuery(webframeComponentsQuery({ slideId })) as unknown as SpatialBase[]
  return useMemo(
    () => mergeComponents(texts, images, shapes, videos, webframes),
    [texts, images, shapes, videos, webframes],
  )
}
