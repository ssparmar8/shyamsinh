import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TypeOut } from './TypeOut'

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

describe('TypeOut', () => {
  it('exposes the real text to assistive tech from first paint', () => {
    render(<TypeOut text="An agentic operating system." />)
    expect(screen.getByText('An agentic operating system.')).toBeInTheDocument()
  })

  it('keeps the real text in the DOM even while typing', () => {
    const { container } = render(<TypeOut text="AI voice agents." />)
    expect(container.textContent).toContain('AI voice agents.')
  })

  it('hides the animated layer from assistive tech', () => {
    const { container } = render(<TypeOut text="Typed copy." />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('renders the requested element type', () => {
    render(<TypeOut as="p" text="Paragraph." />)
    expect(screen.getByText('Paragraph.').closest('p')).toBeTruthy()
  })

  it('renders plain text with no animated layer under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<TypeOut text="Plain copy." />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.textContent).toBe('Plain copy.')
  })
})
