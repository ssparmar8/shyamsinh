'use client'

import { useLenis } from '@/lib/scroll/useLenis'

/** Mount once, at `/` only. Renders nothing. */
export function SmoothScroll() {
  useLenis()
  return null
}
