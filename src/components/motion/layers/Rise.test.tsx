import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { Rise } from './Rise'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <Rise>
        <p>ROW</p>
      </Rise>
    </SceneContext.Provider>,
  )
}

describe('Rise', () => {
  it('renders children in every mode', () => {
    wrap('static')
    expect(screen.getByText('ROW')).toBeInTheDocument()
  })
  it('registers with the Scene only in scrub mode', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rise' }))
  })
  it('does not register in static/reveal', () => {
    const reg = vi.fn(() => () => {})
    wrap('reveal', reg)
    expect(reg).not.toHaveBeenCalled()
  })
})
