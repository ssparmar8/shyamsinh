# ARCHIVE Portfolio — Canvas & Choreography Implementation Plan (Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The final cinematic layer — a WebGL particle constellation behind the homepage, the full eight-beat scroll (identity → trajectory → systems → telemetry → archive → uplink), scroll-reveal animation as each beat enters view, and a telemetry world map. Mounted at `/` only; the static routes stay lean.

**Architecture:** Every beat's content is server-rendered and in the HTML — the canvas, the reveals, and the map are decoration layered on top, exactly as Plan 2's gate was. A no-JS visitor, a crawler, and a reduced-motion user all get the full page as plain scrolling content. WebGL degrades to a 2D canvas, which degrades to nothing; none of those degradations touch the content.

**Two decisions locked by the owner (deviations/choices to honour):**
1. **WebGL constellation via Three.js** — not the 2D-only option. A 2D fallback is still mandatory (no-WebGL devices, reduced motion), so the simulation logic is shared and the renderer is swappable.
2. **Scroll-reveals, NOT pinned scroll.** Sections flow normally; each beat animates as it enters view (decode, map zoom, records typing in). No GSAP pinning — it's the most jitter-prone thing on mobile and we're deliberately not doing it. Reduced motion shows everything immediately.

**Tech Stack:** Next.js 16 · React 19 · Tailwind v4 · Three.js · GSAP + ScrollTrigger · Lenis (Plan 2) · `src/lib/scramble.ts`, `ScrambleTextAnimated`, `useDeviceTier`-style hooks

**Spec:** [`docs/superpowers/specs/2026-07-17-archive-portfolio-design.md`](../specs/2026-07-17-archive-portfolio-design.md) §9.02–9.07, §11, §12, §13
**Prior plans:** foundation (Tasks 1–10) + cinematic-entry (Plan 2) complete. **89 unit + 13 e2e tests pass.**

---

## What Plans 1 and 2 taught us — read before writing code

Every task across both prior plans found a defect its own passing tests could not see: a guard blind to a typo, a decode that never animated, every font silently wrong, a "persistent" link that scrolled away, a security guard that never ran on deploy, 13 records sharing one number, a decode wired into nothing. **This plan is the MOST exposed to that pattern** — WebGL, rAF loops, and scroll animation are invisible to jsdom by construction, and the preview browser freezes rAF/IntersectionObserver (`document.visibilityState: "hidden"`).

Therefore:
- **A task is not done until it's verified in a real, VISIBLE browser — via Playwright, not the preview pane.** The preview pane will make every canvas and every scroll-reveal look dead. This is documented, cost real time before, and is non-negotiable.
- **Every animation gets a permanent e2e guard.** A frozen canvas, a reveal that never fires, a WebGL context that leaks — each must be caught by `tests/e2e`, because unit tests structurally cannot.
- **A test whose name promises more than its assertion checks is worse than no test.** Four shipped in Plan 1.

## Non-negotiables

1. **Content is never gated.** Every beat's text is server-rendered HTML. Verify with `curl` that identity, trajectory, all six systems, the archive names, and contact are in the initial HTML with JS disabled.
2. **`/systems/*`, `/archive`, `/contact` ship ZERO of: three, gsap, lenis.** Verified by the content-based e2e check from Plan 2 (grep chunk BODIES, not URLs; scroll to bottom; include a `/`-loads-it control).
3. **`prefers-reduced-motion`:** no canvas animation (static frame or nothing), no reveals (everything visible immediately), no Lenis. A first-class path.
4. **No-WebGL degrades to 2D canvas; no-canvas degrades to nothing.** The content never depends on either.
5. **The canvas never blocks interaction.** `pointer-events: none`, behind content, `aria-hidden`.
6. **Perf: the rAF loop stops when the tab is hidden.** A portfolio left open in a background tab must not burn a core.

## File structure

