'use client'

import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSceneMode } from '@/lib/motion/useSceneMode'
import { useReveal } from '@/lib/motion/useReveal'
import { buildSceneTimeline, holdFade } from '@/lib/motion/buildSceneTimeline'
import { SceneContext, type LayerReg, type SceneCtx } from './SceneContext'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  children: ReactNode
  /** Pin-hold length in viewport multiples (how long the assembled beat holds at the top). */
  length?: number
  className?: string
}

/**
 * A beat as a pinned, scroll-scrubbed scene. Three modes (see useSceneMode):
 *   static — reduced motion / SSR: children in normal flow, fully visible, no wrapper.
 *   reveal — touch / narrow: today's one-shot fade+slide (reuses useReveal). No pin.
 *   scrub  — pointer + wide: two-phase choreography (below).
 *
 * Scrub is two ScrollTriggers on an outer wrapper, with the content in an inner wrapper so
 * the pin (position:fixed) and the content transforms never fight over the same element:
 *   1. ASSEMBLE — scrubbed `top bottom → top top`: the inner content assembles (decode /
 *      mask / rise) as the beat scrolls up into view, finishing just as it reaches the top.
 *      For the first/above-fold beat this start is already passed at load, so it renders
 *      fully assembled (no blank hero).
 *   2. HOLD — pin the beat at the top for `length` viewports, then release so the next beat
 *      scrolls up. This is the "holds in place" beat; scrubbing back up reverses the assembly.
 *
 * Like Reveal, this only ever wraps already-server-rendered children — it never gates them.
 */
export function Scene({ children, length = 1, className }: Props) {
  const mode = useSceneMode()

  // Layer registry (scrub only). Children register via context in their ref callbacks, which
  // run bottom-up — so they (and innerRef) are all set by the time outerRef (the parent) runs.
  const layers = useRef<Map<HTMLElement, LayerReg>>(new Map())
  const register = useCallback((reg: LayerReg) => {
    layers.current.set(reg.el, reg)
    return () => {
      layers.current.delete(reg.el)
    }
  }, [])
  const ctx = useMemo<SceneCtx>(() => ({ mode, register }), [mode, register])

  const innerRef = useRef<HTMLDivElement | null>(null)

  const outerRef = useCallback(
    (outer: HTMLElement | null) => {
      if (!outer) return
      const target = innerRef.current ?? outer
      const tl = buildSceneTimeline(target, [...layers.current.values()])

      const assemble = ScrollTrigger.create({
        trigger: outer,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
      })
      const hold = ScrollTrigger.create({
        trigger: outer,
        start: 'top top',
        end: () => '+=' + window.innerHeight * length,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Settle the beat out over the last of the pin (transform/opacity only — never
          // layout, so the pin can't jump). `target` is the inner content; the assemble
          // timeline animates the beat's layer children (or, for an unannotated beat, the
          // root itself as a one-shot reveal that finishes before this tail begins), so the
          // two are scroll-sequential and don't fight.
          const { alpha, y } = holdFade(self.progress)
          gsap.set(target, { autoAlpha: alpha, y })
        },
      })

      return () => {
        assemble.kill()
        hold.kill()
        tl.kill()
      }
    },
    [length],
  )

  // reveal mode reuses useReveal; pass `reduced=true` (its short-circuit) in every other
  // mode so it never builds a ScrollTrigger we don't want.
  const { ref: revealRef, revealed } = useReveal<HTMLDivElement>(mode !== 'reveal')

  if (mode === 'static') {
    return <>{children}</>
  }

  if (mode === 'reveal') {
    return (
      <div
        ref={revealRef}
        className={
          'transition duration-700 ease-out ' +
          (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        {children}
      </div>
    )
  }

  return (
    <SceneContext.Provider value={ctx}>
      <div ref={outerRef} className={className}>
        <div ref={innerRef}>{children}</div>
      </div>
    </SceneContext.Provider>
  )
}
