import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HudFrame } from './HudFrame'

describe('HudFrame', () => {
  it('renders its children', () => {
    render(<HudFrame><p>RECORD_LOG</p></HudFrame>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  /** The top row carries no route label and no contact link. */
  it('renders no header chrome in the top row', () => {
    render(<HudFrame><p>x</p></HudFrame>)
    expect(screen.queryByText('ARCHIVE://')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /uplink/i })).not.toBeInTheDocument()
  })

  /**
   * The chrome must be pinned to the viewport, not the document.
   *
   * `min-h-dvh` is a floor, not a cap: the box grows to content height, so
   * `absolute` chrome anchors to the document and scrolls away. Measured on a
   * 3096px page in a 964px viewport, mid-scroll showed no brackets at all.
   *
   * jsdom does not lay out, so it cannot observe the outcome. This asserts the
   * mechanism only.
   */
  it('pins its chrome to the viewport, not the document', () => {
    const { container } = render(<HudFrame><p>x</p></HudFrame>)
    expect(container.querySelectorAll('.fixed').length).toBeGreaterThan(0)
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