```
src/
  lib/
    canvas/useDeviceTier.ts          — capability + budget: 'webgl'|'2d'|'none' × particle count
    canvas/simulation.ts             — pure particle sim (positions, velocities, links). No DOM/WebGL. Unit-tested.
    canvas/useRafLoop.ts             — rAF that auto-pauses on document.hidden + reduced motion
    motion/useReveal.ts              — ScrollTrigger-driven "has entered view" for a ref; reduced-motion → immediately true
  components/
    canvas/Constellation.tsx         — picks renderer from tier; mounts one of the two below
    canvas/Renderer2D.tsx            — 2D canvas draw of the shared simulation (the fallback)
    canvas/RendererWebGL.tsx         — Three.js draw of the same simulation
    sections/Identity.tsx            — beat 02
    sections/Trajectory.tsx          — beat 03 (the climb)
    sections/Systems.tsx             — beat 04 (six records)
    sections/Telemetry.tsx           — beat 05 (world map)
    sections/ArchiveIndex.tsx        — beat 06
    sections/Uplink.tsx              — beat 07
  app/
    page.tsx                         — MODIFIED: Constellation + EntryOverlay + the six sections
tests/e2e/
    canvas.spec.ts                   — new
    homepage.spec.ts                 — new
```

**Boundaries.** `simulation.ts` is pure (no DOM, no WebGL, no Three) so the physics is unit-testable and shared by both renderers — a renderer is just a way to draw the same particle array. Sections are server components rendering content; the reveal animation is a client enhancement wrapping them, so their text is always in the HTML.

---

### Task 1: Device tier and capability detection

**Files:** Create `src/lib/canvas/useDeviceTier.ts`, `src/lib/canvas/useDeviceTier.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { pickTier } from './useDeviceTier'

describe('pickTier', () => {
  it('returns none under reduced motion, whatever the hardware', () => {
    expect(pickTier({ reduced: true, webgl: true, cores: 16, small: false }).renderer).toBe('none')
  })

  it('returns 2d when WebGL is unavailable', () => {
    expect(pickTier({ reduced: false, webgl: false, cores: 16, small: false }).renderer).toBe('2d')
  })

  it('returns webgl on a capable device', () => {
    expect(pickTier({ reduced: false, webgl: true, cores: 16, small: false }).renderer).toBe('webgl')
  })

  it('budgets fewer particles on a small screen', () => {
    const phone = pickTier({ reduced: false, webgl: true, cores: 4, small: true })
    const desk = pickTier({ reduced: false, webgl: true, cores: 16, small: false })
    expect(phone.count).toBeLessThan(desk.count)
  })

  it('budgets fewer particles on low core counts', () => {
    const weak = pickTier({ reduced: false, webgl: true, cores: 2, small: false })
    const strong = pickTier({ reduced: false, webgl: true, cores: 16, small: false })
    expect(weak.count).toBeLessThan(strong.count)
  })

  it('never budgets zero particles for a rendering tier', () => {
    expect(pickTier({ reduced: false, webgl: true, cores: 1, small: true }).count).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run it, watch it fail** — `npm test -- useDeviceTier`

- [ ] **Step 3: Implement `src/lib/canvas/useDeviceTier.ts`**

```ts
'use client'

import { useSyncExternalStore } from 'react'

export type Tier = { renderer: 'webgl' | '2d' | 'none'; count: number }

type Inputs = { reduced: boolean; webgl: boolean; cores: number; small: boolean }

/**
 * Pure tier decision, so it's testable without a browser.
 *
 * Reduced motion wins over everything — no animated canvas at all. Otherwise the
 * budget scales with the weakest of (cores, screen size), because a portfolio will
 * be opened on a mid-range Android and a runaway particle count is exactly what
 * tanks it (spec §12). Never zero for a real renderer — a canvas that draws nothing
 * is a bug that looks like success.
 */
export function pickTier({ reduced, webgl, cores, small }: Inputs): Tier {
  if (reduced) return { renderer: 'none', count: 0 }
  const base = small ? 55 : 130
  const coreScale = Math.min(1, Math.max(0.35, cores / 8))
  const count = Math.max(24, Math.round(base * coreScale))
  return { renderer: webgl ? 'webgl' : '2d', count }
}

const hasWebGL = (): boolean => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

const read = (): Tier =>
  pickTier({
    reduced:
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: hasWebGL(),
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    small: typeof innerWidth !== 'undefined' ? innerWidth < 768 : false,
  })

// Capability doesn't change during a session; a static server snapshot is correct
// and keeps hydration stable. 'none' on the server means no canvas renders until
// the client confirms — content never depends on it.
const serverTier: Tier = { renderer: 'none', count: 0 }

