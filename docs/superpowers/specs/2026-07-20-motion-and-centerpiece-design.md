# MOTION — Cinematic Animation Pass

**Date:** 2026-07-20
**Subject:** Shyamsinh Parmar — portfolio (`/`)
**Reference:** https://to-portfolio.com/ (motion *feel* only; no code or content reuse)
**Builds on:** [2026-07-17-archive-portfolio-design.md](2026-07-17-archive-portfolio-design.md)

---

## 1. Goal

Bring three animation effects closer to the reference site's cinematic feel, **without**
undoing the archive-portfolio spec's deliberate deviations (fast, usable, accessible,
addressable). This is a motion pass over already-built, content-complete sections — not
new features and not a redesign.

The three effects, in priority order:

1. **Per-record reveal + typewriter** — each system record slides in on scroll and its
   summary types out (today all six reveal together, statically).
2. **Scramble reach** — extend the existing decode effect from "nowhere in the records" to
   headings, record names, key field values, and the archive index.
3. **Hexagonal wireframe centerpiece** — a slowly-rotating faceted "crystal" at screen
   centre, floating in front of the existing particle constellation.

## 2. Current state (what exists)

- `ScrambleTextAnimated` is **fully built and correct** (decode-on-scroll, `sr-only` real
  string + `aria-hidden` noise, reduced-motion → plain text, `useOnScreen` trigger) but is
  **not used anywhere in the records** — `SystemRecord` imports the `ScrambleText` *stub*,
  which renders plain text. So today no record name decodes.
- `lib/scramble.ts` (`scrambleFrame`, deterministic, tested) is the shared decode engine.
- `Systems.tsx` maps six `SystemRecord`s inside a **single** `Reveal` wrapper (one fade for
  the whole block). Records have no per-item motion.
- The canvas is the particle **constellation only** — `RendererWebGL` (Three.js, ortho
  pixel-space camera) and `Renderer2D` (2D fallback) both draw `simulation.ts`'s field.
  There is **no** centred object, and **no** `TypeOut` component.

## 3. Non-goals

- **Telemetry world map** — the separate unbuilt beat (`Telemetry.tsx` placeholder). Not
  in this pass.
- **Scroll-linked centerpiece motion** (rotation/zoom driven by scroll progress) and
  **depth-cued line opacity** — constant slow rotation with uniform opacity is v1.
- **Perspective camera** — the centerpiece is drawn through the existing orthographic
  pixel-space projection; a flat, perspective-free wireframe is *more* on-genre for a HUD.
- **Per-field typewriter** — only the record summary types out. Typing labels, stack tags,
  and every field reads as noise, not as a readout.
- **Palette / pacing rewrite** — no colour changes; page length and boot cap unchanged.

## 4. Effect 1 — Per-record reveal + typewriter

### 4.1 Per-record slide-in

`Systems.tsx` wraps **each** record in its own `Reveal` instead of one wrapper around all
six:

```tsx
<div className="mt-10 space-y-8">
  {getFeatured().map((s, i) => (
    <Reveal key={s.slug} delayMs={0}>
      <SystemRecord system={s} index={recordNumber(s.slug) - 1} seedBase={i} />
    </Reveal>
  ))}
</div>
```

Each `Reveal` owns its own `ScrollTrigger` (`top 85%`, once), so the six records stagger
naturally as the reader scrolls through them — no explicit stagger timing needed. Reduced
motion short-circuits `Reveal` exactly as it does today (renders children with no wrapper).

### 4.2 `TypeOut` (new component)

A typewriter for the record summary, built to `ScrambleTextAnimated`'s **exact** a11y
contract — this is non-negotiable and the reason it's a sibling component, not an ad-hoc
effect:

- The real string sits in an always-present `sr-only` span (accessible name + indexed text
  from first paint).
