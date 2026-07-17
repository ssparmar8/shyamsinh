'use client'

import { useCallback, useState } from 'react'

/**
 * Whether the element has entered the viewport. Latches on — once true, stays true.
 *
 * Latching is the point: a decode should play once, not replay every time the user
 * scrolls past it. The observer disconnects the moment it fires, so a page of 18
 * records never holds 18 live observers.
 *
 * Implemented as a React 19 ref callback returning a cleanup, rather than a
 * `useRef` + `useEffect` pair. Two reasons: the effect version had to call setState
 * directly inside the effect for the no-observer fallback, which
 * `react-hooks/set-state-in-effect` rejects; and a ref callback fires exactly when
 * the element attaches, which is the thing we actually care about, instead of
 * inferring it from a dependency array.
 */
export function useOnScreen<T extends Element>(rootMargin = '-10%') {
  const [seen, setSeen] = useState(false)

  const ref = useCallback(
    (el: T | null) => {
      if (!el || seen) return

      // No IntersectionObserver: reveal immediately. A fallback that leaves content
      // hidden forever is far worse than having no fallback at all.
      if (typeof IntersectionObserver !== 'function') {
        setSeen(true)
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
    },
    [seen, rootMargin],
  )

  return { ref, seen }
}
