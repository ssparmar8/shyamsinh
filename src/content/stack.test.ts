import { describe, it, expect } from 'vitest'
import { CAPABILITIES, STACK } from './stack'

describe('stack content', () => {
  it('lists the six architecture capability areas, each with items', () => {
    expect(CAPABILITIES).toHaveLength(6)
    for (const c of CAPABILITIES) {
      expect(c.area).toMatch(/\S/)
      expect(c.items.length).toBeGreaterThan(0)
      expect(new Set(c.items).size).toBe(c.items.length) // no dupes within an area
    }
  })

  it('lists the five technical stack groups, each with items', () => {
    expect(STACK.map((g) => g.group)).toEqual(['AI', 'DATA', 'BACKEND', 'CLOUD', 'INTEGRATION'])
    for (const g of STACK) {
      expect(g.items.length).toBeGreaterThan(0)
      expect(new Set(g.items).size).toBe(g.items.length)
    }
  })

  it('has unique capability areas and stack groups', () => {
    expect(new Set(CAPABILITIES.map((c) => c.area)).size).toBe(CAPABILITIES.length)
    expect(new Set(STACK.map((g) => g.group)).size).toBe(STACK.length)
  })
})
