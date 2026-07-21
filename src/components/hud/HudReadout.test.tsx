import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HudReadout } from './HudReadout'

// jsdom has no matchMedia → the reduced-motion path (stamp once, no interval).
describe('HudReadout', () => {
  it('renders a decorative, aria-hidden readout with the status + PID flavour', () => {
    const { container } = render(<HudReadout />)
    const el = container.querySelector('[aria-hidden="true"]')
    expect(el).toBeTruthy()
    expect(el?.textContent).toMatch(/LINK STABLE/)
    expect(el?.textContent).toMatch(/PID 4182/)
  })
})
