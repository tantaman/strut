import { createFileRoute } from '@tanstack/react-router'

// Runnable-artifact upload: store the author's source as a built, sandboxed HTML doc in R2 (or local-disk
// dev fallback) and return { url } for the component's `src`. Guest-OK auth + a daily quota live inside
// uploadArtifactFromRequest. See server/artifact.ts.
export const Route = createFileRoute('/api/artifact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { uploadArtifactFromRequest } = await import('../../server/artifact')
        const { getUploadsBucket } = await import('../../server/cf-env')
        return uploadArtifactFromRequest(request, await getUploadsBucket())
      },
    },
  },
})
