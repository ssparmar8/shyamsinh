# ARCHIVE Portfolio — Cinematic Entry Implementation Plan (Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The entry experience — audio gate, boot sequence, decode-animated text, synthesized SFX, and smooth scroll — mounted at `/` only, without costing the static routes their speed or the site its crawlability.

**Architecture:** Everything here is a client-side overlay *on top of* server-rendered content, never a replacement for it. `/` renders its full content server-side as it does today; the gate and boot cover it and then dismiss. That single decision is what keeps `/` indexable, keeps the reduced-motion path honest, and means a failed JS bundle degrades to a working page instead of a blank one.

**Tech Stack:** Next.js 16 · React 19 · Tailwind v4 · Lenis · Web Audio API (synthesized, no asset files) · `src/lib/scramble.ts` (built, tested, Plan 1)

**Spec:** [`docs/superpowers/specs/2026-07-17-archive-portfolio-design.md`](../specs/2026-07-17-archive-portfolio-design.md) §9.00–9.02, §11.3, §13
**Prior plan:** [`2026-07-17-archive-portfolio-foundation.md`](./2026-07-17-archive-portfolio-foundation.md) — Tasks 1–10 complete, 58 tests passing

---

## What Plan 1 taught us — read before writing code

Every task in Plan 1 found a defect that its own passing tests could not see. This is not a hypothetical risk register; it is what actually happened, and this plan is more exposed to it than Plan 1 was, because animation defects are *invisible to jsdom by construction*.

| What broke | What the tests said |
| --- | --- |
| Private-host guard couldn't detect a typo in the one hostname it protected | all green |
| The decode effect rendered a frozen mask and never animated | 7 green |
| Every font on the site silently fell back to the system stack | 44 green, clean build |
| The "persistent" contact link scrolled away on any tall page | 4 green |
| The security guard never ran on the deploy path at all | 56 green, clean build |
| 13 of 18 records rendered as "RECORD 01" | 56 green |

**Therefore, in this plan, a task is not done until someone has looked at it in a real browser.** Every task below carries a mandatory browser-verification step with a measurement, not a screenshot glance. "The test passes" is not evidence. A test whose name promises more than its assertion checks is worse than no test — three of those shipped in Plan 1.

## Corrections found during execution — read before Tasks 3–7

**1. `react-hooks/set-state-in-effect` rejects the "default safe, correct in an effect"
pattern.** Tasks 1's original code used `useState(true)` + `useEffect(() => setReduced(...))`
and failed lint (`eslint-plugin-react-hooks@7.1.1`, bundled with `eslint-config-next@16`).
The rule was right. `usePrefersReducedMotion` is now `useSyncExternalStore` — `matchMedia`
*is* an external store, and the hook handles the server→client handoff itself, so there is
no mismatch and no setState-in-effect. `useOnScreen` is now a React 19 ref callback
returning a cleanup, which fires exactly when the element attaches. **Any later task
reaching for `useState` + `useEffect` to read a browser API should use one of these two
shapes instead.**

**2. `vi.fn(() => ctx)` cannot be used with `new` in Vitest 4.** It throws
`TypeError: ... is not a constructor`. Use a `function` expression:
`vi.fn(function () { return ctx })`. This matters more than it looks — in Task 2's suite
the TypeError was swallowed by `AudioBus`'s own try/catch, so "survives an AudioContext
constructor that throws" **passed for the wrong reason**: it never reached its own
`Error('blocked')`, it hit the constructor TypeError instead. Another test passing while
testing nothing.

**3. `useOnScreen`'s default margin now shrinks only the bottom edge.** It was `-10%` on
all four edges, which meant an above-the-fold hero never intersected and its decode never
ran — it sat on raw noise forever. Now `'0px 0px -10% 0px'`. Do not revert it.

**4. The in-app preview browser reports `document.visibilityState: "hidden"`, which
freezes IntersectionObserver.** IO callbacks do not fire there — for ANY element, at ANY
margin — so the preview pane will make every scroll-reveal look "dead" and every
frame-count read 1. **Verify IntersectionObserver-driven animation with Playwright, not the
preview pane.** A visible Playwright page fires IO normally. This cost real time in Task 3;
do not repeat it. (Non-IO checks — computed styles, DOM shape, curl'd HTML — are fine in
the preview pane.)

