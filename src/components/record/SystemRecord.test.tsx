import { describe, it, expect } from 'vitest'
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

describe('SystemRecord', () => {
  it('renders name, domain, role, and year', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText(/led a small team/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
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
})
