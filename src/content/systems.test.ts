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

  it('has 9 sectors across 18 systems', () => {
    expect(countSectors()).toBe(9)
    expect(SYSTEMS).toHaveLength(18)
  })

  it('counts 3 client regions and 4 map regions including home', () => {
    expect(countClientRegions()).toBe(3)
    expect(countRegions()).toBe(4)
  })

  it('keeps sectors coarse — no sector has only one system unless it genuinely stands alone', () => {
    // Guard against sector-per-project drift, which would make the count meaningless
    // again. If this fires, the sector list has grown too fine-grained.
    expect(countSectors()).toBeLessThanOrEqual(SYSTEMS.length / 2)
  })
})
