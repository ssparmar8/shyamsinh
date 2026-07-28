import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Identity } from './Identity'
import { IDENTITY, availabilityLabel, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions, countRegions } from '@/content'

/** The <li> holding a given stat label, so a figure is asserted against its own caption. */
const statCell = (label: string) => screen.getByText(label).closest('li')

describe('Identity', () => {
  it('renders without throwing and shows the name and title', () => {
    render(<Identity />)
    expect(screen.getByRole('heading', { name: IDENTITY.name })).toBeInTheDocument()
    expect(screen.getByText(IDENTITY.title.toUpperCase())).toBeInTheDocument()
  })

  it('states what the work is, not just who he is', () => {
    render(<Identity />)
    expect(screen.getByText(IDENTITY.pitch)).toBeInTheDocument()
  })

  it('shows the availability status', () => {
    render(<Identity />)
    expect(screen.getByText(availabilityLabel())).toBeInTheDocument()
  })

  it('offers a route into the work and a route to contact', () => {
    render(<Identity />)
    expect(screen.getByRole('link', { name: /VIEW THE ARCHIVE/ })).toHaveAttribute(
      'href',
      '/archive',
    )
    expect(screen.getByRole('link', { name: /START AN UPLINK/ })).toHaveAttribute(
      'href',
      '/contact',
    )
  })

  it('pairs every derived figure with its own caption', () => {
    render(<Identity />)
    expect(statCell('YRS')).toHaveTextContent(String(yearsExperience()))
    expect(statCell('SYSTEMS')).toHaveTextContent(String(countSystems()))
    expect(statCell('SECTORS')).toHaveTextContent(String(countSectors()))
  })

  /**
   * The regions figure is the one number on this page that can become a false claim: it sits
   * beside a systems count, so countRegions() there would read "work delivered to 4 regions"
   * when one of those four is his own base. See src/content/index.ts.
   */
  it('counts regions with countClientRegions, not countRegions', () => {
    render(<Identity />)
    expect(statCell('CLIENT REGIONS')).toHaveTextContent(String(countClientRegions()))
    expect(countClientRegions()).toBeLessThan(countRegions())
  })
})
