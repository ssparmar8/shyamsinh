import { describe, it, expect } from 'vitest'
import { IDENTITY, yearsExperience } from './identity'
import { CAREER_START_YEAR } from './schema'

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
})
