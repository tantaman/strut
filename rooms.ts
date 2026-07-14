// Managed Rindle Realtime bundle entry. The CLI discovers this beside topology.ncl and uploads it
// with `rindle deploy`; Headwaters composes it into Strut's isolated room tenant script.
export { mutators, ownedTables } from './shared/rooms.ts'