## Non-negotiables

1. **Content is never gated from a crawler or a no-JS visitor.** The gate is an overlay over server-rendered content. Verify with `curl` that `/`'s full text is in the initial HTML *while the gate exists*.
2. **`/systems/*`, `/archive`, `/contact` stay untouched and animation-free.** No Lenis, no gate, no boot. They are the escape hatch for a client who wants the email in ten seconds. Verified by test.
3. **`prefers-reduced-motion` is a first-class path, not a degraded one.** No gate, no boot, no scramble — full content, immediately. It must be *better*, not worse.
4. **The real string is always the accessible name.** Scramble noise lives in an `aria-hidden` layer. A screen reader must never hear `$G#J5KF#V`.
5. **Audio never plays without an explicit click.** Browsers block it anyway; we don't rely on that.

## File structure

```
src/
  lib/
    motion/usePrefersReducedMotion.ts   — media query hook, SSR-safe
    motion/useOnScreen.ts               — IntersectionObserver hook
    audio/AudioBus.ts                   — Web Audio singleton; no-op when muted. Pure TS.
    audio/useAudio.ts                   — React binding + mute state
    scroll/useLenis.ts                  — Lenis lifecycle; disabled under reduced motion
  components/
    text/ScrambleText.tsx               — MODIFIED: static by default, animate opt-in
    gate/Gate.tsx                       — audio consent overlay
    gate/gateStorage.ts                 — localStorage read/write, SSR-safe. Pure.
    boot/BootSequence.tsx               — 3s-capped, skippable overlay
    boot/EntryOverlay.tsx               — orchestrates Gate → Boot → dismiss
  app/
    entry-flash.tsx                     — the pre-paint script (see Task 5)
    page.tsx                            — MODIFIED: wraps content in EntryOverlay
```

**Boundaries.** `AudioBus.ts` and `gateStorage.ts` are pure TypeScript with no React — unit-testable without a DOM. Components never touch `localStorage` or `AudioContext` directly; they go through those two modules. `ScrambleText` keeps its current static behaviour as the default so the 4 existing tests and every static route keep working untouched.

---

### Task 1: Reduced-motion and on-screen hooks

**Files:** Create `src/lib/motion/usePrefersReducedMotion.ts`, `src/lib/motion/usePrefersReducedMotion.test.tsx`, `src/lib/motion/useOnScreen.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/motion/usePrefersReducedMotion.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
    })),
  )
  return listeners
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('reports true when the user asks for reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reports false when the user does not', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  /**
   * The safe default is "reduce". If we guess wrong on the server we would
   * animate at someone who asked us not to; guessing the other way merely
   * delays an animation by one frame.
   */
  it('defaults to true when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npm test -- usePrefersReducedMotion` → FAIL, cannot resolve `./usePrefersReducedMotion`

- [ ] **Step 3: Implement `src/lib/motion/usePrefersReducedMotion.ts`**

```ts
'use client'

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the user has asked for reduced motion.
 *
 * Starts `true` deliberately. The server cannot know the answer, and the two
 * wrong guesses are not symmetric: guessing "animate" flashes motion at someone
 * who explicitly asked for none, while guessing "reduce" costs one frame before
 * animation starts. Also avoids a hydration mismatch — the server and the client's
 * first render agree.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia(QUERY)
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
```

- [ ] **Step 4: Run it, watch it pass** — `npm test -- usePrefersReducedMotion` → 3 passed

- [ ] **Step 5: Implement `src/lib/motion/useOnScreen.ts`**

```ts
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
```

- [ ] **Step 6: Verify build + commit**

```bash
npm test && npm run build
git add src/lib/motion/
git commit -m "feat(motion): add reduced-motion and on-screen hooks"
```

---

### Task 2: The audio bus

Spec §11.3. The reference site's gate advertises `SCOPE: SFX · VOICE SYNTH · NO AMBIENT LOOP` — sound is synthesized in the Web Audio API, not shipped as files. Same here: zero asset weight, and the "no ambient loop" promise is *structurally* true because there is no loop to play.

