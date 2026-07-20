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
 * Lenis + ScrollTrigger integration (the fiddly part, documented in full
 * here because it is easy to get subtly wrong): `SmoothScroll`/`useLenis.ts`
 * constructs `new Lenis({ duration: 1.1, smoothWheel: true })` with no
 * `wrapper`/`content` override. Lenis's own constructor defaults
 * (`node_modules/lenis/dist/lenis.mjs`) are `wrapper = window` and
 * `content = document.documentElement`, and it animates scroll by calling
 * `wrapper.scrollTo(...)` — i.e. the REAL `window.scrollTo()` — on every
 * frame of its own rAF loop, not by translating a virtual wrapper with a CSS
 * transform the way Locomotive-Scroll-style libraries do. That was
 * confirmed by reading the installed package, not assumed: `useLenis.ts` is
 * out of scope for this task (it keeps its Lenis instance private to its own
 * effect — no module export, no `window.__lenis` — so there is no instance
 * here to call `lenis.on('scroll', ScrollTrigger.update)` on, the way GSAP's
 * own Lenis recipe does when it has direct access).
 *
 * Because Lenis moves the real `window.scrollY`, ScrollTrigger's default
 * `window` scroller already reads the exact same live value Lenis is
 * animating — no `scrollerProxy` is required for correctness, unlike a
 * transform-based smooth-scroll library. The one gap: ScrollTrigger's own
 * scroll handling is batched through gsap's ticker, which runs on its own
 * `requestAnimationFrame` registration, independent of Lenis's rAF loop —
 * so there is no ordering guarantee between "Lenis moved the scroll
 * position this frame" and "ScrollTrigger noticed." For a scrubbed or
 * pinned animation that ordering gap is exactly what causes visible jitter
 * (which is why the official recipe drives Lenis from gsap's own ticker
 * instead) — but for a one-shot reveal like this one, being up to one frame
 * (~16ms) late is imperceptible. The line below closes even that gap
 * explicitly rather than leaving it implicit: Lenis's `scrollTo()` calls are
 * what *produce* the browser's native `scroll` event on `window` (moving
 * real scroll position always does, regardless of what moved it), so
 * listening for that event and forcing `ScrollTrigger.update()` is the
 * observable equivalent of hooking the instance directly — ScrollTrigger's
 * view of the world is refreshed the instant Lenis moves it, without
 * depending on gsap's ticker having already run this frame. It's cheap
 * (`.update()` with nothing to do is a fast no-op) and it's verified firing
 * at the correct scroll position in Playwright, not just assumed to work
 * (see tests/e2e — Task 5's mandatory browser verification).
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

      const onScroll = () => ScrollTrigger.update()
      window.addEventListener('scroll', onScroll, { passive: true })

      return () => {
        trigger.kill()
        window.removeEventListener('scroll', onScroll)
      }
    },
    [reduced],
  )

  return { ref, revealed }
}
