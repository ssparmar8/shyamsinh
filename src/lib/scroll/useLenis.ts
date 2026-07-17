'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

/**
 * Smooth scroll, at `/` only.
 *
 * Disabled entirely under reduced motion — smooth scrolling IS motion, and
 * hijacking the scroll of someone who asked for none is exactly the kind of
 * "accessible in name only" that spec §13 rejects.
 *
 * Lenis is imported statically here but this hook is only mounted from `/`, so
 * the static routes never pull it into their bundle. Verify that claim with the
 * network check in Step 4 rather than trusting it.
 */
export function useLenis() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf = 0
    const tick = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduced])
}
