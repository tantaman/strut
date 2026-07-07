import { createFileRoute } from '@tanstack/react-router'

// Serve a built runnable artifact by its content-addressed key at /a/<hash>.html. Always text/html + the
// sandbox CSP + nosniff (server/artifact.ts). In prod this is typically served from the dedicated
// ARTIFACT_ORIGIN (a separate origin) for cross-origin isolation; the same handler answers on both hosts.
export const Route = createFileRoute('/a/$key')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { serveArtifactByKey } = await import('../../server/artifact')
        const { getUploadsBucket } = await import('../../server/cf-env')
        return serveArtifactByKey(params.key, await getUploadsBucket())
      },
    },
  },
})
