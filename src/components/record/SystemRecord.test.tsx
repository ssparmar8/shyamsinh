import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemRecord } from './SystemRecord'
import type { System } from '@/content/schema'

const live: System = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  sector: 'Conversational AI',
  region: 'US',
  engagement: 'Client contract',
  year: 2025,
  role: 'Architecture + led a small team · freelance contract',
  stack: ['Twilio', 'OpenAI'],
  summary: 'AI voice agents.',
  url: 'https://aivachat.io/',
  status: 'LIVE',
  featured: true,
}

const priv: System = { ...live, slug: 'mof', name: 'MOF', status: 'PRIVATE', url: undefined }

// Exercise the ANIMATED path: without these stubs jsdom has no matchMedia, so the
// components fall back to reduced-motion (plain text) and the animated wiring goes
// untested. matches:false = motion allowed; IO fires immediately so the decode/type
// mounts its aria-hidden layers.
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never) }
    disconnect() {}
    unobserve() {}
  })
})

describe('SystemRecord', () => {
  it('renders name, domain, role, and year', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText(/led a small team/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('keeps the name as accessible text even while it decodes', () => {
    const { container } = render(<SystemRecord system={live} index={0} />)
    expect(container.querySelector('.sr-only')?.textContent).toContain('AIVA Chat')
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('keeps the summary as accessible text while it types out', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AI voice agents.')).toBeInTheDocument()
  })

  it('renders each stack entry', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('Twilio')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
  })

  it('links out to a LIVE system, opening safely in a new tab', () => {
    render(<SystemRecord system={live} index={0} />)
    const link = screen.getByRole('link', { name: /aivachat\.io/i })
    expect(link).toHaveAttribute('href', 'https://aivachat.io/')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders no outbound link for a PRIVATE system', () => {
    render(<SystemRecord system={priv} index={1} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/PRIVATE/)).toBeInTheDocument()
  })

  it('shows the status of a LIVE system, not only of a private one', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  /**
   * A record must contain no aria-hidden nodes: that is the signal a reduced-motion e2e uses
   * to assert the decode/type noise layers are absent. Decorations therefore go in CSS — a
   * decorative node here would mask a real regression there.
   */
  it('draws the status marker without adding a node to the record', () => {
    const { container } = render(<SystemRecord system={live} index={0} animate={false} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.querySelector('.status-mark')).toBeTruthy()
  })

  it('links to its own record page when given one', () => {
    render(<SystemRecord system={live} index={0} recordHref="/systems/aiva" />)
    expect(screen.getByRole('link', { name: /OPEN RECORD/ })).toHaveAttribute(
      'href',
      '/systems/aiva',
    )
  })

  /** The record page IS the record; a card there linking to itself is a dead control. */
  it('offers no record link when none is given', () => {
    render(<SystemRecord system={live} index={0} animate={false} />)
    expect(screen.queryByRole('link', { name: /OPEN RECORD/ })).not.toBeInTheDocument()
  })

  /** A PRIVATE system has nothing public to point at, but its case study is still readable. */
  it('offers the record link even when there is no outbound url', () => {
    render(<SystemRecord system={priv} index={1} recordHref="/systems/mof" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/systems/mof')
  })

  it('renders a 1-based padded record number', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText(/RECORD 01/)).toBeInTheDocument()
  })

  it('marks an own product as such, never as a contract', () => {
    const own: System = { ...live, engagement: 'Own product', role: 'Own product · built and operated under Woyce Tech' }
    render(<SystemRecord system={own} index={0} />)
    expect(screen.getByText(/Own product/)).toBeInTheDocument()
  })

  it('renders name, domain, and summary as plain text under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<SystemRecord system={live} index={0} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText('AI voice agents.')).toBeInTheDocument()
  })

  it('renders plain text with no animated layer when animate is false, even with motion allowed', () => {
    // beforeEach allows motion (matches:false); animate={false} (the static detail
    // route) must still force plain text — no decode/type layer at all.
    const { container } = render(<SystemRecord system={live} index={0} animate={false} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText('AI voice agents.')).toBeInTheDocument()
  })
})
