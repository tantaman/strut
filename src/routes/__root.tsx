import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import strutCss from '../strut.css?url'
import { RindleProvider } from '../rindle/RindleProvider'
import { DecksKeepalive } from '../rindle/DecksKeepalive'
import { ANALYTICS_ENABLED, UMAMI_ID, UMAMI_SRC } from '../lib/analytics'
import { googleFontsHref } from '../config'
import { themeBootstrapScript } from '../ThemeToggle'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Strut' },
    ],
    links: [
      // Strut favicon (the stacked-bars mark from strut.io). Versioned to bust the
      // browser's aggressive favicon cache when it changes.
      { rel: 'icon', href: '/favicon.ico?v=strut', sizes: 'any' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
      },
      // Slide text fonts — derived from config.ts FONTS so this list can never drift from the
      // chooser (a stale list would make the font picker silently fall back to the browser default).
      { rel: 'stylesheet', href: googleFontsHref() },
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: strutCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <HeadContent />
        {/* Privacy-first, cookieless product analytics (Umami). Rendered ONLY when the build set
            VITE_UMAMI_SRC — an unconfigured clone omits it entirely and collects nothing. See
            src/lib/analytics.ts. `defer` keeps it off the critical path. */}
        {ANALYTICS_ENABLED && (
          <script defer src={UMAMI_SRC} data-website-id={UMAMI_ID} />
        )}
      </head>
      <body>
        <RindleProvider>
          {/* Keep the dashboard's decks coverage warm across the whole session (incl. while a deck is
              open) so returning to `/` doesn't flash empty for one daemon round-trip. */}
          <DecksKeepalive />
          {children}
        </RindleProvider>
        <TanStackDevtools
          config={{ position: 'bottom-left' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
