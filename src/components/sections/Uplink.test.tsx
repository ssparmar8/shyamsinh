import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Uplink } from './Uplink'
import { IDENTITY } from '@/content/identity'

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
})
