import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HudFrame } from './HudFrame'

describe('HudFrame', () => {
  it('renders its children', () => {
    render(<HudFrame><p>RECORD_LOG</p></HudFrame>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('renders the label when given one', () => {
    render(<HudFrame label="ARCHIVE://"><p>x</p></HudFrame>)
    expect(screen.getByText('ARCHIVE://')).toBeInTheDocument()
  })

  it('exposes a persistent contact link at every depth', () => {
    render(<HudFrame><p>x</p></HudFrame>)
    const link = screen.getByRole('link', { name: /uplink/i })
    expect(link).toHaveAttribute('href', '/contact')
  })

  it('marks decorative brackets as hidden from assistive tech', () => {
    const { container } = render(<HudFrame><p>x</p></HudFrame>)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
})
