import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HudTraces } from './HudTraces'

describe('HudTraces', () => {
  it('renders four decorative corner traces in an aria-hidden, click-through layer', () => {
    const { container } = render(<HudTraces />)
    const layer = container.querySelector('[aria-hidden="true"]')
    expect(layer?.className).toMatch(/pointer-events-none/)
    expect(container.querySelectorAll('svg')).toHaveLength(4)
  })
})
