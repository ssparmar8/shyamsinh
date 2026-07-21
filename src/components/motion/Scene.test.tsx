import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scene } from './Scene'

function setEnv(mode: 'static' | 'reveal' | 'scrub') {
  const reduced = mode === 'static'
  const coarse = mode === 'reveal'
  vi.stubGlobal('innerWidth', 1400)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('coarse') ? coarse : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

// Same jsdom-can't-drive-ScrollTrigger stubbing as Reveal.test.tsx.
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
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })), update: vi.fn(), refresh: vi.fn() },
}))

beforeEach(() => vi.unstubAllGlobals())

describe('Scene', () => {
  it('always renders children (content never gated) in every mode', () => {
    for (const mode of ['static', 'reveal', 'scrub'] as const) {
      setEnv(mode)
      const { unmount } = render(
        <Scene>
          <p>BEAT {mode}</p>
        </Scene>,
      )
      expect(screen.getByText(`BEAT ${mode}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('static mode wraps in nothing (no reveal/pin styling)', () => {
    setEnv('static')
    const { container } = render(
      <Scene>
        <p>BEAT</p>
      </Scene>,
    )
    // children rendered directly; the <p> is the first element, no wrapper div class
    expect(container.querySelector('p')).toBe(container.firstElementChild)
  })

  it('reveal mode starts hidden awaiting the one-shot trigger', () => {
    setEnv('reveal')
    const { container } = render(
      <Scene>
        <p>BEAT</p>
      </Scene>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('opacity-0')
  })
})
