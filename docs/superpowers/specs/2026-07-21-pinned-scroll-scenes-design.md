# MOTION — Pinned Scroll-Scrubbed Scenes

**Date:** 2026-07-21
**Subject:** Shyamsinh Parmar — portfolio (`/`)
**Reference:** https://to-portfolio.com/ (motion *feel* only; no code or content reuse)
**Builds on:** [2026-07-17-archive-portfolio-design.md](2026-07-17-archive-portfolio-design.md) ·
[2026-07-20-motion-and-centerpiece-design.md](2026-07-20-motion-and-centerpiece-design.md)

---

## 1. Goal

Turn the homepage scroll from a stack of one-shot fade-in sections into a **sequence of
pinned, scroll-scrubbed scenes**: as the reader scrolls into each beat, it holds the
viewport and its content *assembles* — driven by scroll progress, not a timer — then
releases so the next beat scrolls up to take its place.

Each scene assembles using all three of the site's existing motion languages, layered:

1. **Per-line decode** — labels/short strings resolve from glyph-noise into text, the
   `scramble.ts` engine driven by scroll progress instead of a one-shot `useOnScreen` timer.
2. **Mask / clip wipe** — headings and blocks wipe up from behind a clip edge.
3. **Spatial assembly** — body lines rise into place from an offset and HUD accents draw
   themselves (corner brackets extend, Telemetry crosshair locks on, world-map dots resolve).

This is a **motion-layer change only**. No copy, records, palette, sections, boot, or gate
change. Every accessibility and SSR contract from the prior two specs is preserved by
construction (§7).

## 2. Current state (what exists)

- **`Reveal`** (`components/motion/Reveal.tsx`) wraps each beat in `page.tsx` and fades +
  slides it up 8px **once** as it crosses `top 85%` (`useReveal` → one `ScrollTrigger`,
  `once: true`). Reduced motion renders children with **no wrapper at all**.
- **`Systems.tsx`** wraps each of six records in its **own** `Reveal` so they stagger in.
- **`ScrambleTextAnimated`** + **`TypeOut`** decode/type on a `useOnScreen` latch (once), on a
  `performance.now()` rAF. Real string is always an `sr-only` node; noise is `aria-hidden`.
  Reduced motion → one plain text node, no observer, no timer.
- **`scramble.ts`** — `scrambleFrame` (deterministic, tested) is the shared decode engine;
  it already maps a progress value to a partially-decoded string.
- **Lenis** (`lib/scroll/useLenis.ts`) — smooth scroll on `/` only, **disabled under reduced
  motion**. Runs its **own** `requestAnimationFrame` loop and does **not** bridge to
  `ScrollTrigger.update`. Fine for one-shot reveals (window scroll is native); insufficient
  for scrub (§5).
- **Centerpiece** — `pointer.ts` computes `scrollProgress = scrollY / (scrollHeight − viewH)`
  live on its own passive `scroll` listener; `wireframe.ts` maps 0→1 to Y-rotation
  (`WIRE_SCROLL_TURN = 2π`) and zoom (`WIRE_ZOOM = 0.22`).
- **`HudFrame`** — `fixed` chrome (brackets `z-20`, label/uplink/readout `z-30`); content in
  `<div class="relative z-10">`; sections in `<main class="mx-auto max-w-3xl px-6">`.
- **e2e contract** (`tests/e2e/motion.spec.ts`) asserts: a below-fold record starts
  `opacity < 0.5` and reveals on scroll; reduced motion shows full record content with **no**
  `aria-hidden` layer; **no `fixed` canvas** under reduced motion.

## 3. Non-goals

- **No content / copy / record / palette changes.** Same eight beats, same text.
- **No new sections**, no career/timeline "RECORD_LOG" beat (that was a different option).
- **No horizontal scroll**, no cross-beat master timeline (Approach B was rejected), no
  perspective camera or new 3D geometry.
- **No change to the gate or boot sequence.** Scenes initialize *after* boot dismiss (§6.5).
- **No forced pinning on touch.** Touch/narrow degrades to today's one-shot reveal (§6.3).

