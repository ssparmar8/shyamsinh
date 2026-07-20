# Cinematic Animation Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring three animation effects closer to the reference site's cinematic feel — per-record slide-in + typewriter, wider scramble-decode reach, and a hexagonal wireframe centerpiece over the constellation.

**Architecture:** Reuse the existing motion primitives (`ScrambleTextAnimated`, `Reveal`/`useReveal`, `useOnScreen`, `useRafLoop`) and the shared-pure-module pattern (`simulation.ts`). Add two units — a pure `wireframe.ts` (geometry + projection, consumed by both canvas renderers) and a `TypeOut` component (typewriter, built to `ScrambleTextAnimated`'s a11y contract). Wire them into the records, section headings, and both renderers.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Three.js (ortho pixel-space), GSAP ScrollTrigger, Lenis, Tailwind v4, Vitest (jsdom), Playwright.

**Spec:** [2026-07-20-motion-and-centerpiece-design.md](../specs/2026-07-20-motion-and-centerpiece-design.md)

---

## Non-negotiable contracts (hold these in every task)

- **A11y:** every animated string is real text in the DOM from first paint (`sr-only`); noise/typing/wireframe live on `aria-hidden` layers. Reduced motion renders plain text with **no** timers/observers, and **no** canvas.
- **Reduced-motion fallback is automatic in unit tests:** jsdom has no `matchMedia`, so `usePrefersReducedMotion()` returns `true` unless a test stubs `matchMedia` to `{ matches: false }`. To exercise the *animated* path in a test you MUST stub `matchMedia` (matches:false) **and** `IntersectionObserver` (see the mock in Task 2).
- **Server/client boundary:** section + record components stay Server Components that *render* the client animation components as children. Do not add `'use client'` to `SystemRecord`, `Systems`, or the section files.
- **Perf:** the centerpiece rides the existing `useRafLoop` (already pauses on hidden tab). No new rAF loop in the renderers.

## File structure

| File | Responsibility |
| --- | --- |
| `src/lib/canvas/wireframe.ts` | **new** — pure: `hexBipyramid()` geometry + `rotateProject()` (shared by both renderers) |
| `src/lib/canvas/wireframe.test.ts` | **new** — unit tests for the above |
| `src/components/text/TypeOut.tsx` | **new** — typewriter, a11y-mirrored to `ScrambleTextAnimated` |
| `src/components/text/TypeOut.test.tsx` | **new** — unit tests for the above |
| `src/components/record/SystemRecord.tsx` | animated name + scrambled `DOMAIN·REGION` + `TypeOut` summary |
| `src/components/sections/Systems.tsx` | per-record `Reveal`; scrambled heading; `seedBase` |
| `src/app/page.tsx` | stop wrapping `Systems` in a single `Reveal` |
| `src/components/sections/{Trajectory,Telemetry,ArchiveIndex,Uplink}.tsx` | scrambled `NODE:` headings |
| `src/components/sections/Identity.tsx` | scrambled `// IDENTITY` label + stat line |
| `src/components/canvas/RendererWebGL.tsx` | draw the centerpiece `LineSegments` |
| `src/components/canvas/Renderer2D.tsx` | stroke the centerpiece edges |
| `tests/e2e/motion.spec.ts` | **new** — record reveal, reduced-motion record, canvas presence |

---

## Task 1: Pure wireframe geometry + projection

**Files:**
- Create: `src/lib/canvas/wireframe.ts`
- Test: `src/lib/canvas/wireframe.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/canvas/wireframe.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { hexBipyramid, rotateProject } from './wireframe'

describe('hexBipyramid', () => {
  it('has 8 vertices and 18 edges', () => {
    const { vertices, edges } = hexBipyramid()
    expect(vertices).toHaveLength(8)
    expect(edges).toHaveLength(18)
  })

  it('references only valid vertex indices', () => {
    const { vertices, edges } = hexBipyramid()
    for (const [a, b] of edges) {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(vertices.length)
      expect(a).not.toBe(b)
    }
  })
})

describe('rotateProject', () => {
  const { vertices } = hexBipyramid()

  it('is deterministic for the same inputs', () => {
    const a = rotateProject(vertices, 0.3, 1.1, 100, 400, 300)
    const b = rotateProject(vertices, 0.3, 1.1, 100, 400, 300)
    expect(a).toEqual(b)
  })

  it('projects the top apex to the centre when unrotated', () => {
    // vertex index 6 is the top apex (0,0,1); with no rotation its x/y are 0.
    const pts = rotateProject(vertices, 0, 0, 100, 400, 300)
    expect(pts[6].x).toBeCloseTo(400)
    expect(pts[6].y).toBeCloseTo(300)
  })

  it('projects opposite ring vertices symmetrically about the centre', () => {
    // ring vertex 0 is (1,0,0); ring vertex 3 is (-1,0,0).
    const pts = rotateProject(vertices, 0, 0, 100, 400, 300)
    expect(pts[0].x).toBeCloseTo(500)
    expect(pts[3].x).toBeCloseTo(300)
    expect(pts[0].y).toBeCloseTo(300)
    expect(pts[3].y).toBeCloseTo(300)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/canvas/wireframe.test.ts`
Expected: FAIL — `Failed to resolve import './wireframe'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/canvas/wireframe.ts`:

```ts
export type Vec3 = { x: number; y: number; z: number }
export type Vec2 = { x: number; y: number }

/**
 * A hexagonal bipyramid: a 6-vertex ring in the z=0 plane plus a top and bottom
 * apex. 8 vertices, 18 edges (ring 6 + top spokes 6 + bottom spokes 6). Sparse on
 * purpose — it is a background anchor, not the subject.
 *
 * Shared, like simulation.ts, so both renderers draw the identical shape and cannot
 * drift. Pure and unit-testable — no THREE, no canvas.
 */
export function hexBipyramid(): { vertices: Vec3[]; edges: [number, number][] } {
  const ring: Vec3[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i // 60° steps
    ring.push({ x: Math.cos(a), y: Math.sin(a), z: 0 })
  }
  const vertices: Vec3[] = [...ring, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }]
  // indices: 0..5 ring, 6 top apex, 7 bottom apex
  const edges: [number, number][] = []
  for (let i = 0; i < 6; i++) edges.push([i, (i + 1) % 6]) // ring
  for (let i = 0; i < 6; i++) edges.push([i, 6]) // to top
  for (let i = 0; i < 6; i++) edges.push([i, 7]) // to bottom
  return { vertices, edges }
}

/**
 * Rotate each vertex around X (tilt) then Y (spin), drop z (orthographic — matches
 * RendererWebGL's ortho pixel-space camera), scale, and translate to (cx, cy).
 * Pure: same inputs always yield the same 2D points, which the deterministic decode
 * relies on for the scroll-driven case and which makes it testable here.
 */
export function rotateProject(
  vertices: Vec3[],
  angleX: number,
  angleY: number,
  scale: number,
  cx: number,
  cy: number,
): Vec2[] {
  const cosX = Math.cos(angleX)
  const sinX = Math.sin(angleX)
  const cosY = Math.cos(angleY)
  const sinY = Math.sin(angleY)
  return vertices.map((v) => {
    // rotate around X
    const y = v.y * cosX - v.z * sinX
    const z = v.y * sinX + v.z * cosX
    // rotate around Y (z2 is discarded by the orthographic projection)
    const x = v.x * cosY + z * sinY
    return { x: cx + x * scale, y: cy + y * scale }
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/canvas/wireframe.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/canvas/wireframe.ts src/lib/canvas/wireframe.test.ts
git commit -m "feat(canvas): add pure hexagonal-wireframe geometry and projection"
```

---

## Task 2: TypeOut typewriter component

**Files:**
- Create: `src/components/text/TypeOut.tsx`
- Test: `src/components/text/TypeOut.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/text/TypeOut.test.tsx` (mocks mirror `ScrambleTextAnimated.test.tsx`):

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TypeOut } from './TypeOut'

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

