import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Systems } from './Systems'
import { getFeatured } from '@/content'

describe('Systems', () => {
  it('renders 6 featured systems as records with distinct names', () => {
    render(<Systems />)
    const featured = getFeatured()
    expect(featured.length).toBe(6)
    const names = new Set(featured.map((s) => s.name))
    expect(names.size).toBe(6)
    for (const name of names) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders a heading identifying this as the systems node', () => {
    render(<Systems />)
    expect(screen.getByText(/NODE: SYSTEMS/)).toBeInTheDocument()
  })
})
