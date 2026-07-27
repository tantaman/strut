import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/aamu/session')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { isAamuAuthEnabled, resolveAamuPrincipal } =
          await import('../../server/aamu-auth')
        const principal = await resolveAamuPrincipal(request)
        return Response.json({
          enabled: isAamuAuthEnabled(),
          principal,
        })
      },
    },
  },
})
