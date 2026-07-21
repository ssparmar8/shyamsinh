'use client'

import { useEffect, useState } from 'react'
import { useAudio } from '@/lib/audio/useAudio'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * The boot sequence. Hard-capped at BOOT_MS.
 *
 * The reference site's equivalent runs materially longer and pays for it in
 * visitors who leave before seeing anything. Three seconds is a deliberate
 * deviation: long enough to land as intentional, short enough that an impatient
 * client does not bail. Skippable from frame one, by click or Escape.
 */
export const BOOT_MS = 3000

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const { play } = useAudio()

  useEffect(() => {
    play('boot')
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / BOOT_MS)
      setPct(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else {
        play('complete')
        onDone()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone, play])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-bg)]"
    >
      <div
        className="font-mono text-sm tracking-[var(--tracking-wide)] text-[var(--color-ink)]"
        aria-live="polite"
      >
        {pct >= 1 ? 'COMPLETE' : 'LOADING'}
      </div>
      <div className={`${LABEL} mt-3`}>CANVAS READY · {Math.round(pct * 100)}%</div>

      <div className="mt-6 h-px w-56 bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-dim)]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={onDone}
        className={`${LABEL} mt-8 underline underline-offset-4 hover:text-[var(--color-ink)]`}
      >
        SKIP →
      </button>
    </div>
  )
}