export function useDeviceTier(): Tier {
  return useSyncExternalStore(
    () => () => {},
    read,
    () => serverTier,
  )
}
```

- [ ] **Step 4: Run it, watch it pass** — 6 passed

- [ ] **Step 5: Commit**

```bash
npm test && npm run lint && npm run build
git add src/lib/canvas/
git commit -m "feat(canvas): add device tier and WebGL capability detection"
```

---

### Task 2: The particle simulation (pure) and the 2D renderer

The 2D renderer is built FIRST and on its own, because it is the mandatory fallback and it must work everywhere. If WebGL is hard, the site still has a working background.

**Files:** Create `src/lib/canvas/simulation.ts`, `src/lib/canvas/simulation.test.ts`, `src/lib/canvas/useRafLoop.ts`, `src/components/canvas/Renderer2D.tsx`

- [ ] **Step 1: Write the failing test for the simulation**

```ts
import { describe, it, expect } from 'vitest'
import { createField, stepField, nearLinks } from './simulation'

describe('particle field', () => {
  it('creates the requested number of particles within bounds', () => {
    const f = createField(40, 800, 600, 1)
    expect(f.length).toBe(40)
    for (const p of f) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(800)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(600)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = createField(20, 800, 600, 7)
    const b = createField(20, 800, 600, 7)
    expect(a).toEqual(b)
  })

  it('moves particles when stepped', () => {
    const f = createField(10, 800, 600, 1)
    const before = f.map((p) => ({ x: p.x, y: p.y }))
    stepField(f, 800, 600, 16)
    expect(f.some((p, i) => p.x !== before[i].x || p.y !== before[i].y)).toBe(true)
  })

  it('keeps particles inside the bounds after many steps (wraps or bounces)', () => {
    const f = createField(30, 400, 300, 2)
    for (let i = 0; i < 500; i++) stepField(f, 400, 300, 16)
    for (const p of f) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(400)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(300)
    }
  })

  it('links only particles within the threshold', () => {
    const f = [
      { x: 0, y: 0, vx: 0, vy: 0 },
      { x: 10, y: 0, vx: 0, vy: 0 },
      { x: 999, y: 999, vx: 0, vy: 0 },
    ]
    const links = nearLinks(f, 50)
    expect(links).toEqual([[0, 1]])
  })
})
```

- [ ] **Step 2: Run it, watch it fail**

- [ ] **Step 3: Implement `src/lib/canvas/simulation.ts`**

```ts
export type Particle = { x: number; y: number; vx: number; vy: number }

// Deterministic PRNG so a given seed reproduces a field — matters for tests and
// for not reshuffling the whole constellation on every resize.
const rng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const SPEED = 0.012 // px per ms — a slow drift, not a swarm

export function createField(count: number, w: number, h: number, seed = 1): Particle[] {
  const r = rng(seed)
  return Array.from({ length: count }, () => ({
    x: r() * w,
    y: r() * h,
    vx: (r() - 0.5) * SPEED,
    vy: (r() - 0.5) * SPEED,
  }))
}

/** Advance by dt ms. Particles bounce off the edges so the field stays populated. */
export function stepField(f: Particle[], w: number, h: number, dt: number): void {
  for (const p of f) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.x <= 0 || p.x >= w) { p.vx *= -1; p.x = Math.min(w, Math.max(0, p.x)) }
    if (p.y <= 0 || p.y >= h) { p.vy *= -1; p.y = Math.min(h, Math.max(0, p.y)) }
  }
}

/** Index pairs closer than `dist`. O(n²) — the tier budget keeps n small on purpose. */
export function nearLinks(f: Particle[], dist: number): Array<[number, number]> {
  const d2 = dist * dist
  const out: Array<[number, number]> = []
  for (let i = 0; i < f.length; i++) {
    for (let j = i + 1; j < f.length; j++) {
      const dx = f[i].x - f[j].x
      const dy = f[i].y - f[j].y
      if (dx * dx + dy * dy <= d2) out.push([i, j])
    }
  }
  return out
}
```

- [ ] **Step 4: Run it, watch it pass** — 5 passed

- [ ] **Step 5: Implement `src/lib/canvas/useRafLoop.ts`**

```ts
'use client'

import { useEffect, useRef } from 'react'

