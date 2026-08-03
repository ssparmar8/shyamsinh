import { describe, it, expect } from 'vitest'
import { IDENTITY, AVAILABILITY, availabilityLabel, yearsExperience, SITE_URL } from './identity'
import { CAREER_START_YEAR } from './schema'

/**
 * Runs in `prebuild`, which is the point: every failure below ships a social card that
 * looks fine locally and is broken for every crawler, with nothing in the build to say so.
 */
describe('SITE_URL', () => {
  it('is an absolute https origin', () => {
    expect(() => new URL(SITE_URL)).not.toThrow()
    expect(new URL(SITE_URL).protocol).toBe('https:')
  })

  /**
   * `metadataBase` composes with leading-slash paths, and localhost is what Next silently
   * falls back to when the base is missing — a card pointing at the developer's machine.
   */
  it('is not localhost', () => {
    expect(new URL(SITE_URL).hostname).not.toMatch(/^(localhost|127\.|0\.0\.0\.0)/)
  })

  /** No trailing slash and no path: everything downstream appends its own. */
  it('is a bare origin', () => {
    expect(SITE_URL).not.toMatch(/\/$/)
    expect(new URL(SITE_URL).pathname).toBe('/')
    expect(new URL(SITE_URL).search).toBe('')
  })
})

describe('IDENTITY', () => {
  it('has a well-formed https url for every link', () => {
    for (const l of IDENTITY.links) {
      expect(() => new URL(l.href), `${l.label} is not a url`).not.toThrow()
      expect(new URL(l.href).protocol, `${l.label} is not https`).toBe('https:')
    }
  })

  /**
   * Share links carry attribution telemetry — Upwork's own share button hands out
   * `?mp_source=share`. That belongs to the act of sharing, not to the address, and
   * shipping it tells the destination where every visitor came from. Strip it.
   */
  it('carries no tracking parameters', () => {
    for (const l of IDENTITY.links) {
      expect(new URL(l.href).search, `${l.label} has a query string`).toBe('')
    }
  })

  /**
   * lib/jsonLd.ts splits this into addressLocality/addressRegion. Reformatting it to
   * "Rajkot (Gujarat)" or back to "Gujarat, India" would not throw — it would quietly emit a
   * Person graph with the region in the locality slot, or an undefined region, and the only
   * symptom would be local search results that never arrive.
   */
  it('states the location as "City, Region, Country"', () => {
    const parts = IDENTITY.location.split(',').map((p) => p.trim())
    expect(parts).toHaveLength(3)
    expect(parts.every((p) => p.length > 0)).toBe(true)
  })

  /**
   * schema.org sameAs asserts "this URL is this person". The Woyce Tech row is an
   * organisation and the LinkedIn row is marked UNCONFIRMED in identity.ts; either one in the
   * graph teaches search engines the wrong entity, which is worse than shipping no graph.
   */
  it('never claims an organisation or an unconfirmed profile as sameAs', () => {
    const byLabel = (l: string) => IDENTITY.links.find((x) => x.label === l)
    expect(byLabel('WOYCE TECH')?.sameAs).toBe(false)
    expect(byLabel('LINKEDIN')?.sameAs).toBe(false)
    // And at least one row must survive, or the graph resolves no entity at all.
    expect(IDENTITY.links.filter((l) => l.sameAs).length).toBeGreaterThan(0)
  })

  it('has unique, non-empty labels', () => {
    const labels = IDENTITY.links.map((l) => l.label)
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels.every((l) => l.length > 0)).toBe(true)
  })

  it('derives years of experience from the anchor rather than hardcoding it', () => {
    expect(yearsExperience(2026)).toBe(2026 - CAREER_START_YEAR)
    expect(yearsExperience(2030)).toBe(2030 - CAREER_START_YEAR)
  })

  it('has a plausible email', () => {
    expect(IDENTITY.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })

  /** The hero renders it as one paragraph — a second sentence would wrap past the beat. */
  it('has a one-sentence pitch', () => {
    expect(IDENTITY.pitch.trim().length).toBeGreaterThan(0)
    expect(IDENTITY.pitch.match(/\./g) ?? []).toHaveLength(1)
  })

  /**
   * Both branches must stay reachable. If `open` ever narrows to a literal type again, the
   * booked case becomes dead code and the site can no longer say he is unavailable.
   */
  it('can express both availability states', () => {
    expect(availabilityLabel({ ...AVAILABILITY, open: true })).toBe(AVAILABILITY.openLabel)
    expect(availabilityLabel({ ...AVAILABILITY, open: false })).toBe(AVAILABILITY.closedLabel)
    expect(availabilityLabel()).toBe(
      AVAILABILITY.open ? AVAILABILITY.openLabel : AVAILABILITY.closedLabel,
    )
  })
})
