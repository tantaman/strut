// Live-load every component of a slide (one query per type) and merge them into z-ordered
// AnyComponent[]. Used by the stage, the well thumbnails, and overview cards — so each rendered
// slide is a real live snapshot (spec §5.1).
//
// `token` switches the whole family to the public read-only link queries (carrying the share token in
// the subscription identity) so the same rendering serves the /share viewer (see shared/queries.ts).

import { useMemo } from 'react'
import { useQuery } from '@rindle/react'
import {
  imageComponentsQuery,
  publicImageComponentsQuery,
  publicShapeComponentsQuery,
  publicTextComponentsQuery,
  publicVideoComponentsQuery,
  publicWebframeComponentsQuery,
  shapeComponentsQuery,
  textComponentsQuery,
  videoComponentsQuery,
  webframeComponentsQuery,
} from '../../shared/queries'
import { mergeComponents, type AnyComponent, type SpatialBase } from './types'

export function useSlideComponents(
  slideId: string,
  token?: string,
): AnyComponent[] {
  const texts = useQuery(
    token
      ? publicTextComponentsQuery({ slideId, token })
      : textComponentsQuery({ slideId }),
  ) as unknown as SpatialBase[]
  const images = useQuery(
    token
      ? publicImageComponentsQuery({ slideId, token })
      : imageComponentsQuery({ slideId }),
  ) as unknown as SpatialBase[]
  const shapes = useQuery(
    token
      ? publicShapeComponentsQuery({ slideId, token })
      : shapeComponentsQuery({ slideId }),
  ) as unknown as SpatialBase[]
  const videos = useQuery(
    token
      ? publicVideoComponentsQuery({ slideId, token })
      : videoComponentsQuery({ slideId }),
  ) as unknown as SpatialBase[]
  const webframes = useQuery(
    token
      ? publicWebframeComponentsQuery({ slideId, token })
      : webframeComponentsQuery({ slideId }),
  ) as unknown as SpatialBase[]
  return useMemo(
    () => mergeComponents(texts, images, shapes, videos, webframes),
    [texts, images, shapes, videos, webframes],
  )
}
