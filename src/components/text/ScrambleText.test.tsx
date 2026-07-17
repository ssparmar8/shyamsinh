import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrambleText } from './ScrambleText'

describe('ScrambleText', () => {
  it('exposes the real text to the accessibility tree', () => {
    render(<ScrambleText text="SHYAMSINH PARMAR" />)
    expect(screen.getByText('SHYAMSINH PARMAR')).toBeInTheDocument()
  })

  it('renders as plain text when not animated', () => {
    const { container } = render(<ScrambleText text="AI ARCHITECT" />)
    expect(container.textContent).toBe('AI ARCHITECT')
  })

  it('renders the given element type', () => {
    render(<ScrambleText as="h1" text="RECORD" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RECORD')
  })

  it('applies the supplied class name', () => {
    const { container } = render(<ScrambleText text="X" className="text-dim" />)
    expect(container.firstChild).toHaveClass('text-dim')
  })
})