describe('TypeOut', () => {
  it('exposes the real text to assistive tech from first paint', () => {
    render(<TypeOut text="An agentic operating system." />)
    expect(screen.getByText('An agentic operating system.')).toBeInTheDocument()
  })

  it('keeps the real text in the DOM even while typing', () => {
    const { container } = render(<TypeOut text="AI voice agents." />)
    expect(container.textContent).toContain('AI voice agents.')
  })

  it('hides the animated layer from assistive tech', () => {
    const { container } = render(<TypeOut text="Typed copy." />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('renders the requested element type', () => {
    render(<TypeOut as="p" text="Paragraph." />)
    expect(screen.getByText('Paragraph.').closest('p')).toBeTruthy()
  })

  it('renders plain text with no animated layer under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<TypeOut text="Plain copy." />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(container.textContent).toBe('Plain copy.')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/text/TypeOut.test.tsx`
Expected: FAIL — `Failed to resolve import './TypeOut'`.

- [ ] **Step 3: Write the implementation**

Create `src/components/text/TypeOut.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, type ElementType, type Ref } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'
import { useOnScreen } from '@/lib/motion/useOnScreen'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Milliseconds for the full type-out. */
  durationMs?: number
  /** Wait this long after entering view before typing (lets a panel slide in first). */
  startDelayMs?: number
  onDone?: () => void
}

/**
 * Types a string out character by character when it scrolls into view.
 *
 * Same a11y shape as ScrambleTextAnimated, and it is not negotiable: the real
 * string sits in an always-present `sr-only` span (accessible name + indexed text
 * from first paint); the visible, growing prefix and the cursor live in a separate
 * `aria-hidden` layer. Under reduced motion this renders exactly one plain text
 * node — no cursor, no timer, no observer.
 */
export function TypeOut({
  text,
  as: Tag = 'span',
  className,
  durationMs = 1100,
  startDelayMs = 150,
  onDone,
}: Props) {
  const reduced = usePrefersReducedMotion()
  const { ref, seen } = useOnScreen<HTMLElement>()
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduced || !seen || done) return
    const t0 = performance.now() + startDelayMs
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / durationMs))
      setCount(Math.floor(text.length * p))
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCount(text.length)
        setDone(true)
        onDone?.()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [reduced, seen, done, text, durationMs, startDelayMs, onDone])

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag ref={ref as Ref<Element>} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, count)}
        {!done && <span className="opacity-60">▍</span>}
      </span>
    </Tag>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/text/TypeOut.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/text/TypeOut.tsx src/components/text/TypeOut.test.tsx
git commit -m "feat(text): add TypeOut typewriter with a11y-safe accessible name"
```

---

## Task 3: Animate the system record (name, domain, summary)

**Files:**
- Modify: `src/components/record/SystemRecord.tsx`
- Test: `src/components/record/SystemRecord.test.tsx`

- [ ] **Step 1: Update the test — add mocks and animated-path assertions**

Replace `src/components/record/SystemRecord.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemRecord } from './SystemRecord'
import type { System } from '@/content/schema'

const live: System = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  sector: 'Conversational AI',
  region: 'US',
  engagement: 'Client contract',
  year: 2025,
  role: 'Architecture + led a small team · freelance contract',
  stack: ['Twilio', 'OpenAI'],
  summary: 'AI voice agents.',
  url: 'https://aivachat.io/',
  status: 'LIVE',
  featured: true,
}

const priv: System = { ...live, slug: 'mof', name: 'MOF', status: 'PRIVATE', url: undefined }

// Exercise the ANIMATED path: without these stubs jsdom has no matchMedia, so the
// components fall back to reduced-motion (plain text) and the animated wiring goes
// untested. matches:false = motion allowed; IO fires immediately so the decode/type
// mounts its aria-hidden layers.
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

describe('SystemRecord', () => {
  it('renders name, domain, role, and year', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText(/led a small team/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it('keeps the name as accessible text even while it decodes', () => {
    const { container } = render(<SystemRecord system={live} index={0} />)
    // real name lives in an sr-only span; the decorative decode is aria-hidden.
    expect(container.querySelector('.sr-only')?.textContent).toContain('AIVA Chat')
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('keeps the summary as accessible text while it types out', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AI voice agents.')).toBeInTheDocument()
  })

  it('renders each stack entry', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('Twilio')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
  })

  it('links out to a LIVE system, opening safely in a new tab', () => {
    render(<SystemRecord system={live} index={0} />)
    const link = screen.getByRole('link', { name: /aivachat\.io/i })
    expect(link).toHaveAttribute('href', 'https://aivachat.io/')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders no outbound link for a PRIVATE system', () => {
    render(<SystemRecord system={priv} index={1} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/PRIVATE/)).toBeInTheDocument()
  })

  it('renders a 1-based padded record number', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText(/RECORD 01/)).toBeInTheDocument()
  })

  it('marks an own product as such, never as a contract', () => {
    const own: System = { ...live, engagement: 'Own product', role: 'Own product · built and operated under Woyce Tech' }
    render(<SystemRecord system={own} index={0} />)
    expect(screen.getByText(/Own product/)).toBeInTheDocument()
  })

  it('renders name, domain, and summary as plain text under reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((q: string) => ({
      matches: true, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const { container } = render(<SystemRecord system={live} index={0} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText('AI voice agents.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/record/SystemRecord.test.tsx`
Expected: FAIL — the new assertions (`.sr-only` for the name, `aria-hidden` layer) fail because `SystemRecord` still uses the plain `ScrambleText` stub and a plain `<p>` summary.

- [ ] **Step 3: Write the implementation**

Replace `src/components/record/SystemRecord.tsx` with:

```tsx
import type { System } from '@/content/schema'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
import { TypeOut } from '@/components/text/TypeOut'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export function SystemRecord({
  system,
  index,
  seedBase = 0,
}: {
  system: System
  index: number
  /** Varies the decode noise between records so adjacent ones don't shimmer in sync. */
  seedBase?: number
}) {
  const num = String(index + 1).padStart(2, '0')
  const host = system.url ? new URL(system.url).hostname.replace(/^www\./, '') : null

  return (
    <article className="relative border border-[var(--color-border)] bg-[var(--color-panel)]/60 px-7 py-7 md:px-8">
      <div className={LABEL}>RECORD {num}</div>

      <ScrambleTextAnimated
        as="h2"
        text={system.name}
        seed={seedBase * 10 + 1}
        className="mt-3 font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]"
      />

      {/*
        A grid with a fixed label column, not flex rows: the whole conceit is a
        machine-tabulated record, and ragged columns read as sloppy. Values align
        because the column is declared, not because the labels happen to be a
        similar length.
      */}
      <dl className="mt-5 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
        <dt className={LABEL}>DOMAIN</dt>
        <dd className={LABEL}>
          <ScrambleTextAnimated text={`${system.domain} · ${system.region}`} seed={seedBase * 10 + 2} />
        </dd>

        <dt className={LABEL}>ROLE</dt>
        <dd className={LABEL}>{system.role}</dd>

        <dt className={LABEL}>YEAR</dt>
        <dd className={LABEL}>{system.year}</dd>
      </dl>

      <TypeOut
        as="p"
        text={system.summary}
        className="mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]"
      />

      <ul className="mt-5 flex flex-wrap gap-2">
        {system.stack.map((t) => (
          <li
            key={t}
            className="border border-[var(--color-border)] px-2 py-1 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]"
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {system.url && host ? (
          <a
            href={system.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-ink)] underline underline-offset-4"
          >
            ▸ {host}
          </a>
        ) : (
          <span className={LABEL}>STATUS: PRIVATE · NOT PUBLICLY LINKABLE</span>
        )}
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/record/SystemRecord.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/record/SystemRecord.tsx src/components/record/SystemRecord.test.tsx
git commit -m "feat(record): decode the name/domain and type out the summary"
```

---

## Task 4: Per-record reveal + scrambled Systems heading

**Files:**
- Modify: `src/components/sections/Systems.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/components/sections/Systems.test.tsx`

- [ ] **Step 1: Update the test — mock gsap + motion, keep name assertions**

Replace `src/components/sections/Systems.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Systems } from './Systems'
import { getFeatured } from '@/content'

// Systems now wraps each record in <Reveal>, which imports gsap + ScrollTrigger.
// jsdom can't drive a real ScrollTrigger, so mock it (same shape as Reveal.test.tsx).
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }))
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })), update: vi.fn() },
}))

// Motion allowed + IO fires, so the scrambled heading/names mount their sr-only layer.
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

describe('Systems', () => {
  it('renders 6 featured systems as records with distinct names', () => {
    render(<Systems />)
    const featured = getFeatured()
    expect(featured.length).toBe(6)
    const names = new Set(featured.map((s) => s.name))
    expect(names.size).toBe(6)
    for (const name of names) {
      // each name is the accessible (sr-only) text of its record's decode layer.
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders the systems heading as a decode layer, keeping the real text accessible', () => {
    render(<Systems />)
    // After the swap the heading is ScrambleTextAnimated: the real text lives in an
    // sr-only span. Against the old plain <h2> this element has no sr-only class.
    expect(screen.getByText('NODE: SYSTEMS')).toHaveClass('sr-only')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Systems.test.tsx`
Expected: FAIL — the heading test fails because the current `Systems.tsx` renders a plain `<h2>NODE: SYSTEMS</h2>` (no `sr-only`). The `vi.mock('gsap')` line is also what makes the *edited* component (which imports `Reveal` → gsap) renderable in jsdom at all.

- [ ] **Step 3: Write the implementation**

Replace `src/components/sections/Systems.tsx` with:

```tsx
import { getFeatured, recordNumber } from '@/content'
import { SystemRecord } from '@/components/record/SystemRecord'
import { Reveal } from '@/components/motion/Reveal'
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'

const HEADING = 'font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]'

/**
 * Beat 04 — six featured systems. Each record is wrapped in its OWN Reveal so the
 * six slide in one after another as the reader scrolls through them (each Reveal
 * owns a ScrollTrigger at `top 85%`), rather than the whole block appearing at
 * once. page.tsx therefore no longer wraps this section in a single Reveal.
 *
 * `recordNumber(slug) - 1` is the real catalogue index across all 18 systems, NOT
 * this filtered list's position — see recordNumber's own doc. `seedBase` varies the
 * decode noise per record.
 */
export function Systems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <ScrambleTextAnimated as="h2" text="NODE: SYSTEMS" className={HEADING} />

      <div className="mt-10 space-y-8">
        {getFeatured().map((s, i) => (
          <Reveal key={s.slug}>
            <SystemRecord system={s} index={recordNumber(s.slug) - 1} seedBase={i + 1} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Systems.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Stop double-wrapping Systems in page.tsx**

In `src/app/page.tsx`, replace:

```tsx
            <Reveal delayMs={100}>
              <Systems />
            </Reveal>
```

with:

```tsx
            {/* Systems reveals per-record internally (see Systems.tsx), so it is
                not wrapped in a single section-level Reveal. */}
            <Systems />
```

- [ ] **Step 6: Verify the page still type-checks and the full unit suite is green**

Run: `npx vitest run`
Expected: PASS (all suites).

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/Systems.tsx src/components/sections/Systems.test.tsx src/app/page.tsx
git commit -m "feat(home): stagger system records with per-record reveal"
```

---

## Task 5: Widen scramble reach (headings, identity, archive)

**Files:**
- Modify: `src/components/sections/Trajectory.tsx`
- Modify: `src/components/sections/Telemetry.tsx`
- Modify: `src/components/sections/ArchiveIndex.tsx`
- Modify: `src/components/sections/Uplink.tsx`
- Modify: `src/components/sections/Identity.tsx`

> No new unit tests: the decode engine is already covered by `ScrambleTextAnimated.test.tsx`, and each section's existing `*.test.tsx` asserts its text is present — which stays true because the real string is always the `sr-only` accessible text (and jsdom's reduced-motion fallback renders it plain). The wiring is verified by keeping those suites green (Step 6) plus the e2e in Task 8.

- [ ] **Step 1: Scramble the `NODE:` heading in `Trajectory.tsx`**

Add the import after the existing content import:

```tsx
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
```

Replace `<h2 className={HEADING}>NODE: TRAJECTORY</h2>` with:

```tsx
      <ScrambleTextAnimated as="h2" text="NODE: TRAJECTORY" className={HEADING} />
```

- [ ] **Step 2: Scramble the `NODE:` heading in `Telemetry.tsx`**

Add the import after the existing content import:

```tsx
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
```

Replace `<h2 className={HEADING}>NODE: TELEMETRY</h2>` with:

```tsx
      <ScrambleTextAnimated as="h2" text="NODE: TELEMETRY" className={HEADING} />
```

- [ ] **Step 3: Scramble the heading AND the row names in `ArchiveIndex.tsx`**

Add the import after the existing imports:

```tsx
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
```

Replace `<h2 className={HEADING}>NODE: ARCHIVE INDEX</h2>` with:

```tsx
      <ScrambleTextAnimated as="h2" text="NODE: ARCHIVE INDEX" className={HEADING} />
```

Replace the row-name span:

```tsx
              <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
                {s.name}
              </span>
```

with:

```tsx
              <ScrambleTextAnimated
                text={s.name}
                seed={recordNumber(s.slug)}
                className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]"
              />
```

- [ ] **Step 4: Scramble the `NODE:` heading in `Uplink.tsx`**

Add the import after the existing content import:

```tsx
import { ScrambleTextAnimated } from '@/components/text/ScrambleTextAnimated'
```

Replace `<h2 className={HEADING}>NODE: UPLINK</h2>` with:

```tsx
      <ScrambleTextAnimated as="h2" text="NODE: UPLINK" className={HEADING} />
```

- [ ] **Step 5: Scramble the `// IDENTITY` label and the stat line in `Identity.tsx`**

`ScrambleTextAnimated` is already imported in `Identity.tsx`.

Replace `<div className={LABEL}>{'// IDENTITY'}</div>` with:

```tsx
      <ScrambleTextAnimated as="div" text="// IDENTITY" className={LABEL} seed={1} />
```

Replace the stat-line div:

```tsx
      <div className={`${LABEL} mt-1`}>
        {yearsExperience()} YRS · {countSystems()} SYSTEMS · {countSectors()} SECTORS ·{' '}
        {countClientRegions()} CLIENT REGIONS
      </div>
```

with:

```tsx
      <ScrambleTextAnimated
        as="div"
        seed={2}
        text={`${yearsExperience()} YRS · ${countSystems()} SYSTEMS · ${countSectors()} SECTORS · ${countClientRegions()} CLIENT REGIONS`}
        className={`${LABEL} mt-1`}
      />
```

- [ ] **Step 6: Run the full unit suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS (all suites — every section still exposes its heading/name text).

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/Trajectory.tsx src/components/sections/Telemetry.tsx src/components/sections/ArchiveIndex.tsx src/components/sections/Uplink.tsx src/components/sections/Identity.tsx
git commit -m "feat(sections): decode headings, identity stats, and archive names"
```

---

## Task 6: Wireframe centerpiece — WebGL renderer

**Files:**
- Modify: `src/components/canvas/RendererWebGL.tsx`

> No unit test: the WebGL draw path needs a GL context jsdom doesn't provide (the existing `RendererWebGL.tsx` has no unit test for the same reason). The geometry/projection math is covered by Task 1; appearance is verified visually in Step 3 and in Task 8.

- [ ] **Step 1: Add the centerpiece to the WebGL scene**

In `src/components/canvas/RendererWebGL.tsx`:

Add imports near the top (after the existing `simulation`/`useRafLoop` imports):

```tsx
import { hexBipyramid, rotateProject } from '@/lib/canvas/wireframe'
```

Add module-scope constants next to `LINK_DIST` / `INK`:

```tsx
const WIRE = hexBipyramid()
const WIRE_TILT = 0.4 // fixed X tilt so the crystal reads as 3D
const WIRE_SPIN = 0.0002 // rad/ms on Y ≈ one revolution / ~30s
const WIRE_SCALE = 0.18 // of min(w, h)
```

Extend the `stateRef` object type to carry the wireframe line object and a spin accumulator — change the `stateRef` generic to:

```tsx
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.OrthographicCamera
    points: THREE.Points
    lines: THREE.LineSegments
    wire: THREE.LineSegments
    field: Particle[]
    spin: number
    w: number
    h: number
  } | null>(null)
```

After the `lines` `LineSegments` is created (before `scene.add(points, lines)`), add the wireframe object:

```tsx
    const wireGeo = new THREE.BufferGeometry()
    // 18 edges × 2 endpoints × 3 floats
    wireGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WIRE.edges.length * 6), 3))
    const wire = new THREE.LineSegments(
      wireGeo,
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.28 }),
    )
