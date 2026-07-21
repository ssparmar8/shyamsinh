import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TelemetryMap } from './TelemetryMap'

// jsdom provides no 2d canvas context and no matchMedia (so the reduced-motion path
// runs). The component must render its aria-hidden canvas gracefully and never draw —
// the accessible data lives in Telemetry.tsx's DOM, not in these pixels.
describe('TelemetryMap', () => {
  it('renders an aria-hidden canvas without throwing', () => {
    const { container } = render(<TelemetryMap />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
