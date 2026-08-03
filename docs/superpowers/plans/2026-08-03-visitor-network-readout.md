# Visitor Network Readout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revive the bottom-left `HudReadout` HUD block, replacing the old decorative `NEURAL_NODE · LINK STABLE` line with a real one showing the visitor's own browser, OS, public IP, and approximate city/country.

**Architecture:** Two tasks, built in order. Task 1 restores the pre-existing `HudReadout` (facility/PID + clock lines, wired into `HudFrame`) exactly as it was before this session's cleanup — a safe, independently-testable baseline. Task 2 adds a new top line populated by a `useVisitorNetwork()` hook: browser/OS parsed synchronously from `navigator.userAgent`, IP/city/country fetched client-side from `https://ipwho.is/` on mount. The line renders only once the fetch succeeds; it stays absent on load, on failure, or if blocked by an ad-blocker. No server involvement — the site is a static export (S3 + CloudFront).

**Tech Stack:** React 19 (`useState`/`useEffect`), Vitest + `@testing-library/react` (mocking `navigator.userAgent` and `global.fetch`), Tailwind v4 theme tokens already defined in `globals.css`.

**Design doc:** [docs/superpowers/specs/2026-08-03-visitor-network-readout-design.md](../specs/2026-08-03-visitor-network-readout-design.md)

---

### Task 1: Restore baseline `HudReadout` (facility/PID + clock)

**Files:**
- Create: `src/components/hud/HudReadout.tsx`
- Create: `src/components/hud/HudReadout.test.tsx`
- Modify: `src/components/hud/HudFrame.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/HudReadout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HudReadout } from './HudReadout'

// jsdom has no matchMedia → the reduced-motion path (stamp once, no interval).
describe('HudReadout', () => {
  it('renders a decorative, aria-hidden readout with the PID flavour', () => {
    const { container } = render(<HudReadout />)
    const el = container.querySelector('[aria-hidden="true"]')
    expect(el).toBeTruthy()
    expect(el?.textContent).toMatch(/PID 4182/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/hud/HudReadout.test.tsx`