```

Change `scene.add(points, lines)` to:

```tsx
    scene.add(points, lines, wire)
```

In the `resize` function, include the new fields when it writes `stateRef.current` (it currently sets `{ renderer, scene, camera, points, lines, field, w, h }`):

```tsx
      stateRef.current = { renderer, scene, camera, points, lines, wire, field, spin: stateRef.current?.spin ?? 0, w, h }
```

In the cleanup return, dispose the wireframe too (alongside the existing disposes):

```tsx
      wireGeo.dispose()
      ;(wire.material as THREE.Material).dispose()
```

At the end of the `useRafLoop` callback, after the constellation lines are updated and before `s.renderer.render(...)`, drive and draw the centerpiece:

```tsx
    // Centerpiece: rotate on the CPU (same math the 2D renderer uses) and write the
    // projected edges as z=0 segments — consistent with how the field is drawn, and
    // inside the ortho camera's near/far.
    s.spin += WIRE_SPIN * dt
    const scale = Math.min(s.w, s.h) * WIRE_SCALE
    const pts = rotateProject(WIRE.vertices, WIRE_TILT, s.spin, scale, s.w / 2, s.h / 2)
    const wpos = s.wire.geometry.getAttribute('position') as THREE.BufferAttribute
    let wi = 0 // endpoint write index — not to be confused with s.w (width)
    for (const [i, j] of WIRE.edges) {
      wpos.setXYZ(wi++, pts[i].x, pts[i].y, 0)
      wpos.setXYZ(wi++, pts[j].x, pts[j].y, 0)
    }
    wpos.needsUpdate = true
