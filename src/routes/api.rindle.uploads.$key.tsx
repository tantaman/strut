import { createFileRoute } from '@tanstack/react-router'

// Serve a locally-stored fallback image (dev). With R2 configured, image src URLs point at the
// bucket and never hit this route.
export const Route = createFileRoute('/api/rindle/uploads/$key')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { serveUploadByKey } = await import('../../server/upload')
        const { getUploadsBucket } = await import('../../server/cf-env')
        return serveUploadByKey(params.key, await getUploadsBucket())
      },
    },
  },
})
