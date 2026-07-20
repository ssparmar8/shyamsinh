'use client'

import { useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registered once, at module scope, guarded for SSR: this file is `'use
// client'` but Next still evaluates the module on the server while
// server-rendering the page that will hydrate it — only the *effects* (and
// this ref callback) never run there. registerPlugin is idempotent, so React
// StrictMode's double-invoked renders/effects and Fast Refresh re-evaluating
// this module are both safe.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Fires once the element's top crosses 85% down the viewport — late enough
// that a section below the fold is still genuinely hidden at load (so
// "starts hidden, reveals on scroll" is real, not a rounding error), early
// enough that it reveals a beat before it's fully on screen rather than
// snapping in at the last pixel. If the element's top is ALREADY above that
// line the moment its ScrollTrigger is created — true for Identity, which
// sits at the very top of the page — ScrollTrigger fires onEnter immediately
// on its initial refresh rather than waiting for a scroll that can never
// happen. That is standard, documented ScrollTrigger behaviour (the enter
// callback reflects a transition from "not yet initialised" to "active", and
// an already-satisfied start condition is active from the first refresh),
// verified here in Playwright rather than just assumed.
const START = 'top 85%'

/**
 * "Has this element scrolled into view?" — the ScrollTrigger-backed sibling
 * of useOnScreen (IntersectionObserver): same ref-callback shape
 * (`{ ref, revealed }` vs. useOnScreen's `{ ref, seen }`), chosen here
 * because Reveal wants ScrollTrigger's percentage-based start line and
 * `once` semantics rather than raw intersection ratios.
 *
 * Reduced motion short-circuits everything, unconditionally: `revealed` is
 * `reduced || fired`, so when `reduced` is true it is already `true` from
 * the very first render, and the ref callback below returns before ever
 * calling `ScrollTrigger.create()` — a reduced-motion visitor never gets a
 * ScrollTrigger at all, never gets the animation. Deriving `revealed` this
 * way (rather than seeding a `useState(reduced)` once) also means a
 * mid-session change to the OS reduced-motion setting takes effect
 * immediately on the next render, not just at mount.
 *
 * Lenis + ScrollTrigger integration: `useLenis.ts` constructs Lenis with the
 * default `wrapper = window`, and Lenis animates scroll by calling the real
 * `window.scrollTo(...)` each frame — not by translating a wrapper with a CSS
 * transform. So ScrollTrigger's default `window` scroller reads the exact same
 * live `window.scrollY` Lenis is animating (no `scrollerProxy` needed), and
 * ScrollTrigger's own built-in scroll listener already fires on the native
 * `scroll` events Lenis's `scrollTo()` produces. A one-shot `top 85%` reveal
 * therefore needs no manual `ScrollTrigger.update()` bridge: an earlier version
 * added a per-instance `window` scroll listener to shave a ≤1-frame ordering
 * gap, but for a non-scrubbed reveal that lateness is imperceptible, and one
 * listener per Reveal is pure redundant per-scroll work at scale. Verified
 * firing at the right scroll position in Playwright (tests/e2e).
 */
export function useReveal<T extends HTMLElement>(reduced: boolean) {
  const [fired, setFired] = useState(false)
  const revealed = reduced || fired

  const ref = useCallback(
    (el: T | null) => {
      if (!el || reduced) return

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: START,
        once: true,
        onEnter: () => setFired(true),
      })

      return () => trigger.kill()
    },
    [reduced],
  )

  return { ref, revealed }
}