```

- [ ] **Step 2: Verify it builds and unit tests are unaffected**

Run: `npx vitest run src/lib/canvas`
Expected: PASS (wireframe + simulation + useDeviceTier suites).

- [ ] **Step 3: Visual verification (WebGL)**

Start the dev server (`npm run dev`), open `/`, dismiss the gate (`OFF`) + boot (`SKIP`), and confirm a **slowly-rotating hexagonal wireframe** sits centered on screen, in front of the particle field, in the same grey ink. Capture a screenshot of `/` for the record (see commit `bd47351` for the canvas screenshot-verification approach).
Expected: centered rotating hex "crystal" over the constellation; no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/RendererWebGL.tsx
git commit -m "feat(canvas): draw the hexagonal wireframe centerpiece (WebGL)"
```

---

## Task 7: Wireframe centerpiece — 2D fallback

**Files:**
- Modify: `src/components/canvas/Renderer2D.tsx`

- [ ] **Step 1: Draw the centerpiece on the 2D canvas**

In `src/components/canvas/Renderer2D.tsx`:

Add imports (after the existing `simulation`/`useRafLoop` imports):

```tsx
import { hexBipyramid, rotateProject } from '@/lib/canvas/wireframe'
```

Add module-scope constants next to `LINK_DIST` / `INK`:

