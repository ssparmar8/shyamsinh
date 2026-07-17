export const GATE_KEY = 'archive:audio'

/**
 * The visitor's audio choice, or null if they have not chosen.
 *
 * Every access is wrapped. Safari in private mode throws on write, some
 * privacy extensions throw on read, and an unhandled throw here would take out
 * the entry overlay and the entire homepage with it. Storage is a convenience;
 * losing it must cost the visitor one extra prompt, nothing more.
 */
export function readGate(): boolean | null {
  try {
    const v = localStorage.getItem(GATE_KEY)
    if (v === 'on') return true
    if (v === 'off') return false
    return null
  } catch {
    return null
  }
}

export function writeGate(on: boolean): void {
  try {
    localStorage.setItem(GATE_KEY, on ? 'on' : 'off')
  } catch {
    /* choice is not persisted; the visitor sees the gate again. Acceptable. */
  }
}
