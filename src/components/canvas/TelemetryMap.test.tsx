import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TelemetryMap } from './TelemetryMap'
import type { TelemetryNode } from '@/content'

// Fixtures, not getTelemetryNodes(): the component takes nodes as props precisely so it
// never reaches into '@/content' itself (that import shipped schema.ts to the browser).
// A test that called the real accessor would re-couple the two in the one place that
// should prove they are apart.
const home: TelemetryNode = { region: 'IN', lat: 22, lon: 71, label: 'IN', count: 0 }
const clients: TelemetryNode[] = [{ region: 'US', lat: 39, lon: -98, label: 'US', count: 3 }]

// jsdom provides no 2d canvas context and no matchMedia (so the reduced-motion path
// runs). The component must render its aria-hidden canvas gracefully and never draw —
// the accessible data lives in Telemetry.tsx's DOM, not in these pixels.
describe('TelemetryMap', () => {
  it('renders an aria-hidden canvas without throwing', () => {
    const { container } = render(<TelemetryMap home={home} clients={clients} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
