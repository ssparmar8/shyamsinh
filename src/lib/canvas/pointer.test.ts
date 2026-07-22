import { describe, it, expect } from 'vitest'
import { normPointer, scrollProgressOf, smoothVelocity } from './pointer'

describe('normPointer', () => {
  it('maps the centre to 0 and the corners to ±1', () => {
    expect(normPointer(500, 250, 1000, 500)).toEqual({ x: 0, y: 0 })
    expect(normPointer(0, 0, 1000, 500)).toEqual({ x: -1, y: -1 })
    expect(normPointer(1000, 500, 1000, 500)).toEqual({ x: 1, y: 1 })
  })

  it('is safe when the viewport has no size', () => {
    expect(normPointer(10, 10, 0, 0)).toEqual({ x: 0, y: 0 })
  })
})

describe('scrollProgressOf', () => {
  it('is 0 at the top and 1 at the bottom', () => {
    expect(scrollProgressOf(0, 3000, 1000)).toBe(0)
    expect(scrollProgressOf(2000, 3000, 1000)).toBe(1)
    expect(scrollProgressOf(1000, 3000, 1000)).toBeCloseTo(0.5)
  })

  it('clamps out-of-range scroll and handles an unscrollable page', () => {
    expect(scrollProgressOf(-50, 3000, 1000)).toBe(0)
    expect(scrollProgressOf(9999, 3000, 1000)).toBe(1)
    expect(scrollProgressOf(0, 500, 1000)).toBe(0) // content shorter than viewport
  })
})

describe('smoothVelocity', () => {
  it('attacks instantly toward a larger sample magnitude', () => {
    expect(smoothVelocity(0, 10)).toBe(10)
    expect(smoothVelocity(5, -20)).toBe(20) // magnitude, sign-agnostic
  })

  it('releases slowly when the sample is smaller (decay ~0.9/frame)', () => {
    expect(smoothVelocity(10, 0)).toBeCloseTo(9)
    expect(smoothVelocity(10, 3)).toBeCloseTo(9) // max(3, 9)
  })

  it('snaps to 0 below the noise floor so the effect fully settles', () => {
    expect(smoothVelocity(0.005, 0)).toBe(0)
  })
})
