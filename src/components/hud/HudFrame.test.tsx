import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HudFrame } from './HudFrame'

describe('HudFrame', () => {
  it('renders its children', () => {
    render(<HudFrame><p>RECORD_LOG</p></HudFrame>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('renders the label when given one', () => {
    render(<HudFrame label="ARCHIVE://"><p>x</p></HudFrame>)
    expect(screen.getByText('ARCHIVE://')).toBeInTheDocument()
  })

  it('points the contact link at /contact', () => {
    render(<HudFrame><p>x</p></HudFrame>)
    const link = screen.getByRole('link', { name: /uplink/i })
    expect(link).toHaveAttribute('href', '/contact')
  })

  /**
   * The chrome must be pinned to the viewport, not the document.
   *
   * `min-h-dvh` is a floor, not a cap: the box grows to content height, so
   * `absolute` chrome anchors to the document and scrolls away. Measured on a
   * 3096px page in a 964px viewport, mid-scroll showed no brackets and no contact
   * link — the escape hatch this component exists to provide, gone.
   *
   * jsdom does not lay out, so it cannot observe the outcome. This asserts the
   * mechanism; `tests/e2e/routes.spec.ts` scrolls a real browser and asserts the
   * outcome. Both are needed — this one alone would pass on a rewrite that broke it.
   */
  it('pins the contact link and label to the viewport, not the document', () => {
    render(<HudFrame label="ARCHIVE://"><p>x</p></HudFrame>)
    expect(screen.getByRole('link', { name: /uplink/i }).className).toMatch(/\bfixed\b/)
    expect(screen.getByText('ARCHIVE://').className).toMatch(/\bfixed\b/)
  })

  it('marks decorative brackets as hidden from assistive tech', () => {
    const { container } = render(<HudFrame><p>x</p></HudFrame>)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('never lets decorative layers swallow clicks meant for content', () => {
    const { container } = render(<HudFrame><p>x</p></HudFrame>)
    for (const el of container.querySelectorAll('[aria-hidden="true"].fixed')) {
      expect(el.className, 'a full-viewport decorative layer must not catch pointer events')
        .toMatch(/pointer-events-none/)
    }
  })
})
