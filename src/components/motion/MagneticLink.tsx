'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { magneticOffset } from '@/lib/motion/magnetic'
import { scrambleFrame } from '@/lib/scramble'
import { useCursorEnabled } from '@/lib/motion/useCursorEnabled'

const STRENGTH = 0.3 // fraction of the cursor offset the link follows
const MAX = 6 // px cap on the pull (restrained)
const EASE = 0.2 // per-frame lerp toward the magnetic target
const DECODE_MS = 350 // hover-decode duration

/**
 * A link that eases a few px toward the cursor and (with `text`) briefly scramble-decodes
 * its label on hover. Imports only next/link + scramble.ts + rAF — no gsap/lenis/three —
 * so it is safe in shared chrome that reaches record routes. Gated by useCursorEnabled:
 * when off it is a plain <Link> (no listeners, no aria-hidden layer).
 */
export function MagneticLink({
  href,
  text,
  children,
  className,
}: {
  href: string
  text?: string
  children?: ReactNode
  className?: string
}) {
  const enabled = useCursorEnabled()
  const ref = useRef<HTMLAnchorElement | null>(null)
  const raf = useRef<number | null>(null)
  const decodeRaf = useRef<number | null>(null)
  const target = useRef({ x: 0, y: 0 })
  const cur = useRef({ x: 0, y: 0 })
  const [frame, setFrame] = useState(text ?? '')

  const stopDecode = useCallback(() => {
    if (decodeRaf.current != null) {
      cancelAnimationFrame(decodeRaf.current)
      decodeRaf.current = null
    }
  }, [])

  const runRaf = useCallback(() => {
    if (raf.current != null) return
    const step = () => {
      cur.current.x += (target.current.x - cur.current.x) * EASE
      cur.current.y += (target.current.y - cur.current.y) * EASE
      if (ref.current) {
        ref.current.style.transform = `translate(${cur.current.x}px, ${cur.current.y}px)`
      }
      const settled =
        Math.abs(target.current.x - cur.current.x) < 0.1 &&
        Math.abs(target.current.y - cur.current.y) < 0.1
      raf.current = settled ? null : requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  const onMove = useCallback(
    (e: PointerEvent<HTMLAnchorElement>) => {
      if (!enabled || !ref.current) return
      target.current = magneticOffset(
        e.clientX,
        e.clientY,
        ref.current.getBoundingClientRect(),
        STRENGTH,
        MAX,
      )
      runRaf()
    },
    [enabled, runRaf],
  )

  const onLeave = useCallback(() => {
    target.current = { x: 0, y: 0 }
    runRaf()
    stopDecode()
    if (text) setFrame(text)
  }, [runRaf, stopDecode, text])

  const onEnter = useCallback(() => {
    if (!enabled || !text) return
    stopDecode()
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DECODE_MS)
      setFrame(scrambleFrame(text, p))
      if (p < 1) {
        decodeRaf.current = requestAnimationFrame(tick)
      } else {
        decodeRaf.current = null
        setFrame(text)
      }
    }
    decodeRaf.current = requestAnimationFrame(tick)
  }, [enabled, text, stopDecode])

  useEffect(() => {
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current)
      stopDecode()
    }
  }, [stopDecode])

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onPointerMove={enabled ? onMove : undefined}
      onPointerEnter={enabled ? onEnter : undefined}
      onPointerLeave={enabled ? onLeave : undefined}
    >
      {text ? (
        enabled ? (
          <>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">{frame}</span>
          </>
        ) : (
          text
        )
      ) : (
        children
      )}
    </Link>
  )
}
