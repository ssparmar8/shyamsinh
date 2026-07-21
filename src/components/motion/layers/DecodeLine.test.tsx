import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { DecodeLine } from './DecodeLine'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <DecodeLine text="IDENTITY" />
    </SceneContext.Provider>,
  )
}

describe('DecodeLine', () => {
  it('static/reveal → exactly one plain text node, no aria-hidden noise layer', () => {
    const { container } = wrap('static')
    expect(screen.getByText('IDENTITY')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.querySelector('.sr-only')).toBeNull()
  })
  it('scrub → real string is the accessible text (sr-only) + a separate aria-hidden layer', () => {
    const { container } = wrap('scrub')
    expect(container.querySelector('.sr-only')?.textContent).toBe('IDENTITY')
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
  it('scrub registers a decode layer carrying the target text', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'decode', text: 'IDENTITY' }))
  })
})
