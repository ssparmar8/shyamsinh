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

  /**
   * The interval belongs to the gap between two nodes, not to the row it precedes. Joined to
   * `detail` it read "+3 YRS · Sanjaybhai Rajguru · CGPA 8.68" — three years as a property of
   * the college. Asserting they are separate elements is what keeps them from being rejoined.
   */
  it('keeps the interval separate from the node detail', () => {
    render(<Trajectory />)
    const withSpan = TRAJECTORY.filter((n) => n.span && n.detail)
    expect(withSpan.length).toBeGreaterThan(0)
    for (const node of withSpan) {
      expect(screen.queryByText(`${node.span} · ${node.detail}`)).not.toBeInTheDocument()
      // getAllByText: '+3 YRS' is a legitimately repeated interval (2012→2015, 2015→2018).
      expect(screen.getAllByText(node.span).length).toBe(
        TRAJECTORY.filter((n) => n.span === node.span).length,
      )
      expect(screen.getByText(node.detail)).toBeInTheDocument()
    }
  })

  /** 'TRADE' describes the 2012 programme; only intervals belong on the rail. */
  it('keeps a node-qualifying note on its own row', () => {
    render(<Trajectory />)
    const withNote = TRAJECTORY.filter((n) => n.note)
    expect(withNote.length).toBeGreaterThan(0)
    for (const node of withNote) {
      expect(node.span, `${node.label} uses both note and span`).toBe('')
      const row = screen.getByText(node.label).closest('li')
      expect(row).toHaveTextContent(node.note)
    }
  })

  /** Marks the endpoint by position, so appending a node to the content file moves the tag. */
  it('tags only the final node as current', () => {
    render(<Trajectory />)
    const tags = screen.getAllByText('CURRENT')
    expect(tags).toHaveLength(1)
    expect(tags[0].closest('li')).toHaveTextContent(TRAJECTORY[TRAJECTORY.length - 1].label)
  })

  /** Rail markers are decoration; a screen reader gets the year and label, not five bullets. */
  it('hides the rail markers from assistive tech', () => {
    const { container } = render(<Trajectory />)
    expect(container.querySelectorAll('li [aria-hidden="true"]')).toHaveLength(TRAJECTORY.length)
  })
})
