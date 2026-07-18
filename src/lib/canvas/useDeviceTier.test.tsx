import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { pickTier, useDeviceTier } from './useDeviceTier'

describe('pickTier', () => {
  it('returns none under reduced motion, whatever the hardware', () => {
    expect(pickTier({ reduced: true, webgl: true, cores: 16, small: false }).renderer).toBe('none')
  })

  it('returns 2d when WebGL is unavailable', () => {
    expect(pickTier({ reduced: false, webgl: false, cores: 16, small: false }).renderer).toBe('2d')
  })

  it('returns webgl on a capable device', () => {
    expect(pickTier({ reduced: false, webgl: true, cores: 16, small: false }).renderer).toBe('webgl')
  })

  it('budgets fewer particles on a small screen', () => {
    const phone = pickTier({ reduced: false, webgl: true, cores: 4, small: true })
    const desk = pickTier({ reduced: false, webgl: true, cores: 16, small: false })
    expect(phone.count).toBeLessThan(desk.count)
  })

  it('budgets fewer particles on low core counts', () => {
    const weak = pickTier({ reduced: false, webgl: true, cores: 2, small: false })
    const strong = pickTier({ reduced: false, webgl: true, cores: 16, small: false })
    expect(weak.count).toBeLessThan(strong.count)
  })

  it('never budgets zero particles for a rendering tier', () => {
    expect(pickTier({ reduced: false, webgl: true, cores: 1, small: true }).count).toBeGreaterThan(0)
  })
})

describe('useDeviceTier (the hook, not just pickTier)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((q: string) => ({
        matches: false,
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  /**
   * The regression guard for the crash Task 1 shipped and Task 3 caught. The hook
   * uses useSyncExternalStore, which requires a referentially STABLE snapshot; the
   * first version returned a fresh pickTier() object every call, so React saw
   * "changed" on every render and threw "Maximum update depth exceeded" (#185),
   * crashing every consumer on mount. pickTier's own unit tests never rendered the
   * hook, so they stayed green through it.
   *
   * If the snapshot is ever unstable again, render() below throws and this fails.
   */
  it('renders without an infinite loop and returns a stable snapshot', () => {
    let renders = 0
    function Probe() {
      renders++
      useDeviceTier()
      return null
    }
    expect(() => render(<Probe />)).not.toThrow()
    // A stable snapshot commits in a bounded number of renders, not hundreds.
    expect(renders).toBeLessThan(5)
  })
})
