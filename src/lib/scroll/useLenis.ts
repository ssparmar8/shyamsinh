'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { pushScrollVelocity } from '@/lib/canvas/pointer'

// Registered once, SSR-guarded (module is 'use client' but Next still evaluates it on
// the server while rendering the page that hydrates it). registerPlugin is idempotent.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Smooth scroll on `/` only, disabled under reduced motion.
 *
 * Drives Lenis from GSAP's ticker (not a standalone rAF) and updates ScrollTrigger on
 * every Lenis scroll, so pinned/scrubbed Scenes track the smoothed scroll frame-for-frame.
 * Lenis animates the real window scroll (no transform wrapper), so ScrollTrigger's default
 * `window` scroller and `pinType: 'fixed'` are correct — no scrollerProxy needed.
 */
export function useLenis() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    // Lenis's own settling drives its velocity toward 0 before events stop, so the
    // stored magnitude decays to rest without a separate ticker. Canvas-only; under
    // reduced motion Lenis never mounts, so velocity stays 0 and reactions are inert.
    lenis.on('scroll', () => pushScrollVelocity(lenis.velocity))

    const onTick = (time: number) => lenis.raf(time * 1000) // ticker seconds → Lenis ms
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    // Scenes create their pins on mount, but the boot overlay locks body scroll while
    // it's up (EntryOverlay sets overflow:hidden). Once it dismisses and restores
    // overflow, re-measure so pin start/end land against the real layout.
    const refresh = () => ScrollTrigger.refresh()
    addEventListener('entry:done', refresh)

    return () => {
      removeEventListener('entry:done', refresh)
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [reduced])
}
