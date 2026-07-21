'use client'

import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSceneMode } from '@/lib/motion/useSceneMode'
import { useReveal } from '@/lib/motion/useReveal'
import { buildSceneTimeline } from '@/lib/motion/buildSceneTimeline'
import { SceneContext, type LayerReg, type SceneCtx } from './SceneContext'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  children: ReactNode
  /** Pin length in viewport multiples (how much scroll the beat consumes). */
  length?: number
  className?: string
}

/**
 * A beat as a pinned, scroll-scrubbed scene. Three modes (see useSceneMode):
 *   static — reduced motion / SSR: children in normal flow, fully visible, no wrapper.
 *   reveal — touch / narrow: today's one-shot fade+slide (reuses useReveal). No pin.
 *   scrub  — pointer + wide: pin the section and drive one timeline off scroll progress.
 *
 * Like Reveal, this only ever wraps already-server-rendered children — it never gates them.
 */
export function Scene({ children, length = 1, className }: Props) {
  const mode = useSceneMode()

  // Layer registry (scrub only). Children register via context in their ref callbacks,
  // which run bottom-up — so they're all present by the time scrubRef (the parent) runs.
  const layers = useRef<Map<HTMLElement, LayerReg>>(new Map())
  const register = useCallback((reg: LayerReg) => {
    layers.current.set(reg.el, reg)
    return () => {
      layers.current.delete(reg.el)
    }
  }, [])
  const ctx = useMemo<SceneCtx>(() => ({ mode, register }), [mode, register])

  const scrubRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return
      const tl = buildSceneTimeline(el, [...layers.current.values()])
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => '+=' + window.innerHeight * length,
        pin: true,
        pinSpacing: true,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
      })
      return () => {
        st.kill()
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
      <div ref={scrubRef} className={className}>
        {children}
      </div>
    </SceneContext.Provider>
  )
}
