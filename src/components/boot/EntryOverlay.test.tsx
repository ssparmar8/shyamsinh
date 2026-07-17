import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryOverlay } from './EntryOverlay'
import { GATE_KEY } from '@/components/gate/gateStorage'

function setMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: reduced, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
}

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  setMotion(false)
})

describe('EntryOverlay', () => {
  /** Non-negotiable #1: content is never gated from a crawler or a no-JS visitor. */
  it('always renders its children', async () => {
    render(<EntryOverlay><p>RECORD_LOG</p></EntryOverlay>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('shows the gate to a first-time visitor', async () => {
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    expect(await screen.findByText(/OUTPUT ROUTING/i)).toBeInTheDocument()
  })

  it('never shows the gate to a visitor who already chose', async () => {
    localStorage.setItem(GATE_KEY, 'off')
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await waitFor(() => expect(screen.queryByText(/OUTPUT ROUTING/i)).not.toBeInTheDocument())
  })

  /** Non-negotiable #3: reduced motion gets content, not a performance. */
  it('shows neither gate nor boot under reduced motion', async () => {
    setMotion(true)
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await waitFor(() => {
      expect(screen.queryByText(/OUTPUT ROUTING/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument()
    })
  })

  it('records the choice so the gate never returns', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(localStorage.getItem(GATE_KEY)).toBe('off')
  })

  it('moves to the boot sequence after a choice', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(await screen.findByText(/LOADING/i)).toBeInTheDocument()
  })

  it('offers a skip during boot', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(await screen.findByRole('button', { name: /SKIP/i })).toBeInTheDocument()
  })

  it('dismisses everything when skip is pressed', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    await user.click(await screen.findByRole('button', { name: /SKIP/i }))
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })

  it('lets Escape dismiss the boot', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })
})
