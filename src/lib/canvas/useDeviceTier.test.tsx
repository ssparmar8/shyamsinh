import { describe, it, expect } from 'vitest'
import { pickTier } from './useDeviceTier'

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