## 4. The `Scene` component (Approach C)

`Scene` **replaces** the per-beat `Reveal` in `page.tsx`. It is a `'use client'` wrapper
around **already-server-rendered** children (identical SSR posture to `Reveal` — the section
component is resolved in `page.tsx`'s server tree and passed in as a prop; `Scene` never
pulls it onto the client). It selects one of **three modes** and never gates content:

```tsx
<Scene id="identity" length={0.8}>
  <Identity />
</Scene>
```

### 4.1 Mode selection — one pure function

```ts
// src/lib/motion/sceneMode.ts   (pure, unit-tested)
export type SceneMode = 'static' | 'reveal' | 'scrub'
export function pickSceneMode(reduced: boolean, coarseOrNarrow: boolean): SceneMode {
  if (reduced) return 'static'          // guardrail #1 — full content, no motion at all
  if (coarseOrNarrow) return 'reveal'   // mobile/touch fallback — today's one-shot reveal
  return 'scrub'                        // full experience — pin + scrubbed assembly
}
```

- **`static`** (reduced motion, no-JS/SSR default): render `<>{children}</>` with **no
  wrapper, no ref, no ScrollTrigger, no timeline** — the exact `Reveal` reduced branch. Full
  content from first paint.
- **`reveal`** (touch OR viewport < breakpoint, not reduced): behave **exactly like today's
  `Reveal`** — one-shot fade + 8px slide via the existing `useReveal`. **No pin.** This is the
  confirmed graceful mobile fallback; pin+scrub on touch is where the pattern turns janky.
- **`scrub`** (pointer + ≥ breakpoint, not reduced): pin the section and run a scrubbed
  timeline built from its registered layers (§4.2, §5).

`coarseOrNarrow` = `matchMedia('(pointer: coarse)').matches || innerWidth < BREAKPOINT`
(BREAKPOINT ≈ 768, tunable). Read via a small `useSceneMode()` hook over the existing
`usePrefersReducedMotion` pattern; the pure `pickSceneMode` is what unit tests target.

### 4.2 Layers register with the Scene

Inside a Scene, the elements that should animate are wrapped in three tiny layer primitives
that register themselves with the parent Scene via React context (element + kind + DOM/explicit
order). The Scene builds **one** `gsap.timeline()` from the ordered registrations. Sections
keep their current markup; we only wrap the elements that move — the same "add motion around
SSR content" philosophy `Reveal` already uses, applied at element granularity.

| Primitive | `scrub` mode (driven by timeline progress) | `static` / `reveal` mode |
| --- | --- | --- |
| `<DecodeLine text=…>` | `scramble.ts` maps the tween's 0→1 to a decoding prefix; a11y layer identical to `ScrambleTextAnimated` (real `sr-only` string + `aria-hidden` noise) | **one plain text node** — no noise layer (mirrors `ScrambleTextAnimated`'s reduced branch; satisfies the "no `aria-hidden` layer" e2e) |
| `<MaskWipe>` | `clip-path` inset animates full→0 with a small translateY (wipes up from behind an edge) | children, **no clip, no transform** (final state) |
| `<Rise offset=…>` | translateY(offset)+opacity 0 → settled, staggered after the wipe | children, final state |

Section-specific **spatial accents** (Telemetry crosshair lock-on, world-map dot resolve,
corner-bracket extension) subscribe to the Scene's live progress the same way — the component
reads a `0..1` value from Scene context and drives its own draw (e.g. `stroke-dashoffset`),
instead of its current mount-time animation. In `static`/`reveal` they render fully drawn.

### 4.3 Assembly order within a beat

Default sequence along the pin's `0..1`: HUD label **decodes** (0–0.25) → heading
**mask-wipes** up (0.15–0.5) → body lines **rise + decode** in a tight overlapping stagger
(0.35–0.85) → HUD accents **draw** (0.7–1.0). Overlaps are deliberate so it reads as one
assembly, not four steps. Exact keyframes are tunable per beat and **not load-bearing**.

## 5. Scroll engine — Lenis ↔ ScrollTrigger bridge

