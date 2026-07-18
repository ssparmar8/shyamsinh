import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchiveIndex } from './ArchiveIndex'
import { getArchive } from '@/content'

describe('ArchiveIndex', () => {
  it('renders 12 rows, each linking to its own /systems/[slug]', () => {
    render(<ArchiveIndex />)
    const archive = getArchive()
    expect(archive.length).toBe(12)
    for (const system of archive) {
      const link = screen.getByRole('link', { name: new RegExp(system.name) })
      expect(link).toHaveAttribute('href', `/systems/${system.slug}`)
    }
  })

  it('links to the full archive index route', () => {
    render(<ArchiveIndex />)
    expect(screen.getByRole('link', { name: /FULL ARCHIVE INDEX/i })).toHaveAttribute(
      'href',
      '/archive',
    )
  })

  it('renders a heading identifying this as the archive index node', () => {
    render(<ArchiveIndex />)
    expect(screen.getByText(/NODE: ARCHIVE INDEX/)).toBeInTheDocument()
  })
})
