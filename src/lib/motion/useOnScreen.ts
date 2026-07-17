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
 *
 * The default margin shrinks only the BOTTOM edge. An earlier `-10%` shrank all
 * four, so an element already on screen at the top of the viewport — a hero name —
 * sat above the shrunk boundary and NEVER intersected: `seen` stayed false and the
 * decode never ran, leaving raw glyph noise where the name should be. Verified in a
 * real browser (hero at y=24 → 1 frame, permanent noise). jsdom's IntersectionObserver
 * stub fires regardless of position, so no unit test can see this — only a browser can.
 * Shrinking only the bottom keeps the "reveal once comfortably in view" feel for
 * below-fold content while letting anything already visible fire at mount.
 */
export function useOnScreen<T extends Element>(rootMargin = '0px 0px -10% 0px') {
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
