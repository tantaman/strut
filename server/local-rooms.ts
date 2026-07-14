// Node-only local room host. This module is dynamically imported only by Vite development mode;
// production rooms are Headwaters Durable Objects, so keep it out of the Worker graph.

import { createRoomShell, httpAuthority, memoryJournal } from '@rindle/room'
import { deckRoomFootprint } from '../shared/queries.ts'
import { mutators, ownedTables } from '../shared/rooms.ts'

interface LocalRoomConfig {
  apiOrigin: string
  daemonUrl: string
  daemonWsUrl: string
  daemonToken: string
  shellSecret: string
  tokenKid: string
  tokenSecret: string
  flushCredential: string
}

const rooms = new Map<
  string,
  Promise<{
    shell: Awaited<ReturnType<typeof createRoomShell>>
    wsEndpoint: string
  }>
>()

export async function ensureLocalDeckRoom(
  doc: string,
  config: LocalRoomConfig,
): Promise<{ wsEndpoint: string }> {
  let entry = rooms.get(doc)
  if (!entry) {
    const deckId = doc.startsWith('deck/') ? doc.slice('deck/'.length) : ''
    if (!deckId) throw new Error(`unexpected room document ${doc}`)
    entry = (async () => {
      const shell = await createRoomShell({
        upstream: {
          wsUrl: config.daemonWsUrl,
          controlUrl: config.daemonUrl,
          authToken: config.daemonToken,
          footprintAst: deckRoomFootprint(deckId).ast(),
        },
        downstream: {
          docId: doc,
          tokenKeys: { [config.tokenKid]: config.tokenSecret },
          sweepIntervalMs: 500,
          control: { authToken: config.shellSecret },
          writes: {
            mutators,
            ownedTables,
            journal: memoryJournal(),
            authority: httpAuthority({
              applyUrl: `${config.apiOrigin}/api/rindle/apply-row-change-txn`,
              claimUrl: `${config.apiOrigin}/api/rindle/claim-room-epoch`,
              lmidsUrl: `${config.apiOrigin}/api/rindle/room-lmids`,
              headers: {
                'x-rindle-room-credential': config.flushCredential,
              },
            }),
            flushDebounceMs: 250,
          },
        },
        log: (line) => console.info(`[rindle room ${doc}] ${line}`),
      })
      await shell.awaitLive()
      console.info(`[rindle room] ready ${doc} on ws://127.0.0.1:${shell.port}`)
      return { shell, wsEndpoint: `ws://127.0.0.1:${shell.port}` }
    })()
    rooms.set(doc, entry)
    entry.catch(() => rooms.delete(doc))
  }
  return { wsEndpoint: (await entry).wsEndpoint }
}

export async function drainLocalRoom(
  doc: string,
): Promise<{ finalFlushSeq: number }> {
  const entry = rooms.get(doc)
  if (!entry) throw new Error(`no local room for ${doc}`)
  const { shell } = await entry
  const response = await fetch(`http://127.0.0.1:${shell.controlPort}/drain`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.RINDLE_ROOM_SHELL_SECRET ?? 'strut-local-room-shell'}`,
    },
  })
  if (!response.ok)
    throw new Error(`local room drain failed (${response.status})`)
  return (await response.json()) as { finalFlushSeq: number }
}
