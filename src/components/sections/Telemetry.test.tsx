import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Telemetry } from './Telemetry'
import { countClientRegions, countRegions, getTelemetryNodes } from '@/content'

describe('Telemetry', () => {
  it('renders without throwing and shows the telemetry heading', () => {
    render(<Telemetry />)
    expect(screen.getByText(/NODE: TELEMETRY/)).toBeInTheDocument()
  })

  it('uses countClientRegions (3), never countRegions (4), next to the systems claim', () => {
    render(<Telemetry />)
    // Sanity check the two counts really do differ in this dataset, so this test
    // cannot pass vacuously.
    expect(countClientRegions()).not.toBe(countRegions())
    // Match the claim line specifically, not a bare digit — the map's coordinate
    // readouts (e.g. "22.30°N") also contain digits and would make a loose match ambiguous.
    expect(
      screen.getByText(new RegExp(`ACROSS ${countClientRegions()} REGIONS`, 'i')),
    ).toBeInTheDocument()
    expect(screen.queryByText(/4 REGIONS/i)).not.toBeInTheDocument()
  })

  /**
   * The tally must encode the count exactly. A normalised bar would let a one-system region
   * render as a visible sliver of a big one; one mark per system cannot overstate anything.
   */
  it('draws one tally mark per delivered system', () => {
    const { container } = render(<Telemetry />)
    const { clients } = getTelemetryNodes()
    for (const c of clients) {
      const row = screen.getByText(c.region).closest('div')
      expect(row?.querySelectorAll('[aria-hidden="true"] > span')).toHaveLength(c.count)
    }
    // Scoped to the readout: the map is aria-hidden too, and it is not a tally.
    expect(container.querySelectorAll('dl [aria-hidden="true"]').length).toBe(clients.length)
  })

  /** Origin is where the work is done FROM. Listing it among the regions is countRegions()'s bug. */
  it('separates origin from the delivered-to regions', () => {
    render(<Telemetry />)
    const { home, clients } = getTelemetryNodes()
    const originRow = screen.getByText('ORIGIN').closest('div')
    expect(originRow).toHaveTextContent(home.label)
    expect(originRow).not.toHaveTextContent(/DELIVERED/)
    for (const c of clients) {
      expect(screen.getByText(c.region).closest('div')).not.toHaveTextContent('ORIGIN')
    }
  })
})
