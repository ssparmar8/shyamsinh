import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryOverlay } from './EntryOverlay'

function setMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: reduced, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
}

beforeEach(() => {
  vi.unstubAllGlobals()
  setMotion(false)
})

describe('EntryOverlay', () => {
  /** Non-negotiable #1: content is never gated from a crawler or a no-JS visitor. */
  it('always renders its children', async () => {
    render(<EntryOverlay><p>RECORD_LOG</p></EntryOverlay>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('goes straight to the boot sequence', async () => {
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    expect(await screen.findByText(/LOADING/i)).toBeInTheDocument()
  })

  /**
   * A modal must remove background content from focus/interaction, not merely
   * claim `aria-modal`. Without `inert`, Tab reaches the content behind the boot
   * before the boot's own button.
   */
  it('makes background content inert while the boot is up, and interactive again after', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <EntryOverlay>
        <a href="/somewhere">BACKGROUND LINK</a>
      </EntryOverlay>,
    )
    await screen.findByText(/LOADING/i)
    const wrapper = container.querySelector('a')!.parentElement!
    expect(wrapper.hasAttribute('inert')).toBe(true)

    await user.click(await screen.findByRole('button', { name: /SKIP/i })) // → done
    await waitFor(() => expect(wrapper.hasAttribute('inert')).toBe(false))
  })

  /** Non-negotiable #3: reduced motion gets content, not a performance. */
  it('shows no boot under reduced motion', async () => {
    setMotion(true)
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await waitFor(() => {
      expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument()
    })
  })

  it('offers a skip during boot', async () => {
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    expect(await screen.findByRole('button', { name: /SKIP/i })).toBeInTheDocument()
  })

  it('dismisses everything when skip is pressed', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /SKIP/i }))
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })

  it('lets Escape dismiss the boot', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await screen.findByText(/LOADING/i)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })
})
