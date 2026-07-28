'use client'

import { useCallback, useEffect, useState } from 'react'
import { BootSequence } from './BootSequence'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

type Phase = 'undecided' | 'boot' | 'done'

/**
 * Orchestrates boot → dismiss, as an overlay ON TOP of already-rendered content.
 *
 * Starts in 'undecided' and renders no overlay, on the server and on the first
 * client render alike. Audio stays off until something turns it on; nothing here
 * asks the visitor about it.
 *
 * The cost is that a visitor may glimpse one frame of content before the boot
 * covers it. That is the right trade: the alternative is hiding content until JS
 * decides, which blanks the page for crawlers and for anyone whose JS fails.
 * Children are ALWAYS rendered — see the first test.
 */
export function EntryOverlay({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState<Phase>('undecided')

  useEffect(() => {
    // `reduced` is already resolved synchronously at render time (it comes from
    // useSyncExternalStore, not a useState+useEffect pair), so eslint's
    // set-state-in-effect rule reads this as the "derive state you already have
    // during render" antipattern it exists to catch — correctly, in isolation.
    // But it cannot be hoisted into the lazy useState initializer, which also
    // runs on the server, where `getServerSnapshot` reports `reduced = true`.
    // That would make the server's (and first client render's) phase depend on a
    // guessed value instead of always starting at the hydration-safe 'undecided'
    // this component's whole design relies on.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(reduced ? 'done' : 'boot')
  }, [reduced])

  const onBootDone = useCallback(() => setPhase('done'), [])

  const overlayUp = phase === 'boot'

  useEffect(() => {
    // Lock scroll only while an overlay is actually up.
    document.body.style.overflow = overlayUp ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [overlayUp])

  // Signal the scroll layer (useLenis) to re-measure once the overlay is gone and body
  // overflow is restored — pins created during boot need a refresh against real layout.
  // Defined AFTER the overflow effect so overflow is restored before the refresh fires.
  useEffect(() => {
    if (phase === 'done' && typeof window !== 'undefined') {
      dispatchEvent(new Event('entry:done'))
    }
  }, [phase])

  return (
    <>
      {/*
        `inert` while the overlay is up, not just `aria-modal` on the overlay.
        aria-modal is a hint with no enforcement: without this, Tab reaches the six
        record links behind the boot BEFORE the boot's own SKIP button, and a
        screen reader reads straight through the "modal" into background content.
        `inert` removes the whole subtree from focus, pointer, and the a11y tree in
        one attribute — no focus-trap library — while leaving it in the DOM, so
        crawlers and no-JS visitors still get the full page. `display: contents`
        keeps the wrapper layout-neutral; `inert` still applies through it.
      */}
      <div style={{ display: 'contents' }} inert={overlayUp || undefined}>
        {children}
      </div>
      {phase === 'boot' && <BootSequence onDone={onBootDone} />}
    </>
  )
}
