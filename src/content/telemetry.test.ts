import { describe, it, expect } from 'vitest'
import { getTelemetryNodes, countClientRegions } from './index'

describe('telemetry nodes', () => {
  it('home is the Gujarat / IN node', () => {
    const { home } = getTelemetryNodes()
    expect(home.region).toBe('IN')
    expect(home.label).toMatch(/GUJARAT/)
  })

  it('has one client node per distinct client region, matching countClientRegions()', () => {
    const { clients } = getTelemetryNodes()
    expect(clients.length).toBe(countClientRegions())
    expect(new Set(clients.map((c) => c.region))).toEqual(new Set(['US', 'CA', 'DK']))
  })

  it('every client node has a positive delivered count and finite coordinates', () => {
    const { clients } = getTelemetryNodes()
    for (const c of clients) {
      expect(c.count).toBeGreaterThan(0)
      expect(Number.isFinite(c.lat) && Number.isFinite(c.lon)).toBe(true)
    }
  })

  it('never lists the home region as a client node', () => {
    const { clients } = getTelemetryNodes()
    expect(clients.some((c) => c.region === 'IN')).toBe(false)
  })
})