Scrubbed pins must track the smoothed scroll frame-perfectly, so `useLenis` (full-motion
branch only; reduced still returns early and mounts nothing) changes from its standalone rAF
to driving Lenis from GSAP's ticker and updating ScrollTrigger on every Lenis scroll:

```ts
gsap.registerPlugin(ScrollTrigger)
const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
const onTick = (time: number) => lenis.raf(time * 1000) // gsap.ticker seconds → Lenis ms
gsap.ticker.add(onTick)
gsap.ticker.lagSmoothing(0)
return () => { gsap.ticker.remove(onTick); lenis.destroy() }
```

- **`pinType: 'fixed'`** (ScrollTrigger default) is correct: Lenis animates the real
  `window.scrollTo`, so pins pin against a genuinely-scrolled window — no `scrollerProxy`.
- **Refresh coordination:** call `ScrollTrigger.refresh()` after the boot overlay dismisses
  and after the `dynamic(ssr:false)` canvas attaches, so pin start/end are measured against
  the settled layout (§6.5). GSAP already refreshes on resize.

## 6. Interactions & tuning

### 6.1 Pinning inside the centered column
GSAP wraps each pinned `<section>` in a pin-spacer that preserves its width, so the
`max-w-3xl` centering and `px-6` gutters are unaffected. The `fixed` HUD chrome is outside
`<main>` and untouched. Content stays at `z-10`, below the `z-20/30` chrome, as today.

### 6.2 Pacing / page length (confirmed: ~1 viewport per beat)
Each scene pins for roughly **one viewport of scroll** (`length` = viewport multiples,
default `1`), tuned per beat. Suggested starting lengths:

| Beat | `length` | Rationale |
| --- | --- | --- |
| Identity | 0.8 | hero, few lines |
| Trajectory | 1.0 | — |
| Systems | 2.0–2.5 | six records assemble in sequence across the pin (replaces the old per-record `Reveal`s) |
| Stack | 0.7 | text-light |
| Telemetry | 1.2 | map + crosshair lock-on wants room |
| ArchiveIndex | 1.0 | — |
| Uplink | 0.8 | closing beat |

Net page height grows to the sum of pins (~8 viewports of deliberate scroll). This length is
**inherent** to "every section pinned" and was accepted as a deliberate trade.

### 6.3 Mobile / touch (confirmed: graceful fallback)
`reveal` mode: no pins, no scrub — the existing one-shot fade+slide. Content and pacing on
touch are exactly today's, so nothing regresses on phones.

### 6.4 Centerpiece
`pointer.ts` keeps working unchanged: pin-spacers are part of `scrollHeight`, so
`scrollProgress` still spans 0→1 across the whole (taller) journey. Because the page is now
~8× longer, retune `WIRE_SCROLL_TURN` (e.g. to a few full turns) and `WIRE_ZOOM` so the
crystal's rotation reads across the scroll instead of crawling. Cosmetic, tunable, non-blocking.

### 6.5 Boot / gate
`EntryOverlay` already always renders children, so section layout exists before dismiss, but
scroll is locked during boot. Scenes create their ScrollTriggers on mount and call
`ScrollTrigger.refresh()` once boot dismisses (and once the canvas mounts) so pin positions
are measured against the real, unlocked layout.

## 7. Contracts preserved (unchanged from the codebase)

- **A11y:** every animated string is real text in the DOM from first paint; all noise / clip
  / transform is `aria-hidden` or purely visual. **Reduced motion → `static` mode:** full
  content, no pin, no timeline, no observers, no timers, no noise layer.
- **No-JS / crawler:** sections are server-rendered; `Scene` only wraps them. Full content
  without JS, identical to `Reveal` today.
- **Performance:** one timeline per beat, all driven by the single shared Lenis/`gsap.ticker`
  loop — no per-element scroll listeners. Canvas res/tier and hidden-tab pause unchanged.
- **Addressability:** in-page anchors and `ArchiveIndex` links still resolve; a jump to a
  pinned section lands at its pin start (§10.5).

## 8. Files