/**
 * A rAF loop that pauses when the tab is hidden.
 *
 * The pause is the point: a portfolio sits open in a background tab for hours, and
 * an unpaused particle loop burns a CPU core the whole time (spec §12). `cb`
 * receives dt in ms, clamped so a long pause doesn't teleport the sim on resume.
 */
export function useRafLoop(cb: (dtMs: number) => void, enabled: boolean): void {
  const cbRef = useRef(cb)
  cbRef.current = cb

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last = performance.now()
    let running = true

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min(50, now - last) // clamp: never advance more than ~3 frames at once
      last = now
      cbRef.current(dt)
      raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled])
}
```

- [ ] **Step 6: Implement `src/components/canvas/Renderer2D.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { createField, stepField, nearLinks, type Particle } from '@/lib/canvas/simulation'
import { useRafLoop } from '@/lib/canvas/useRafLoop'

const LINK_DIST = 120
const INK = '#8d8d8d' // decorative only — never text, so the AA rule doesn't apply

/**
 * The 2D-canvas constellation: the mandatory fallback, and a complete feature.
 *
 * DPR-aware so it isn't blurry on retina; capped at 2 so a 3x phone doesn't render
 * a 9x-area buffer. Redraws the shared simulation each frame. `count` comes from the
 * device tier; the caller only mounts this when the tier says '2d'.
 */
export function Renderer2D({ count }: { count: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fieldRef = useRef<Particle[]>([])
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const w = innerWidth
      const h = innerHeight
      sizeRef.current = { w, h }
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fieldRef.current = createField(count, w, h, 1)
    }
    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [count])

  useRafLoop((dt) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w, h } = sizeRef.current
    const field = fieldRef.current
    stepField(field, w, h, dt)

    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = INK
    for (const [i, j] of nearLinks(field, LINK_DIST)) {
      const a = field[i]
      const b = field[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const alpha = 0.18 * (1 - Math.sqrt(dx * dx + dy * dy) / LINK_DIST)
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.5
    ctx.fillStyle = INK
    for (const p of field) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }, true)

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
```

- [ ] **Step 7: MANDATORY browser verification (Playwright — the preview pane freezes rAF)**

Build a probe route (no leading underscore) mounting `<Renderer2D count={80} />`. In Playwright, sample the canvas: capture `toDataURL()` at two moments ~300ms apart; assert they DIFFER (the field is moving). Then set the tab hidden (`page.evaluate(() => Object.defineProperty(document,'hidden',{value:true,configurable:true})); dispatchEvent(new Event('visibilitychange'))`) and confirm the frames STOP changing. Report both. **Delete the probe.**

- [ ] **Step 8: Commit**

```bash
git add src/lib/canvas/ src/components/canvas/Renderer2D.tsx
git commit -m "feat(canvas): add pure particle simulation, paused-when-hidden rAF, and 2D renderer"
```

---

### Task 3: The WebGL renderer (Three.js)

Same simulation, drawn with WebGL. The riskiest task. Read it fully.

**Files:** Create `src/components/canvas/RendererWebGL.tsx`, `src/components/canvas/Constellation.tsx`; install `three`.

- [ ] **Step 1: Install**

```bash
npm i three
npm i -D @types/three
```

- [ ] **Step 2: Implement `src/components/canvas/RendererWebGL.tsx`**

Raw Three.js (no react-three-fiber — one canvas, one loop, r3f is overhead we don't need). An orthographic camera in pixel space so the WebGL field uses the SAME coordinates as the 2D one and the shared simulation just works. Points via `Points` + `BufferGeometry`; links via `LineSegments` whose position buffer is rewritten each frame from `nearLinks`.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createField, stepField, nearLinks, type Particle } from '@/lib/canvas/simulation'
import { useRafLoop } from '@/lib/canvas/useRafLoop'

const LINK_DIST = 120
const INK = new THREE.Color('#8d8d8d')

export function RendererWebGL({ count }: { count: number }) {
  const holderRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.OrthographicCamera
    points: THREE.Points
    lines: THREE.LineSegments
    field: Particle[]
    w: number
    h: number
  } | null>(null)

  useEffect(() => {
    const holder = holderRef.current
    if (!holder) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      return // context creation can fail even when detection passed; caller has a 2D fallback
    }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1))
    holder.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    Object.assign(renderer.domElement.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0',
    })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1)

    const pointsGeo = new THREE.BufferGeometry()
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    const points = new THREE.Points(
      pointsGeo,
      new THREE.PointsMaterial({ color: INK, size: 2.6, transparent: true, opacity: 0.5, sizeAttenuation: false }),
    )

    const linesGeo = new THREE.BufferGeometry()
    // Max links is bounded by n²; allocate once, draw a dynamic range each frame.
    const maxLinks = (count * (count - 1)) / 2
    linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxLinks * 6), 3))
    const lines = new THREE.LineSegments(
      linesGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.14 }),
    )

    scene.add(points, lines)

    const resize = () => {
      const w = innerWidth
      const h = innerHeight
      renderer.setSize(w, h)
      // Ortho camera in pixel space, y-flipped so (0,0) is top-left like the 2D canvas.
      camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h
      camera.updateProjectionMatrix()
      const field = createField(count, w, h, 1)
      stateRef.current = { renderer, scene, camera, points, lines, field, w, h }
    }
    resize()
    addEventListener('resize', resize)

    return () => {
      removeEventListener('resize', resize)
      pointsGeo.dispose()
      linesGeo.dispose()
      ;(points.material as THREE.Material).dispose()
      ;(lines.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
      stateRef.current = null
    }
  }, [count])

  useRafLoop((dt) => {
    const s = stateRef.current
    if (!s) return
    stepField(s.field, s.w, s.h, dt)

    const pos = s.points.geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < s.field.length; i++) {
      pos.setXYZ(i, s.field[i].x, s.field[i].y, 0)
    }
    pos.needsUpdate = true

    const links = nearLinks(s.field, LINK_DIST)
    const lpos = s.lines.geometry.getAttribute('position') as THREE.BufferAttribute
    let k = 0
    for (const [i, j] of links) {
      lpos.setXYZ(k++, s.field[i].x, s.field[i].y, 0)
      lpos.setXYZ(k++, s.field[j].x, s.field[j].y, 0)
    }
    s.lines.geometry.setDrawRange(0, links.length * 2)
    lpos.needsUpdate = true

    s.renderer.render(s.scene, s.camera)
  }, true)

  return <div ref={holderRef} aria-hidden="true" />
}
```