**Files:** Create `src/lib/audio/AudioBus.ts`, `src/lib/audio/AudioBus.test.ts`, `src/lib/audio/useAudio.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/audio/AudioBus.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AudioBus } from './AudioBus'

class FakeOsc {
  frequency = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  type = ''
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}
class FakeGain {
  gain = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
  connect = vi.fn()
}
class FakeCtx {
  currentTime = 0
  destination = {}
  state = 'running'
  createOscillator = vi.fn(() => new FakeOsc())
  createGain = vi.fn(() => new FakeGain())
  resume = vi.fn()
  close = vi.fn()
}

let ctx: FakeCtx
beforeEach(() => {
  ctx = new FakeCtx()
  vi.stubGlobal('AudioContext', vi.fn(() => ctx))
  AudioBus.reset()
})

describe('AudioBus', () => {
  it('creates no AudioContext until enabled', () => {
    AudioBus.play('click')
    expect(AudioContext).not.toHaveBeenCalled()
  })

  it('plays a tone once enabled', () => {
    AudioBus.enable()
    AudioBus.play('click')
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  /** Muted must be a true no-op, not a zero-volume tone — no context, no cost. */
  it('is a no-op when disabled', () => {
    AudioBus.enable()
    AudioBus.disable()
    ctx.createOscillator.mockClear()
    AudioBus.play('click')
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('survives an AudioContext constructor that throws', () => {
    vi.stubGlobal('AudioContext', vi.fn(() => { throw new Error('blocked') }))
    AudioBus.reset()
    expect(() => { AudioBus.enable(); AudioBus.play('click') }).not.toThrow()
  })

  it('survives a browser with no AudioContext at all', () => {
    vi.stubGlobal('AudioContext', undefined)
    AudioBus.reset()
    expect(() => { AudioBus.enable(); AudioBus.play('boot') }).not.toThrow()
  })

  it('reports its enabled state', () => {
    expect(AudioBus.isEnabled()).toBe(false)
    AudioBus.enable()
    expect(AudioBus.isEnabled()).toBe(true)
  })

  /**
   * The gate promises "NO AMBIENT LOOP". Make that structurally true rather than a
   * matter of discipline: every voice must be a short one-shot with a stop time.
   * A looping oscillator would make the gate's own copy a lie.
   */
  it('always schedules a stop — no sound can loop', () => {
    AudioBus.enable()
    const osc = new FakeOsc()
    ctx.createOscillator.mockReturnValueOnce(osc as never)
    AudioBus.play('boot')
    expect(osc.stop).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it, watch it fail** — `npm test -- AudioBus` → cannot resolve

- [ ] **Step 3: Implement `src/lib/audio/AudioBus.ts`**

```ts
type Sound = 'click' | 'decode' | 'boot' | 'complete'

/** Short, dry, machine-ish. Deliberately not musical. */
const VOICES: Record<Sound, { freq: number; to: number; ms: number; type: OscillatorType; gain: number }> = {
  click:    { freq: 880,  to: 660,  ms: 45,  type: 'square',   gain: 0.035 },
  decode:   { freq: 1400, to: 1400, ms: 18,  type: 'square',   gain: 0.012 },
  boot:     { freq: 220,  to: 440,  ms: 260, type: 'sawtooth', gain: 0.03 },
  complete: { freq: 520,  to: 1040, ms: 180, type: 'triangle', gain: 0.04 },
}

/**
 * Synthesized SFX. No audio files exist in this project and none should.
 *
 * Muted is a genuine no-op: no AudioContext is constructed at all, so a visitor
 * who chose OFF pays nothing — not a download, not a suspended context. That is
 * also why the gate's "NO AMBIENT LOOP" claim is true by construction rather than
 * by discipline: there is no loop to forget to stop.
 *
 * Every browser call is wrapped. Audio is decoration; a browser that blocks or
 * lacks the API must degrade to silence, never to a broken page.
 */
