import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { CursorTrail } from './CursorTrail'

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

beforeEach(() => vi.unstubAllGlobals())

describe('CursorTrail', () => {
  it('renders nothing when the cursor gate is off (touch / reduced / SSR)', () => {
    setEnabled(false)
    const { container } = render(<CursorTrail />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an aria-hidden, non-interactive overlay when enabled', () => {
    setEnabled(true)
    const { container } = render(<CursorTrail />)
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).not.toBeNull()
    expect(overlay).toHaveClass('pointer-events-none')
  })
})
