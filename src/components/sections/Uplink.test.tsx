import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Uplink } from './Uplink'
import { IDENTITY, availabilityLabel } from '@/content/identity'

describe('Uplink', () => {
  it('renders without throwing and shows a mailto link with the email', () => {
    render(<Uplink />)
    const link = screen.getByRole('link', { name: IDENTITY.email })
    expect(link).toHaveAttribute('href', `mailto:${IDENTITY.email}`)
  })

  it('renders every identity link', () => {
    render(<Uplink />)
    for (const l of IDENTITY.links) {
      expect(screen.getByRole('link', { name: new RegExp(l.label) })).toHaveAttribute(
        'href',
        l.href,
      )
    }
  })

  /** The beat where someone decides to make contact must say whether he is taking work. */
  it('states availability, like the hero does', () => {
    render(<Uplink />)
    expect(screen.getByText(availabilityLabel())).toBeInTheDocument()
  })

  /** The phone is a channel a client can act on now, not a footnote under the address. */
  it('offers the phone as a dialable link', () => {
    render(<Uplink />)
    const tel = screen.getByRole('link', { name: IDENTITY.phone })
    expect(tel).toHaveAttribute('href', `tel:${IDENTITY.phone.replace(/\s/g, '')}`)
  })

  it('captions each channel', () => {
    render(<Uplink />)
    for (const caption of ['EMAIL', 'PHONE', 'BASE']) {
      expect(screen.getByText(caption)).toBeInTheDocument()
    }
  })
})
