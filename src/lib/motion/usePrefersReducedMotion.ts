'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (onChange: () => void): (() => void) => {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean => {
  if (typeof matchMedia !== 'function') return true
  return matchMedia(QUERY).matches
}

/**
 * The server cannot know the answer, so it assumes the safer one.
 *
 * The two wrong guesses are not symmetric: guessing "animate" flashes motion at
 * someone who explicitly asked for none, while guessing "reduce" costs at most one
 * frame before animation starts.
 */
const getServerSnapshot = (): boolean => true

/**
 * Whether the user has asked for reduced motion.
 *
 * `useSyncExternalStore`, not `useState` + `useEffect`. `matchMedia` is an external
 * store and this is precisely the problem the hook exists for: it handles the
 * server→client handoff itself, so there is no hydration mismatch and no setState
 * inside an effect. The first draft of this file did the latter and failed
 * `react-hooks/set-state-in-effect` — the rule was right.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
