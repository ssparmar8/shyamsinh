import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCursorEnabled } from './useCursorEnabled'

function setEnv({ fine, reduced }: { fine: boolean; reduced: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('fine') ? fine : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('useCursorEnabled', () => {
  it('fine pointer + motion allowed → true', () => {
    setEnv({ fine: true, reduced: false })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(true)
  })
  it('reduced motion → false even with a fine pointer', () => {
    setEnv({ fine: true, reduced: true })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(false)
  })
  it('coarse pointer → false', () => {
    setEnv({ fine: false, reduced: false })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(false)
  })
})
