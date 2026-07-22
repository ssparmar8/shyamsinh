# Cursor, Scroll & Animation Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a restrained cursor/scroll/animation polish pass — glyph-trail cursor, HUD scroll-progress, decode+magnetic links, scroll-velocity centerpiece reactions, and a beat-release settle — without regressing the site's locked 60fps or the record-route "no animation library" guarantee.

**Architecture:** Per-frame input (raw cursor pixels, scroll velocity) flows through module singletons read imperatively (the existing `pointer.ts` pattern), never React state. Each visible effect is a small `'use client'` component gated on `(pointer: fine)` + motion-allowed; all decorative nodes are `aria-hidden` with real text always present. New singletons/components that can reach record routes import only `scramble.ts` + rAF — never gsap/lenis/three.

**Tech Stack:** Next 16 (static export), React 19, GSAP + ScrollTrigger, Lenis, Three.js, Tailwind v4, Vitest (jsdom), Playwright.

**Spec:** [docs/superpowers/specs/2026-07-22-effects-polish-design.md](../specs/2026-07-22-effects-polish-design.md)

---

## File Structure

**New files:**
- `src/lib/canvas/cursor.ts` — raw pointer-pixel singleton (`cursorPos`, `cursorMoved`).
- `src/lib/canvas/cursor.test.ts`
- `src/lib/motion/useCursorEnabled.ts` — `(pointer: fine)` + not-reduced gate hook.
- `src/lib/motion/useCursorEnabled.test.tsx`
- `src/lib/motion/magnetic.ts` — pure `magneticOffset`.
- `src/lib/motion/magnetic.test.ts`
- `src/components/cursor/CursorTrail.tsx` — glyph-trail caret (mounted at `/`).
- `src/components/cursor/CursorTrail.test.tsx`
- `src/components/motion/MagneticLink.tsx` — magnetic + optional decode link.
- `src/components/motion/MagneticLink.test.tsx`
- `src/components/hud/ScrollProgress.tsx` — HUD progress hairline + percent readout.
- `src/components/hud/ScrollProgress.test.tsx`

**Modified files:**
- `src/lib/canvas/pointer.ts` — add `smoothVelocity`, `pushScrollVelocity`, `scrollVelocity`.
- `src/lib/canvas/pointer.test.ts` — cover `smoothVelocity`.
- `src/lib/scroll/useLenis.ts` — push Lenis velocity into `pointer.ts`.
- `src/lib/canvas/wireframe.ts` — velocity constants + pure `velTilt`/`velZoom`.
- `src/lib/canvas/wireframe.test.ts` — cover `velTilt`/`velZoom`.
- `src/components/canvas/RendererWebGL.tsx` + `Renderer2D.tsx` — consume `scrollVelocity()`.
- `src/lib/motion/buildSceneTimeline.ts` — add pure `holdFade`.
- `src/lib/motion/buildSceneTimeline.test.ts` — cover `holdFade`.
- `src/components/motion/Scene.tsx` — fade the beat out over the last of the pin (`holdFade`).
- `src/components/hud/HudFrame.tsx` — mount `ScrollProgress`; UPLINK → `MagneticLink`.
- `src/components/sections/ArchiveIndex.tsx` — row links + FULL ARCHIVE link → `MagneticLink`.
- `src/app/globals.css` — `.cursor-none` + `.cursor-glyph` styles.
- `src/app/page.tsx` — mount `CursorTrail`.
- `tests/e2e/motion.spec.ts` — cursor presence/absence, scroll-progress advance.

**Intentionally NOT touched:** `SystemRecord.tsx` (its only link is an external `_blank` URL, and it is shared with the static `/systems/[slug]` route which is spec'd fast/static — the spec's "record links" are the `ArchiveIndex` rows).

---

## Task 1: Scroll-velocity singleton in `pointer.ts`

**Files:**
- Modify: `src/lib/canvas/pointer.ts`
- Test: `src/lib/canvas/pointer.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/canvas/pointer.test.ts`:

```ts
import { smoothVelocity } from './pointer'

describe('smoothVelocity', () => {
  it('attacks instantly toward a larger sample magnitude', () => {
    expect(smoothVelocity(0, 10)).toBe(10)
    expect(smoothVelocity(5, -20)).toBe(20) // magnitude, sign-agnostic
  })

  it('releases slowly when the sample is smaller (decay ~0.9/frame)', () => {
    expect(smoothVelocity(10, 0)).toBeCloseTo(9)
    expect(smoothVelocity(10, 3)).toBeCloseTo(9) // max(3, 9)
  })

  it('snaps to 0 below the noise floor so the effect fully settles', () => {
    expect(smoothVelocity(0.005, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/canvas/pointer.test.ts`
Expected: FAIL — `smoothVelocity is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/canvas/pointer.ts`, add after `scrollProgressOf`:

```ts
/**
 * Pure: smoothed scroll-speed magnitude. Attacks instantly toward a faster sample and
 * releases ~0.9/frame, so the centerpiece reacts immediately to a flick and settles
 * when scrolling stops. Snaps to 0 below a noise floor so "at rest" is exactly rest.
 */
export function smoothVelocity(prev: number, sample: number): number {
  const next = Math.max(Math.abs(sample), prev * 0.9)
  return next < 0.01 ? 0 : next
}
```

And at the bottom of the module, add the singleton:

