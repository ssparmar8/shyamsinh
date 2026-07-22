# MOTION — Cursor, Scroll & Animation Polish Pass

**Date:** 2026-07-22
**Subject:** Shyamsinh Parmar — portfolio (`/` + record routes)
**Builds on:** [2026-07-17-archive-portfolio-design.md](2026-07-17-archive-portfolio-design.md) ·
[2026-07-20-motion-and-centerpiece-design.md](2026-07-20-motion-and-centerpiece-design.md) ·
[2026-07-21-pinned-scroll-scenes-design.md](2026-07-21-pinned-scroll-scenes-design.md)

---

## 1. Goal

Add a **restrained polish pass** across cursor, scrolling, and animation, in the site's
existing archive/HUD register. Five additions, each subtle enough that a visitor notices
them only on a second look:

1. **Glyph-trail cursor** — a block caret that follows the pointer and sheds fading glyph
   noise as it moves (the site's decode signature, following the hand).
2. **Scroll progress in the HUD** — a hairline progress line + percent readout woven into
   the frame chrome, so you always know where you are in the archive.
3. **Decode + magnetic links** — record/nav links briefly scramble-decode and ease a few
   px toward the cursor on hover, springing back on leave.
4. **Scroll-velocity reactions** — the constellation field and wireframe centerpiece react
   to scroll *speed* (extra tilt/zoom/parallax when you move fast, settling when you stop).
5. **Beat transition polish** — refine `Scene`'s pin→release handoff so outgoing beats
   settle out instead of snapping.

This is a **motion-and-input-layer change only**. No copy, records, palette, sections,
boot, or gate change. Every accessibility and SSR contract from the prior three specs is
preserved by construction (§10). Verdict from the 2026-07-22 smoothness verification: the
site holds a locked 60fps today; **this pass must keep it there** (§11).

## 2. Current state (what exists)

- **`pointer.ts`** (`lib/canvas/`) — a **module-singleton** input store: one lazy passive
  `pointermove` listener → `pointerTarget()` (−1..1), one passive `scroll` listener →
  `scrollProgress()` (0..1). Pure helpers `normPointer`, `scrollProgressOf` are unit-tested.
  Only the canvas samples it; nothing re-renders React. **This is the pattern the whole
  pass follows.**
- **`wireframe.ts`** (`lib/canvas/`) — centerpiece tuning constants (`WIRE_SCROLL_TURN`,
  `WIRE_ZOOM`, `WIRE_MOUSE_YAW/PITCH`, `FIELD_PARALLAX`, `POINTER_EASE`) shared by both
  renderers; pure `hexBipyramid` + `rotateProject`, unit-tested. Renderers read
  `scrollProgress()` + `pointerTarget()` each frame in `useRafLoop`.
- **`scramble.ts`** — `scrambleFrame(target, progress, seed)` (deterministic, unit-tested).
  Shared decode engine. `GLYPHS` alphabet lives here. **No `lenis`/`three`/`gsap` markers.**
- **`SmoothScroll` / `useLenis`** — Lenis on `/` only, disabled under reduced motion, driven
  from `gsap.ticker`, `lenis.on('scroll', ScrollTrigger.update)`. Lenis's scroll event
  carries **`velocity`** (px/frame) — currently unused.
- **`Scene.tsx`** — three modes (`static`/`reveal`/`scrub`). Scrub = two ScrollTriggers on an
  outer wrapper (assemble: `top bottom→top top` scrub; hold: pin `+= innerHeight*length`),
  content in an inner wrapper. `buildSceneTimeline` builds one paused timeline from registered
  layers (rise/mask/decode).
- **`HudFrame.tsx`** — `fixed` chrome, used on **every** route (`/` and records). Brackets
  `z-20`, label/UPLINK/readout `z-30`. UPLINK is a `next/link`. `HudReadout` is the existing
  live-terminal readout (`'use client'`, reduced-motion aware).
- **Gating hooks** — `usePrefersReducedMotion` (useSyncExternalStore), `useSceneMode`
  (static/reveal/scrub; reads `(pointer: coarse)` + width < 768). No `(pointer: fine)` hook
  yet.
- **e2e contracts that constrain this pass** (`tests/e2e/`):
  - Record routes (`/systems/aiva`, `/archive`, `/contact`) **ship no animation library** —
    detector greps every `.js` body for `/lenisVersion|smoothWheel|THREE\.|gsap/i`
    (`entry.spec.ts`). Anything reaching a record route must not import gsap/lenis/three.
  - Reduced motion → full content, **no `aria-hidden` noise layer** in records, **no `fixed`
    canvas** (`motion.spec.ts`).
  - Touch/narrow → beats not pinned (`motion.spec.ts`).

## 3. Non-goals

- **No content / copy / record / palette / section changes.** Same beats, same text.
- **No new scroll library, no scroll-snap, no scroll physics retune.** Lenis stays as-is;
  scroll *feel* is already verified smooth. We add feedback + reactions, not new easing.
- **No cursor that replaces affordance.** Native cursor stays under the caret's hotspot
  semantics — links still show pointer intent; the trail is decorative only.
- **No forced effects on touch or under reduced motion.** Every effect degrades to nothing
  (§10).
- **No React re-render on the animation hot path.** All per-frame work is imperative
  (refs/DOM/canvas), matching `pointer.ts`.

## 4. Architecture — shared singletons + small client components (Approach A)

The one cross-cutting decision: per-frame data (raw cursor pixels, scroll velocity) flows
through **module singletons read imperatively**, never React state. Rejected alternatives:
per-component listeners (drift + N listeners), React context (re-renders kill per-frame
animation). Approach A matches `pointer.ts` exactly.

**New: `lib/canvas/cursor.ts`** — a singleton mirroring `pointer.ts`'s shape, exposing the
**raw** pointer position in **CSS pixels** (the caret needs un-eased, pixel-precise position;
`pointerTarget()`'s normalized −1..1 is for parallax and is the wrong space):

```ts
export function cursorPos(): { x: number; y: number }  // raw client px, lazy one-listener
export function cursorMoved(): boolean                  // did it move since last sample (for idle fade)
```

One lazy passive `pointermove` listener; SSR-safe (`typeof window` guard); no gating needed
(only components that mount under fine-pointer + motion ever call it). Contains **no**
gsap/lenis/three import, so it is safe on any route.

**Extend `pointer.ts`** with scroll velocity, fed by the source that already has it:

```ts
export function scrollVelocity(): number   // smoothed |px/frame|, decays to 0 at rest
export function pushScrollVelocity(v: number): void  // Lenis calls this from its scroll cb
```

`useLenis` adds `lenis.on('scroll', ({ velocity }) => pushScrollVelocity(velocity))` alongside
its existing `ScrollTrigger.update`. Under reduced motion Lenis never mounts → velocity stays
0 → reactions are inert (correct: the canvas is absent anyway). Smoothing/decay is a **pure,
unit-tested** function (`smoothVelocity(prev, sample)` in `pointer.ts`, tested like
`scrollProgressOf`).

**New: `lib/motion/useCursorEnabled.ts`** — `useSyncExternalStore` over
`(pointer: fine)` + `(prefers-reduced-motion: reduce)`, returning `true` only for a
fine-pointer visitor with motion allowed. SSR/first render → `false` (no cursor until the
client confirms, mirroring `useDeviceTier`/`useSceneMode`). Drives cursor mount + magnetic
enable.

## 5. Effect 1 — Glyph-trail cursor (`components/cursor/CursorTrail.tsx`)

`'use client'`, mounted **at `/` only** (added to `page.tsx` beside `SmoothScroll`; renders
`null` server-side and whenever `useCursorEnabled()` is false).

- **Caret**: one `fixed`, `pointer-events-none`, `aria-hidden` block (~8×12px, `--color-ink`)
  positioned by `transform: translate()` from `cursorPos()`, updated in a single `useRafLoop`
  (pauses on hidden tab, already handles dt-clamp). No easing on the caret itself — it tracks
  the true pointer so it never feels laggy.
- **Trail**: when the pointer moves past a small distance threshold, append a `fixed`
  `aria-hidden` glyph `<span>` at the last position, character drawn from `GLYPHS`
  (`scramble.ts`), CSS-animated to fade + drift down over ~650ms then removed. Trail spans are
  pooled/capped (hard cap ~24 live nodes) so a fast sweep can't unbound the DOM.
- **Native cursor**: hidden via a class on `<html>`/`<body>` **only while the trail is
  active** (`cursor: none`), toggled by CursorTrail on mount/unmount — never in global CSS, so
  touch/reduced-motion/record-route visitors always keep the native cursor.
- **Idle**: when the pointer is still, the caret gently fades (via `cursorMoved()`), so a
  parked cursor doesn't sit as a hard block over text.

**Gating:** not mounted at all unless fine-pointer + motion. Reduced motion / touch / coarse →
native cursor, zero JS trail. `aria-hidden` throughout → invisible to AT.

## 6. Effect 2 — Scroll progress in the HUD (`components/hud/ScrollProgress.tsx`)

`'use client'`, **lib-free** (plain passive `scroll` listener + rAF; **no gsap/lenis/three
import**), so it is safe to render inside `HudFrame` on **every** route including the tall
record pages.

- **Visual**: a hairline vertical track on the right frame edge (`fixed`, `z-20`,
  `aria-hidden`, `--color-hair` track / `--color-dim` fill) whose fill height = progress; plus
  a small percent readout (`fixed`, HUD-label style: `font-mono text-[9px]
  tracking-[var(--tracking-hud)] text-[var(--color-dim)]`) near the existing UPLINK/readout.
  Restrained: thin, low-contrast, decorative.
- **Drive**: `progressFrac = scrollProgressOf(scrollY, scrollHeight, innerHeight)` (reuse the
  existing pure helper) written to a **ref/DOM** each rAF — no React state, no per-frame
  re-render. Works under native scroll (records, reduced motion) and Lenis (`/`) identically,
  because both move the real `window.scrollY`.
- **Reduced motion**: still rendered (position feedback, not decoration), but the fill has no
  CSS transition — it tracks scroll directly with no easing.
- **Placement**: rendered by `HudFrame` so it appears wherever the chrome does. Hidden on very
  short pages where `scrollHeight <= innerHeight` (nothing to indicate).

## 7. Effect 3 — Decode + magnetic links (`components/motion/MagneticLink.tsx`)

`'use client'`, a wrapper around a link/`next/link` child. **Dependency-light: imports only
`scramble.ts` + rAF — no gsap/lenis/three**, so applying it to shared chrome (UPLINK) cannot
break the record-route bundle guarantee. Verified in §11.

- **Magnetic**: on `pointermove` within the element's bounds + a small padding, ease the
  element by `magneticOffset(cursor, rect, strength)` — a **pure, unit-tested** function
  returning a capped fraction of the offset from center. Applied via `transform: translate()`
  in rAF; springs back to 0 on `pointerleave`. Small `strength` (restrained — a few px, not a
  grab).
- **Decode**: on `pointerenter`, run a brief (~350ms) `scrambleFrame` sweep over the visible
  label then restore. Accessibility-safe via the site's established split: the real string is
  an always-present node (accessible name/index text); only a duplicated `aria-hidden` layer
  scrambles. On leave/cancel it restores to the real text. (Same contract as `DecodeLine` /
  `ScrambleTextAnimated`.)
- **Gating**: reads `useCursorEnabled()` (fine-pointer + motion). Otherwise renders the plain
  child link unchanged — **no wrapper, no `aria-hidden` layer** (so the reduced-motion
  "no noise layer in a record" test still holds).
- **Applied to**: home record links (`ArchiveIndex`, `Systems`) and the persistent UPLINK in
  `HudFrame`. On record routes the UPLINK still renders (lib-free) but, under the typical
  fine-pointer desktop, gets the same subtle effect — consistent, and provably library-free.

## 8. Effect 4 — Scroll-velocity reactions (canvas only)

Feed `scrollVelocity()` into the existing centerpiece + field math; **no new component, no
accessibility surface** (the canvas is already absent under reduced motion, tier `none`).

- **New tuning constants in `wireframe.ts`** (keeps WebGL + 2D in lockstep, unit-testable
  pattern): e.g. `WIRE_VEL_TILT`, `WIRE_VEL_ZOOM`, `FIELD_VEL_PARALLAX`, each a small gain.
- **Both renderers** (`RendererWebGL`, `Renderer2D`) already read `scrollProgress()` each
  frame; add reading `scrollVelocity()` and fold a velocity term into `angleX`/`scale` (extra
  tilt/zoom on fast scroll) and a touch of field drift. Because `scrollVelocity()` decays to 0
  at rest, the centerpiece **settles** when scrolling stops — no permanent change.
- Reactions are proportional and clamped so a flick can't spin the crystal wildly (restrained).

## 9. Effect 5 — Beat transition polish (`components/motion/Scene.tsx` + `buildSceneTimeline.ts`)

Conservative refinement of the scrub `hold`→release handoff so an outgoing beat **settles**
rather than snaps, using the existing scrubbed timeline (no new ScrollTrigger, no master
timeline).

- Add a short **release tail** to the assembled timeline: as the pin releases and the beat
  scrolls up out of view, a subtle `autoAlpha`/`y` ease-down on the inner content (a few px,
  low alpha floor — it never fully disappears, so scrolling back up reverses cleanly).
- Verify **no layout jump** at pin release (the existing `pinSpacing`/`anticipatePin` are
  retained; the tail is a transform/opacity change only, never layout).
- Untouched under `static`/`reveal` — this lives only in the scrub branch.

## 10. Accessibility & SSR contracts (cross-cutting, preserved by construction)

| Visitor | Cursor | Scroll progress | Magnetic/decode links | Velocity reactions | Beat transitions |
|---|---|---|---|---|---|
| **Reduced motion** | not mounted (native cursor) | shown, un-eased | plain links, no noise layer | inert (canvas absent) | static mode (no scrub) |
| **Touch / coarse** | not mounted | shown | plain links | canvas runs; velocity term applies, harmless | reveal mode (no pin) |
| **Fine pointer + motion (`/`)** | full | full | full | full | full |
| **Record routes** | not mounted (only `/` mounts CursorTrail) | shown (lib-free) | UPLINK enhanced iff fine-pointer, else plain | n/a (no canvas velocity dep on records) | n/a (no Scene on records) |

- **SSR/first render**: `useCursorEnabled` and `useDeviceTier`/`useSceneMode` all return the
  "off" snapshot on the server and first client render, then re-read after mount — no
  hydration mismatch, content never gated.
- **Record-route bundle**: `cursor.ts`, `ScrollProgress`, `MagneticLink`, and everything they
  import are free of `lenis`/`three`/`gsap` markers. The only gsap/lenis consumers stay
  `/`-scoped (`SmoothScroll`, `Scene`, `useReveal`). §11 verifies.
- **`aria-hidden` discipline**: caret, trail glyphs, progress bar, and the decode noise layer
  are all `aria-hidden`; every real string stays a live text node. Screen readers never meet
  noise.

## 11. Testing & verification

**Pure functions (vitest)** — keep logic out of components so it's headless-testable, matching
`pickTier`/`scrollProgressOf`:
- `smoothVelocity(prev, sample)` — decays to 0, clamps, monotonic toward sample.
- `magneticOffset(cursor, rect, strength)` — 0 at center, capped at edges, symmetric.
- Reuse existing `scrollProgressOf`, `scrambleFrame` tests (no change).

**Component (vitest + jsdom)** — `CursorTrail`/`MagneticLink`/`ScrollProgress` render `null` or
plain children when their gate is off; `aria-hidden` present on decorative nodes; no noise
layer when disabled.

**e2e (Playwright)** — new/extended in `tests/e2e/motion.spec.ts`:
- Cursor caret present on `/` (fine pointer, default project), **absent** under reduced motion
  and on a touch/narrow viewport.
- A `MagneticLink` shifts its transform on hover on `/`; renders as a plain link (no
  `aria-hidden` sibling) under reduced motion.
- Scroll-progress fill advances as `window.scrollY` grows.
- **Record-route guarantee still green**: the existing "ships no animation library" test must
  pass unchanged — the primary risk gate for this pass.
- Reuse the existing reduced-motion "no noise layer / no fixed canvas" and touch "not pinned"
  tests unchanged.

**Frame budget (the smoothness gate)** — re-run the frame-timing probe from the 2026-07-22
verification (headed Chromium, scroll every beat, record rAF deltas): **p95 ≤ ~18ms, zero
frames > 50ms, no main-thread long tasks**, with the cursor + magnetic + velocity effects
live. This is a hard acceptance criterion — a polish pass that costs the 60fps is a regression,
not an improvement.

## 12. Files touched

**New:**
- `src/lib/canvas/cursor.ts` (+ `cursor.test.ts`)
- `src/lib/motion/useCursorEnabled.ts` (+ test)
- `src/components/cursor/CursorTrail.tsx` (+ test)
- `src/components/hud/ScrollProgress.tsx` (+ test)
- `src/components/motion/MagneticLink.tsx` (+ test)

**Changed:**
- `src/lib/canvas/pointer.ts` — add `scrollVelocity()`/`pushScrollVelocity()`/`smoothVelocity()`.
- `src/lib/scroll/useLenis.ts` — push Lenis velocity into `pointer.ts`.
- `src/lib/canvas/wireframe.ts` — velocity tuning constants.
- `src/components/canvas/RendererWebGL.tsx` + `Renderer2D.tsx` — consume `scrollVelocity()`.
- `src/components/hud/HudFrame.tsx` — mount `ScrollProgress`; wrap UPLINK in `MagneticLink`.
- `src/components/sections/ArchiveIndex.tsx` + `Systems.tsx` — record links via `MagneticLink`.
- `src/components/motion/Scene.tsx` + `src/lib/motion/buildSceneTimeline.ts` — release tail.
- `src/app/page.tsx` — mount `CursorTrail`.

## 13. Risks & mitigations

- **Record-route bundle leak** (highest): a stray gsap/lenis/three import via `MagneticLink`/
  `ScrollProgress`/`cursor.ts` reaching a record route. *Mitigation*: keep those modules
  dependency-light (scramble + rAF only); the existing content-grep e2e test is the gate,
  run every change.
- **Frame-budget regression**: trail DOM churn or extra per-frame math. *Mitigation*: single
  `useRafLoop` for the caret, capped/pooled trail nodes, transform-only writes, velocity math
  is a handful of multiplies; the frame-timing probe is the gate.
- **Cursor over affordance**: caret obscuring text or click targets. *Mitigation*:
  `pointer-events-none`, small caret, idle fade, native cursor semantics unchanged.
- **Beat-transition layout jump**: the release tail must stay transform/opacity-only.
  *Mitigation*: no layout properties in the tail; verify pin release visually + in e2e.
