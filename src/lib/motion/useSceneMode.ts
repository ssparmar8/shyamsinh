'use client'

import { useSyncExternalStore } from 'react'
import { pickSceneMode, type SceneMode } from './sceneMode'

const RM = '(prefers-reduced-motion: reduce)'
const COARSE = '(pointer: coarse)'
const NARROW = 768

function read(): SceneMode {
  if (typeof matchMedia !== 'function') return 'static'
  const reduced = matchMedia(RM).matches
  const coarseOrNarrow =
    matchMedia(COARSE).matches || (typeof innerWidth === 'number' && innerWidth < NARROW)
  return pickSceneMode(reduced, coarseOrNarrow)
}

// SceneMode is a primitive string, so referential stability is automatic — no cached
// object dance (unlike useDeviceTier). We still memo to avoid re-notifying identical reads.
let cached: SceneMode | null = null
function getSnapshot(): SceneMode {
  const next = read()
  if (cached === next) return cached
  cached = next
  return cached
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const rm = matchMedia(RM)
  const coarse = matchMedia(COARSE)
  rm.addEventListener('change', onChange)
  coarse.addEventListener('change', onChange)
  addEventListener('resize', onChange)
  return () => {
    rm.removeEventListener('change', onChange)
    coarse.removeEventListener('change', onChange)
    removeEventListener('resize', onChange)
  }
}

// Server (and first client render) → 'static': full content, no wrapper, no pin. The
// client re-reads after mount and swaps to reveal/scrub, exactly like usePrefersReducedMotion.
const getServerSnapshot = (): SceneMode => 'static'

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
