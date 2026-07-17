'use client'

import { useCallback, useEffect, useState } from 'react'
import { Gate } from '@/components/gate/Gate'
import { BootSequence } from './BootSequence'
import { readGate, writeGate } from '@/components/gate/gateStorage'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useAudio } from '@/lib/audio/useAudio'

type Phase = 'undecided' | 'gate' | 'boot' | 'done'

/**
 * Orchestrates gate → boot → dismiss, as an overlay ON TOP of already-rendered
 * content.
 *
 * Starts in 'undecided' and renders no overlay, on the server and on the first
 * client render alike. The visitor's choice lives in localStorage, which the
 * server cannot read, so deciding during render is a hydration mismatch.
 *
 * The cost is that a first-time visitor may glimpse one frame of content before
 * the gate covers it. That is the right trade: the alternative is hiding content
 * until JS decides, which blanks the page for crawlers and for anyone whose JS
 * fails. Children are ALWAYS rendered — see the first test.
 */
export function EntryOverlay({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion()
  const { setEnabled } = useAudio()
  const [phase, setPhase] = useState<Phase>('undecided')

  useEffect(() => {
    if (reduced) {
      // `reduced` is already resolved synchronously at render time (it comes from
      // useSyncExternalStore, not a useState+useEffect pair), so eslint's
      // set-state-in-effect rule reads this branch as the "derive state you
      // already have during render" antipattern it exists to catch — correctly,
      // in isolation. But this branch cannot be hoisted out of the effect: doing
      // so would mean computing the initial `phase` from `reduced` during the
      // lazy useState initializer, which also runs on the server, where
      // `getServerSnapshot` reports `reduced = true`. That would make the
      // server's (and first client render's) phase depend on a guessed value
      // instead of always starting at the hydration-safe 'undecided' this
      // component's whole design relies on. Keeping the reduced-motion
      // short-circuit in the same effect as the `readGate()` localStorage read
      // below means both halves of "decide the phase once, after mount" resolve
      // through one path instead of racing each other across two effects.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('done')
      return
    }
    const prior = readGate()
    if (prior === null) {
      setPhase('gate')
      return
    }
    // Restore the prior choice through the hook, NOT AudioBus.enable() directly —
    // the bus alone does not notify useSyncExternalStore subscribers, so any
    // component reading useAudio().enabled would show a stale value forever.
    setEnabled(prior)
    setPhase('done')
  }, [reduced, setEnabled])

  const onChoose = useCallback((on: boolean) => {
    writeGate(on)
    setPhase('boot')
  }, [])

  const onBootDone = useCallback(() => setPhase('done'), [])

  useEffect(() => {
    // Lock scroll only while an overlay is actually up.
    const locked = phase === 'gate' || phase === 'boot'
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  return (
    <>
      {children}
      {phase === 'gate' && <Gate onChoose={onChoose} />}
      {phase === 'boot' && <BootSequence onDone={onBootDone} />}
    </>
  )
}