class Bus {
  private ctx: AudioContext | null = null
  private enabled = false

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
    try {
      this.ctx?.close()
    } catch {
      /* already closed */
    }
    this.ctx = null
  }

  isEnabled() {
    return this.enabled
  }

  /** Test seam. Not for production use. */
  reset() {
    this.enabled = false
    this.ctx = null
  }

  private context(): AudioContext | null {
    if (!this.enabled) return null
    if (this.ctx) return this.ctx
    try {
      const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      return this.ctx
    } catch {
      return null
    }
  }

  play(sound: Sound) {
    const ctx = this.context()
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const v = VOICES[sound]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const now = ctx.currentTime
      const dur = v.ms / 1000

      osc.type = v.type
      osc.frequency.setValueAtTime(v.freq, now)
      if (v.to !== v.freq) osc.frequency.exponentialRampToValueAtTime(v.to, now + dur)

      gain.gain.setValueAtTime(v.gain, now)
      // Ramp to near-zero, not zero: exponentialRamp to 0 is a no-op in spec.
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + dur)
    } catch {
      /* audio is decoration — never break the page for it */
    }
  }
}

export const AudioBus = new Bus()
export type { Sound }
```

- [ ] **Step 4: Run it, watch it pass** — `npm test -- AudioBus` → 7 passed

- [ ] **Step 5: Implement `src/lib/audio/useAudio.ts`**

```ts
'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { AudioBus, type Sound } from './AudioBus'

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function useAudio() {
  const enabled = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => AudioBus.isEnabled(),
    () => false, // server snapshot — audio is never on during SSR
  )

  const setEnabled = useCallback((on: boolean) => {
    if (on) AudioBus.enable()
    else AudioBus.disable()
    emit()
  }, [])

  const play = useCallback((s: Sound) => AudioBus.play(s), [])

  return { enabled, setEnabled, play }
}
```

- [ ] **Step 6: Commit**

```bash
npm test && npm run build
git add src/lib/audio/
git commit -m "feat(audio): add synthesized SFX bus with no-op mute"
```

---

### Task 3: Animate ScrambleText

`ScrambleText` is currently a static pass-through used by `/systems/[slug]` and `/`. **Its existing behaviour must not change by default** — the static routes must stay zero-JS. Animation is opt-in via a new `animate` prop.

**Files:** Modify `src/components/text/ScrambleText.tsx`; create `src/components/text/ScrambleTextAnimated.tsx`, `src/components/text/ScrambleTextAnimated.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/text/ScrambleTextAnimated.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrambleTextAnimated } from './ScrambleTextAnimated'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never) }
    disconnect() {}
    unobserve() {}
  })
})

describe('ScrambleTextAnimated', () => {
  /**
   * The single most important property. Noise must never reach the accessibility
   * tree — a screen reader hearing "$G#J5KF#V" instead of the name is a total
   * failure, and it is invisible in a screenshot.
   */
  it('exposes the real text to assistive tech from first paint', () => {
    render(<ScrambleTextAnimated text="SHYAMSINH PARMAR" />)
    expect(screen.getByText('SHYAMSINH PARMAR')).toBeInTheDocument()
  })

  it('hides the decorative noise layer from assistive tech', () => {
    const { container } = render(<ScrambleTextAnimated text="SHYAMSINH" />)
    const noise = container.querySelector('[aria-hidden="true"]')
    expect(noise).toBeTruthy()
  })

  it('keeps the real text in the DOM even while animating', () => {
    const { container } = render(<ScrambleTextAnimated text="AI ARCHITECT" />)
    expect(container.textContent).toContain('AI ARCHITECT')
  })

  it('renders the requested element type', () => {
    render(<ScrambleTextAnimated as="h1" text="RECORD" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RECORD')
  })

  it('renders plain, un-noised text under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<ScrambleTextAnimated text="AI ARCHITECT" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.textContent).toBe('AI ARCHITECT')
  })
})
```

- [ ] **Step 2: Run it, watch it fail** — cannot resolve `./ScrambleTextAnimated`

- [ ] **Step 3: Implement `src/components/text/ScrambleTextAnimated.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState, type ElementType } from 'react'
import { scrambleFrame } from '@/lib/scramble'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useOnScreen } from '@/lib/motion/useOnScreen'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Milliseconds for the full decode. */
  durationMs?: number
  seed?: number
  onDone?: () => void
}

