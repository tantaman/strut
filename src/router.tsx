import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { APP_BASEPATH } from '../shared/appPath'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    ...(APP_BASEPATH ? { basepath: APP_BASEPATH } : {}),
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
