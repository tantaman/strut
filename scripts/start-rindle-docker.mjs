import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const token = process.env.RINDLE_DAEMON_TOKEN
if (!token) throw new Error('RINDLE_DAEMON_TOKEN is required')

const config = JSON.parse(await readFile('/app/daemon.json', 'utf8'))
config.authToken = token
const runDir = await mkdtemp(join(tmpdir(), 'slides-rindle-'))
await writeFile(join(runDir, 'daemon.json'), JSON.stringify(config))

const child = spawn(
  process.execPath,
  ['/app/node_modules/@rindle/cli/dist/cli.js', 'up', '--migrate'],
  {
    cwd: runDir,
    env: {
      ...process.env,
      RINDLE_MIGRATIONS_DIR: '/app/migrations',
    },
    stdio: 'inherit',
  },
)

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
