'use client'

import type { ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useReveal } from '@/lib/motion/useReveal'

type Props = {
  children: ReactNode
  /** Optional per-section stagger, in ms, as a CSS transition-delay. */
  delayMs?: number
}

/**
 * Wraps a server-rendered section so it fades and slides up as it scrolls
 * into view. See useReveal.ts for the ScrollTrigger + Lenis wiring.
 *
 * Children are ALWAYS rendered, in both branches below — this only ever adds
 * opacity/transform styling around already-present content, the same
 * contract EntryOverlay already holds for the whole page ("Children are
 * ALWAYS rendered — see the first test"). A no-JS visitor, a crawler, and a
 * reduced-motion user all get the full section from first paint. Because
 * `children` here is JSX authored by a Server Component (page.tsx renders
 * `<Reveal><Identity /></Reveal>`, and `Identity` has no `'use client'`),
 * `<Identity />` is resolved and server-rendered as part of page.tsx's own
 * tree BEFORE it ever reaches this component — Reveal (a Client Component)
 * only receives the already-rendered result as a prop and wraps it. It does
 * not pull that subtree onto the client. Verified with curl, not just
 * assumed: see this task's report.
 *
 * Reduced motion renders children with NO wrapper at all: no div, no ref, no
 * ScrollTrigger, no opacity/transform class ever applied — not even for one
 * frame. This does not rely on globals.css's blanket
 * `transition-duration: 0.01ms !important` to *finish* a hidden→visible
 * transition instantly; that would still mean `opacity-0` was briefly the
 * real state. Skipping the class outright, via useReveal's `reduced` branch,
 * is the stronger guarantee non-negotiable #2 asks for.
 */
export function Reveal({ children, delayMs = 0 }: Props) {
  const reduced = usePrefersReducedMotion()
  const { ref, revealed } = useReveal<HTMLDivElement>(reduced)

  if (reduced) {
    return <>{children}</>
  }

  return (
    <div
      ref={ref}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={
        'transition duration-700 ease-out ' +
        (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
      }
    >
      {children}
    </div>
  )
}
