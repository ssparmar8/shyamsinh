import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { MaskWipe } from './MaskWipe'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <MaskWipe>
        <h2>HEADING</h2>
      </MaskWipe>
    </SceneContext.Provider>,
  )
}

describe('MaskWipe', () => {
  it('renders children in every mode', () => {
    wrap('static')
    expect(screen.getByText('HEADING')).toBeInTheDocument()
  })
  it('registers as a mask layer only in scrub mode', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'mask' }))
  })
  it('does not register in static/reveal', () => {
    const reg = vi.fn(() => () => {})
    wrap('reveal', reg)
    expect(reg).not.toHaveBeenCalled()
  })
})
