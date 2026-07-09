const metaEnv = (
  import.meta as unknown as {
    env?: Record<string, string | undefined>
  }
).env

function normalizeBasepath(value: string | undefined): string {
  if (!value || value === '/') return ''
  return `/${value.replace(/^\/+|\/+$/g, '')}`
}

export const APP_BASEPATH = normalizeBasepath(metaEnv?.TSS_ROUTER_BASEPATH)

export function appPath(path = '/'): string {
  const normalized = path ? (path.startsWith('/') ? path : `/${path}`) : '/'
  if (!APP_BASEPATH) return normalized
  if (normalized === '/') return APP_BASEPATH
  return `${APP_BASEPATH}${normalized}`
}