```ts
let velocity = 0

/** Feed a raw signed scroll velocity (px/frame); stored as a smoothed magnitude. */
export function pushScrollVelocity(sample: number): void {
  velocity = smoothVelocity(velocity, sample)
}

/** Current smoothed scroll-speed magnitude (0 at rest). Renderers ease toward this. */
export function scrollVelocity(): number {
  return velocity
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/canvas/pointer.test.ts`
Expected: PASS (existing `normPointer`/`scrollProgressOf` tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/canvas/pointer.ts src/lib/canvas/pointer.test.ts
git commit -m "$(printf 'feat(canvas): scroll-velocity singleton in pointer.ts\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 2: Feed Lenis velocity into the singleton

**Files:**
- Modify: `src/lib/scroll/useLenis.ts`

No unit test — this is a one-line Lenis integration verified end-to-end in Task 13 (the centerpiece reacts to scroll). jsdom has no Lenis.

- [ ] **Step 1: Import the setter**

In `src/lib/scroll/useLenis.ts`, extend the existing pointer import (add it if absent):

```ts
import { pushScrollVelocity } from '@/lib/canvas/pointer'
```

- [ ] **Step 2: Push velocity on every Lenis scroll**

Immediately after the existing `lenis.on('scroll', ScrollTrigger.update)` line, add:

```ts
    // Lenis's own settling drives its velocity toward 0 before events stop, so the
    // stored magnitude decays to rest without a separate ticker. Canvas-only; under
    // reduced motion Lenis never mounts, so velocity stays 0 and reactions are inert.
    lenis.on('scroll', () => pushScrollVelocity(lenis.velocity))
```

- [ ] **Step 3: Verify build + existing tests**

Run: `npx vitest run src/lib && npx tsc --noEmit`
Expected: PASS / no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/scroll/useLenis.ts
git commit -m "$(printf 'feat(scroll): push Lenis velocity into the pointer singleton\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 3: Velocity-reaction constants + pure helpers in `wireframe.ts`

**Files:**
- Modify: `src/lib/canvas/wireframe.ts`
- Test: `src/lib/canvas/wireframe.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/canvas/wireframe.test.ts`:

```ts
import { velTilt, velZoom, WIRE_VEL_TILT, WIRE_VEL_ZOOM, VEL_MAX } from './wireframe'

describe('velocity reactions', () => {
  it('are 0 at rest', () => {
    expect(velTilt(0)).toBe(0)
    expect(velZoom(0)).toBe(0)
  })

  it('reach their max gain at VEL_MAX and are sign-agnostic', () => {
    expect(velTilt(VEL_MAX)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velTilt(-VEL_MAX)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velZoom(VEL_MAX)).toBeCloseTo(WIRE_VEL_ZOOM)
  })

  it('clamp beyond VEL_MAX so a flick cannot explode the effect', () => {
    expect(velTilt(9999)).toBeCloseTo(WIRE_VEL_TILT)
    expect(velZoom(9999)).toBeCloseTo(WIRE_VEL_ZOOM)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/canvas/wireframe.test.ts`
Expected: FAIL — `velTilt is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/canvas/wireframe.ts`, add after the `POINTER_EASE` line:

```ts
// Scroll-velocity reactions (restrained): extra tilt/zoom proportional to scroll speed,
// clamped so a flick can't spin the crystal. Renderers ease their local velocity toward
// scrollVelocity() with VEL_EASE, so the reaction settles when scrolling stops.
export const WIRE_VEL_TILT = 0.12 // max extra X-tilt (rad) at VEL_MAX
export const WIRE_VEL_ZOOM = 0.06 // max extra scale gain at VEL_MAX
export const VEL_MAX = 40 // px/frame at which the reaction saturates
export const VEL_EASE = 0.1 // per-frame lerp toward the scroll-velocity target
```

Then add the two pure helpers after `rotateProject`:

```ts
/** Pure: extra centerpiece tilt (rad) for a scroll-speed magnitude, 0..WIRE_VEL_TILT. */
export function velTilt(vel: number): number {
  return (Math.min(VEL_MAX, Math.abs(vel)) / VEL_MAX) * WIRE_VEL_TILT
}

/** Pure: extra centerpiece scale gain for a scroll-speed magnitude, 0..WIRE_VEL_ZOOM. */
export function velZoom(vel: number): number {
  return (Math.min(VEL_MAX, Math.abs(vel)) / VEL_MAX) * WIRE_VEL_ZOOM
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/canvas/wireframe.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/canvas/wireframe.ts src/lib/canvas/wireframe.test.ts
git commit -m "$(printf 'feat(canvas): scroll-velocity tilt/zoom constants + helpers\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 4: Consume scroll velocity in both renderers

**Files:**
- Modify: `src/components/canvas/RendererWebGL.tsx`
- Modify: `src/components/canvas/Renderer2D.tsx`

No new unit test — renderers require WebGL/canvas (jsdom stubs `getContext`); covered by the Task 13 e2e (canvas present) + the frame-budget probe in Task 14. Keep both renderers in lockstep.

- [ ] **Step 1: WebGL — import the helpers**

In `src/components/canvas/RendererWebGL.tsx`, add `velTilt, velZoom, VEL_EASE` to the existing `wireframe` import, and add `scrollVelocity` to the `pointer` import:

```ts
import {
  hexBipyramid, rotateProject, WIRE_TILT, WIRE_SPIN, WIRE_SCALE, WIRE_OPACITY,
  WIRE_SCROLL_TURN, WIRE_ZOOM, WIRE_MOUSE_YAW, WIRE_MOUSE_PITCH, FIELD_PARALLAX,
  POINTER_EASE, velTilt, velZoom, VEL_EASE,
} from '@/lib/canvas/wireframe'
import { pointerTarget, scrollProgress, scrollVelocity } from '@/lib/canvas/pointer'
```

- [ ] **Step 2: WebGL — add `vel` to the state ref shape**

In the `stateRef` type union, add `vel: number` next to `spin: number`. In the `resize()` assignment to `stateRef.current`, add `vel: stateRef.current?.vel ?? 0,` next to the `spin:` line.

- [ ] **Step 3: WebGL — fold velocity into the centerpiece math**

In the `useRafLoop` callback, replace the `angleX`/`scale` computation:

```ts
    s.vel += (scrollVelocity() - s.vel) * VEL_EASE
    s.spin += WIRE_SPIN * dt
    const sc = scrollProgress()
    const angleY = s.spin + sc * WIRE_SCROLL_TURN + s.px * WIRE_MOUSE_YAW
    const angleX = WIRE_TILT + s.py * WIRE_MOUSE_PITCH + velTilt(s.vel)
    const scale = Math.min(s.w, s.h) * WIRE_SCALE * (1 + sc * WIRE_ZOOM + velZoom(s.vel))
```

- [ ] **Step 4: 2D — mirror the change**

In `src/components/canvas/Renderer2D.tsx`, add `velTilt, velZoom, VEL_EASE` to the `wireframe` import and `scrollVelocity` to the `pointer` import. Add a ref near the others:

```ts
  const velRef = useRef(0)
```

In the `useRafLoop` callback, replace the centerpiece `angleY`/`angleX`/`scale` block with:

```ts
    velRef.current += (scrollVelocity() - velRef.current) * VEL_EASE
    spinRef.current += WIRE_SPIN * dt
    const sc = scrollProgress()
    const angleY = spinRef.current + sc * WIRE_SCROLL_TURN + pt.x * WIRE_MOUSE_YAW
    const angleX = WIRE_TILT + pt.y * WIRE_MOUSE_PITCH + velTilt(velRef.current)
    const scale = Math.min(w, h) * WIRE_SCALE * (1 + sc * WIRE_ZOOM + velZoom(velRef.current))
```

- [ ] **Step 5: Verify types + existing tests**

Run: `npx tsc --noEmit && npx vitest run src/components/canvas`
Expected: no type errors; existing canvas tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/canvas/RendererWebGL.tsx src/components/canvas/Renderer2D.tsx
git commit -m "$(printf 'feat(canvas): centerpiece reacts to scroll velocity (both renderers)\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 5: Raw pointer-pixel singleton `cursor.ts`

**Files:**
- Create: `src/lib/canvas/cursor.ts`
- Test: `src/lib/canvas/cursor.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/canvas/cursor.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cursorPos, cursorMoved } from './cursor'

