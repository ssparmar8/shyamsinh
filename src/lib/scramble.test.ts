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
})
