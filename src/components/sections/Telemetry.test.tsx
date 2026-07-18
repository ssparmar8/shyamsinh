import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Telemetry } from './Telemetry'
import { countClientRegions, countRegions } from '@/content'

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
    expect(screen.getByText(new RegExp(String(countClientRegions())))).toBeInTheDocument()
    expect(screen.queryByText(/4 REGIONS/i)).not.toBeInTheDocument()
  })
})