- [ ] **Step 3: Implement `src/components/canvas/Constellation.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useDeviceTier } from '@/lib/canvas/useDeviceTier'
import { Renderer2D } from './Renderer2D'

// Three.js is heavy; load the WebGL renderer only when the tier actually chooses it,
// so devices that fall back to 2D — and every SSR pass — never download Three.
const RendererWebGL = dynamic(() => import('./RendererWebGL').then((m) => m.RendererWebGL), {
  ssr: false,
})

/**
 * The constellation background, mounted at / only.
 *
 * The tier decides the renderer: 'webgl' → Three, '2d' → canvas, 'none' → nothing
 * (reduced motion, or SSR before the client confirms). Content never depends on
 * this — it's a fixed, aria-hidden, pointer-events-none layer at z-0.
 */
export function Constellation() {
  const tier = useDeviceTier()
  if (tier.renderer === 'none') return null
  if (tier.renderer === '2d') return <Renderer2D count={tier.count} />
  return <RendererWebGL count={tier.count} />
}
```

- [ ] **Step 4: MANDATORY browser verification (Playwright)**

Probe route mounting `<Constellation />` on a WebGL-capable Playwright chromium:
1. A `<canvas>` exists and its rendered pixels CHANGE across ~300ms (`toDataURL` differs) — the WebGL field animates.
2. The Three chunk loads on the probe but the WebGL path is chosen (check `renderer.domElement` is a WebGL canvas — `getContext('webgl')` is non-null on it).
3. Hidden tab → frames stop.
4. Force `WebGLRenderingContext` unavailable (block it in an init script) and confirm the component falls back to the 2D renderer (a 2D canvas still animates) — the fallback path, exercised.
5. Reduced motion → no canvas at all.
Report each. **Delete the probe.**

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/ package.json package-lock.json
git commit -m "feat(canvas): add Three.js WebGL renderer with 2D fallback"
```

---

### Task 4: The eight-beat homepage structure

Replace the interim `page.tsx` with the full scroll. **All content server-rendered** — this task adds NO animation beyond the existing hero decode. Constellation behind. The point is a complete, correct, scrollable page that works with JS off; Task 5 animates it.

**Files:** Create `src/components/sections/{Identity,Trajectory,Systems,Telemetry,ArchiveIndex,Uplink}.tsx`; modify `src/app/page.tsx`.

Each section is a server component rendering content from `@/content`. Detailed content per section:

- **Identity** — the current hero (name via `ScrambleTextAnimated`, title, the derived `8 YRS · 18 SYSTEMS · 9 SECTORS · 3 CLIENT REGIONS` line, location). Extracted from today's `page.tsx` verbatim.
- **Trajectory** — render `TRAJECTORY`/`CONTINUITY` from `@/content/trajectory` as the horizontal climb: `2012 ITI → 2015 DIPLOMA → 2018 B.E. → 2018 FIRST SYSTEM → 2026 ARCHITECT`, each a dated node. `CONTINUITY` ("NO BREAK SINCE 2018") as a footer label.
- **Systems** — `getFeatured()` rendered as six `SystemRecord`s (reuse the Plan 1 component; it already exists and is tested), each with its `recordNumber`.
- **Telemetry** — a placeholder section for Task 6 (heading `NODE: TELEMETRY`, the `countClientRegions()`/`countRegions()` copy). Task 6 fills in the map. Leave a clearly-marked mount point.
- **ArchiveIndex** — the 12 non-featured systems as compact rows (name · domain · year), each linking to `/systems/[slug]`, plus a link to `/archive`.
- **Uplink** — the contact CTA: email mailto, the `IDENTITY.links`, `◂ OPEN CHANNEL`. Mirror `/contact`'s content.

- [ ] **Step 1** — Build each section component. Each takes no props (reads `@/content`) except where noted. Keep each file focused. Follow the existing HUD label/token conventions (`font-mono`, `text-[var(--color-dim)]`, `tracking-[var(--tracking-hud)]`).

- [ ] **Step 2** — Rewrite `src/app/page.tsx`:

```tsx
import { Constellation } from '@/components/canvas/Constellation'
import { EntryOverlay } from '@/components/boot/EntryOverlay'
import { SmoothScroll } from '@/components/scroll/SmoothScroll'
import { HudFrame } from '@/components/hud/HudFrame'
import { Identity } from '@/components/sections/Identity'
import { Trajectory } from '@/components/sections/Trajectory'
import { Systems } from '@/components/sections/Systems'
import { Telemetry } from '@/components/sections/Telemetry'
import { ArchiveIndex } from '@/components/sections/ArchiveIndex'
import { Uplink } from '@/components/sections/Uplink'

