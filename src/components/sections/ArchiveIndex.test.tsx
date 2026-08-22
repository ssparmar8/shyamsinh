import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArchiveIndex } from './ArchiveIndex'
import { getArchive, getFeatured } from '@/content'

describe('ArchiveIndex', () => {
  it('renders 14 rows, each linking to its own /systems/[slug]', () => {
    render(<ArchiveIndex />)
    const archive = getArchive()
    // 14 since 2026-08-22: Goodfin and Chroma Data were recovered from the portfolio
    // decks. Both land in the archive, not the featured six, so this count moved and the
    // featured count did not.
    expect(archive.length).toBe(14)
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

  /** Both counts derive from the data, so splitting a record between the two lists can't lie. */
  it('says these records are the ones beyond the featured six', () => {
    render(<ArchiveIndex />)
    expect(
      screen.getByText(`${getArchive().length} SYSTEMS BEYOND THE ${getFeatured().length} FEATURED ABOVE`),
    ).toBeInTheDocument()
  })

  /**
   * The domain is what tells a reader what a record IS. It used to be `hidden` below md, so a
   * phone got a name and a year — it must be present at every width, moved rather than dropped.
   */
  it('keeps every column present in the markup, including the domain', () => {
    render(<ArchiveIndex />)
    for (const system of getArchive()) {
      const row = screen.getByRole('link', { name: new RegExp(system.name) })
      expect(row).toHaveTextContent(system.domain)
      expect(row).toHaveTextContent(`${system.region} · ${system.year}`)
    }
  })

  it('captions the columns', () => {
    render(<ArchiveIndex />)
    for (const caption of ['NO', 'SYSTEM', 'DOMAIN', 'REGION · YEAR']) {
      expect(screen.getByText(caption)).toBeInTheDocument()
    }
  })
})
