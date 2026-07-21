import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSceneMode } from './useSceneMode'

// matchMedia stub: reduced + coarse are the two queries the hook reads.
function setEnv({ reduced, coarse, width }: { reduced: boolean; coarse: boolean; width: number }) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('coarse') ? coarse : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('useSceneMode', () => {
  it('reduced → static', () => {
    setEnv({ reduced: true, coarse: false, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('static')
  })
  it('coarse pointer → reveal', () => {
    setEnv({ reduced: false, coarse: true, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('reveal')
  })
  it('narrow viewport → reveal', () => {
    setEnv({ reduced: false, coarse: false, width: 600 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('reveal')
  })
  it('wide + fine pointer → scrub', () => {
    setEnv({ reduced: false, coarse: false, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('scrub')
  })
})