describe('cursor singleton', () => {
  it('starts at the origin and tracks pointermove in client pixels', () => {
    expect(cursorPos()).toEqual({ x: 0, y: 0 })
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 12 }))
    expect(cursorPos()).toEqual({ x: 40, y: 12 })
  })

  it('cursorMoved latches true after a move, then resets to false', () => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 7, clientY: 7 }))
    expect(cursorMoved()).toBe(true)
    expect(cursorMoved()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/canvas/cursor.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/canvas/cursor.ts`:

```ts
/**
 * Raw pointer position in CSS pixels, a module singleton mirroring pointer.ts. The
 * glyph-trail caret needs the true, un-eased pointer location — pointer.ts's normalised
 * −1..1 target is the wrong space. One lazy passive listener; read imperatively each
 * frame, no React re-render. No gsap/lenis/three import, so it is safe on any route.
 */
let x = 0
let y = 0
let moved = false
let attached = false

function attach(): void {
  if (attached || typeof window === 'undefined') return
  attached = true
  addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX
      y = e.clientY
      moved = true
    },
    { passive: true },
  )
}

/** Current raw pointer position in client pixels. */
export function cursorPos(): { x: number; y: number } {
  attach()
  return { x, y }
}

/** True once since the last call if the pointer moved — lets the caret fade when idle. */
export function cursorMoved(): boolean {
  attach()
  const m = moved
  moved = false
  return m
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/canvas/cursor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/canvas/cursor.ts src/lib/canvas/cursor.test.ts
git commit -m "$(printf 'feat(canvas): raw pointer-pixel singleton for the cursor trail\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 6: `useCursorEnabled` gate hook

**Files:**
- Create: `src/lib/motion/useCursorEnabled.ts`
- Test: `src/lib/motion/useCursorEnabled.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/motion/useCursorEnabled.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCursorEnabled } from './useCursorEnabled'

function setEnv({ fine, reduced }: { fine: boolean; reduced: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? reduced : q.includes('fine') ? fine : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('useCursorEnabled', () => {
  it('fine pointer + motion allowed → true', () => {
    setEnv({ fine: true, reduced: false })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(true)
  })
  it('reduced motion → false even with a fine pointer', () => {
    setEnv({ fine: true, reduced: true })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(false)
  })
  it('coarse pointer → false', () => {
    setEnv({ fine: false, reduced: false })
    expect(renderHook(() => useCursorEnabled()).result.current).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/motion/useCursorEnabled.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/motion/useCursorEnabled.ts`:

```ts
'use client'

import { useSyncExternalStore } from 'react'

const FINE = '(pointer: fine)'
const RM = '(prefers-reduced-motion: reduce)'

function read(): boolean {
  if (typeof matchMedia !== 'function') return false
  return matchMedia(FINE).matches && !matchMedia(RM).matches
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const fine = matchMedia(FINE)
  const rm = matchMedia(RM)
  fine.addEventListener('change', onChange)
  rm.addEventListener('change', onChange)
  return () => {
    fine.removeEventListener('change', onChange)
    rm.removeEventListener('change', onChange)
  }
}

/**
 * True only for a fine-pointer visitor with motion allowed — the gate for the custom
 * cursor and magnetic links. Server + first client render → false (no cursor until the
 * client confirms), mirroring useSceneMode/useDeviceTier; re-reads on a media change.
 */
export function useCursorEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/motion/useCursorEnabled.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/useCursorEnabled.ts src/lib/motion/useCursorEnabled.test.tsx
git commit -m "$(printf 'feat(motion): useCursorEnabled gate (fine pointer + motion)\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 7: `CursorTrail` component + styles + mount

**Files:**
- Create: `src/components/cursor/CursorTrail.tsx`
- Test: `src/components/cursor/CursorTrail.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/cursor/CursorTrail.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { CursorTrail } from './CursorTrail'

function setEnabled(on: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? false : q.includes('fine') ? on : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('CursorTrail', () => {
  it('renders nothing when the cursor gate is off (touch / reduced / SSR)', () => {
    setEnabled(false)
    const { container } = render(<CursorTrail />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an aria-hidden, non-interactive overlay when enabled', () => {
    setEnabled(true)
    const { container } = render(<CursorTrail />)
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).not.toBeNull()
    expect(overlay).toHaveClass('pointer-events-none')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/cursor/CursorTrail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/cursor/CursorTrail.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { cursorPos, cursorMoved } from '@/lib/canvas/cursor'
import { useRafLoop } from '@/lib/canvas/useRafLoop'
import { useCursorEnabled } from '@/lib/motion/useCursorEnabled'
import { scrambleFrame } from '@/lib/scramble'

const SHED_DIST2 = 140 // px² the pointer must travel before shedding a glyph
const MAX_GLYPHS = 24 // hard cap on live trail nodes
const IDLE_FRAMES = 30 // still frames before the caret fades

/**
 * The glyph-trail cursor: a block caret that tracks the raw pointer and sheds fading
 * glyph noise as it moves — the site's decode signature, following the hand. Mounted at
 * `/` only. Not rendered at all unless useCursorEnabled() (fine pointer + motion), so
 * touch / reduced-motion / record-route visitors keep the native cursor. aria-hidden
 * throughout; pointer-events:none; native cursor hidden only while this is active.
 */
export function CursorTrail() {
  const enabled = useCursorEnabled()
  const caretRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const lastShed = useRef({ x: 0, y: 0 })
  const seed = useRef(0)
  const idle = useRef(0)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('cursor-none')
    return () => document.documentElement.classList.remove('cursor-none')
  }, [enabled])

  useRafLoop(() => {
    const caret = caretRef.current
    const layer = layerRef.current
    if (!caret || !layer) return
    const { x, y } = cursorPos()
    caret.style.transform = `translate(${x}px, ${y}px)`

    if (cursorMoved()) {
      idle.current = 0
      caret.style.opacity = '1'
    } else if (++idle.current > IDLE_FRAMES) {
      caret.style.opacity = '0.25'
    }

    const dx = x - lastShed.current.x
    const dy = y - lastShed.current.y
    if (dx * dx + dy * dy > SHED_DIST2 && layer.childElementCount < MAX_GLYPHS) {
      lastShed.current = { x, y }
      const g = document.createElement('span')
      g.className = 'cursor-glyph'
      g.textContent = scrambleFrame('X', 0, seed.current++) // one deterministic noise glyph
      g.style.transform = `translate(${x + (Math.random() * 12 - 6)}px, ${y + (Math.random() * 12 - 6)}px)`
      layer.appendChild(g)
      setTimeout(() => g.remove(), 650)
    }
  }, enabled)

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0" />
      <div
        ref={caretRef}
        data-testid="cursor-caret"
        className="absolute top-0 left-0 -mt-[6px] -ml-[3px] h-3 w-[6px] bg-[var(--color-ink)] transition-opacity duration-300"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/cursor/CursorTrail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the styles**

Append to `src/app/globals.css` (after the reduced-motion block):

```css
/* Custom cursor: the native cursor is hidden ONLY while CursorTrail is mounted (it adds
 * .cursor-none to <html>), so touch / reduced-motion / record-route visitors are never
 * affected. Glyph-trail nodes fade out; the fade is opacity-only so it never fights the
 * inline transform that positions each glyph. */
.cursor-none, .cursor-none * { cursor: none !important; }

.cursor-glyph {
  position: absolute;
  top: 0;
  left: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-ghost);
  pointer-events: none;
  animation: cursor-glyph-fade 650ms ease-out forwards;
}
@keyframes cursor-glyph-fade {
  from { opacity: 0.9; }
  to { opacity: 0; }
}
```

- [ ] **Step 6: Mount at `/`**

In `src/app/page.tsx`, add the import and render it beside `SmoothScroll`:

```tsx
import { CursorTrail } from '@/components/cursor/CursorTrail'
```

```tsx
      <Constellation />
      <SmoothScroll />
      <CursorTrail />
```

- [ ] **Step 7: Verify**

Run: `npx vitest run src/components/cursor && npx tsc --noEmit`
Expected: PASS / no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/cursor src/app/globals.css src/app/page.tsx
git commit -m "$(printf 'feat(cursor): glyph-trail cursor, mounted at /\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 8: Pure `magneticOffset`

**Files:**
- Create: `src/lib/motion/magnetic.ts`
- Test: `src/lib/motion/magnetic.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/motion/magnetic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { magneticOffset } from './magnetic'

const rect = { left: 100, top: 100, width: 100, height: 40 } // center (150, 120)

describe('magneticOffset', () => {
  it('is zero when the cursor is at the element center', () => {
    expect(magneticOffset(150, 120, rect, 0.3, 6)).toEqual({ x: 0, y: 0 })
  })

  it('pulls toward the cursor, scaled by strength', () => {
    // 10px right of center × 0.3 = 3px, under the cap
    expect(magneticOffset(160, 120, rect, 0.3, 6)).toEqual({ x: 3, y: 0 })
  })

  it('caps the pull at ±max on each axis', () => {
    expect(magneticOffset(1000, 1000, rect, 0.3, 6)).toEqual({ x: 6, y: 6 })
    expect(magneticOffset(-1000, -1000, rect, 0.3, 6)).toEqual({ x: -6, y: -6 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/motion/magnetic.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/motion/magnetic.ts`:

```ts
/**
 * Pure: how far to pull an element toward the cursor. Zero at the element center, a
 * `strength` fraction of the offset otherwise, capped at ±`max` px per axis so a distant
 * cursor can't fling the element. No DOM, no deps — unit-testable and safe on any route.
 */
export function magneticOffset(
  cursorX: number,
  cursorY: number,
  rect: { left: number; top: number; width: number; height: number },
  strength: number,
  max: number,
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const clamp = (v: number) => Math.max(-max, Math.min(max, v))
  return { x: clamp((cursorX - cx) * strength), y: clamp((cursorY - cy) * strength) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/motion/magnetic.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/motion/magnetic.ts src/lib/motion/magnetic.test.ts
git commit -m "$(printf 'feat(motion): pure magneticOffset helper\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 9: `MagneticLink` component

**Files:**
- Create: `src/components/motion/MagneticLink.tsx`
- Test: `src/components/motion/MagneticLink.test.tsx`

Two modes, one responsibility (an enhanced link): with `text`, it renders an aria-safe
decode label (real `sr-only` text + `aria-hidden` noise) that scrambles briefly on hover;
with `children`, it wraps them (magnetic movement only). Both modes ease toward the cursor.
When the gate is off it is a plain `<Link>` — no listeners, no `aria-hidden` layer.

- [ ] **Step 1: Write the failing test**

Create `src/components/motion/MagneticLink.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MagneticLink } from './MagneticLink'

function setEnabled(on: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('reduced-motion') ? false : q.includes('fine') ? on : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => vi.unstubAllGlobals())

describe('MagneticLink', () => {
  it('disabled: renders a plain link with the text and no aria-hidden layer', () => {
    setEnabled(false)
    const { container } = render(<MagneticLink href="/contact" text="UPLINK" />)
    const link = screen.getByRole('link', { name: 'UPLINK' })
    expect(link).toHaveAttribute('href', '/contact')
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('enabled: keeps the real text as the accessible name via an sr-only node', () => {
    setEnabled(true)
    render(<MagneticLink href="/contact" text="UPLINK" />)
    // Accessible name still resolves to the real string (sr-only), never the noise layer.
    expect(screen.getByRole('link', { name: 'UPLINK' })).toHaveAttribute('href', '/contact')
  })

  it('children mode: wraps children and links to href', () => {
    setEnabled(false)
    render(
      <MagneticLink href="/systems/aiva">
        <span>AIVA</span>
      </MagneticLink>,
    )
    expect(screen.getByRole('link', { name: 'AIVA' })).toHaveAttribute('href', '/systems/aiva')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/motion/MagneticLink.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/motion/MagneticLink.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { magneticOffset } from '@/lib/motion/magnetic'
import { scrambleFrame } from '@/lib/scramble'
import { useCursorEnabled } from '@/lib/motion/useCursorEnabled'

const STRENGTH = 0.3 // fraction of the cursor offset the link follows
const MAX = 6 // px cap on the pull (restrained)
const EASE = 0.2 // per-frame lerp toward the magnetic target
const DECODE_MS = 350 // hover-decode duration

/**
 * A link that eases a few px toward the cursor and (with `text`) briefly scramble-decodes
 * its label on hover. Imports only next/link + scramble.ts + rAF — no gsap/lenis/three —
 * so it is safe in shared chrome that reaches record routes. Gated by useCursorEnabled:
 * when off it is a plain <Link> (no listeners, no aria-hidden layer).
 */
export function MagneticLink({
  href,
  text,
  children,
  className,
}: {
  href: string
  text?: string
  children?: ReactNode
  className?: string
}) {
  const enabled = useCursorEnabled()
  const ref = useRef<HTMLAnchorElement | null>(null)
  const raf = useRef<number | null>(null)
  const target = useRef({ x: 0, y: 0 })
  const cur = useRef({ x: 0, y: 0 })
  const [frame, setFrame] = useState(text ?? '')

  const runRaf = useCallback(() => {
    if (raf.current != null) return
    const step = () => {
      cur.current.x += (target.current.x - cur.current.x) * EASE
      cur.current.y += (target.current.y - cur.current.y) * EASE
      if (ref.current) {
        ref.current.style.transform = `translate(${cur.current.x}px, ${cur.current.y}px)`
      }
      const settled =
        Math.abs(target.current.x - cur.current.x) < 0.1 &&
        Math.abs(target.current.y - cur.current.y) < 0.1
      raf.current = settled ? null : requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  const onMove = useCallback(
    (e: PointerEvent<HTMLAnchorElement>) => {
      if (!enabled || !ref.current) return
      target.current = magneticOffset(
        e.clientX,
        e.clientY,
        ref.current.getBoundingClientRect(),
        STRENGTH,
        MAX,
      )
      runRaf()
    },
    [enabled, runRaf],
  )

  const onLeave = useCallback(() => {
    target.current = { x: 0, y: 0 }
    runRaf()
    if (text) setFrame(text)
  }, [runRaf, text])

  const onEnter = useCallback(() => {
    if (!enabled || !text) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DECODE_MS)
      setFrame(scrambleFrame(text, p))
      if (p < 1) requestAnimationFrame(tick)
      else setFrame(text)
    }
    requestAnimationFrame(tick)
  }, [enabled, text])

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onPointerMove={enabled ? onMove : undefined}
      onPointerEnter={enabled ? onEnter : undefined}
      onPointerLeave={enabled ? onLeave : undefined}
    >
      {text ? (
        enabled ? (
          <>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">{frame}</span>
          </>
        ) : (
          text
        )
      ) : (
        children
      )}
    </Link>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/motion/MagneticLink.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/MagneticLink.tsx src/components/motion/MagneticLink.test.tsx
git commit -m "$(printf 'feat(motion): MagneticLink (magnetic pull + aria-safe hover decode)\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 10: Apply `MagneticLink` to UPLINK + ArchiveIndex

**Files:**
- Modify: `src/components/hud/HudFrame.tsx`
- Modify: `src/components/sections/ArchiveIndex.tsx`

- [ ] **Step 1: UPLINK → MagneticLink**

In `src/components/hud/HudFrame.tsx`, replace the `next/link` import with the MagneticLink import (the `HudReadout`/`CornerBracket`/`HudTraces` imports stay):

```tsx
import { MagneticLink } from '@/components/motion/MagneticLink'
```

Replace the UPLINK `<Link>…</Link>` block with:

```tsx
      <MagneticLink
        href="/contact"
        text="◂ UPLINK"
        className="fixed top-6 right-8 z-30 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
      />
```

- [ ] **Step 2: ArchiveIndex rows + FULL ARCHIVE link → MagneticLink**

In `src/components/sections/ArchiveIndex.tsx`, replace the `import Link from 'next/link'` line with:

```tsx
import { MagneticLink } from '@/components/motion/MagneticLink'
```

Replace the row `<Link …>…</Link>` (inside `<Rise>`) with `<MagneticLink …>` (children mode — same props, same children):

```tsx
              <MagneticLink
                href={`/systems/${s.slug}`}
                className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)] md:grid-cols-[2.5rem_1fr_1fr_auto]"
              >
                <span className={LABEL}>{String(recordNumber(s.slug)).padStart(2, '0')}</span>
                <ScrambleTextAnimated
                  text={s.name}
                  seed={recordNumber(s.slug)}
                  className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]"
                />
                <span className={`${LABEL} hidden md:block`}>{s.domain}</span>
                <span className={LABEL}>{s.year} ▸</span>
              </MagneticLink>
```

Replace the FULL ARCHIVE INDEX link (text mode):

```tsx
      <Rise as="div" className="mt-8">
        <MagneticLink
          href="/archive"
          text="▸ FULL ARCHIVE INDEX"
          className={`${LABEL} inline-block hover:text-[var(--color-ink)]`}
        />
      </Rise>
```

- [ ] **Step 3: Verify types + existing section tests**

Run: `npx tsc --noEmit && npx vitest run src/components/sections/ArchiveIndex.test.tsx src/components/hud`
Expected: no type errors; existing tests pass. (If `ArchiveIndex.test.tsx` asserts `getByRole('link')`, MagneticLink still renders an `<a>` so it holds.)

- [ ] **Step 4: Commit**

```bash
git add src/components/hud/HudFrame.tsx src/components/sections/ArchiveIndex.tsx
git commit -m "$(printf 'feat(motion): magnetic UPLINK + archive record links\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 11: `ScrollProgress` HUD indicator

**Files:**
- Create: `src/components/hud/ScrollProgress.tsx`
- Test: `src/components/hud/ScrollProgress.test.tsx`
- Modify: `src/components/hud/HudFrame.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/ScrollProgress.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScrollProgress } from './ScrollProgress'

describe('ScrollProgress', () => {
  it('renders an aria-hidden, non-interactive indicator starting at 000', () => {
    const { container } = render(<ScrollProgress />)
    const root = container.querySelector('[aria-hidden="true"]')
    expect(root).not.toBeNull()
    expect(root).toHaveClass('pointer-events-none')
    expect(container.querySelector('[data-testid="scroll-pct"]')?.textContent).toBe('000')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/hud/ScrollProgress.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/hud/ScrollProgress.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { scrollProgressOf } from '@/lib/canvas/pointer'

/**
 * A hairline scroll-progress track on the right frame edge plus a percent readout — HUD
 * position feedback for the tall pages. Lib-free (plain passive scroll listener + rAF,
 * no gsap/lenis/three), so it is safe on every route including the record pages. Writes to
 * refs each frame, no React state. aria-hidden; shown from `sm` up. Works identically under
 * Lenis (`/`) and native scroll (records, reduced motion) since both move window.scrollY.
 */
export function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement | null>(null)
  const pctRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    let ticking = false
    const paint = () => {
      ticking = false
      const p = scrollProgressOf(scrollY, document.documentElement.scrollHeight, innerHeight)
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p})`
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, '0')
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        raf = requestAnimationFrame(paint)
      }
    }
    paint()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 z-20 hidden h-dvh w-px sm:block"
    >
      <div className="absolute inset-0 bg-[var(--color-hair)]" />
      <div
        ref={fillRef}
        className="absolute inset-x-0 top-0 h-full origin-top bg-[var(--color-dim)]"
        style={{ transform: 'scaleY(0)' }}
      />
      <div
        ref={pctRef}
        data-testid="scroll-pct"
        className="absolute top-1/2 right-2 font-mono text-[9px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
      >
        000
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/hud/ScrollProgress.test.tsx`
Expected: PASS.

- [ ] **Step 5: Mount in HudFrame**

In `src/components/hud/HudFrame.tsx`, add the import:

```tsx
import { ScrollProgress } from './ScrollProgress'
```

Render it just before `<HudReadout />`:

```tsx
      <ScrollProgress />
      <HudReadout />
```

- [ ] **Step 6: Verify types + record-route bundle guarantee**

Run: `npx tsc --noEmit && npx vitest run src/components/hud`
Expected: no type errors; tests pass. (Bundle guarantee is exercised in Task 13.)

- [ ] **Step 7: Commit**

```bash
git add src/components/hud/ScrollProgress.tsx src/components/hud/ScrollProgress.test.tsx src/components/hud/HudFrame.tsx
git commit -m "$(printf 'feat(hud): scroll-progress hairline + percent readout\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 12: Beat-release settle (`holdFade` + Scene)

**Files:**
- Modify: `src/lib/motion/buildSceneTimeline.ts`
- Test: `src/lib/motion/buildSceneTimeline.test.ts`
- Modify: `src/components/motion/Scene.tsx`

Reuse the existing `hold` pin trigger's `onUpdate` (no new ScrollTrigger): fade + lift the
inner content over the last of the pin so an outgoing beat settles out instead of snapping,
reversing cleanly on scroll-up.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/motion/buildSceneTimeline.test.ts`:

```ts
import { holdFade } from './buildSceneTimeline'

describe('holdFade', () => {
  it('is a no-op for the first 80% of the pin', () => {
    expect(holdFade(0)).toEqual({ alpha: 1, y: 0 })
    expect(holdFade(0.8)).toEqual({ alpha: 1, y: 0 })
  })

  it('fades toward 0.5 alpha and lifts 16px by the end of the pin', () => {
    expect(holdFade(1)).toEqual({ alpha: 0.5, y: -16 })
    const mid = holdFade(0.9) // halfway through the tail
    expect(mid.alpha).toBeCloseTo(0.75)
    expect(mid.y).toBeCloseTo(-8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/motion/buildSceneTimeline.test.ts`
Expected: FAIL — `holdFade is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/motion/buildSceneTimeline.ts`, add (top-level export, after the imports):

```ts
const TAIL_START = 0.8 // fraction of the pin after which the beat begins settling out
const TAIL_ALPHA = 0.5 // lowest alpha the outgoing beat reaches (never fully gone)
const TAIL_LIFT = 16 // px the outgoing beat lifts as it settles

/**
 * Pure: the outgoing beat's alpha/lift for a given pin progress (0..1). A no-op until
 * TAIL_START, then eases to (TAIL_ALPHA, −TAIL_LIFT) by progress 1 so a released beat
 * settles out instead of snapping. Reverses cleanly when scrubbed back up.
 */
export function holdFade(progress: number): { alpha: number; y: number } {
  const f = progress > TAIL_START ? (progress - TAIL_START) / (1 - TAIL_START) : 0
  return { alpha: 1 - f * (1 - TAIL_ALPHA), y: -TAIL_LIFT * f }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/motion/buildSceneTimeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into the hold trigger**

In `src/components/motion/Scene.tsx`, add `holdFade` to the existing `buildSceneTimeline` import:

```tsx
import { buildSceneTimeline, holdFade } from '@/lib/motion/buildSceneTimeline'
```

In the `hold` `ScrollTrigger.create({ … })` call, add an `onUpdate` (keep `pin`, `pinSpacing`,
`anticipatePin`, `end`, `invalidateOnRefresh` as they are):

```tsx
      const hold = ScrollTrigger.create({
        trigger: outer,
        start: 'top top',
        end: () => '+=' + window.innerHeight * length,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Settle the beat out over the last of the pin (transform/opacity only — never
          // layout, so the pin can't jump). `target` is the inner content; the assemble
          // timeline animates the layer children, so these never fight.
          const { alpha, y } = holdFade(self.progress)
          gsap.set(target, { autoAlpha: alpha, y })
        },
      })
```

- [ ] **Step 6: Verify types + Scene tests**

Run: `npx tsc --noEmit && npx vitest run src/components/motion src/lib/motion/buildSceneTimeline.test.ts`
Expected: no type errors; tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/buildSceneTimeline.ts src/lib/motion/buildSceneTimeline.test.ts src/components/motion/Scene.tsx
git commit -m "$(printf 'feat(motion): settle each beat out over the last of its pin\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 13: End-to-end coverage

**Files:**
- Modify: `tests/e2e/motion.spec.ts`

Add cursor presence/absence and scroll-progress assertions. Magnetic-pull displacement and
touch-pointer gating are covered by unit tests (Tasks 6, 8, 9) rather than e2e — Playwright
centers `hover` on the target (offset ≈ 0, so no measurable pull) and its touch contexts do
not reliably clear `(pointer: fine)`. The record-route "no animation library" test in
`entry.spec.ts` is the primary bundle gate and must stay green unchanged.

- [ ] **Step 1: Add the cursor + progress specs**

Append to `tests/e2e/motion.spec.ts` (the `enter` helper is already defined at the top):

```ts
test.describe('custom cursor + scroll progress (desktop)', () => {
  test('the glyph-trail caret mounts on / for a fine pointer', async ({ page }) => {
    await enter(page)
    await page.mouse.move(640, 400)
    await expect(page.getByTestId('cursor-caret')).toBeAttached({ timeout: 5000 })
  })

  test('the scroll-progress readout advances as the page scrolls', async ({ page }) => {
    await enter(page)
    const pct = page.getByTestId('scroll-pct')
    await expect(pct).toHaveText('000')
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(60)
    }
    const value = Number(await pct.textContent())
    expect(value).toBeGreaterThan(5)
  })
})

test.describe('custom cursor: absent when motion is off', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('no caret under reduced motion', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.mouse.move(640, 400)
    await page.waitForTimeout(300)
    await expect(page.getByTestId('cursor-caret')).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run the full e2e suite (cold start builds + serves out/)**

Run: `npm run e2e`
Expected: all specs PASS, including the pre-existing `entry.spec.ts` record-route
"ships no animation library" checks (the bundle gate) and the reduced-motion / touch specs.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/motion.spec.ts
git commit -m "$(printf 'test(e2e): cursor caret presence/absence + scroll-progress advance\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Task 14: Full verification + frame-budget gate

**Files:** none (verification only).

- [ ] **Step 1: Unit + types + lint + build**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green; `out/` produced. (`npm run build` runs the content vitest prebuild too.)

- [ ] **Step 2: Frame-budget probe (the smoothness gate)**

Serve the fresh build and re-run the timing probe from the 2026-07-22 verification:

```bash
npx serve@latest -l 3000 out &
node /private/tmp/claude-501/-Users-woyce-shyamsinh/0d29903b-574d-4983-b38e-3e4bb67fcda5/scratchpad/localize-hitches.mjs
```

Expected: **p95 ≤ ~18ms, worst < 50ms, hitchCount 0, no long tasks**, with the cursor +
magnetic + velocity effects live across three scroll passes. If a hitch appears, localize it
(the probe logs scrollY per hitch), diagnose with `superpowers:systematic-debugging`, and fix
before proceeding — a polish pass that costs the 60fps is a regression. Stop the server when
done (`kill %1` or free port 3000).

- [ ] **Step 3: Restore the e2e webServer if the probe left port 3000 busy**

Confirm nothing is left listening: `lsof -ti :3000 || echo PORT_FREE`.

- [ ] **Step 4: Final commit (only if any fix was applied in Step 2)**

```bash
git add -A
git commit -m "$(printf 'fix(motion): resolve frame-budget hitch found in verification\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>')"
```

---

## Self-Review Notes (for the implementer)

- **Reduced motion** (verify manually + via Task 13): no caret, links plain (no `aria-hidden`
  layer), canvas absent (velocity inert), beats static. **Touch/coarse:** no caret, plain
  links, beats reveal-mode. **Record routes:** no caret; UPLINK enhanced iff fine-pointer,
  else plain; scroll-progress present; **no gsap/lenis/three in the bundle** (Task 13 gate).
- **Type consistency:** `smoothVelocity`/`scrollVelocity`/`pushScrollVelocity` (Task 1),
  `velTilt`/`velZoom`/`VEL_EASE`/`VEL_MAX` (Task 3), `cursorPos`/`cursorMoved` (Task 5),
  `useCursorEnabled` (Task 6), `magneticOffset` (Task 8), `holdFade` (Task 12) are referenced
  by the exact names they are defined under.
- **No new gsap/lenis/three imports** reach `cursor.ts`, `MagneticLink`, `ScrollProgress`, or
  `useCursorEnabled` — the only new hot-path deps are `scramble.ts` (pure) and rAF.
```