```tsx
const WIRE = hexBipyramid()
const WIRE_TILT = 0.4
const WIRE_SPIN = 0.0002
const WIRE_SCALE = 0.18
```

Add a spin accumulator ref next to the existing refs (`canvasRef`, `fieldRef`, `sizeRef`):

```tsx
  const spinRef = useRef(0)
```

At the end of the `useRafLoop` callback, after the particle points are drawn and `ctx.globalAlpha = 1` is restored, draw the centerpiece:

```tsx
    // Centerpiece: same geometry + projection as the WebGL renderer.
    spinRef.current += WIRE_SPIN * dt
    const scale = Math.min(w, h) * WIRE_SCALE
    const pts = rotateProject(WIRE.vertices, WIRE_TILT, spinRef.current, scale, w / 2, h / 2)
    ctx.globalAlpha = 0.28
    ctx.strokeStyle = INK
    ctx.beginPath()
    for (const [i, j] of WIRE.edges) {
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[j].x, pts[j].y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
```

- [ ] **Step 2: Verify unit tests are unaffected**

Run: `npx vitest run src/lib/canvas`
Expected: PASS.

- [ ] **Step 3: Visual verification (2D fallback)**

Temporarily force the 2D path to confirm parity: in `useDeviceTier.ts`'s `hasWebGL` you can return `false` locally (or test in a browser with WebGL disabled), run the dev server, and confirm the same centered rotating hex wireframe appears on the 2D canvas. **Revert any local forcing before committing.**
Expected: identical centered hex crystal via the 2D renderer.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/Renderer2D.tsx
git commit -m "feat(canvas): draw the hexagonal wireframe centerpiece (2D fallback)"
```

---

## Task 8: End-to-end motion checks + full verification

**Files:**
- Create: `tests/e2e/motion.spec.ts`

- [ ] **Step 1: Write the e2e spec**

Create `tests/e2e/motion.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