| File | Change |
| --- | --- |
| `src/lib/motion/sceneMode.ts` | **new** — pure `pickSceneMode` + `SceneMode` type |
| `src/lib/motion/useSceneMode.ts` | **new** — reduced + pointer/width → `SceneMode` |
| `src/lib/motion/useScene.ts` | **new** — pin+scrub ScrollTrigger, timeline build from registered layers, refresh coordination |
| `src/components/motion/Scene.tsx` | **new** — the three-mode wrapper + layer-registration context |
| `src/components/motion/layers/DecodeLine.tsx` · `MaskWipe.tsx` · `Rise.tsx` | **new** — layer primitives (scrub-driven; static/reveal → final state) |
| `src/lib/scroll/useLenis.ts` | bridge Lenis → `ScrollTrigger.update` + `gsap.ticker` (replace standalone rAF) |
| `src/app/page.tsx` | wrap each beat in `Scene` (with per-beat `length`) instead of `Reveal` |
| `src/components/sections/*` | annotate animating elements with layer primitives; `Systems` assembles records across one pin |
| `src/components/sections/Telemetry.tsx` + map canvas | crosshair/dots subscribe to Scene progress |
| `src/lib/canvas/wireframe.ts` | retune `WIRE_SCROLL_TURN` / `WIRE_ZOOM` for the longer page (cosmetic) |
| `src/components/motion/Reveal.tsx` / `useReveal.ts` | **kept** — reused as the `reveal`-mode fallback |

## 9. Testing (TDD)

**Vitest (pure / component logic):**
- `pickSceneMode` — `reduced → static`; `!reduced && coarseOrNarrow → reveal`;
  `!reduced && !coarseOrNarrow → scrub`.
- Layer registration + ordering — layers register with the Scene and yield a timeline
  sequenced by order (gsap mocked/spied); no registration in `static` mode.
- `DecodeLine` — `static`/`reveal` renders exactly one plain text node (no `aria-hidden`
  layer); scrub mapping produces the expected decoded prefix for a given progress via
  `scramble.ts` (deterministic).
- `MaskWipe` / `Rise` — `static`/`reveal` render children with no clip/transform (final state).

**Playwright (the paths that matter):**
- **Pin:** scrolling into a beat holds its top at the viewport top across a scroll range.
- **Scrub reveal:** an element inside a below-fold beat starts hidden and becomes visible as
  you scroll through the pin.
- **Reduced motion (`static`):** full content for every beat, no pinned/`fixed` section, no
  `aria-hidden` noise layer, no `fixed` canvas — the existing contract, extended to Scene.
- **Touch (`reveal`):** with a coarse-pointer/narrow context, sections are **not** pinned but
  content still reveals (one-shot).
- **Update** the existing per-record reveal test to the Systems Scene behavior.

## 10. Open questions (non-blocking; tunable against the running build)

1. **Per-beat `length` + scrub smoothing** — start at §6.2; tune by eye. Not load-bearing.
2. **Systems** — six records across one long pin (planned) vs. a shorter pin with a denser
   stagger. Decide against the running build.
3. **Touch breakpoint** — `pointer: coarse` alone, or also `innerWidth < 768`. Default: both.
4. **Centerpiece retune amount** — how many turns across the longer page. Cosmetic.
5. **Anchor into a pinned section** — landing at pin start is expected ScrollTrigger behavior;
   confirm it feels right for the `ArchiveIndex`/`UPLINK` links, adjust with `anticipatePin`
   / offsets if not.

## 11. Implementation note (repo-specific)

Per `AGENTS.md`, this is a modified Next.js — the implementation plan will consult
`node_modules/next/dist/docs/` before writing code. The motion layer is client-only DOM/GSAP
work, so Next specifics are minimal, but `Scene`/layers are `'use client'` wrappers around
server-rendered children exactly as `Reveal` is, and must not convert any section into a
Client Component.

## 12. Out of scope / future

New content beats · cross-beat master timeline · horizontal scroll · perspective camera ·
depth-cued wireframe opacity · palette or copy changes · gate/boot changes.
