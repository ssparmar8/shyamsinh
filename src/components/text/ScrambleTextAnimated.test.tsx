import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrambleTextAnimated } from './ScrambleTextAnimated'

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

describe('ScrambleTextAnimated', () => {
  /**
   * The single most important property. Noise must never reach the accessibility
   * tree — a screen reader hearing "$G#J5KF#V" instead of the name is a total
   * failure, and it is invisible in a screenshot.
   */
  it('exposes the real text to assistive tech from first paint', () => {
    render(<ScrambleTextAnimated text="SHYAMSINH PARMAR" />)
    expect(screen.getByText('SHYAMSINH PARMAR')).toBeInTheDocument()
  })

  it('hides the decorative noise layer from assistive tech', () => {
    const { container } = render(<ScrambleTextAnimated text="SHYAMSINH" />)
    const noise = container.querySelector('[aria-hidden="true"]')
    expect(noise).toBeTruthy()
  })

  it('keeps the real text in the DOM even while animating', () => {
    const { container } = render(<ScrambleTextAnimated text="AI ARCHITECT" />)
    expect(container.textContent).toContain('AI ARCHITECT')
  })

  it('renders the requested element type', () => {
    render(<ScrambleTextAnimated as="h1" text="RECORD" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RECORD')
  })

  it('renders plain, un-noised text under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<ScrambleTextAnimated text="AI ARCHITECT" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.textContent).toBe('AI ARCHITECT')
  })
})
