import { describe, it, expect } from 'vitest'
import { SYSTEMS } from './systems'
import { SystemSchema, PRIVATE_HOSTS } from './schema'
import { getFeatured, getBySlug, getArchive } from './index'

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
})
