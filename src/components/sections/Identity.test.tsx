import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Identity } from './Identity'
import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'

describe('Identity', () => {
  it('renders without throwing and shows the name and title', () => {
    render(<Identity />)
    expect(screen.getByRole('heading', { name: IDENTITY.name })).toBeInTheDocument()
    expect(screen.getByText(IDENTITY.title.toUpperCase())).toBeInTheDocument()
  })

  it('renders the derived stats line using countClientRegions, not countRegions', () => {
    render(<Identity />)
    const expected = `${yearsExperience()} YRS · ${countSystems()} SYSTEMS · ${countSectors()} SECTORS · ${countClientRegions()} CLIENT REGIONS`
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
