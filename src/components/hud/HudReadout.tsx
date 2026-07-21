'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

const LINE = 'font-mono text-[9px] leading-relaxed tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const PLACEHOLDER = '----------T--:--:--'

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// The current timestamp, cached at module scope so getSnapshot is referentially stable
// between ticks (a fresh string per call would make useSyncExternalStore loop — the
// same trap useDeviceTier documents).
let current = PLACEHOLDER

/**
 * The clock as an external store — no setState-in-effect. `subscribe` stamps once
 * immediately (the frozen frame reduced motion keeps) and, when ticking is allowed,
 * updates every second. `getServerSnapshot` returns the placeholder so SSR and the
 * first client render agree, then it fills in.
 */
function useClock(tick: boolean): string {
  const subscribe = useCallback(
    (onChange: () => void) => {
      current = stamp(new Date())
      onChange()
      if (!tick) return () => {}
      const id = setInterval(() => {
        current = stamp(new Date())
        onChange()
      }, 1000)
      return () => clearInterval(id)
    },
    [tick],
  )
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => PLACEHOLDER,
  )
}

/**
 * The live terminal readout — persistent HUD chrome that makes the frame read as a
 * running system, not a page (the reference's PID/facility/clock, our own restraint).
 *
 * Decorative and `aria-hidden`: `PID`/`FACILITY` are terminal flavour, never claims.
 * Under reduced motion the clock is stamped once and never ticks.
 */
export function HudReadout() {
  const reduced = usePrefersReducedMotion()
  const now = useClock(!reduced)
  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-6 left-8 z-20 hidden sm:block">
      <div className={LINE}>NEURAL_NODE · LINK STABLE</div>
      <div className={LINE}>FACILITY // ARCHIVE_DAEMON · PID 4182</div>
      <div className={LINE}>{now}</div>
    </div>
  )
}
