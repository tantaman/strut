// Canned transitions (spec §7.2). The old Bespoke generator exposed a preset grid; clicking sets
// `deck.canned_transition = <name>`. In old Strut the name is emitted as a CSS class for the Bespoke
// plugin to interpret — Strut itself computes no arrangement. We ship the impress-style camera (not
// Bespoke), so there's no Bespoke plugin to run the named effect; instead we map each preset to a
// camera-flight FEEL (duration + easing) so the choice is visible in Present and the export's
// `data-transition-duration`. (True per-name 3-D effects would require the Bespoke generator.)

export const CANNED_TRANSITIONS = [
  'none',
  'carousel',
  'classic',
  'concave',
  'coverflow',
  'cube',
  'cubeb',
  'cards',
] as const

export type CannedTransition = (typeof CANNED_TRANSITIONS)[number]

interface Flight {
  /** Camera transition duration in ms. */
  duration: number
  /** CSS timing function for the camera move. */
  easing: string
}

// Hand-tuned so each preset reads differently when flying between slides.
const FLIGHTS: Record<string, Flight> = {
  none: { duration: 0, easing: 'linear' },
  classic: { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)' },
  carousel: { duration: 1100, easing: 'cubic-bezier(.4,0,.2,1)' },
  concave: { duration: 1000, easing: 'cubic-bezier(.6,-0.2,.3,1.2)' },
  coverflow: { duration: 1200, easing: 'cubic-bezier(.25,.8,.25,1)' },
  cube: { duration: 900, easing: 'cubic-bezier(.7,0,.3,1)' },
  cubeb: { duration: 1000, easing: 'cubic-bezier(.7,0,.3,1)' },
  cards: { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' },
}

const DEFAULT_FLIGHT: Flight = {
  duration: 900,
  easing: 'cubic-bezier(.4,0,.2,1)',
}

export function flightFor(name: string | undefined): Flight {
  if (!name) return DEFAULT_FLIGHT
  return FLIGHTS[name] ?? DEFAULT_FLIGHT
}
