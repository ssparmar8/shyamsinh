import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Systems } from './Systems'
import { getFeatured } from '@/content'

// Systems now wraps each record in <Reveal>, which imports gsap + ScrollTrigger.
// jsdom can't drive a real ScrollTrigger, so mock it (same shape as Reveal.test.tsx).
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })), update: vi.fn() },
}))

// Motion allowed + IO fires, so the scrambled heading/names mount their sr-only layer.
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

describe('Systems', () => {
  it('renders 6 featured systems as records with distinct names', () => {
    render(<Systems />)
    const featured = getFeatured()
    expect(featured.length).toBe(6)
    const names = new Set(featured.map((s) => s.name))
    expect(names.size).toBe(6)
    for (const name of names) {
      // each name is the accessible (sr-only) text of its record's decode layer.
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders the systems heading as a decode layer, keeping the real text accessible', () => {
    render(<Systems />)
    // After the swap the heading is ScrambleTextAnimated: the real text lives in an
    // sr-only span. Against the old plain <h2> this element has no sr-only class.
    expect(screen.getByText('NODE: SYSTEMS')).toHaveClass('sr-only')
  })
})
