import { describe, it, expect } from 'vitest'
import { scrambleFrame } from './scramble'

describe('scrambleFrame', () => {
  it('returns the exact target at progress 1', () => {
    expect(scrambleFrame('SHYAMSINH', 1, 0)).toBe('SHYAMSINH')
  })

  it('returns a string of target length at progress 0', () => {
    expect(scrambleFrame('SHYAMSINH', 0, 0)).toHaveLength(9)
  })

  it('resolves left to right — an early char settles before a late one', () => {
    const mid = scrambleFrame('SHYAMSINH', 0.5, 0)
    expect(mid.slice(0, 4)).toBe('SHYA')
    expect(mid).toHaveLength(9)
  })

  it('is deterministic for the same seed', () => {
    expect(scrambleFrame('SHYAMSINH', 0.3, 7)).toBe(scrambleFrame('SHYAMSINH', 0.3, 7))
  })

  it('preserves spaces at any progress', () => {
    const out = scrambleFrame('AI ARCHITECT', 0.2, 3)
    expect(out[2]).toBe(' ')
  })

  it('clamps progress above 1', () => {
    expect(scrambleFrame('AB', 5, 0)).toBe('AB')
  })

  it('handles the empty string', () => {
    expect(scrambleFrame('', 0.5, 0)).toBe('')
  })

  /**
   * The whole aesthetic is text RESOLVING out of noise. If the noise doesn't move,
   * it isn't decoding — it's a static mask being eaten left to right, which reads
   * as dead.
   *
   * This is not hypothetical. The first implementation hashed only (seed, index),
   * never progress, so a component driving it the obvious way — fix the seed,
   * advance progress each frame — showed the SAME glyph at every unsettled
   * position for the entire animation. Measured: one distinct glyph at index 8
   * across 31 frames.
   */
  it('shimmers — unsettled glyphs churn as progress advances', () => {
    // settled = floor(9 * 0.10) = 0 and floor(9 * 0.15) = 1, so indices 1-8 are
    // unsettled in both frames. Same seed, so only progress differs.
    const a = scrambleFrame('SHYAMSINH', 0.1, 0)
    const b = scrambleFrame('SHYAMSINH', 0.15, 0)
    expect(a.slice(1)).not.toBe(b.slice(1))
  })

  it('churns a single position across many frames', () => {
    const seen = new Set<string>()
    for (let f = 0; f <= 30; f++) seen.add(scrambleFrame('SHYAMSINH', f * 0.015, 0)[8])
    expect(seen.size).toBeGreaterThan(3)
  })

  it('does not always open with the same glyph at the default seed', () => {
    // sin(0) === 0 exactly, so an unoffset hash pins index 0 to 'A' forever.
    const firsts = new Set(
      Array.from({ length: 20 }, (_, k) => scrambleFrame('SHYAMSINH', k / 300, 0)[0]),
    )
    expect(firsts.size).toBeGreaterThan(1)
  })

  it('treats a non-finite progress as fully scrambled, deliberately', () => {
    // A caller computing `elapsed / duration` can hand us NaN when duration is 0.
    // Math.min/max propagate NaN silently, so this is pinned rather than accidental.
    expect(scrambleFrame('AB', NaN, 0)).toBe(scrambleFrame('AB', 0, 0))
  })
})
