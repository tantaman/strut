import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import strutCss from '../strut.css?url'
import { RindleProvider } from '../rindle/RindleProvider'

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
      // Slide text fonts (config.ts FONT_FAMILIES) — without these, the font chooser
      // silently falls back to the browser default and appears to do nothing.
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Droid+Sans+Mono&family=Fredoka+One&family=Gorditas&family=Hammersmith+One&family=Lato:wght@400;700&family=League+Gothic&family=Press+Start+2P&family=Ubuntu:wght@400;700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: strutCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <RindleProvider>{children}</RindleProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
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