export default function Home() {
  return (
    <>
      <Constellation />
      <SmoothScroll />
      <EntryOverlay>
        <HudFrame label="ARCHIVE://">
          <main className="mx-auto max-w-3xl px-6">
            <Identity />
            <Trajectory />
            <Systems />
            <Telemetry />
            <ArchiveIndex />
            <Uplink />
          </main>
        </HudFrame>
      </EntryOverlay>
    </>
  )
}
```

- [ ] **Step 3: Unit tests** for the sections that have logic (Trajectory renders all 5 nodes; Systems renders 6 records; ArchiveIndex renders 12 rows and links each to its slug). Content presence, not animation.

- [ ] **Step 4: `npm test`, `npm run lint`, `npm run build`, `npx tsc --noEmit`** all clean.

- [ ] **Step 5: MANDATORY browser + curl verification**
1. `curl -s localhost:3000/ | grep -c 'Shyamsinh Parmar'` ≥ 1, and the same for one trajectory year, one featured system, one archive name, and the email — **all in the initial HTML.**
2. Load `/` in Playwright, dismiss the gate, scroll top to bottom, screenshot each beat. Report honest visual judgement — does it read as one continuous archive document?
3. No horizontal scroll at 375px through the whole page.
4. The constellation is visible behind the content and doesn't wash out the text (contrast still holds).

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/ src/app/page.tsx
git commit -m "feat(home): assemble the eight-beat scrolling homepage"
```

---

### Task 5: Scroll-reveal choreography (no pinning)

GSAP + ScrollTrigger drive reveals as each beat enters view. **No pinning** — owner's decision. Reduced motion shows everything immediately.

