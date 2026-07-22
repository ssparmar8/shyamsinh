import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MagneticLink } from './MagneticLink'

function setEnabled(on: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? false : q.includes('fine') ? on : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

/**
 * Deterministic rAF stub: `requestAnimationFrame` records callbacks instead of
 * scheduling them, and `cancelAnimationFrame` removes them from the queue — the
 * same contract real browsers give, just synchronous and inspectable. Callers
 * flush the queue explicitly with `flush()` instead of waiting on real frames,
 * so the regression test below can't be flaky.
 */
function stubRaf() {
  let nextId = 0
  const scheduled = new Map<number, FrameRequestCallback>()
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      const id = ++nextId
      scheduled.set(id, cb)
      return id
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => {
      scheduled.delete(id)
    }),
  )
  return {
    pending: () => scheduled.size,
    flush: (now: number) => {
      for (const cb of Array.from(scheduled.values())) cb(now)
    },
  }
}

beforeEach(() => vi.unstubAllGlobals())

describe('MagneticLink', () => {
  it('disabled: renders a plain link with the text and no aria-hidden layer', () => {
    setEnabled(false)
    const { container } = render(<MagneticLink href="/contact" text="UPLINK" />)
    const link = screen.getByRole('link', { name: 'UPLINK' })
    expect(link).toHaveAttribute('href', '/contact')
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('enabled: keeps the real text as the accessible name via an sr-only node', () => {
    setEnabled(true)
    render(<MagneticLink href="/contact" text="UPLINK" />)
    // Accessible name still resolves to the real string (sr-only), never the noise layer.
    expect(screen.getByRole('link', { name: 'UPLINK' })).toHaveAttribute('href', '/contact')
  })

  it('children mode: wraps children and links to href', () => {
    setEnabled(false)
    render(
      <MagneticLink href="/systems/aiva">
        <span>AIVA</span>
      </MagneticLink>,
    )
    expect(screen.getByRole('link', { name: 'AIVA' })).toHaveAttribute('href', '/systems/aiva')
  })

  /**
   * Regression: the hover-decode rAF must be cancelled on pointer-leave, not just
   * left to run to completion. Without the cancel, a decode frame scheduled right
   * before the cursor leaves fires afterward and re-scrambles the label — the bug
   * this test pins.
   *
   * Deterministic by construction: a stubbed rAF queue replaces real frame timing,
   * so "flush whatever's still scheduled after pointer-leave" is not a timing race,
   * it's a direct check of what onLeave did or didn't cancel. Fails against the old
   * (uncancelled) onEnter/onLeave; passes with the decodeRaf-ref + stopDecode fix.
   */
  it('cancels the in-flight decode rAF on pointer-leave (no stale re-scramble)', () => {
    setEnabled(true)
    const raf = stubRaf()

    render(<MagneticLink href="/contact" text="UPLINK" />)
    const link = screen.getByRole('link', { name: 'UPLINK' })

    act(() => {
      fireEvent.pointerEnter(link)
    })
    expect(raf.pending()).toBeGreaterThan(0) // decode frame scheduled

    act(() => {
      fireEvent.pointerLeave(link)
    })

    // Flush whatever is left in the queue after leave (e.g. the magnetic-transform
    // rAF from runRaf). If the decode rAF was properly cancelled, none of the
    // flushed callbacks can resurrect a scrambled frame.
    act(() => {
      raf.flush(performance.now() + 50)
    })

    const noise = link.querySelector('[aria-hidden="true"]')
    expect(noise?.textContent).toBe('UPLINK')
  })
})
