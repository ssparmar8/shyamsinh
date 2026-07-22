import { describe, it, expect } from 'vitest'
import { magneticOffset } from './magnetic'

const rect = { left: 100, top: 100, width: 100, height: 40 } // center (150, 120)

describe('magneticOffset', () => {
  it('is zero when the cursor is at the element center', () => {
    expect(magneticOffset(150, 120, rect, 0.3, 6)).toEqual({ x: 0, y: 0 })
  })

  it('pulls toward the cursor, scaled by strength', () => {
    // 10px right of center × 0.3 = 3px, under the cap
    expect(magneticOffset(160, 120, rect, 0.3, 6)).toEqual({ x: 3, y: 0 })
  })

  it('caps the pull at ±max on each axis', () => {
    expect(magneticOffset(1000, 1000, rect, 0.3, 6)).toEqual({ x: 6, y: 6 })
    expect(magneticOffset(-1000, -1000, rect, 0.3, 6)).toEqual({ x: -6, y: -6 })
  })
})
