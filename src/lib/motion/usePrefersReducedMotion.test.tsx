import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
    })),
  )
  return listeners
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('reports true when the user asks for reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reports false when the user does not', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  /**
   * The safe default is "reduce". If we guess wrong on the server we would
   * animate at someone who asked us not to; guessing the other way merely
   * delays an animation by one frame.
   */
  it('defaults to true when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })
})
