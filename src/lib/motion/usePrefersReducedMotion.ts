'use client'

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the user has asked for reduced motion.
 *
 * Starts `true` deliberately. The server cannot know the answer, and the two
 * wrong guesses are not symmetric: guessing "animate" flashes motion at someone
 * who explicitly asked for none, while guessing "reduce" costs one frame before
 * animation starts. Also avoids a hydration mismatch — the server and the client's
 * first render agree.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(QUERY)
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
