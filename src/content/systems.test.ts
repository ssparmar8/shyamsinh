import { describe, it, expect } from 'vitest'
import { SYSTEMS } from './systems'
import { SystemSchema, PRIVATE_HOSTS } from './schema'
import { IDENTITY } from './identity'
import { TITLE_MAX, DESCRIPTION_MAX } from '@/lib/seo'
import {
  getFeatured,
  getBySlug,
  getArchive,
  countSectors,
  countClientRegions,
  countRegions,
  countOwnProducts,
  recordNumber,
  getRelated,
  RELATED_COUNT,
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

/**
 * Every record must fit the search result it will appear in. These run in `prebuild`, so a
 * new system with a long name or a wordy summary fails the build instead of shipping a title
 * or description that Google writes down and never shows.
 */
describe('records fit the SERP', () => {
  it('no branded title exceeds the truncation point', () => {
    // Matches the composition in systems/[slug]/page.tsx: the record's own title, then the
    // root layout's `%s — ${IDENTITY.name}` template — with the domain suffix dropped, not
    // truncated mid-word, on the one record that overflows with it (Flourish Together
    // Therapy — Healthcare · booking, 67 characters against the 60-character budget).
    for (const s of SYSTEMS) {
      const recordTitle = `${s.name} — ${s.domain}`
      const withDomain = `${recordTitle} — ${IDENTITY.name}`
      const branded = withDomain.length <= TITLE_MAX ? withDomain : `${s.name} — ${IDENTITY.name}`
      expect(branded.length, `${s.slug}: "${branded}"`).toBeLessThanOrEqual(TITLE_MAX)
    }
  })

  it('no effective meta description exceeds the truncation point', () => {
    for (const s of SYSTEMS) {
      const desc = s.metaDescription ?? s.summary
      expect(desc.length, `${s.slug} — add a metaDescription`).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })

  /** An override only earns its place by being shorter than what it replaces. */
  it('every metaDescription override is shorter than the summary it stands in for', () => {
    for (const s of SYSTEMS.filter((x) => x.metaDescription)) {
      expect(s.metaDescription!.length, s.slug).toBeLessThan(s.summary.length)
    }
  })
})

describe('getRelated', () => {
  /** The whole point: no record page may be a crawlable dead end. */
  it('gives every record a full set of onward links', () => {
    for (const s of SYSTEMS) {
      expect(getRelated(s.slug), s.slug).toHaveLength(RELATED_COUNT)
    }
  })

  it('never links a record to itself', () => {
    for (const s of SYSTEMS) {
      expect(getRelated(s.slug).map((r) => r.slug)).not.toContain(s.slug)
    }
  })

  it('returns distinct records', () => {
    for (const s of SYSTEMS) {
      const slugs = getRelated(s.slug).map((r) => r.slug)
      expect(new Set(slugs).size, s.slug).toBe(slugs.length)
    }
  })

  /**
   * Sector is weighted above shared tooling on purpose. Half the archive uses Node.js, so a
   * stack-led ranking would surface the same handful of records from every page and the
   * section would stop meaning anything.
   */
  it('puts a same-sector record first whenever one exists', () => {
    for (const s of SYSTEMS) {
      const sameSector = SYSTEMS.filter((o) => o.slug !== s.slug && o.sector === s.sector)
      if (sameSector.length === 0) continue
      expect(getRelated(s.slug)[0].sector, s.slug).toBe(s.sector)
    }
  })

  /** Stable output, or every build emits different HTML and every deploy invalidates it. */
  it('is deterministic', () => {
    for (const s of SYSTEMS) {
      expect(getRelated(s.slug).map((r) => r.slug)).toEqual(getRelated(s.slug).map((r) => r.slug))
    }
  })

  it('returns nothing for an unknown slug rather than throwing', () => {
    expect(getRelated('nope')).toEqual([])
  })
})
