import { createFileRoute } from '@tanstack/react-router'

// Image upload → object storage (R2) or local-disk dev fallback. Returns { url }.
export const Route = createFileRoute('/api/rindle/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { uploadFromRequest } = await import('../../server/upload')
        return uploadFromRequest(request)
      },
    },
  },
})
