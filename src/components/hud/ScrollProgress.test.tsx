import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScrollProgress } from './ScrollProgress'

describe('ScrollProgress', () => {
  it('renders an aria-hidden, non-interactive indicator starting at 000', () => {
    const { container } = render(<ScrollProgress />)
    const root = container.querySelector('[aria-hidden="true"]')
    expect(root).not.toBeNull()
    expect(root).toHaveClass('pointer-events-none')
    expect(container.querySelector('[data-testid="scroll-pct"]')?.textContent).toBe('000')
  })

  it('hides itself when the page is too short to scroll', () => {
    const { container } = render(<ScrollProgress />)
    const root = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(root.style.display).toBe('none')
  })
})
