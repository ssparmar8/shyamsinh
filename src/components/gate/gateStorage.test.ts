import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readGate, writeGate, GATE_KEY } from './gateStorage'

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

// vi.spyOn(Storage.prototype, ...) below is a real spy on jsdom's Storage prototype,
// not a stubbed global — vi.unstubAllGlobals() in beforeEach does not touch it.
// Without an explicit restore, "survives storage that throws on write"'s setItem
// spy leaks into every later test (its own localStorage.setItem call throws), and
// "survives storage that throws on read"'s getItem spy leaks into
// "treats a corrupted value as no choice": readGate() would still return null, but
// only because the leaked mock throws and readGate()'s catch block returns null —
// the test would pass without ever reaching the corrupted-value comparison it is
// named for. Confirmed empirically while implementing: with the getItem spy left
// unrestored, `vi.isMockFunction(Storage.prototype.getItem)` was still `true`
// inside the corrupted-value test. Restoring after every test closes both leaks.
afterEach(() => {
  vi.restoreAllMocks()
})

describe('gateStorage', () => {
  it('returns null when the visitor has never chosen', () => {
    expect(readGate()).toBeNull()
  })

  it('round-trips an ON choice', () => {
    writeGate(true)
    expect(readGate()).toBe(true)
  })

  it('round-trips an OFF choice', () => {
    writeGate(false)
    expect(readGate()).toBe(false)
  })

  /**
   * Safari in private mode throws on localStorage.setItem. An unhandled throw here
   * would take down the entry overlay and, with it, the whole homepage.
   */
  it('survives storage that throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
    expect(() => writeGate(true)).not.toThrow()
  })

  it('survives storage that throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readGate()).toBeNull()
  })

  it('treats a corrupted value as no choice', () => {
    localStorage.setItem(GATE_KEY, 'banana')
    expect(readGate()).toBeNull()
  })
})
