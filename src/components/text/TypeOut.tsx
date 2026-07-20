'use client'

import { useEffect, useRef, useState, type ElementType, type Ref } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useOnScreen } from '@/lib/motion/useOnScreen'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Milliseconds for the full type-out. */
  durationMs?: number
  /** Wait this long after entering view before typing (lets a panel slide in first). */
  startDelayMs?: number
  onDone?: () => void
}

/**
 * Types a string out character by character when it scrolls into view.
 *
 * Same a11y shape as ScrambleTextAnimated, and it is not negotiable: the real
 * string sits in an always-present `sr-only` span (accessible name + indexed text
 * from first paint); the visible, growing prefix and the cursor live in a separate
 * `aria-hidden` layer. Under reduced motion this renders exactly one plain text
 * node — no cursor, no timer, no observer.
 */
export function TypeOut({
  text,
  as: Tag = 'span',
  className,
  durationMs = 1100,
  startDelayMs = 150,
  onDone,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const { ref, seen } = useOnScreen<HTMLElement>()
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduced || !seen || done) return
    const t0 = performance.now() + startDelayMs
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / durationMs))
      setCount(Math.floor(text.length * p))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCount(text.length)
        setDone(true)
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, seen, done, text, durationMs, startDelayMs, onDone])

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {done ? text : text.slice(0, count)}
        {!done && <span className="opacity-60">▍</span>}
      </span>
    </Tag>
  )
}
