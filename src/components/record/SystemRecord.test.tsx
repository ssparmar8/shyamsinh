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
})
