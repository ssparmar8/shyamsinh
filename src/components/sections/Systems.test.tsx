import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Systems } from './Systems'
import { getFeatured } from '@/content'

// SystemRecord's names use ScrambleTextAnimated; the Rise wrappers render plain (no Scene
// context in this isolated render), so no gsap is pulled in. Mock kept minimal for safety.
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

  it('renders the systems heading (a DecodeLine, plain text outside a Scene)', () => {
    render(<Systems />)
    // Rendered in isolation there's no SceneContext, so DecodeLine renders one plain heading
    // node — the real text is present and accessible (the scrubbed noise layer only exists
    // inside a scrub Scene, verified in e2e).
    expect(screen.getByRole('heading', { name: 'NODE: SYSTEMS' })).toBeInTheDocument()
  })
})