// Dismisses the gate + boot so the scroll experience is what a visitor sees.
async function enter(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /OFF/i }).click()
  await page.getByRole('button', { name: /SKIP/i }).click()
  await expect(page.getByText(/LOADING/i)).toHaveCount(0)
}

test.describe('per-record reveal', () => {
  test('a below-the-fold record starts hidden and reveals on scroll', async ({ page }) => {
    await enter(page)

    // The last featured record ("Health Wealth Safe") is well below the fold. Its
    // Reveal wrapper is the article's parent; before scrolling it is opacity 0.
    const wrapper = page.locator('div:has(> article:has-text("Health Wealth Safe"))').first()
    const before = await wrapper.evaluate((el) => Number(getComputedStyle(el).opacity))
    expect(before).toBeLessThan(0.5)

    await page.getByRole('heading', { name: 'Health Wealth Safe' }).scrollIntoViewIfNeeded()
    // ScrollTrigger fires at top 85% and the wrapper transitions to opacity 1.
    await expect
      .poll(async () => wrapper.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 3000 })
      .toBeGreaterThan(0.9)
  })
})

test.describe('reduced motion gets full record content', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('a record shows its full summary with no animated layer', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Full content present and, under reduced motion, no decode/type noise layer
    // anywhere in the systems section.
    const record = page.locator('article:has-text("AIVA Chat")')
    await expect(record).toBeVisible()
    await expect(record.getByText(/agents/i)).toBeVisible()
    expect(await record.locator('[aria-hidden="true"]').count()).toBe(0)
  })
})