**Files:** Create `src/lib/motion/useReveal.ts`, `src/components/motion/Reveal.tsx`, `src/components/motion/Reveal.test.tsx`; wrap sections in `page.tsx`.

- [ ] **Step 1: Install GSAP** — `npm i gsap` (free for commercial use incl. ScrollTrigger).

- [ ] **Step 2: Write the failing test** for `Reveal` — under reduced motion it renders children fully visible (no opacity-0 stuck state); by default it renders children (content always present). jsdom can't drive ScrollTrigger, so the test asserts the content-always-present and reduced-motion-visible invariants only.

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Reveal } from './Reveal'

function setMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
    matches: reduced, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })))
}
beforeEach(() => { vi.unstubAllGlobals(); setMotion(false) })

describe('Reveal', () => {
  it('always renders its children (content is never gated behind animation)', () => {
    render(<Reveal><p>BEAT CONTENT</p></Reveal>)
    expect(screen.getByText('BEAT CONTENT')).toBeInTheDocument()
  })

  it('under reduced motion, children are fully visible with no animation styles', () => {
    setMotion(true)
    const { container } = render(<Reveal><p>BEAT</p></Reveal>)
    // no opacity-0 / translate stuck state
    const el = container.firstElementChild as HTMLElement
    expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true)
  })
})
```

- [ ] **Step 3: Implement `useReveal.ts`** — registers a ScrollTrigger for a ref that sets a "revealed" state when the element enters (respecting reduced motion → immediately revealed, no ScrollTrigger). Import ScrollTrigger and `gsap.registerPlugin(ScrollTrigger)` once. Tie ScrollTrigger's scroller to Lenis if needed (ScrollTrigger + Lenis integration: call `ScrollTrigger.update` on Lenis scroll — document this carefully, it's the fiddly bit).

- [ ] **Step 4: Implement `Reveal.tsx`** — a client wrapper: children always rendered; when not revealed and motion allowed, apply an initial `opacity-0 translate-y-2` and transition to visible on reveal. Under reduced motion, render children with no transform at all.

- [ ] **Step 5: Wrap each section** in `page.tsx` with `<Reveal>` (staggered per beat). Identity's hero decode already animates; don't double-animate it — reveal the sub-copy, not the name.

- [ ] **Step 6: MANDATORY browser verification (Playwright)**
1. Load `/`, dismiss gate, and confirm a below-the-fold section starts hidden (opacity < 1) and becomes visible (opacity 1) after scrolling to it. Measure both.
2. Reduced motion: every section is opacity 1 from the start, no scrolling required. Measure.
3. Keyboard scroll (PageDown/End) still reaches the bottom and triggers reveals.
4. The `/systems/*` routes still load zero gsap (content-based check).

- [ ] **Step 7: Commit**

```bash
git add src/lib/motion/useReveal.ts src/components/motion/ src/app/page.tsx package.json package-lock.json
git commit -m "feat(motion): add scroll-reveal choreography, reduced-motion safe"
```

---

### Task 6: The telemetry world map

Beat 05. A world map, client nodes pulsing at US/CA/DK, home node at IN (Gujarat), revealing/zooming as it enters view.

**Files:** Create `src/components/sections/TelemetryMap.tsx` (+ a lightweight inline SVG world map or a minimal dot-grid map — NO heavy geo library), test; wire into `Telemetry.tsx`.

- [ ] **Step 1** — Represent the map as a compact SVG (an equirectangular dot-grid or a simple continents silhouette inlined as a path — keep it a few KB, monochrome). Plot four nodes at approximate lat/long → x/y. Client nodes (US/CA/DK) one style; the home node (IN) visibly distinct (the "you are here" pulse). Label them `US · CA · DK` and `◂ YOU · IN`.

- [ ] **Step 2** — Copy: `NODE: TELEMETRY`, and the honest figure — `countClientRegions()` (3) for "client regions", with the 4th (home) shown as the distinct node, never conflated. Reuse the §index.ts distinction; do NOT print "18 systems across 4 regions".

- [ ] **Step 3** — Reveal/zoom on enter via `Reveal` (or a subtle scale from 0.96→1). Reduced motion: static, full-size, immediately.

- [ ] **Step 4: Browser verification** — the four nodes render at plausible positions, the home node is visually distinct, labels are legible against the map, no horizontal overflow at 375px.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/TelemetryMap.tsx src/components/sections/Telemetry.tsx
git commit -m "feat(home): add the telemetry world map"
```

---

### Task 7: Verify the whole cinematic homepage

**Files:** Create `tests/e2e/canvas.spec.ts`, `tests/e2e/homepage.spec.ts`.

- [ ] **Step 1: `canvas.spec.ts`** — permanent guards for the defects unit tests can't see:
  - The constellation canvas's pixels change over time (animates), on a WebGL-capable page.
  - With WebGL blocked, a 2D canvas still animates (fallback works).
  - Reduced motion → no canvas element that animates.
  - Hidden tab → the canvas stops changing (the perf guard).

- [ ] **Step 2: `homepage.spec.ts`** — the eight-beat page:
  - All beats' content in the HTML (identity, a trajectory year, all six featured names, an archive name, the email).
  - Below-fold sections reveal on scroll (opacity 0 → 1); reduced motion shows all at 1 immediately.
  - The telemetry map renders four nodes.
  - No horizontal scroll at 375px anywhere down the page.
  - Extend the Plan 2 animation-lib content check: `/systems/aiva`, `/archive`, `/contact` load NONE of three/gsap/lenis, with the `/`-loads-them control.

- [ ] **Step 3: Run `npm run e2e` cold** — all green.

- [ ] **Step 4: Measure and report** actual numbers:

| Check | Target |
| --- | --- |
| Content beats in initial HTML (JS off) | all present |
| Canvas animates (distinct frames) | yes, on WebGL and on 2D fallback |
| Canvas stops when tab hidden | yes |
| three/gsap/lenis on `/systems/aiva` | none |
| JS transferred on `/systems/aiva` | report; must not grow vs Plan 2 |
| JS transferred on `/` | report (Three + GSAP are expected here) |
| Lighthouse a11y on `/` | 1.0 |
| Lighthouse perf on `/`, mid-tier mobile | report; canvas must not tank it |

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test(e2e): cover the constellation, reveals, and the eight-beat homepage"
```

---

## Definition of done

- [ ] `npm run lint && npm test && npm run build && npm run e2e` all pass
- [ ] Every beat's content is in the initial HTML with JS disabled
- [ ] The constellation animates on WebGL, falls back to 2D when WebGL is blocked, and shows nothing under reduced motion
- [ ] The canvas rAF loop stops when the tab is hidden
- [ ] Sections reveal on scroll; reduced motion shows everything immediately, no stuck opacity-0
- [ ] The telemetry map shows 3 client nodes + 1 distinct home node; no copy claims work delivered to 4 regions
- [ ] `/systems/*`, `/archive`, `/contact` still load zero three/gsap/lenis
- [ ] No horizontal scroll at 375px anywhere on `/`
- [ ] The site is deployable and the static routes are unchanged in speed

## Found during execution, deferred (low severity, decorative-only)

- **WebGL context-loss is unhandled.** If the GPU resets (rare on desktop, plausible on
  mobile backgrounding), `RendererWebGL` has no `webglcontextlost`/`restored` listener, so
  the constellation freezes permanently. It's a silently-frozen decorative background, never
  a crash, and content is never gated on it. Add a listener that `preventDefault()`s loss and
  rebuilds on restore if this ever shows up in the wild.
- **The two renderers fade links differently.** `Renderer2D` fades each link's opacity by
  distance (`0.18 × (1 − dist/120)`); `RendererWebGL`'s `LineBasicMaterial` uses a flat 0.14.
  Both are faint grey on near-white and no single visitor sees both, so the inconsistency is
  invisible in practice — but matching them (per-link vertex alpha in WebGL) would make the
  fallback a pixel-exact match. Low priority.

## Deferred / out of scope

- Pinned-scroll choreography (owner chose scroll-reveals). If wanted later, it layers on the same sections.
- The Plan 2 wheel-scroll-lock during the gate: resolve here only if the new `page.tsx` mount makes it trivial (Lenis not started until entry done); otherwise carry the note forward.
- Bundle-analysis pass on `/` (Three + GSAP land here) — open it as the first step if the perf number in Task 7 disappoints.

## Still blocking publication (not this plan)

The 2018 experience anchor, ServiceNow/Goodfin scope, client consent to be named, and the unconfirmed LinkedIn URL. All one-line edits in `src/content/`.
