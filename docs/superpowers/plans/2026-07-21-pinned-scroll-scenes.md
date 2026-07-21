# Pinned Scroll-Scrubbed Scenes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every homepage beat into a pinned, scroll-scrubbed scene whose content assembles (decode + mask-wipe + spatial rise) as you scroll through it, while preserving the site's reduced-motion / no-JS / touch contracts.

**Architecture:** A reusable `Scene` client wrapper (Approach C from the spec) replaces per-beat `Reveal`. It picks one of three modes — `static` (reduced/SSR: children in normal flow), `reveal` (touch/narrow: today's one-shot fade), `scrub` (pointer+wide: pin the section and drive a single GSAP timeline off scroll). Inside a scrub Scene, `<DecodeLine>` / `<MaskWipe>` / `<Rise>` primitives register with the Scene via React context; the Scene sorts them by DOM order and builds one scrubbed timeline. Lenis is bridged to `ScrollTrigger.update` via `gsap.ticker` so scrubbing tracks the smoothed scroll.

**Tech Stack:** Next 16 (App Router, RSC), React 19, GSAP 3 + ScrollTrigger, Lenis, Tailwind v4, Vitest + Testing Library, Playwright.

**Reference:** [spec](../specs/2026-07-21-pinned-scroll-scenes-design.md) · motion feel: https://to-portfolio.com/

**Milestones (each independently shippable):**
- **M1 — vertical slice (Tasks 1–5):** engine bridge + Scene with a default section-level scrub + page wiring. Every beat pins and assembles; no per-element layers yet.
- **M2 — layer primitives (Tasks 6–10):** DecodeLine / MaskWipe / Rise + timeline-from-layers.
- **M3 — apply + polish (Tasks 11–16):** annotate the seven beats, retune the centerpiece, full e2e.

---

## Repo conventions (read before starting)

- `AGENTS.md`: modified Next.js — consult `node_modules/next/dist/docs/` before writing code. Confirmed relevant: **Server Components passed as `children` to a Client Component stay server-rendered** (`.../05-server-and-client-components.md`), so `<Scene>{server section}</Scene>` and context reaching client layer-primitives nested in server markup both hold.
- Client-only reactive reads use `useSyncExternalStore` (see `usePrefersReducedMotion.ts`, `useDeviceTier.ts`). Match that shape for new hooks.
- Unit tests mock `gsap` + `gsap/ScrollTrigger` and stub `matchMedia` (see `Reveal.test.tsx`). Real scroll/pin behavior is verified in Playwright, not jsdom.
- Run unit tests: `npx vitest run <path>`. Run e2e: `npm run e2e`. Lint: `npm run lint`.
- Commit style: conventional commits; footer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/motion/sceneMode.ts` | **new** — pure `pickSceneMode(reduced, coarseOrNarrow) → SceneMode` |
| `src/lib/motion/useSceneMode.ts` | **new** — `useSyncExternalStore` over reduced + `(pointer:coarse)` + width |
| `src/components/motion/SceneContext.ts` | **new** — context + `LayerReg`/`SceneCtx` types |
| `src/lib/motion/buildSceneTimeline.ts` | **new** — pure-ish: `(root, layers[]) → paused gsap.timeline` (default reveal when no layers) |
| `src/components/motion/Scene.tsx` | **new** — the three-mode wrapper: static / reveal / scrub(pin+timeline) |
| `src/components/motion/layers/Rise.tsx` | **new** — spatial-rise layer primitive |
| `src/components/motion/layers/MaskWipe.tsx` | **new** — clip-wipe layer primitive |
| `src/components/motion/layers/DecodeLine.tsx` | **new** — scrub-driven scramble, a11y-mirrored |
| `src/lib/scroll/useLenis.ts` | **modify** — bridge Lenis→ScrollTrigger via `gsap.ticker`; refresh on `entry:done` |
| `src/components/boot/EntryOverlay.tsx` | **modify** — dispatch `entry:done` when phase becomes `done` |
| `src/app/page.tsx` | **modify** — wrap beats in `Scene length=…` instead of `Reveal` |
| `src/components/sections/*.tsx`, `record/SystemRecord.tsx` | **modify** — annotate elements with layer primitives |
| `src/lib/canvas/wireframe.ts` | **modify** — retune `WIRE_SCROLL_TURN` for the taller page |
| `tests/e2e/motion.spec.ts` | **modify** — pin/scrub/reduced/touch assertions |

---

## Task 1: `pickSceneMode` (pure mode selection)

**Files:**
- Create: `src/lib/motion/sceneMode.ts`
- Test: `src/lib/motion/sceneMode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/motion/sceneMode.test.ts
import { describe, it, expect } from 'vitest'
import { pickSceneMode } from './sceneMode'

describe('pickSceneMode', () => {
  it('reduced motion wins over everything → static', () => {
    expect(pickSceneMode(true, false)).toBe('static')
    expect(pickSceneMode(true, true)).toBe('static')
  })
  it('touch/narrow but not reduced → reveal', () => {
    expect(pickSceneMode(false, true)).toBe('reveal')
  })
  it('pointer + wide + not reduced → scrub', () => {
    expect(pickSceneMode(false, false)).toBe('scrub')
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/lib/motion/sceneMode.test.ts`
Expected: FAIL — `pickSceneMode` is not defined.

- [ ] **Step 3: Implement**

```ts
// src/lib/motion/sceneMode.ts
export type SceneMode = 'static' | 'reveal' | 'scrub'

/**
 * Which motion treatment a Scene gets. Ordered by guardrail priority:
 * reduced motion → no motion at all; touch/narrow → today's one-shot reveal;
 * otherwise the full pinned scrub. Pure so it's testable without a browser.
 */
export function pickSceneMode(reduced: boolean, coarseOrNarrow: boolean): SceneMode {
  if (reduced) return 'static'
  if (coarseOrNarrow) return 'reveal'
  return 'scrub'
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run src/lib/motion/sceneMode.test.ts` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/sceneMode.ts src/lib/motion/sceneMode.test.ts
git commit -m "feat(motion): pure scene-mode selector

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `useSceneMode` hook

**Files:**
- Create: `src/lib/motion/useSceneMode.ts`
- Test: `src/lib/motion/useSceneMode.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/motion/useSceneMode.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSceneMode } from './useSceneMode'

// matchMedia stub: reduced + coarse are the two queries the hook reads.
function setEnv({ reduced, coarse, width }: { reduced: boolean; coarse: boolean; width: number }) {
  vi.stubGlobal('innerWidth', width)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('coarse') ? coarse : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('useSceneMode', () => {
  it('reduced → static', () => {
    setEnv({ reduced: true, coarse: false, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('static')
  })
  it('coarse pointer → reveal', () => {
    setEnv({ reduced: false, coarse: true, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('reveal')
  })
  it('narrow viewport → reveal', () => {
    setEnv({ reduced: false, coarse: false, width: 600 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('reveal')
  })
  it('wide + fine pointer → scrub', () => {
    setEnv({ reduced: false, coarse: false, width: 1400 })
    expect(renderHook(() => useSceneMode()).result.current).toBe('scrub')
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/lib/motion/useSceneMode.test.tsx` → FAIL (not defined).

- [ ] **Step 3: Implement**

```ts
// src/lib/motion/useSceneMode.ts
'use client'

import { useSyncExternalStore } from 'react'
import { pickSceneMode, type SceneMode } from './sceneMode'

const RM = '(prefers-reduced-motion: reduce)'
const COARSE = '(pointer: coarse)'
const NARROW = 768

function read(): SceneMode {
  if (typeof matchMedia !== 'function') return 'static'
  const reduced = matchMedia(RM).matches
  const coarseOrNarrow =
    matchMedia(COARSE).matches || (typeof innerWidth === 'number' && innerWidth < NARROW)
  return pickSceneMode(reduced, coarseOrNarrow)
}

// SceneMode is a primitive string, so referential stability is automatic — no cached
// object dance (unlike useDeviceTier). We still memo to avoid re-notifying identical reads.
let cached: SceneMode | null = null
function getSnapshot(): SceneMode {
  const next = read()
  if (cached === next) return cached
  cached = next
  return cached
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const rm = matchMedia(RM)
  const coarse = matchMedia(COARSE)
  rm.addEventListener('change', onChange)
  coarse.addEventListener('change', onChange)
  addEventListener('resize', onChange)
  return () => {
    rm.removeEventListener('change', onChange)
    coarse.removeEventListener('change', onChange)
    removeEventListener('resize', onChange)
  }
}

// Server (and first client render) → 'static': full content, no wrapper, no pin. The
// client re-reads after mount and swaps to reveal/scrub, exactly like usePrefersReducedMotion.
const getServerSnapshot = (): SceneMode => 'static'

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run src/lib/motion/useSceneMode.test.tsx` → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/useSceneMode.ts src/lib/motion/useSceneMode.test.tsx
git commit -m "feat(motion): useSceneMode hook (reduced/touch/pointer → mode)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Bridge Lenis → ScrollTrigger + `entry:done` refresh

**Files:**
- Modify: `src/lib/scroll/useLenis.ts`
- Modify: `src/components/boot/EntryOverlay.tsx`

No new unit test (jsdom has no scroll/pin; covered by e2e in Task 16). Verify by build + manual browser check at end of M1.

- [ ] **Step 1: Rewrite `useLenis.ts` to drive Lenis from `gsap.ticker` and update ScrollTrigger**

Replace the whole file body with:

```ts
// src/lib/scroll/useLenis.ts
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

// Registered once, SSR-guarded (module is 'use client' but Next still evaluates it on
// the server while rendering the page that hydrates it). registerPlugin is idempotent.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Smooth scroll on `/` only, disabled under reduced motion.
 *
 * Drives Lenis from GSAP's ticker (not a standalone rAF) and updates ScrollTrigger on
 * every Lenis scroll, so pinned/scrubbed Scenes track the smoothed scroll frame-for-frame.
 * Lenis animates the real window scroll (no transform wrapper), so ScrollTrigger's default
 * `window` scroller and `pinType: 'fixed'` are correct — no scrollerProxy needed.
 */
export function useLenis() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => lenis.raf(time * 1000) // ticker seconds → Lenis ms
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    // Scenes create their pins on mount, but the boot overlay locks body scroll while
    // it's up (EntryOverlay sets overflow:hidden). Once it dismisses and restores
    // overflow, re-measure so pin start/end land against the real layout.
    const refresh = () => ScrollTrigger.refresh()
    addEventListener('entry:done', refresh)

    return () => {
      removeEventListener('entry:done', refresh)
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [reduced])
}
```

- [ ] **Step 2: Dispatch `entry:done` from `EntryOverlay` when the overlay clears**

In `src/components/boot/EntryOverlay.tsx`, add an effect right AFTER the existing `overlayUp` scroll-lock effect (after the block ending `}, [overlayUp])`):

```tsx
  // Signal the scroll layer (useLenis) to re-measure once the overlay is gone and body
  // overflow is restored — pins created during boot need a refresh against real layout.
  useEffect(() => {
    if (phase === 'done' && typeof window !== 'undefined') {
      dispatchEvent(new Event('entry:done'))
    }
  }, [phase])
```

(`useEffect` is already imported in this file.)

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit` → no errors.
Run: `npm run lint` → no new errors.

- [ ] **Step 4: Run the existing unit suite (nothing should break)**

Run: `npx vitest run` → all green (EntryOverlay/useLenis have no unit tests that assert the old rAF; if any fail, fix before continuing).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scroll/useLenis.ts src/components/boot/EntryOverlay.tsx
git commit -m "feat(scroll): bridge Lenis to ScrollTrigger via gsap.ticker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

> **Execution note (2026-07-21):** browser verification of M1 showed a single pin-from-`top`
> scrub leaves the hero blank at scroll 0 and makes below-fold beats rise as blank blocks
> before pinning. Scene was refined to a **two-phase** choreography: an ASSEMBLE trigger
> scrubbed over `top bottom → top top` (content builds on entrance; the first beat's start is
> already passed at load, so the hero renders visible), plus a separate HOLD trigger that pins
> at `top top` for `length` viewports. Content sits in an inner wrapper, the pin is on the
> outer, so pin (`position:fixed`) and content transforms don't fight. The layer/registration
> API below is unchanged; see the committed `Scene.tsx` for the final shape.

## Task 4: `Scene` component (three modes; scrub pins + default timeline)

Depends on Task 5's `buildSceneTimeline` for the scrub timeline — build the context + timeline module first, then Scene.

**Files:**
- Create: `src/components/motion/SceneContext.ts`
- Create: `src/lib/motion/buildSceneTimeline.ts`
- Create: `src/components/motion/Scene.tsx`
- Test: `src/components/motion/Scene.test.tsx`

- [ ] **Step 1: Create the context + types**

```ts
// src/components/motion/SceneContext.ts
'use client'

import { createContext } from 'react'
import type { SceneMode } from '@/lib/motion/sceneMode'

export type LayerKind = 'decode' | 'mask' | 'rise'

/** A single animated element registered by a layer primitive with its parent Scene. */
export type LayerReg = {
  el: HTMLElement
  kind: LayerKind
  /** Optional explicit timeline position (0..1). Default: staggered by DOM order. */
  at?: number
  duration?: number
  /** rise: px travelled. */
  offset?: number
  /** decode: target string + noise seed. */
  text?: string
  seed?: number
}

export type SceneCtx = {
  mode: SceneMode
  register: (reg: LayerReg) => () => void
}

export const SceneContext = createContext<SceneCtx | null>(null)
```

- [ ] **Step 2: Create the timeline builder**

```ts
// src/lib/motion/buildSceneTimeline.ts
import { gsap } from 'gsap'
import { scrambleFrame } from '@/lib/scramble'
import type { LayerReg } from '@/components/motion/SceneContext'

const STAGGER = 0.12 // timeline-time between consecutive layers when `at` is not given

/**
 * Build ONE paused timeline for a Scene from its registered layers, sorted by DOM order.
 * With no layers, a default: the whole section rises + fades across the first part of the
 * pin, so even an un-annotated beat assembles on scroll. ScrollTrigger scrubs this.
 */
export function buildSceneTimeline(root: HTMLElement, layers: LayerReg[]) {
  const tl = gsap.timeline({ paused: true })

  if (layers.length === 0) {
    tl.fromTo(root, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'none' })
    tl.to({}, { duration: 0.4 }) // hold, so the beat sits settled through the rest of the pin
    return tl
  }

  const ordered = [...layers].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )

  ordered.forEach((layer, i) => {
    const at = layer.at ?? i * STAGGER
    if (layer.kind === 'rise') {
      tl.fromTo(
        layer.el,
        { autoAlpha: 0, y: layer.offset ?? 24 },
        { autoAlpha: 1, y: 0, duration: layer.duration ?? 0.5, ease: 'none' },
        at,
      )
    } else if (layer.kind === 'mask') {
      tl.fromTo(
        layer.el,
        { clipPath: 'inset(0 0 100% 0)', y: 14, autoAlpha: 0 },
        { clipPath: 'inset(0 0 0% 0)', y: 0, autoAlpha: 1, duration: layer.duration ?? 0.5, ease: 'none' },
        at,
      )
    } else {
      // decode: tween a proxy 0→1 and write scrambleFrame() into the aria-hidden node.
      const target = layer.text ?? layer.el.textContent ?? ''
      const seed = layer.seed ?? 0
      const proxy = { p: 0 }
      tl.to(
        proxy,
        {
          p: 1,
          duration: layer.duration ?? 0.45,
          ease: 'none',
          onUpdate: () => {
            layer.el.textContent = scrambleFrame(target, proxy.p, seed)
          },
        },
        at,
      )
    }
  })

  return tl
}
```

- [ ] **Step 3: Write the failing Scene test**

```tsx
// src/components/motion/Scene.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scene } from './Scene'

function setEnv(mode: 'static' | 'reveal' | 'scrub') {
  const reduced = mode === 'static'
  const coarse = mode === 'reveal'
  vi.stubGlobal('innerWidth', 1400)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('coarse') ? coarse : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

// Same jsdom-can't-drive-ScrollTrigger stubbing as Reveal.test.tsx.
vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), timeline: vi.fn(() => ({ fromTo: vi.fn().mockReturnThis(), to: vi.fn().mockReturnThis(), kill: vi.fn() })) },
}))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })), update: vi.fn(), refresh: vi.fn() },
}))

beforeEach(() => vi.unstubAllGlobals())

describe('Scene', () => {
  it('always renders children (content never gated) in every mode', () => {
    for (const mode of ['static', 'reveal', 'scrub'] as const) {
      setEnv(mode)
      const { unmount } = render(
        <Scene>
          <p>BEAT {mode}</p>
        </Scene>,
      )
      expect(screen.getByText(`BEAT ${mode}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('static mode wraps in nothing (no reveal/pin styling)', () => {
    setEnv('static')
    const { container } = render(
      <Scene>
        <p>BEAT</p>
      </Scene>,
    )
    // children rendered directly; the <p> is the first element, no wrapper div class
    expect(container.querySelector('p')).toBe(container.firstElementChild)
  })

  it('reveal mode starts hidden awaiting the one-shot trigger', () => {
    setEnv('reveal')
    const { container } = render(
      <Scene>
        <p>BEAT</p>
      </Scene>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.className).toContain('opacity-0')
  })
})
```

- [ ] **Step 4: Run it, verify it fails**

Run: `npx vitest run src/components/motion/Scene.test.tsx` → FAIL (Scene not defined).

- [ ] **Step 5: Implement `Scene.tsx`**

```tsx
// src/components/motion/Scene.tsx
'use client'

import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSceneMode } from '@/lib/motion/useSceneMode'
import { useReveal } from '@/lib/motion/useReveal'
import { buildSceneTimeline } from '@/lib/motion/buildSceneTimeline'
import { SceneContext, type LayerReg, type SceneCtx } from './SceneContext'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  children: ReactNode
  /** Pin length in viewport multiples (how much scroll the beat consumes). */
  length?: number
  className?: string
}

/**
 * A beat as a pinned, scroll-scrubbed scene. Three modes (see useSceneMode):
 *   static — reduced motion / SSR: children in normal flow, fully visible, no wrapper.
 *   reveal — touch / narrow: today's one-shot fade+slide (reuses useReveal). No pin.
 *   scrub  — pointer + wide: pin the section and drive one timeline off scroll progress.
 *
 * Like Reveal, this only ever wraps already-server-rendered children — it never gates them.
 */
export function Scene({ children, length = 1, className }: Props) {
  const mode = useSceneMode()

  // Layer registry (scrub only). Children register via context in their ref callbacks,
  // which run bottom-up — so they're all present by the time scrubRef (the parent) runs.
  const layers = useRef<Map<HTMLElement, LayerReg>>(new Map())
  const register = useCallback((reg: LayerReg) => {
    layers.current.set(reg.el, reg)
    return () => {
      layers.current.delete(reg.el)
    }
  }, [])
  const ctx = useMemo<SceneCtx>(() => ({ mode, register }), [mode, register])

  const scrubRef = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return
      const tl = buildSceneTimeline(el, [...layers.current.values()])
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => '+=' + window.innerHeight * length,
        pin: true,
        pinSpacing: true,
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
      })
      return () => {
        st.kill()
        tl.kill()
      }
    },
    [length],
  )

  // reveal mode reuses useReveal; pass `reduced=true` (its short-circuit) in every other
  // mode so it never builds a ScrollTrigger we don't want.
  const { ref: revealRef, revealed } = useReveal<HTMLDivElement>(mode !== 'reveal')

  if (mode === 'static') {
    return <>{children}</>
  }

  if (mode === 'reveal') {
    return (
      <div
        ref={revealRef}
        className={
          'transition duration-700 ease-out ' +
          (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        {children}
      </div>
    )
  }

  return (
    <SceneContext.Provider value={ctx}>
      <div ref={scrubRef} className={className}>
        {children}
      </div>
    </SceneContext.Provider>
  )
}
```

- [ ] **Step 6: Run it, verify it passes**

Run: `npx vitest run src/components/motion/Scene.test.tsx` → PASS.
Run: `npx tsc --noEmit` → clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/SceneContext.ts src/lib/motion/buildSceneTimeline.ts src/components/motion/Scene.tsx src/components/motion/Scene.test.tsx
git commit -m "feat(motion): Scene wrapper with static/reveal/scrub modes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire `page.tsx` to `Scene` (M1 complete)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `Reveal` with `Scene` in the page**

In `src/app/page.tsx`: change the import line `import { Reveal } from '@/components/motion/Reveal'` to `import { Scene } from '@/components/motion/Scene'`, and replace the `<main>` body's beats with (keeping the surrounding `Constellation`/`SmoothScroll`/`EntryOverlay`/`HudFrame`/`main` intact):

```tsx
            <Scene length={0.8}>
              <Identity />
            </Scene>
            <Scene length={1}>
              <Trajectory />
            </Scene>
            <Scene length={2.2}>
              <Systems />
            </Scene>
            <Scene length={0.7}>
              <Stack />
            </Scene>
            <Scene length={1.2}>
              <Telemetry />
            </Scene>
            <Scene length={1}>
              <ArchiveIndex />
            </Scene>
            <Scene length={0.8}>
              <Uplink />
            </Scene>
```

Delete the now-stale `Reveal`-specific comment block above the beats (the one describing `delayMs`); replace with a one-line note:

```tsx
            {/* Each beat is a Scene: pinned + scroll-scrubbed on pointer/wide, one-shot
                reveal on touch, full static content under reduced motion. See Scene.tsx. */}
```

Note: `Systems.tsx` still wraps each record in its own `Reveal` internally — that's fine for M1 (nested one-shot reveals inside a pinned scrub scene). Task 13 converts it.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit` → clean (unused `Reveal` import removed).
Run: `npm run build` → succeeds.

- [ ] **Step 3: Manual browser verification (the M1 payoff)**

Start dev server (via the preview tool, `name` from `.claude/launch.json` — create one running `npm run dev` on port 3000 if absent). Dismiss gate (OFF) + skip boot. Confirm:
- Scrolling holds each beat at the top of the viewport (pinned) and its content rises/fades in as you scroll through, then releases to the next.
- No console errors; page scrolls smoothly (Lenis).
- Toggle OS reduced motion (or Playwright `reducedMotion`) → beats are all visible, no pinning.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): pin+scrub every beat via Scene (M1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `Rise` layer primitive

**Files:**
- Create: `src/components/motion/layers/Rise.tsx`
- Test: `src/components/motion/layers/Rise.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/layers/Rise.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { Rise } from './Rise'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <Rise>
        <p>ROW</p>
      </Rise>
    </SceneContext.Provider>,
  )
}

describe('Rise', () => {
  it('renders children in every mode', () => {
    wrap('static')
    expect(screen.getByText('ROW')).toBeInTheDocument()
  })
  it('registers with the Scene only in scrub mode', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rise' }))
  })
  it('does not register in static/reveal', () => {
    const reg = vi.fn(() => () => {})
    wrap('reveal', reg)
    expect(reg).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run src/components/motion/layers/Rise.test.tsx` → FAIL (Rise not defined).

- [ ] **Step 3: Implement**

```tsx
// src/components/motion/layers/Rise.tsx
'use client'

import { useCallback, useContext, type ElementType, type ReactNode, type Ref } from 'react'
import { SceneContext } from '../SceneContext'

/**
 * Spatial-rise layer: in a scrub Scene, registers its element so the Scene timeline
 * translates it up + fades it in on scroll. Outside scrub (static/reveal/no Scene) it
 * renders children in their settled state — the Scene handles reveal-mode fade wholesale.
 */
export function Rise({
  children,
  as: Tag = 'div',
  className,
  offset = 24,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
  offset?: number
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'rise', offset })
    },
    [ctx, offset],
  )

  if (!scrub) return <Tag className={className}>{children}</Tag>
  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      {children}
    </Tag>
  )
}
```

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run src/components/motion/layers/Rise.test.tsx` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/layers/Rise.tsx src/components/motion/layers/Rise.test.tsx
git commit -m "feat(motion): Rise layer primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: `MaskWipe` layer primitive

**Files:**
- Create: `src/components/motion/layers/MaskWipe.tsx`
- Test: `src/components/motion/layers/MaskWipe.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/layers/MaskWipe.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { MaskWipe } from './MaskWipe'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <MaskWipe>
        <h2>HEADING</h2>
      </MaskWipe>
    </SceneContext.Provider>,
  )
}

describe('MaskWipe', () => {
  it('renders children in every mode', () => {
    wrap('static')
    expect(screen.getByText('HEADING')).toBeInTheDocument()
  })
  it('registers as a mask layer only in scrub mode', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'mask' }))
  })
  it('does not register in static/reveal', () => {
    const reg = vi.fn(() => () => {})
    wrap('reveal', reg)
    expect(reg).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it, verify it fails** → `npx vitest run src/components/motion/layers/MaskWipe.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/components/motion/layers/MaskWipe.tsx
'use client'

import { useCallback, useContext, type ElementType, type ReactNode, type Ref } from 'react'
import { SceneContext } from '../SceneContext'

/**
 * Clip-wipe layer: in a scrub Scene, the Scene timeline animates clip-path inset from
 * fully-clipped to open (with a small rise), so the element wipes up from behind an edge.
 * Outside scrub it renders its settled state.
 */
export function MaskWipe({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'mask' })
    },
    [ctx],
  )

  if (!scrub) return <Tag className={className}>{children}</Tag>
  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      {children}
    </Tag>
  )
}
```

- [ ] **Step 4: Run it, verify it passes** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/layers/MaskWipe.tsx src/components/motion/layers/MaskWipe.test.tsx
git commit -m "feat(motion): MaskWipe layer primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: `DecodeLine` layer primitive

**Files:**
- Create: `src/components/motion/layers/DecodeLine.tsx`
- Test: `src/components/motion/layers/DecodeLine.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/layers/DecodeLine.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContext, type SceneCtx } from '../SceneContext'
import { DecodeLine } from './DecodeLine'

function wrap(mode: SceneCtx['mode'], register = vi.fn(() => () => {})) {
  return render(
    <SceneContext.Provider value={{ mode, register }}>
      <DecodeLine text="IDENTITY" />
    </SceneContext.Provider>,
  )
}

describe('DecodeLine', () => {
  it('static/reveal → exactly one plain text node, no aria-hidden noise layer', () => {
    const { container } = wrap('static')
    expect(screen.getByText('IDENTITY')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.querySelector('.sr-only')).toBeNull()
  })
  it('scrub → real string is the accessible text (sr-only) + a separate aria-hidden layer', () => {
    const { container } = wrap('scrub')
    expect(container.querySelector('.sr-only')?.textContent).toBe('IDENTITY')
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
  it('scrub registers a decode layer carrying the target text', () => {
    const reg = vi.fn(() => () => {})
    wrap('scrub', reg)
    expect(reg).toHaveBeenCalledWith(expect.objectContaining({ kind: 'decode', text: 'IDENTITY' }))
  })
})
```

- [ ] **Step 2: Run it, verify it fails** → `npx vitest run src/components/motion/layers/DecodeLine.test.tsx`

- [ ] **Step 3: Implement**

```tsx
// src/components/motion/layers/DecodeLine.tsx
'use client'

import { useCallback, useContext, type ElementType, type Ref } from 'react'
import { SceneContext } from '../SceneContext'
import { scrambleFrame } from '@/lib/scramble'

/**
 * Scrub-driven decode. Same a11y contract as ScrambleTextAnimated: the real string is an
 * always-present sr-only node (accessible name from first paint); the animated noise is a
 * separate aria-hidden layer the Scene timeline writes into (scrambleFrame by scroll
 * progress). Static/reveal/no-Scene → exactly one plain text node, no noise layer.
 */
export function DecodeLine({
  text,
  as: Tag = 'span',
  className,
  seed = 0,
}: {
  text: string
  as?: ElementType
  className?: string
  seed?: number
}) {
  const ctx = useContext(SceneContext)
  const scrub = ctx?.mode === 'scrub'

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el || !ctx || ctx.mode !== 'scrub') return
      return ctx.register({ el, kind: 'decode', text, seed })
    },
    [ctx, text, seed],
  )

  if (!scrub) return <Tag className={className}>{text}</Tag>
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" ref={ref as Ref<HTMLSpanElement>}>
        {scrambleFrame(text, 0, seed)}
      </span>
    </Tag>
  )
}
```

- [ ] **Step 4: Run it, verify it passes** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/layers/DecodeLine.tsx src/components/motion/layers/DecodeLine.test.tsx
git commit -m "feat(motion): DecodeLine layer primitive (scrub-driven scramble)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: `buildSceneTimeline` layer coverage (unit)

The builder already exists (Task 4). Add focused tests for the layer branches so the decode/mask/rise wiring is pinned down without a browser.

**Files:**
- Test: `src/lib/motion/buildSceneTimeline.test.ts`

- [ ] **Step 1: Write the test**

```ts
// src/lib/motion/buildSceneTimeline.test.ts
import { describe, it, expect, vi } from 'vitest'

const fromTo = vi.fn().mockReturnThis()
const to = vi.fn().mockReturnThis()
vi.mock('gsap', () => ({ gsap: { timeline: vi.fn(() => ({ fromTo, to, kill: vi.fn() })) } }))

import { buildSceneTimeline } from './buildSceneTimeline'
import type { LayerReg } from '@/components/motion/SceneContext'

function el(): HTMLElement {
  return document.createElement('div')
}

describe('buildSceneTimeline', () => {
  it('with no layers, animates the root itself (default reveal)', () => {
    fromTo.mockClear()
    const root = el()
    buildSceneTimeline(root, [])
    expect(fromTo).toHaveBeenCalledWith(root, expect.anything(), expect.anything())
  })

  it('decode layer writes scrambleFrame into the element via onUpdate', () => {
    to.mockClear()
    const node = el()
    const layer: LayerReg = { el: node, kind: 'decode', text: 'HELLO', seed: 1 }
    buildSceneTimeline(el(), [layer])
    const call = to.mock.calls.find((c) => c[1] && typeof c[1].onUpdate === 'function')
    expect(call).toBeTruthy()
    // Drive the proxy to fully-decoded and confirm the element receives the real string.
    const vars = call![1]
    // proxy is the first arg; simulate GSAP setting p=1 before onUpdate
    const proxy = call![0] as { p: number }
    proxy.p = 1
    vars.onUpdate()
    expect(node.textContent).toBe('HELLO')
  })
})
```

- [ ] **Step 2: Run it, verify it passes** (builder already implemented)

Run: `npx vitest run src/lib/motion/buildSceneTimeline.test.ts` → PASS. If the decode test fails because the proxy reference differs, adjust builder so the proxy object passed to `gsap.to` is the same one read in `onUpdate` (it already is — `onUpdate` closes over `proxy`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/motion/buildSceneTimeline.test.ts
git commit -m "test(motion): cover buildSceneTimeline layer branches

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Verify layer registration end-to-end in a scrub Scene (unit)

Confirm that layer primitives nested inside a `Scene` register with it (the context wiring), using the real `Scene` + real primitives with gsap mocked.

**Files:**
- Test: `src/components/motion/Scene.layers.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/motion/Scene.layers.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Scene } from './Scene'
import { DecodeLine } from './layers/DecodeLine'
import { Rise } from './layers/Rise'

// Force scrub mode (wide + fine pointer + not reduced).
beforeEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('innerWidth', 1400)
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })),
  )
})

const created: Array<{ animation: unknown }> = []
vi.mock('gsap', () => ({
  gsap: { registerPlugin: vi.fn(), timeline: vi.fn(() => ({ fromTo: vi.fn().mockReturnThis(), to: vi.fn().mockReturnThis(), kill: vi.fn() })) },
}))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn((cfg: { animation: unknown }) => { created.push(cfg); return { kill: vi.fn() } }),
    update: vi.fn(), refresh: vi.fn(),
  },
}))

describe('Scene + layers (scrub)', () => {
  it('renders all content and builds one ScrollTrigger with a timeline', () => {
    created.length = 0
    render(
      <Scene>
        <section>
          <DecodeLine text="LABEL" />
          <Rise><p>BODY</p></Rise>
        </section>
      </Scene>,
    )
    expect(screen.getByText('BODY')).toBeInTheDocument()
    expect(screen.getByText('LABEL')).toBeInTheDocument() // sr-only real string
    expect(created).toHaveLength(1)
    expect(created[0].animation).toBeTruthy() // a timeline was attached
  })
})
```

- [ ] **Step 2: Run it, verify it passes**

Run: `npx vitest run src/components/motion/Scene.layers.test.tsx` → PASS. (If `created` is empty, the scrubRef didn't run — ensure jsdom attaches the ref; it does for a mounted div.)

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/Scene.layers.test.tsx
git commit -m "test(motion): Scene builds one scrubbed timeline from nested layers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Annotate `Identity` (all three languages)

**Files:**
- Modify: `src/components/sections/Identity.tsx`

Identity is a Client-free Server Component; adding client layer primitives is allowed (a Server Component may render Client Components). Keep it a Server Component — do NOT add `'use client'`.

- [ ] **Step 1: Apply layers**

Rewrite the section body so: the `// IDENTITY` label and the stat line use `DecodeLine`; the name `h1` uses `MaskWipe`; the title + location lines use `Rise`. The name currently uses `ScrambleTextAnimated` (its own on-view decode) — in a scrub Scene we want the name to WIPE, so replace it with `MaskWipe` around plain text. Keep `ScrambleTextAnimated` import only if still used (it is not after this) — remove it.

```tsx
import { IDENTITY, yearsExperience } from '@/content/identity'
import { countSystems, countSectors, countClientRegions } from '@/content'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { MaskWipe } from '@/components/motion/layers/MaskWipe'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export function Identity() {
  return (
    <section id="identity" className="py-20 md:py-28">
      <DecodeLine as="div" text="// IDENTITY" className={LABEL} seed={1} />
      <MaskWipe
        as="h1"
        className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
      >
        {IDENTITY.name}
      </MaskWipe>
      <Rise as="div" className={`${LABEL} mt-3`}>
        {IDENTITY.title.toUpperCase()}
      </Rise>
      <DecodeLine
        as="div"
        seed={2}
        text={`${yearsExperience()} YRS · ${countSystems()} SYSTEMS · ${countSectors()} SECTORS · ${countClientRegions()} CLIENT REGIONS`}
        className={`${LABEL} mt-1`}
      />
      <Rise as="div" className={`${LABEL} mt-1`}>
        {IDENTITY.location.toUpperCase()} · REMOTE
      </Rise>
    </section>
  )
}
```

Note: `MaskWipe`/`Rise`/`DecodeLine` all accept `as` + `className`. `MaskWipe`/`Rise` take children; `DecodeLine` takes `text`. This drops the animated hero-name decode in favor of a mask-wipe (spec §4.3: heading mask-wipes). Under static/reveal the name renders as plain text (accessible, unchanged).

- [ ] **Step 2: Verify Identity test still passes / update it**

Run: `npx vitest run src/components/sections/Identity.test.tsx`. If it asserted `ScrambleTextAnimated`/decode markup for the name, update it to assert the name text is present and (under static) is a plain node. Keep assertions about the real strings being in the document.

- [ ] **Step 3: Typecheck + browser check** (`npx tsc --noEmit`; scroll Identity in the preview — label decodes, name wipes up, sublines rise).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Identity.tsx src/components/sections/Identity.test.tsx
git commit -m "feat(identity): decode label + mask-wipe name + rise sublines

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Annotate `Trajectory` and `Stack`

**Files:**
- Modify: `src/components/sections/Trajectory.tsx`, `src/components/sections/Stack.tsx`

Pattern for a heading + body beat: heading → `DecodeLine` (keeps the `NODE:` decode feel); each body block/row → `Rise`. Read the current file first; preserve all classNames and content.

- [ ] **Step 1: Trajectory** — replace the heading `ScrambleTextAnimated` with `DecodeLine` (same `text`/`seed`/`className`), wrap each `<li>`'s inner content in `Rise` (so the five nodes rise in sequence), and wrap the trailing `CONTINUITY` line in `Rise`. Keep the `<ol>`/`<li>` structure (don't move the border). Example for one node:

```tsx
import { TRAJECTORY, CONTINUITY } from '@/content/trajectory'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'
const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

export function Trajectory() {
  return (
    <section id="trajectory" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: TRAJECTORY" seed={3} className={HEADING} />
      <ol className="mt-10 space-y-8 border-l border-[var(--color-border)] pl-6">
        {TRAJECTORY.map((node) => (
          <li key={`${node.year}-${node.label}`}>
            <Rise>
              <div className={LABEL}>{node.year}</div>
              <div className="mt-1 font-mono text-base tracking-[var(--tracking-hud)] text-[var(--color-ink)] md:text-lg">
                {node.label}
              </div>
              {(node.note || node.detail) && (
                <div className={`${LABEL} mt-1`}>
                  {[node.note, node.detail].filter(Boolean).join(' · ')}
                </div>
              )}
            </Rise>
          </li>
        ))}
      </ol>
      <Rise as="div" className={`${LABEL} mt-10`}>
        {CONTINUITY}
      </Rise>
    </section>
  )
}
```

- [ ] **Step 2: Stack** — heading → `DecodeLine`; wrap the `ARCHITECTURE CAPABILITIES…` subline in `MaskWipe`; wrap each capability `<div>` row and each stack `<div>` group in `Rise`. Preserve all grid classNames. (Read the file; apply the same import + wrapping pattern as Trajectory, using `MaskWipe` for the one subline.)

- [ ] **Step 3: Update section tests if they assert `ScrambleTextAnimated`** — swap expectations to `DecodeLine`'s output (real text present; under static a plain node).

- [ ] **Step 4: Typecheck + browser check both beats.**

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Trajectory.tsx src/components/sections/Stack.tsx src/components/sections/*.test.tsx
git commit -m "feat(sections): scrub-annotate Trajectory + Stack

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Annotate `Systems` (records assemble across the pin)

**Files:**
- Modify: `src/components/sections/Systems.tsx`

- [ ] **Step 1: Replace per-record `Reveal` with `Rise`**

Systems currently wraps each record in `Reveal`. Inside a pinned Scene, use `Rise` so the six records rise in sequence as the beat scrubs (the Scene's stagger orders them by DOM position). Heading → `DecodeLine`.

```tsx
import { getFeatured, recordNumber } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'
import { DecodeLine } from '@/components/motion/layers/DecodeLine'
import { Rise } from '@/components/motion/layers/Rise'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

export function Systems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <DecodeLine as="h2" text="NODE: SYSTEMS" seed={4} className={HEADING} />
      <div className="mt-10 space-y-8">
        {getFeatured().map((s, i) => (
          <Rise key={s.slug}>
            <SystemRecord system={s} index={recordNumber(s.slug) - 1} seedBase={i + 1} />
          </Rise>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update the Systems unit test** — it likely asserted each record is wrapped in a `Reveal`. Update to assert each record renders (six articles) and, under static, no reveal/pin wrapper. Do not assert internal `Rise` structure beyond content presence.

- [ ] **Step 3: Typecheck + browser check** — the six records should rise one after another while SYSTEMS is pinned; `length={2.2}` (Task 5) gives them room.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Systems.tsx src/components/sections/Systems.test.tsx
git commit -m "feat(systems): records rise in sequence across the pinned beat

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Annotate `Telemetry`, `ArchiveIndex`, `Uplink` (+ Telemetry spatial accent)

**Files:**
- Modify: `src/components/sections/Telemetry.tsx`, `src/components/sections/ArchiveIndex.tsx`, `src/components/sections/Uplink.tsx`

Read each file first. Apply: heading → `DecodeLine`; primary content block → `MaskWipe`; rows/links → `Rise`.

- [ ] **Step 1: ArchiveIndex** — heading → `DecodeLine`; wrap each `<li>`'s `<Link>` in `Rise` (rows rise in sequence); the per-row name currently uses `ScrambleTextAnimated` — leave it as-is OR swap to plain text inside the Rise (prefer leaving `ScrambleTextAnimated` for the name so the row keeps a decode; both effects compose acceptably). The trailing `▸ FULL ARCHIVE INDEX` link → `Rise`.

- [ ] **Step 2: Uplink** — heading → `DecodeLine`; contact lines/links → `Rise`; if there is a prominent address/handle block, wrap it in `MaskWipe`.

- [ ] **Step 3: Telemetry (spatial accent)** — heading → `DecodeLine`. The world-map + crosshair is the beat's spatial payload: wrap the map container in `MaskWipe` (it wipes in) and wrap caption/legend lines in `Rise`. If the crosshair "lock-on" is currently a mount-time animation, leaving it is acceptable for this pass (spec §6.4 lists deeper progress-subscription as tunable/optional); note it in the commit body as a follow-up if not wired to progress.

- [ ] **Step 4: Update any section tests** asserting old markup; typecheck; browser-check all three beats.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Telemetry.tsx src/components/sections/ArchiveIndex.tsx src/components/sections/Uplink.tsx src/components/sections/*.test.tsx
git commit -m "feat(sections): scrub-annotate Telemetry, ArchiveIndex, Uplink

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 15: Retune the centerpiece for the taller page

**Files:**
- Modify: `src/lib/canvas/wireframe.ts`

- [ ] **Step 1: Increase the scroll-driven turn**

The page is now ~8 viewports tall, so one full turn (`Math.PI * 2`) across the whole scroll reads as a crawl. Bump it so the crystal keeps turning perceptibly:

```ts
export const WIRE_SCROLL_TURN = Math.PI * 6 // ~3 turns across the (now much taller) scroll
```

Leave `WIRE_ZOOM` at `0.22` (a gentle zoom over a long scroll is fine); adjust only if it reads as too static in the browser.

- [ ] **Step 2: Confirm the wireframe unit tests still pass**

Run: `npx vitest run src/lib/canvas/wireframe.test.ts` → PASS (constants aren't asserted by value; if one is, update it).

- [ ] **Step 3: Browser-check** the crystal visibly rotates across the full scroll.

- [ ] **Step 4: Commit**

```bash
git add src/lib/canvas/wireframe.ts
git commit -m "style(canvas): retune centerpiece turn for the taller pinned page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 16: End-to-end coverage (pin / scrub / reduced / touch)

**Files:**
- Modify: `tests/e2e/motion.spec.ts`

- [ ] **Step 1: Update the per-record reveal test to the pinned-scene behavior**

The old test asserted a below-fold record's `Reveal` wrapper goes opacity <0.5 → >0.9 on scroll. Replace it with a scrub-reveal assertion: a below-fold beat's content starts hidden and becomes visible as it scrolls into the pin. Reuse the `enter()` helper already in the file.

```ts
test.describe('pinned scrub scenes', () => {
  test('a below-the-fold beat assembles as it scrolls into view', async ({ page }) => {
    await enter(page)
    const heading = page.getByRole('heading', { name: 'Health Wealth Safe' })
    // Before scrolling, the SYSTEMS beat is well below the fold and not yet assembled.
    // Scroll it into view; its content becomes visible (opacity settles high).
    await heading.scrollIntoViewIfNeeded()
    await expect
      .poll(async () => heading.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 4000 })
      .toBeGreaterThan(0.9)
  })

  test('a beat pins: its top holds at the viewport top across a scroll range', async ({ page }) => {
    await enter(page)
    const systems = page.locator('#systems')
    await systems.scrollIntoViewIfNeeded()
    const top1 = await systems.evaluate((el) => el.getBoundingClientRect().top)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    const top2 = await systems.evaluate((el) => el.getBoundingClientRect().top)
    // While pinned, the section top stays roughly fixed near the viewport top despite scroll.
    expect(Math.abs(top2 - top1)).toBeLessThan(80)
  })
})
```

- [ ] **Step 2: Keep/extend the reduced-motion contract** (already present): full record content, no `aria-hidden` noise layer, no `fixed` canvas. Add: under reduced motion the SYSTEMS section is NOT pinned (its top moves normally on scroll).

```ts
test.describe('reduced motion: no pinning, full content', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })
  test('sections are not pinned and content is fully present', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    const systems = page.locator('#systems')
    const before = await systems.evaluate((el) => el.getBoundingClientRect().top)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(200)
    const after = await systems.evaluate((el) => el.getBoundingClientRect().top)
    expect(before - after).toBeGreaterThan(200) // moved with the scroll → not pinned
    await expect(page.getByRole('heading', { name: 'NODE: SYSTEMS' })).toBeVisible()
  })
})
```

- [ ] **Step 3: Touch fallback** — a coarse-pointer context uses `reveal` mode (no pin):

```ts
test.describe('touch: one-shot reveal, no pinning', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  test('a below-fold beat reveals without pinning', async ({ page }) => {
    await enter(page)
    const systems = page.locator('#systems')
    const before = await systems.evaluate((el) => el.getBoundingClientRect().top)
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(200)
    const after = await systems.evaluate((el) => el.getBoundingClientRect().top)
    expect(before - after).toBeGreaterThan(150) // scrolls normally → not pinned
  })
})
```

- [ ] **Step 4: Run e2e**

Run: `npm run e2e` → all pass. If pin thresholds are flaky, widen tolerances (pin math depends on scrollbar/viewport); do not weaken the reduced-motion/touch "not pinned" assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/motion.spec.ts
git commit -m "test(e2e): pin/scrub/reduced/touch scene behavior

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after Task 16)

- [ ] `npx vitest run` — all unit suites green.
- [ ] `npm run e2e` — all green.
- [ ] `npm run build` — succeeds (prebuild content tests pass).
- [ ] `npm run lint` — clean.
- [ ] Browser: full scroll top→bottom with gate OFF + boot skipped — every beat pins and assembles (decode/mask/rise), centerpiece rotates, no jank, no console errors. Then reduced-motion and a mobile viewport — full content, no pinning.

## Risks / watch-items (from the spec)

- **clip-path tween:** GSAP animates `inset(...)` via CSSPlugin (core). If a browser refuses to interpolate, fall back to animating a wrapper's `--wipe` CSS var used in `clip-path`. Verify MaskWipe in the browser during Task 7/11.
- **FOUC at setup:** scrub layers get their `from` state when ScrollTrigger renders the timeline at setup (in the ref callback, pre-paint), and the boot overlay covers the initial frames. If any beat flashes fully-visible before hiding, add an initial `opacity:0` inline style in the scrub branch of the primitive.
- **Pin seams / pacing:** if consecutive pins feel abrupt, tune per-beat `length` in `page.tsx` and add `anticipatePin: 1` to the ScrollTrigger in `Scene.tsx`.
- **Anchor links into pinned beats** land at pin start — acceptable per spec §10.5; revisit if the ArchiveIndex/UPLINK links feel wrong.
```