Expected: FAIL — `Failed to resolve import "./HudReadout"` (the file doesn't exist yet).

- [ ] **Step 3: Create `HudReadout.tsx`**

Create `src/components/hud/HudReadout.tsx`:

```tsx
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
      <div className={LINE}>FACILITY // ARCHIVE_DAEMON · PID 4182</div>
      <div className={LINE}>{now}</div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/hud/HudReadout.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Wire `HudReadout` back into `HudFrame`**

In `src/components/hud/HudFrame.tsx`, change the import block from:

```tsx
import { CornerBracket } from './CornerBracket'
import { HudTraces } from './HudTraces'
import { ScrollProgress } from './ScrollProgress'
```

to:

```tsx
import { CornerBracket } from './CornerBracket'
import { HudReadout } from './HudReadout'
import { HudTraces } from './HudTraces'
import { ScrollProgress } from './ScrollProgress'
```

Change the docstring line:

```tsx
 * The persistent chrome: corner brackets and a scroll progress indicator. The top row
 * is deliberately bare — no route label, no contact link.
```

to:

```tsx
 * The persistent chrome: corner brackets and a live terminal readout. The top row
 * is deliberately bare — no route label, no contact link.
```

Change the render block from:

```tsx
      <ScrollProgress />

      <div className="relative z-10">{children}</div>
```

to:

```tsx
      <ScrollProgress />
      <HudReadout />

      <div className="relative z-10">{children}</div>
```

- [ ] **Step 6: Run the full test suite and type-check**

Run: `npm test && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/hud/HudReadout.tsx src/components/hud/HudReadout.test.tsx src/components/hud/HudFrame.tsx
git commit -m "$(cat <<'EOF'
Restore HudReadout (facility/PID + clock) as baseline for network line

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add the visitor network line

**Files:**
- Modify: `src/components/hud/HudReadout.tsx`
- Modify: `src/components/hud/HudReadout.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `src/components/hud/HudReadout.test.tsx` with:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HudReadout } from './HudReadout'

const originalUserAgent = window.navigator.userAgent

function mockUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

const CHROME_MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

afterEach(() => {
  vi.unstubAllGlobals()
  mockUserAgent(originalUserAgent)
})

// jsdom has no matchMedia → the reduced-motion path (stamp once, no interval).
describe('HudReadout', () => {
  it('renders a decorative, aria-hidden readout with the PID flavour', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { container } = render(<HudReadout />)
    const el = container.querySelector('[aria-hidden="true"]')
    expect(el).toBeTruthy()
    expect(el?.textContent).toMatch(/PID 4182/)
  })

  it('does not render a network line before the geo lookup resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { container } = render(<HudReadout />)
    expect(container.textContent).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
  })

  it('renders browser, OS, IP, and location once the geo lookup succeeds', async () => {
    mockUserAgent(CHROME_MAC_UA)
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              ip: '203.0.113.42',
              city: 'San Francisco',
              country_code: 'US',
            }),
        }),
      ),
    )
    const { container } = render(<HudReadout />)
    await waitFor(() => {
      expect(container.textContent).toMatch(/CHROME · MACOS · 203\.0\.113\.42 · SAN FRANCISCO, US/)
    })
  })

  it('does not render a network line when the geo lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('blocked'))))
    const { container } = render(<HudReadout />)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(container.textContent).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
  })
})
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `npx vitest run src/components/hud/HudReadout.test.tsx`
Expected: 3 PASS, 1 FAIL — "renders browser, OS, IP, and location once the geo lookup succeeds" fails because `HudReadout` never renders that text yet. (The pending/failure tests pass vacuously today since no network line exists at all — they'll keep validating real behavior once Step 3 lands.)

- [ ] **Step 3: Implement the network line**

In `src/components/hud/HudReadout.tsx`, add after the `useClock` function and before the `HudReadout` component's docstring:

```tsx
type GeoResponse = {
  success?: boolean
  ip?: string
  city?: string
  country_code?: string
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  const browser = ua.includes('Edg/')
    ? 'EDGE'
    : ua.includes('Firefox/')
      ? 'FIREFOX'
      : ua.includes('Chrome/')
        ? 'CHROME'
        : ua.includes('Safari/')
          ? 'SAFARI'
          : 'UNKNOWN'

  const os = ua.includes('Mac OS X')
    ? 'MACOS'
    : ua.includes('Windows')
      ? 'WINDOWS'
      : ua.includes('Android')
        ? 'ANDROID'
        : /iPhone|iPad|iPod/.test(ua)
          ? 'IOS'
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
```

Update the `react` import at the top of the file from:

```tsx
import { useCallback, useSyncExternalStore } from 'react'
```

to:

```tsx
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
```

Update the `HudReadout` component to call the hook and render the new line first:

```tsx
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/hud/HudReadout.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite, type-check, and lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass, no type errors, no lint errors.

- [ ] **Step 6: Verify in a real browser against the live `ipwho.is` API**

The dev server (`next dev`) should already be running on `localhost:3000`. From the repo root:

```bash
cat > /tmp/verify-network-readout.mjs << 'EOF'
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

const skip = page.getByText('SKIP', { exact: false });
if (await skip.isVisible().catch(() => false)) {
  await skip.click();
  await page.waitForTimeout(1500);
}

await page.waitForTimeout(2000); // let the ipwho.is fetch resolve
const text = await page.evaluate(() => document.body.innerText);
console.log('Contains FACILITY:', text.includes('FACILITY'));
console.log('Network line present:', /\d+\.\d+\.\d+\.\d+/.test(text));
const match = text.match(/^[A-Z]+ · [A-Z]+ · [\d.]+ · .+, [A-Z]{2}$/m);
console.log('Formatted line:', match ? match[0] : '(not found)');

await browser.close();
EOF
node /tmp/verify-network-readout.mjs
rm /tmp/verify-network-readout.mjs
```

Expected: `Contains FACILITY: true`, `Network line present: true`, and a formatted line printed like `CHROME · MACOS · <real IP> · <CITY>, <CC>`. If `Network line present` is `false`, `ipwho.is` may be rate-limiting or unreachable from this network — re-run once; if it still fails, the graceful-hide behavior (Task 2, Step 3) is working as designed and this is an external-service issue, not a bug.

- [ ] **Step 7: Commit**

```bash
git add src/components/hud/HudReadout.tsx src/components/hud/HudReadout.test.tsx
git commit -m "$(cat <<'EOF'
Add visitor network line to HudReadout (browser/OS/IP/location)

Client-side-only lookup via ipwho.is, since the site is a static
export with no server to proxy the request through. Renders nothing
until the lookup succeeds — no placeholder, no visible error state.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