/**
 * Text that decodes out of glyph noise when it scrolls into view.
 *
 * Accessibility shape, and it is not negotiable: the real string sits in a
 * visually-hidden span that is always in the DOM, so it is the accessible name and
 * the indexed text from first paint. The animated noise is a separate
 * `aria-hidden` layer. A screen reader must never encounter the noise.
 *
 * Under reduced motion this renders exactly one plain text node — no noise layer,
 * no timer, no observer.
 */
export function ScrambleTextAnimated({
  text,
  as: Tag = 'span',
  className,
  durationMs = 900,
  seed = 0,
  onDone,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const { ref, seen } = useOnScreen<HTMLElement>()
  const [frame, setFrame] = useState(() => scrambleFrame(text, 0, seed))
  const [done, setDone] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduced || !seen || done) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      setFrame(scrambleFrame(text, p, seed))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDone(true)
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, seen, done, text, durationMs, seed, onDone])

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag ref={ref as never} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{done ? text : frame}</span>
    </Tag>
  )
}
```

- [ ] **Step 4: Add `.sr-only` to `src/app/globals.css`**

Tailwind v4 provides `sr-only`, but verify it exists in the built CSS before relying on it. If absent, add:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 5: Run it, watch it pass** — `npm test -- ScrambleTextAnimated` → 5 passed

- [ ] **Step 6: Verify the static routes did NOT change**

Run: `npm test` → all previous tests still pass, including `ScrambleText.test.tsx`'s 4.
Run: `npm run build`, then `curl -s localhost:3000/systems/aiva | grep -c 'AIVA Chat'` → must be ≥1 (text still server-rendered).

- [ ] **Step 7: MANDATORY browser verification**

Build a probe route rendering `<ScrambleTextAnimated text="SHYAMSINH PARMAR" />`. **Do not name it with a leading underscore** — Next treats `_`-prefixed folders as private and won't route them. Serve it, then in the browser console:

```js
// Sample the noise layer across frames. If it does not change, the animation is dead —
// this exact defect shipped in Plan 1 with all 7 of its tests passing.
const el = document.querySelector('[aria-hidden="true"]');
const seen = new Set();
const id = setInterval(() => seen.add(el.textContent), 16);
setTimeout(() => { clearInterval(id); console.log('distinct frames:', seen.size); }, 900);
```

Expected: **distinct frames > 10**. If it is 1, the animation is not running — report it, do not proceed.

Also confirm: `document.querySelector('.sr-only').textContent === 'SHYAMSINH PARMAR'`, and the element's accessible name is the real text (check the a11y tree, not just the DOM).

**Delete the probe route before committing.**

- [ ] **Step 8: Commit**

```bash
git add src/components/text/ src/app/globals.css
git commit -m "feat(text): add decode-animated ScrambleText with a11y-safe noise layer"
```

---

### Task 4: Gate storage

**Files:** Create `src/components/gate/gateStorage.ts`, `src/components/gate/gateStorage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readGate, writeGate, GATE_KEY } from './gateStorage'

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('gateStorage', () => {
  it('returns null when the visitor has never chosen', () => {
    expect(readGate()).toBeNull()
  })

  it('round-trips an ON choice', () => {
    writeGate(true)
    expect(readGate()).toBe(true)
  })

  it('round-trips an OFF choice', () => {
    writeGate(false)
    expect(readGate()).toBe(false)
  })

  /**
   * Safari in private mode throws on localStorage.setItem. An unhandled throw here
   * would take down the entry overlay and, with it, the whole homepage.
   */
  it('survives storage that throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
    expect(() => writeGate(true)).not.toThrow()
  })

  it('survives storage that throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readGate()).toBeNull()
  })

  it('treats a corrupted value as no choice', () => {
    localStorage.setItem(GATE_KEY, 'banana')
    expect(readGate()).toBeNull()
  })
})
```

- [ ] **Step 2: Run it, watch it fail**

- [ ] **Step 3: Implement `src/components/gate/gateStorage.ts`**

```ts
export const GATE_KEY = 'archive:audio'

/**
 * The visitor's audio choice, or null if they have not chosen.
 *
 * Every access is wrapped. Safari in private mode throws on write, some
 * privacy extensions throw on read, and an unhandled throw here would take out
 * the entry overlay and the entire homepage with it. Storage is a convenience;
 * losing it must cost the visitor one extra prompt, nothing more.
 */
