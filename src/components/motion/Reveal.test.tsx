import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Reveal } from './Reveal'

function setMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: reduced,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

// jsdom has no real layout or scroll, so it cannot drive a genuine
// ScrollTrigger — the real integration (does it fire, does it fire at the
// right scroll position, does Lenis's scroll reach it) is verified in
// Playwright (see tests/e2e), not here. This mock keeps the unit test
// focused on Reveal's own contract: content always renders, and reduced
// motion never applies the hidden/animated styling.
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(() => ({ kill: vi.fn() })),
    update: vi.fn(),
  },
}))

beforeEach(() => {
  vi.unstubAllGlobals()
  setMotion(false)
})

describe('Reveal', () => {
  it('always renders its children (content is never gated behind animation)', () => {
    render(
      <Reveal>
        <p>BEAT CONTENT</p>
      </Reveal>,
    )
    expect(screen.getByText('BEAT CONTENT')).toBeInTheDocument()
  })

  it('under reduced motion, children are fully visible with no animation styles', () => {
    setMotion(true)
    const { container } = render(
      <Reveal>
        <p>BEAT</p>
      </Reveal>,
    )
    // no opacity-0 / translate stuck state
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true)
  })

  it('under reduced motion, content still renders and carries no reveal class', () => {
    setMotion(true)
    const { container } = render(
      <Reveal>
        <p>BEAT</p>
      </Reveal>,
    )
    expect(screen.getByText('BEAT')).toBeInTheDocument()
    const el = container.firstElementChild as HTMLElement
    expect(el.className).not.toContain('opacity-0')
  })

  it('without reduced motion, the wrapper starts hidden, awaiting the scroll trigger', () => {
    const { container } = render(
      <Reveal>
        <p>BEAT</p>
      </Reveal>,
    )
    // Content is still present in the DOM even while visually hidden — only
    // the styling gates visibility, never the content itself.
    expect(screen.getByText('BEAT')).toBeInTheDocument()
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('opacity-0')
  })
})
