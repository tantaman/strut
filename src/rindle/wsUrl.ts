import { appPath } from '../../shared/appPath.ts'

export function rindleWsUrl(
  request: Request,
  configured = process.env.RINDLE_DAEMON_WS?.trim() ?? '',
  socketPath = appPath('/rindle'),
): string {
  if (configured) return configured

  const url = new URL(request.url)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = socketPath
  url.search = ''
  url.hash = ''
  return url.toString()
}
