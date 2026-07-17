'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Whether the element has entered the viewport. Latches on — once true, stays true.
 *
 * Latching is the point: a decode should play once, not replay every time the user
 * scrolls past. It also lets the observer disconnect immediately, so a page with
 * dozens of records isn't holding dozens of live observers.
 */
export function useOnScreen<T extends Element>(rootMargin = '-10%') {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver !== 'function') {
      setSeen(true) // No observer support: show the content rather than hide it forever.
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])

  return { ref, seen }
}