export function readGate(): boolean | null {
  try {
    const v = localStorage.getItem(GATE_KEY)
    if (v === 'on') return true
    if (v === 'off') return false
    return null
  } catch {
    return null
  }
}

export function writeGate(on: boolean): void {
  try {
    localStorage.setItem(GATE_KEY, on ? 'on' : 'off')
  } catch {
    /* choice is not persisted; the visitor sees the gate again. Acceptable. */
  }
}
```

- [ ] **Step 4: Run it, watch it pass** — 6 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/gate/
git commit -m "feat(gate): add fault-tolerant gate storage"
```

---

### Task 5: The Gate and Boot overlay

This is the riskiest task in the plan. Read the whole thing before starting.

**Files:** Create `src/components/gate/Gate.tsx`, `src/components/boot/BootSequence.tsx`, `src/components/boot/EntryOverlay.tsx`, `src/components/boot/EntryOverlay.test.tsx`

#### The hydration problem, and why the overlay starts hidden

The gate must show only to first-time visitors — a fact that lives in `localStorage`, which the server cannot read. Rendering `<Gate />` on the server and then removing it on the client is a hydration mismatch, and React 19 will complain or thrash.

**Therefore the overlay renders nothing on the server and on the first client render, then decides in an effect.** The consequences are deliberate:

- A returning visitor sees content immediately — correct.
- A first-time visitor may see one frame of content before the gate covers it. **This is accepted.** The alternative — hiding content until JS decides — is the exact failure mode we refuse: it would blank the page for crawlers and for anyone whose JS fails.
- Content is always in the HTML. Verify with `curl`.

- [ ] **Step 1: Write the failing test**

`src/components/boot/EntryOverlay.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryOverlay } from './EntryOverlay'
import { GATE_KEY } from '@/components/gate/gateStorage'

function setMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: reduced, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
}

beforeEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  setMotion(false)
})

describe('EntryOverlay', () => {
  /** Non-negotiable #1: content is never gated from a crawler or a no-JS visitor. */
  it('always renders its children', async () => {
    render(<EntryOverlay><p>RECORD_LOG</p></EntryOverlay>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('shows the gate to a first-time visitor', async () => {
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    expect(await screen.findByText(/OUTPUT ROUTING/i)).toBeInTheDocument()
  })

  it('never shows the gate to a visitor who already chose', async () => {
    localStorage.setItem(GATE_KEY, 'off')
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await waitFor(() => expect(screen.queryByText(/OUTPUT ROUTING/i)).not.toBeInTheDocument())
  })

  /** Non-negotiable #3: reduced motion gets content, not a performance. */
  it('shows neither gate nor boot under reduced motion', async () => {
    setMotion(true)
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await waitFor(() => {
      expect(screen.queryByText(/OUTPUT ROUTING/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument()
    })
  })

  it('records the choice so the gate never returns', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(localStorage.getItem(GATE_KEY)).toBe('off')
  })

  it('moves to the boot sequence after a choice', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(await screen.findByText(/LOADING/i)).toBeInTheDocument()
  })

  it('offers a skip during boot', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    expect(await screen.findByRole('button', { name: /SKIP/i })).toBeInTheDocument()
  })

  it('dismisses everything when skip is pressed', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    await user.click(await screen.findByRole('button', { name: /SKIP/i }))
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })

  it('lets Escape dismiss the boot', async () => {
    const user = userEvent.setup()
    render(<EntryOverlay><p>x</p></EntryOverlay>)
    await user.click(await screen.findByRole('button', { name: /OFF/i }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText(/LOADING/i)).not.toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run it, watch it fail**

- [ ] **Step 3: Implement `src/components/gate/Gate.tsx`**

```tsx
'use client'

import { useAudio } from '@/lib/audio/useAudio'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

/**
 * The audio consent prompt. Mirrors the reference site's opening move: it tells the
 * visitor this is a system before it tells them anything else.
 *
 * OFF is a first-class path, not a penalty — nothing is gated behind audio. The
 * "NO AMBIENT LOOP" claim is literally true: AudioBus only ever plays short SFX,
 * and when disabled it constructs no AudioContext at all.
 */