- The visible, `aria-hidden` layer reveals a growing prefix of the string over
  `durationMs`, driven by a `performance.now()`-based rAF from the moment `useOnScreen`
  latches (mirrors `ScrambleTextAnimated`'s loop).
- A blinking block cursor (`▍`) trails the typed prefix while typing, removed on done.
- **Reduced motion** renders exactly one plain text node — no cursor, no timer, no
  observer (same guard shape as `ScrambleTextAnimated`).
- Props: `{ text, as?, className?, durationMs?, startDelayMs?, onDone? }`. `startDelayMs`
  (default ~150ms) lets the summary begin a beat *after* the panel starts sliding in.

Typing speed is derived from `durationMs` (default sized so a ~140-char summary types in
~1.1s — fast enough not to stall the scroll). Tunable; not load-bearing.

## 5. Effect 2 — Scramble reach

Swap plain text / the `ScrambleText` stub for `ScrambleTextAnimated` at these sites, each
with a varied `seed` so adjacent instances don't shimmer in lockstep:

| Site | Component today | After |
| --- | --- | --- |
| Section headings (`NODE: …`, `// IDENTITY`) | plain `<h2>`/label | `ScrambleTextAnimated` |
| Record name | `ScrambleText` (stub) | `ScrambleTextAnimated` |
| Record `DOMAIN · REGION` value | plain `<dd>` | `ScrambleTextAnimated` |
| Archive-index names | plain text | `ScrambleTextAnimated` |
| Identity stat line (`8 YRS · 18 SYSTEMS · …`) | plain text | `ScrambleTextAnimated` |

**Seed strategy:** derive `seed` from the record/row index (e.g. `seedBase` passed into
`SystemRecord`, plus a per-field offset) so the noise differs between instances and between
the name and the field within one record. Deterministic, per `scramble.ts`'s contract.

**What does NOT scramble:** record summaries (they *type out*, §4.2), stack tags, links,
and any multi-line body copy. Decoding long copy is the "noise soup" failure mode; the
effect stays on short, glanceable strings — names, labels, headings, figures.

**Accessibility:** `ScrambleTextAnimated` already guarantees the real string is the
accessible name from first paint and the noise is `aria-hidden`; extending its *usage*
inherits that guarantee. Reduced motion renders all of the above as plain text with no
observers.

## 6. Effect 3 — Hexagonal wireframe centerpiece

### 6.1 Geometry

A **hexagonal bipyramid** — a hex ring of 6 vertices plus a top and bottom apex (8
vertices, 18 edges): the ring (6), apex-to-ring top (6), apex-to-ring bottom (6). It reads
as a faceted crystal/reticle and stays sparse enough to be a background anchor, not clutter.

### 6.2 Shared pure module — `src/lib/canvas/wireframe.ts`

Mirrors how `simulation.ts` is shared by both renderers, so WebGL and 2D **cannot** drift:

```ts
export type Vec3 = { x: number; y: number; z: number }
export function hexBipyramid(): { vertices: Vec3[]; edges: [number, number][] }
// Rotate (Rx tilt, then Ry spin), orthographic drop of z, scale, translate to (cx, cy).
export function rotateProject(
  vertices: Vec3[], angleX: number, angleY: number, scale: number, cx: number, cy: number
): { x: number; y: number }[]
```

Pure and unit-tested: `hexBipyramid()` returns 8 vertices / 18 edges; `rotateProject` is
deterministic (same inputs → same 2D points).

### 6.3 Rendering

Both renderers compute the projected edges each frame with `rotateProject` and draw them —
the centerpiece is a **CPU-projected** wireframe, exactly like the constellation is a
CPU-simulated field. No 3D scene transform.

- **`RendererWebGL`** — add a second `LineSegments` (its own `BufferGeometry`, 18 edges =
  36 endpoints = 108 floats). Each frame, write the projected `(x, y, 0)` into its buffer. `z = 0` sits
  inside the ortho camera's `near/far` (−1..1), so it renders; depth is dropped for v1
  (uniform opacity). Added to the scene alongside the existing points + lines.
- **`Renderer2D`** — stroke the projected edges each frame after the field.

**Rotation:** fixed tilt on X (~0.35 rad) so it's seen at an angle, continuous slow spin on
Y (~one revolution / ~30s, `angleY += k·dt`). Tunable.

**Placement & style:** centred at `(w/2, h/2)`; `scale = min(w, h) · 0.18`; ink `#8d8d8d`;
line opacity slightly above the constellation links (~0.28 vs ~0.14) so it reads as the
anchor. Same fixed, `aria-hidden`, `pointer-events-none`, `z-0` layer as the constellation —
content never depends on it.

**Tier / reduced motion:** unchanged. `pickTier` returning `none` (reduced motion, or SSR
before the client confirms) means **no canvas at all**, hence no centerpiece. The
centerpiece exists only in the `webgl` and `2d` tiers, riding the same `useRafLoop` that
pauses on a hidden tab.

## 7. Contracts preserved (unchanged from the codebase)

- **A11y:** every animated string is real text in the DOM from first paint; all noise /
  typing / wireframe is `aria-hidden`. Reduced motion → full static content, no timers, no
  observers, no canvas.
- **Performance:** the centerpiece adds 18 edges (negligible) and no new rAF loop — it
  rides `useRafLoop`, still paused on hidden tab; particle budget still tier-scaled.
- **SSR:** unchanged — the canvas stays client-only via the existing `dynamic(..., { ssr:
  false })`; sections remain server-rendered with content present before hydration.

## 8. Files

| File | Change |
| --- | --- |
| `src/lib/canvas/wireframe.ts` | **new** — pure geometry + `rotateProject` |
| `src/components/text/TypeOut.tsx` | **new** — typewriter (a11y-mirrored) |
| `src/components/sections/Systems.tsx` | per-record `Reveal`; pass `seedBase` |
| `src/components/record/SystemRecord.tsx` | animated name; scramble `DOMAIN·REGION`; `TypeOut` summary |
| `src/components/canvas/RendererWebGL.tsx` | add centerpiece `LineSegments` |
| `src/components/canvas/Renderer2D.tsx` | stroke centerpiece edges |
| section heading components (`Trajectory`, `Systems`, `Telemetry`, `ArchiveIndex`, `Uplink`) | `NODE: …` headings → `ScrambleTextAnimated` |
| `Identity.tsx` | `// IDENTITY` label + stat line → `ScrambleTextAnimated` (hero name already animated) |
| `ArchiveIndex.tsx` | index row names → `ScrambleTextAnimated` |

## 9. Testing

**Vitest (pure logic):**
- `wireframe.ts` — `hexBipyramid()` yields 8 vertices / 18 edges; `rotateProject` is
  deterministic and centres correctly (a symmetric input projects symmetrically about
  `cx`).
- `TypeOut` — reveals a growing prefix over time; reduced-motion renders the full string
  immediately with no cursor; the real string is always in the accessible tree.

**Playwright (the paths that matter):**
- Records **stagger-reveal on scroll** — a below-fold record starts hidden and appears as
  it enters view.
- `prefers-reduced-motion: reduce` renders full record content (name, summary, fields) with
  no animation.
- The centerpiece canvas is present on `/` and absent under reduced motion.

## 10. Open questions (non-blocking, tunable at implementation)

1. **Rotation speed / tilt** and **scramble/type durations** — start at the values above;
   tune by eye against the running site. None are load-bearing.
2. **Archive-index scramble volume** — decoding ~12 names at once may be busier than the
   reference's restraint. If it reads as too much, dial it to names-only-on-first-view or
   drop the archive rows from the scramble set. Decide against the running build.
3. **Cursor glyph** — `▍` vs `_` vs none for `TypeOut`. Cosmetic.

## 11. Out of scope / future

Telemetry map · scroll-linked centerpiece motion · depth-cued wireframe opacity ·
per-field typewriter · palette or pacing changes.
