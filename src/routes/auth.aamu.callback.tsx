import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/aamu/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { aamuSessionCookie, exchangeAamuCode, safeAamuReturnPath } =
          await import('../../server/aamu-auth')
        const url = new URL(request.url)
        try {
          const { principal, expiresAt } = await exchangeAamuCode(
            url.searchParams.get('code') ?? '',
            request,
          )
          return new Response(null, {
            status: 302,
            headers: {
              location: safeAamuReturnPath(url.searchParams.get('next')),
              'set-cookie': await aamuSessionCookie(
                principal,
                expiresAt,
                request,
              ),
            },
          })
        } catch (error) {
          console.error(
            '[aamu-auth] callback failed:',
            error instanceof Error ? error.message : error,
          )
          return new Response('Aamu sign-in failed', { status: 401 })
        }
      },
    },
  },
})
