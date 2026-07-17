import { describe, it, expect } from 'vitest'
import { SYSTEMS } from './systems'
import { SystemSchema, PRIVATE_HOSTS } from './schema'
import {
  getFeatured,
  getBySlug,
  getArchive,
  countSectors,
  countClientRegions,
  countRegions,
  countOwnProducts,
  recordNumber,
} from './index'

describe('SYSTEMS content', () => {
  it('every system satisfies the schema', () => {
    for (const s of SYSTEMS) {
      expect(() => SystemSchema.parse(s), `${s.slug} failed`).not.toThrow()
    }
  })

  it('has exactly 6 featured systems', () => {
    expect(getFeatured()).toHaveLength(6)
  })

  it('has unique slugs', () => {
    const slugs = SYSTEMS.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never links a private host', () => {
    const urls = SYSTEMS.map((s) => s.url).filter(Boolean) as string[]
    for (const u of urls) {
      for (const host of PRIVATE_HOSTS) {
        expect(u).not.toContain(host)
      }
    }
  })

  it('resolves a featured system by slug', () => {
    expect(getBySlug('aiva')?.name).toBe('AIVA Chat')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getBySlug('nope')).toBeUndefined()
  })

  it('archive excludes featured systems', () => {
    expect(getArchive().every((s) => !s.featured)).toBe(true)
  })

  /**
   * Pins the headline figures. A change here must be deliberate: these numbers are
   * rendered next to Shyamsinh's name, and earlier drafts of this project claimed
   * "20 systems across 6 domains and 4 regions" when the truth was 18 / 9 / 3.
   *
   * `sector` drift is already prevented structurally — it's a zod enum, so a new
   * vertical requires editing the enum on purpose. There is deliberately no
   * "sectors stay coarse" heuristic here; one existed briefly and was removed for
   * asserting something other than what its name claimed.
   */
  it('has 9 sectors across 18 systems', () => {
    expect(countSectors()).toBe(9)
    expect(SYSTEMS).toHaveLength(18)
  })

  it('counts 3 client regions and 4 map regions including home', () => {
    expect(countClientRegions()).toBe(3)
    expect(countRegions()).toBe(4)
  })

  /**
   * AIVA is Shyamsinh's own product (Woyce Tech), not a client contract, and it
   * ships to India. Both facts were wrong in the first draft — it was labelled a
   * US freelance contract, on the most prominent record on the site.
   *
   * These two tests pin the consequences: the record must not claim contract work,
   * and its Indian region must not leak into the client-region count, which would
   * assert a fourth client region that doesn't exist.
   */
  it('AIVA is an own product in IN, not a client contract', () => {
    const aiva = getBySlug('aiva')
    expect(aiva?.engagement).toBe('Own product')
    expect(aiva?.region).toBe('IN')
    expect(aiva?.role).not.toMatch(/contract/i)
  })

  /**
   * Every record needs its own number. A previous version derived it from
   * getFeatured(), which returns -1 for archive systems and fell back to 0 —
   * 13 of 18 records rendered as "RECORD 01".
   */
  it('gives every system a unique, stable record number', () => {
    const numbers = SYSTEMS.map((s) => recordNumber(s.slug))
    expect(new Set(numbers).size).toBe(SYSTEMS.length)
    expect(Math.min(...numbers)).toBe(1)
    expect(Math.max(...numbers)).toBe(SYSTEMS.length)
  })

  it('returns 0 for an unknown slug rather than silently colliding with record 1', () => {
    expect(recordNumber('nope')).toBe(0)
  })

  it('own products never inflate the client-region count', () => {
    const clientRegions = new Set(
      SYSTEMS.filter((s) => s.engagement === 'Client contract').map((s) => s.region),
    )
    expect(clientRegions.has('IN')).toBe(false)
    expect(countOwnProducts()).toBe(1)
  })
})
