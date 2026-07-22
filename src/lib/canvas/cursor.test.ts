import { describe, it, expect } from 'vitest'
import { cursorPos, cursorMoved } from './cursor'

describe('cursor singleton', () => {
  it('starts at the origin and tracks pointermove in client pixels', () => {
    expect(cursorPos()).toEqual({ x: 0, y: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 12 }))
    expect(cursorPos()).toEqual({ x: 40, y: 12 })
  })

  it('cursorMoved latches true after a move, then resets to false', () => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 7, clientY: 7 }))
    expect(cursorMoved()).toBe(true)
    expect(cursorMoved()).toBe(false)
  })
})
