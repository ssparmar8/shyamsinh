'use client'

import { useEffect, useRef, useState, type ElementType, type Ref } from 'react'
import { scrambleFrame } from '@/lib/scramble'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useOnScreen } from '@/lib/motion/useOnScreen'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Milliseconds for the full decode. */
  durationMs?: number
  seed?: number
  onDone?: () => void
}

/**
 * Text that decodes out of glyph noise when it scrolls into view.
 *
 * Accessibility shape, and it is not negotiable: the real string sits in a
 * visually-hidden span that is always in the DOM, so it is the accessible name and
 * the indexed text from first paint. The animated noise is a separate
 * `aria-hidden` layer. A screen reader must never encounter the noise.
 *
 * Under reduced motion this renders exactly one plain text node — no noise layer,
 * no timer, no observer. `useOnScreen`'s ref is only handed to the animated
 * branch's element, so under reduced motion the callback ref never fires and no
 * IntersectionObserver is ever constructed; the decode effect's own guard keeps
 * the rAF loop from ever starting.
 */
export function ScrambleTextAnimated({
  text,
  as: Tag = 'span',
  className,
  durationMs = 900,
  seed = 0,
  onDone,
}: Props) {
  const reduced = usePrefersReducedMotion()
  // useOnScreen now returns a React 19 callback ref (fires on attach, may return a
  // cleanup), not a useRef-style RefObject — the plan predates that change.
  const { ref, seen } = useOnScreen<HTMLElement>()
  const [frame, setFrame] = useState(() => scrambleFrame(text, 0, seed))
  const [done, setDone] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduced || !seen || done) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      setFrame(scrambleFrame(text, p, seed))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDone(true)
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, seen, done, text, durationMs, seed, onDone])

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{done ? text : frame}</span>
    </Tag>
  )
}
