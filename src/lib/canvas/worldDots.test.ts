import { describe, it, expect } from 'vitest'
import { landDots, lonLatToXY, cellToXY, WORLD_COLS, WORLD_ROWS } from './worldDots'

describe('landDots', () => {
  it('decodes a recognisable land mask (a few thousand cells, all in bounds)', () => {
    const dots = landDots()
    expect(dots.length).toBeGreaterThan(2000)
    expect(dots.length).toBeLessThan(3500)
    for (const [c, r] of dots) {
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThan(WORLD_COLS)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThan(WORLD_ROWS)
    }
  })

  it('trims Antarctica — no land in the southernmost rows', () => {
    // rows below ~-60° lat were dropped when generating the mask.
    const dots = landDots()
    const southmost = Math.max(...dots.map(([, r]) => r))
    expect(southmost).toBeLessThan(WORLD_ROWS - 8)
  })

  it('is memoised — same array reference on repeat calls', () => {
    expect(landDots()).toBe(landDots())
  })
})

describe('lonLatToXY', () => {
  it('projects the equirectangular corners and centre', () => {
    expect(lonLatToXY(0, 0, 360, 180)).toEqual({ x: 180, y: 90 })
    expect(lonLatToXY(-180, 90, 360, 180)).toEqual({ x: 0, y: 0 })
    expect(lonLatToXY(180, -90, 360, 180)).toEqual({ x: 360, y: 180 })
  })
})

describe('cellToXY', () => {
  it('places a cell centre inside its cell', () => {
    const { x, y } = cellToXY(0, 0, WORLD_COLS, WORLD_ROWS)
    expect(x).toBeCloseTo(0.5)
    expect(y).toBeCloseTo(0.5)
  })
})
