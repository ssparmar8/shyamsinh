import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Trajectory } from './Trajectory'
import { TRAJECTORY, CONTINUITY } from '@/content/trajectory'

describe('Trajectory', () => {
  it('renders all 5 trajectory node labels', () => {
    render(<Trajectory />)
    expect(TRAJECTORY.length).toBe(5)
    for (const node of TRAJECTORY) {
      expect(screen.getByText(node.label)).toBeInTheDocument()
    }
  })

  it('renders the continuity footer label', () => {
    render(<Trajectory />)
    expect(screen.getByText(CONTINUITY)).toBeInTheDocument()
  })

  it('renders a heading identifying this as the trajectory node', () => {
    render(<Trajectory />)
    expect(screen.getByText(/NODE: TRAJECTORY/)).toBeInTheDocument()
  })
})
