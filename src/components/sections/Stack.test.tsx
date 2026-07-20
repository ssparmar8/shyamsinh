import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack } from './Stack'

// No matchMedia stub: jsdom has none, so usePrefersReducedMotion returns true and
// the ScrambleTextAnimated heading renders as plain text — exactly what these
// content-presence assertions want.
describe('Stack', () => {
  it('renders the stack node heading', () => {
    render(<Stack />)
    expect(screen.getByText(/NODE: STACK/)).toBeInTheDocument()
  })

  it('renders every architecture capability area', () => {
    render(<Stack />)
    for (const area of [
      'SOLUTION ARCHITECTURE',
      'LLM & AGENT SYSTEMS',
      'RETRIEVAL & DATA',
      'PLATFORM ENGINEERING',
      'RELIABILITY & GOVERNANCE',
      'DELIVERY LEADERSHIP',
    ]) {
      expect(screen.getByText(area)).toBeInTheDocument()
    }
  })

  it('renders the technical stack groups and representative tools', () => {
    render(<Stack />)
    for (const group of ['AI', 'DATA', 'BACKEND', 'CLOUD', 'INTEGRATION']) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL / pgvector')).toBeInTheDocument()
    expect(screen.getByText(/Twilio \(Voice/)).toBeInTheDocument()
  })
})
