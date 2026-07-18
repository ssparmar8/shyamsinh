'use client'

import { useSyncExternalStore } from 'react'

export type Tier = { renderer: 'webgl' | '2d' | 'none'; count: number }

type Inputs = { reduced: boolean; webgl: boolean; cores: number; small: boolean }

/**
 * Pure tier decision, so it's testable without a browser.
 *
 * Reduced motion wins over everything — no animated canvas at all. Otherwise the
 * budget scales with the weakest of (cores, screen size), because a portfolio will
 * be opened on a mid-range Android and a runaway particle count is exactly what
 * tanks it (spec §12). Never zero for a real renderer — a canvas that draws nothing
 * is a bug that looks like success.
 */
export function pickTier({ reduced, webgl, cores, small }: Inputs): Tier {
  if (reduced) return { renderer: 'none', count: 0 }
  const base = small ? 55 : 130
  const coreScale = Math.min(1, Math.max(0.35, cores / 8))
  const count = Math.max(24, Math.round(base * coreScale))
  return { renderer: webgl ? 'webgl' : '2d', count }
}

const hasWebGL = (): boolean => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

const compute = (): Tier =>
  pickTier({
    reduced:
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: hasWebGL(),
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    small: typeof innerWidth !== 'undefined' ? innerWidth < 768 : false,
  })

/**
 * The cached snapshot. `useSyncExternalStore` demands a REFERENTIALLY STABLE value
 * from getSnapshot — if it returns a new object each call, React sees "changed" on
 * every render and loops forever (React #185, "Maximum update depth exceeded"). The
 * first version recomputed `pickTier` inline and crashed `Constellation` on mount.
 * We recompute only when the tier's VALUES actually change, and otherwise hand back
 * the same reference.
 */
let cached: Tier | null = null

const read = (): Tier => {
  const next = compute()
  if (cached && cached.renderer === next.renderer && cached.count === next.count) {
    return cached
  }
  cached = next
  return cached
}

/**
 * Capability (WebGL support, core count) can't change mid-session, but two inputs
 * can: reduced-motion can be toggled, and a resize can cross the 768px breakpoint or
 * an orientation change. Subscribe to both so the tier updates — and so the cache
 * above gets a chance to produce a fresh reference React will actually observe.
 */
const subscribe = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  mq?.addEventListener('change', onChange)
  addEventListener('resize', onChange)
  return () => {
    mq?.removeEventListener('change', onChange)
    removeEventListener('resize', onChange)
  }
}

// A static server snapshot keeps hydration stable. 'none' on the server means no
// canvas renders until the client confirms capability — content never depends on it.
const serverTier: Tier = { renderer: 'none', count: 0 }

export function useDeviceTier(): Tier {
  return useSyncExternalStore(subscribe, read, () => serverTier)
}