export function Gate({ onChoose }: { onChoose: (audioOn: boolean) => void }) {
  const { setEnabled, play } = useAudio()

  const choose = (on: boolean) => {
    setEnabled(on)
    if (on) play('click')
    onChoose(on)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Audio output routing"
      className="hud-grid fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-bg)]"
    >
      <div className={LABEL}>{'// AUDIO · RX'}</div>
      <h2 className="mt-3 font-mono text-sm tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-base">
        OUTPUT ROUTING
      </h2>
      <p className={`${LABEL} mt-3 px-6 text-center`}>
        SELECT CHANNEL STATE TO INITIALIZE INTERFACE
      </p>
      <p className={`${LABEL} mt-1 px-6 text-center`}>
        SCOPE: SFX · NO AMBIENT LOOP
      </p>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => choose(true)}
          className="border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ◂ ON
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          className="border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-2 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
        >
          ◂ OFF
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/boot/BootSequence.tsx`**

```tsx
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
      className="hud-grid fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-bg)]"
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
```

- [ ] **Step 5: Implement `src/components/boot/EntryOverlay.tsx`**

```tsx
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
```

- [ ] **Step 6: Run the tests** — `npm test -- EntryOverlay` → 9 passed

- [ ] **Step 7: MANDATORY browser verification — every item**

Wire `EntryOverlay` into `src/app/page.tsx` (wrap the existing `<HudFrame>…</HudFrame>` content), build, serve. Then verify each:

1. **Content is in the HTML while the gate exists:**
   `curl -s localhost:3000/ | grep -c 'Shyamsinh Parmar'` → **must be ≥1**. If 0, the gate is hiding content from crawlers — stop and report.
2. **First visit shows the gate.** Clear localStorage, reload, look. Screenshot.
3. **Second visit does not.** Reload. The gate must not reappear.
4. **`localStorage.archive:audio`** holds `on`/`off` after choosing.
5. **Boot really ends within ~3s.** Time it: `performance.now()` before/after. Report the actual number.
6. **SKIP works** and **Escape works**.
7. **Audio ON actually makes sound** — verify an `AudioContext` exists after choosing ON (`AudioBus` internals or a console check). Audio OFF must construct **no** AudioContext.
8. **Reduced motion shows no gate and no boot.** Use the browser's emulation, not a stub.
9. **`/systems/aiva` shows no gate** — the escape hatch. If it does, the overlay has leaked out of `/`.
10. **No horizontal scroll, nothing clipped, at 375px.**

- [ ] **Step 8: Commit**

```bash
git add src/components/gate/ src/components/boot/ src/app/page.tsx
git commit -m "feat(entry): add audio gate and 3s-capped boot sequence"
```

---

### Task 6: Smooth scroll

**Files:** Create `src/lib/scroll/useLenis.ts`, `src/components/scroll/SmoothScroll.tsx`; modify `src/app/page.tsx`

- [ ] **Step 1: Install**

```bash
npm i lenis
```

- [ ] **Step 2: Implement `src/lib/scroll/useLenis.ts`**

```ts
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

/**
 * Smooth scroll, at `/` only.
 *
 * Disabled entirely under reduced motion — smooth scrolling IS motion, and
 * hijacking the scroll of someone who asked for none is exactly the kind of
 * "accessible in name only" that spec §13 rejects.
 *
 * Lenis is imported statically here but this hook is only mounted from `/`, so
 * the static routes never pull it into their bundle. Verify that claim with the
 * network check in Step 4 rather than trusting it.
 */
export function useLenis() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf = 0
    const tick = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduced])
}
```

- [ ] **Step 3: Implement `src/components/scroll/SmoothScroll.tsx`**

```tsx
'use client'

import { useLenis } from '@/lib/scroll/useLenis'

