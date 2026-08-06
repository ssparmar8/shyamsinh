'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
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

type GeoResponse = {
  success?: boolean
  ip?: string
  city?: string
  country_code?: string
}

export function parseUserAgent(ua: string): { browser: string; os: string } {
  const browser = ua.includes('Edg/')
    ? 'EDGE'
    : ua.includes('Firefox/')
      ? 'FIREFOX'
      : ua.includes('Chrome/')
        ? 'CHROME'
        : ua.includes('Safari/')
          ? 'SAFARI'
          : 'UNKNOWN'

  // iOS check must come before 'Mac OS X': real iPhone Safari UAs contain the literal
  // substring "like Mac OS X" (e.g. "CPU iPhone OS 17_0 like Mac OS X"), so checking
  // Mac OS X first would misclassify iPhones as MACOS. (iPadOS 13+ in default desktop
  // mode sends a UA byte-identical to real macOS Safari — unavoidable, not fixable here.)
  const os = /iPhone|iPad|iPod/.test(ua)
    ? 'IOS'
    : ua.includes('Mac OS X')
      ? 'MACOS'
      : ua.includes('Windows')
        ? 'WINDOWS'
        : ua.includes('Android')
          ? 'ANDROID'
          : ua.includes('Linux')
            ? 'LINUX'
            : 'UNKNOWN'

  return { browser, os }
}

function formatNetworkLine(ua: string, ip: string, city: string, countryCode: string): string {
  const { browser, os } = parseUserAgent(ua)
  return `${browser} · ${os} · ${ip} · ${city.toUpperCase()}, ${countryCode.toUpperCase()}`
}

/**
 * The visitor's own browser/OS/IP/location, resolved client-side (this site is a
 * static export with no server to call instead — see the design spec). Renders
 * nothing until the lookup succeeds: no half-populated line, no visible error state
 * if an ad-blocker kills the request. One attempt, no retries — decorative chrome,
 * not a critical feature.
 */
function useVisitorNetwork(): string | null {
  const [line, setLine] = useState<string | null>(null)

  useEffect(() => {
    // Manually verified: removing this guard causes no test failure and no console
    // warning in React 19/jsdom — this flag protects against a stale setState on
    // unmount that isn't practically unit-testable here, not a fully-covered invariant.
    let cancelled = false
    fetch('https://ipwho.is/')
      .then((res) => res.json())
      .then((data: GeoResponse) => {
        if (cancelled || data.success === false || !data.ip || !data.city || !data.country_code) return
        setLine(formatNetworkLine(navigator.userAgent, data.ip, data.city, data.country_code))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return line
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
  const networkLine = useVisitorNetwork()
  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-6 left-8 z-20 hidden sm:block">
      {networkLine && <div className={LINE}>{networkLine}</div>}
      <div className={LINE}>FACILITY // ARCHIVE_DAEMON · PID 4182</div>
      <div className={LINE}>{now}</div>
    </div>
  )
}
