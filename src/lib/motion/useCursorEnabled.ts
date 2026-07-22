'use client'

import { useSyncExternalStore } from 'react'

const FINE = '(pointer: fine)'
const RM = '(prefers-reduced-motion: reduce)'

function read(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia(FINE).matches && !matchMedia(RM).matches
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return () => {}
  const fine = matchMedia(FINE)
  const rm = matchMedia(RM)
  fine.addEventListener('change', onChange)
  rm.addEventListener('change', onChange)
  return () => {
    fine.removeEventListener('change', onChange)
    rm.removeEventListener('change', onChange)
  }
}

// Server + first client render → false (no cursor until the client confirms), mirroring
// useSceneMode/useDeviceTier.
const getServerSnapshot = (): boolean => false

/**
 * True only for a fine-pointer visitor with motion allowed — the gate for the custom
 * cursor and magnetic links. Server + first client render → false (no cursor until the
 * client confirms), mirroring useSceneMode/useDeviceTier; re-reads on a media change.
 */
export function useCursorEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, getServerSnapshot)
}