/** Mount once, at `/` only. Renders nothing. */
export function SmoothScroll() {
  useLenis()
  return null
}
```

- [ ] **Step 4: MANDATORY browser verification**

Add `<SmoothScroll />` to `src/app/page.tsx`. Build, serve.

1. **`/` scrolls smoothly.** Look. Report honestly whether it feels good or seasick.
2. **`/systems/aiva` does NOT load lenis.** In DevTools Network, filter `lenis` while loading `/systems/aiva` → **zero requests**. If lenis appears, it has leaked into the shared bundle — that breaks non-negotiable #2. Report it.
3. **Reduced motion disables it.** Emulate reduced motion, confirm native scroll (no easing).
4. **Anchor links and keyboard scrolling still work** (Space, PageDown, Home/End). Lenis breaking keyboard scroll is a common and serious accessibility regression.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scroll/ src/components/scroll/ src/app/page.tsx package.json package-lock.json
git commit -m "feat(scroll): add Lenis smooth scroll at / only"
```

---

### Task 7: Verify the whole entry experience

No new code. This task exists because Plan 1 proved that per-task green tests do not add up to a working system.

- [ ] **Step 1: Full suite**

```bash
npm run lint && npm test && npm run build && npx tsc --noEmit
```

- [ ] **Step 2: Add e2e coverage to `tests/e2e/routes.spec.ts`**

```ts
test.describe('the entry experience', () => {
  test('a first-time visitor gets the gate, and content is still in the HTML', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.getByText(/OUTPUT ROUTING/i)).toBeVisible()
    // The gate must COVER content, never replace it — crawlers and no-JS visitors
    // see the page regardless.
    expect(await page.content()).toContain('Shyamsinh Parmar')
  })

  test('the gate never returns once a choice is made', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: /OFF/i }).click()
    await page.getByRole('button', { name: /SKIP/i }).click()
    await page.reload()
    await expect(page.getByText(/OUTPUT ROUTING/i)).toHaveCount(0)
  })

  test('a record route never shows the gate', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {})
    await page.goto('/systems/aiva')
    await expect(page.getByText(/OUTPUT ROUTING/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
  })

  test('record routes ship no animation libraries', async ({ page }) => {
    const heavy: string[] = []
    page.on('request', (r) => {
      if (/three|gsap|lenis/i.test(r.url())) heavy.push(r.url())
    })
    await page.goto('/systems/aiva')
    await page.waitForLoadState('networkidle')
    expect(heavy).toEqual([])
  })
})

test.describe('reduced motion gets the site, not a performance', () => {
  test.use({ reducedMotion: 'reduce' })

  test('no gate, no boot, content immediately', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.getByText(/OUTPUT ROUTING/i)).toHaveCount(0)
    await expect(page.getByText(/LOADING/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Shyamsinh Parmar/i })).toBeVisible()
  })
})
```

- [ ] **Step 3: Run e2e**

```bash
npm run e2e
```

- [ ] **Step 4: Measure, do not assume**

Report actual numbers for each:

| Check | Target |
| --- | --- |
| `curl -s localhost:3000/ \| grep -c 'Shyamsinh Parmar'` | ≥ 1 |
| Boot duration, measured | ≤ 3.2s |
| lenis/three/gsap requests on `/systems/aiva` | 0 |
| JS transferred on `/systems/aiva` | report; must not grow vs Plan 1's 145.6 KB gzip |
| Lighthouse a11y on `/` | 1.0 |
| Distinct noise frames during a decode | > 10 |

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test(e2e): cover the entry experience and the escape hatch"
```

---

## Definition of done

- [ ] `npm run lint && npm test && npm run build && npm run e2e` all pass
- [ ] `/`'s full text is in the initial HTML **while the gate is showing**
- [ ] The gate shows once, then never again
- [ ] Boot ends within ~3s, and SKIP and Escape both work from frame one
- [ ] Audio OFF constructs **no** AudioContext
- [ ] `prefers-reduced-motion` gets no gate, no boot, no scramble, no Lenis
- [ ] `/systems/*`, `/archive`, `/contact` load with **zero** animation libraries
- [ ] A decode shows > 10 distinct noise frames in a real browser
- [ ] A screen reader gets the real string, never the noise
- [ ] Nothing clipped and no horizontal scroll at 375px

## Then

**Plan 3** — the canvas and scroll choreography: Three.js constellation with a 2D fallback and device-tiered particle budgets, GSAP pinned scroll, the telemetry map, and the full eight-beat homepage. Written once this lands.

**Still blocking publication** (not this plan): the 2018 anchor under "8 years", ServiceNow/Goodfin scope, client consent to be named, and the unconfirmed LinkedIn URL.
