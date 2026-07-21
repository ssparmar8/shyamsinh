import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scene } from './Scene'
import { DecodeLine } from './layers/DecodeLine'
import { Rise } from './layers/Rise'

// Force scrub mode (wide + fine pointer + not reduced).
beforeEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('innerWidth', 1400)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

const created: Array<{ animation?: unknown }> = []
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    })),
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn((cfg: { animation?: unknown }) => {
      created.push(cfg)
      return { kill: vi.fn() }
    }),
    update: vi.fn(),
    refresh: vi.fn(),
  },
}))

describe('Scene + layers (scrub)', () => {
  it('renders all content and builds a scrub trigger with a timeline', () => {
    created.length = 0
    render(
      <Scene>
        <section>
          <DecodeLine text="LABEL" />
          <Rise>
            <p>BODY</p>
          </Rise>
        </section>
      </Scene>,
    )
    expect(screen.getByText('BODY')).toBeInTheDocument()
    expect(screen.getByText('LABEL')).toBeInTheDocument() // sr-only real string
    // Two-phase: an assemble trigger (with a timeline) + a hold trigger (pins).
    expect(created.length).toBeGreaterThanOrEqual(1)
    expect(created.some((c) => c.animation)).toBe(true)
  })
})
