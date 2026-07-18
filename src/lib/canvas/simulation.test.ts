import { describe, it, expect } from 'vitest'
import { createField, stepField, nearLinks } from './simulation'

describe('particle field', () => {
  it('creates the requested number of particles within bounds', () => {
    const f = createField(40, 800, 600, 1)
    expect(f.length).toBe(40)
    for (const p of f) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(800)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(600)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = createField(20, 800, 600, 7)
    const b = createField(20, 800, 600, 7)
    expect(a).toEqual(b)
  })

  it('moves particles when stepped', () => {
    const f = createField(10, 800, 600, 1)
    const before = f.map((p) => ({ x: p.x, y: p.y }))
    stepField(f, 800, 600, 16)
    expect(f.some((p, i) => p.x !== before[i].x || p.y !== before[i].y)).toBe(true)
  })

  it('keeps particles inside the bounds after many steps (wraps or bounces)', () => {
    const f = createField(30, 400, 300, 2)
    for (let i = 0; i < 500; i++) stepField(f, 400, 300, 16)
    for (const p of f) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(400)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(300)
    }
  })

  it('links only particles within the threshold', () => {
    const f = [
      { x: 0, y: 0, vx: 0, vy: 0 },
      { x: 10, y: 0, vx: 0, vy: 0 },
      { x: 999, y: 999, vx: 0, vy: 0 },
    ]
    const links = nearLinks(f, 50)
    expect(links).toEqual([[0, 1]])
  })
})
