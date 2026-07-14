// The managed-room write bundle. `rindle deploy` bundles this root-level entry for Headwaters;
// local Vite dev imports the same registry into its Node room shell. Keep this surface limited to
// mutations whose rows live in the deck room footprint.

import { driveMutationSync, isoTx } from '@rindle/client'
import type { MutationOp, SharedMutatorWithArgs } from '@rindle/client'
import type { MutationTx, RoomMutator } from '@rindle/room/mutation-tx'
import { deckShareId, mutators as sharedMutators } from './app-def.ts'

export const ownedTables = ['deck', 'slide', 'component', 'custom_background']

function apply(tx: MutationTx, op: MutationOp): void {
  switch (op.kind) {
    case 'insert':
      tx.insert(op.table, op.row)
      return
    case 'upsert':
      tx.upsert(op.table, op.row)
      return
    case 'insertIgnore':
      // The room transaction has no separate insert-ignore primitive. This app's room-routed
      // mutators do not currently emit it, so refuse loudly instead of weakening its semantics.
      throw new Error('insertIgnore is not supported in a Strut room')
    case 'update':
      tx.update(op.table, op.row)
      return
    case 'delete':
      tx.delete(op.table, op.pk)
  }
}

function requireEditableDeck(
  tx: MutationTx,
  deckId: string,
  user: string,
): void {
  const deck = tx.row('deck', { id: deckId })
  if (!deck) throw new Error('deck is not present in this room')
  if (deck.owner_id === user) return

  const share = tx.row('deck_share', { id: deckShareId(deckId, user) })
  if (
    share?.deck_id === deckId &&
    share.user_id === user &&
    share.role === 'editor'
  )
    return
  throw new Error('not permitted to edit this deck')
}

function deckForSlide(tx: MutationTx, slideId: string): string {
  const slide = tx.row('slide', { id: slideId })
  if (!slide || typeof slide.deck_id !== 'string')
    throw new Error('slide is not present in this room')
  return slide.deck_id
}

function deckForComponent(tx: MutationTx, componentId: string): string {
  const component = tx.row('component', { id: componentId })
  if (!component || typeof component.slide_id !== 'string')
    throw new Error('component is not present in this room')
  return deckForSlide(tx, component.slide_id)
}

function sharedRoomMutator(
  mutator: SharedMutatorWithArgs<any>,
  deckId: (tx: MutationTx, args: any) => string,
): RoomMutator {
  return (tx, raw, ctx) => {
    const args = mutator.args.parse(raw)
    requireEditableDeck(tx, deckId(tx, args), ctx.user)
    driveMutationSync(mutator(isoTx, args, ctx), {
      apply: (op) => apply(tx, op),
      read: (table, pk) => tx.row(table, pk),
      // None of the room-routed mutators uses query reads. Refusing rather than pretending a
      // partial room is authoritative keeps a future mutator safely on the daemon path.
      query: () => {
        throw new Error('query reads are not available in a Strut room')
      },
    })
  }
}

export const mutators: Record<string, RoomMutator> = {
  setDeckTheme: sharedRoomMutator(
    sharedMutators.setDeckTheme,
    (_tx, a) => a.id,
  ),
  setSlideDoc: sharedRoomMutator(sharedMutators.setSlideDoc, (tx, a) =>
    deckForSlide(tx, a.id),
  ),
  setSlideTransform: sharedRoomMutator(
    sharedMutators.setSlideTransform,
    (tx, a) => deckForSlide(tx, a.id),
  ),
  moveComponent: sharedRoomMutator(sharedMutators.moveComponent, (tx, a) =>
    deckForComponent(tx, a.id),
  ),
  setText: sharedRoomMutator(sharedMutators.setText, (tx, a) =>
    deckForComponent(tx, a.id),
  ),
  transformComponent: sharedRoomMutator(
    sharedMutators.transformComponent,
    (tx, a) => deckForComponent(tx, a.id),
  ),
}