test.describe('the animated canvas', () => {
  test('is present on / (constellation + centerpiece)', async ({ page }) => {
    await enter(page)
    expect(await page.locator('canvas').count()).toBeGreaterThan(0)
  })

  test('is absent under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Reduced motion → tier 'none' → Constellation renders nothing.
    expect(await page.locator('canvas').count()).toBe(0)
    await context.close()
  })
})
```

- [ ] **Step 2: Run the e2e spec**

Run: `npx playwright test tests/e2e/motion.spec.ts`
Expected: PASS (4 tests). If the reveal-opacity selector is flaky, confirm the wrapper selector matches the `Reveal` div (the direct parent of `<article>`); adjust the `:has()` selector only, not the assertion.

- [ ] **Step 3: Full verification sweep**

Run each and confirm green:

```bash
npx vitest run          # all unit suites
npx playwright test     # all e2e (entry, routes, motion)
npm run build           # includes the prebuild content zod-validation tests
```

Expected: all pass; build completes. Fix any failure before proceeding (systematic-debugging skill if needed).

- [ ] **Step 4: Final visual confirmation**

With `npm run dev` running, walk `/` end to end: gate → boot → hero decode → per-record slide+type through all six systems → scrambled headings → archive names decoding → centered rotating hex wireframe over the constellation throughout. Confirm no horizontal scroll at 375px and no console errors.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/motion.spec.ts
git commit -m "test(e2e): cover per-record reveal, reduced-motion records, canvas presence"
```

---

## Self-review notes (author)

- **Spec coverage:** Effect 1 → Tasks 3–4; Effect 2 → Task 5 (+ record name/domain in Task 3); Effect 3 → Tasks 1, 6, 7. Contracts (a11y/reduced-motion/perf/SSR) enforced per task and in Task 8. Non-goals (Telemetry map, scroll-linked rotation, per-field typewriter) are untouched.
- **Type consistency:** `hexBipyramid()`/`rotateProject()` signatures match between Task 1 and Tasks 6–7; `seedBase` optional prop is defined in Task 3 and passed in Task 4; `stateRef` shape in Task 6 adds `wire`/`spin` consistently across create/resize/loop/cleanup.
- **Tunables (spec §10):** `WIRE_TILT/SPIN/SCALE`, decode `durationMs`, `TypeOut` `durationMs/startDelayMs`, and the cursor glyph `▍` are all set to defaults here; adjust against the running site in Task 8 Step 4. Archive-index scramble volume is the one to dial back (drop Task 5 Step 3's row-name change) if it reads busy.
```
