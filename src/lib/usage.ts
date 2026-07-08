// A tiny client bus so the usage meter (src/rindle/UsageMeter.tsx) can refresh its ring right after an
// action that consumes a daily AI quota or storage — without the meter and the AI features importing each
// other. Fire notifyUsageChanged() at a success site; the meter listens for USAGE_CHANGED and refetches
// /api/usage. (The meter also refetches on open, which covers any path that doesn't fire this.)

export const USAGE_CHANGED = 'strut:usage-changed'

export function notifyUsageChanged(): void {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(USAGE_CHANGED))
}
