# ARCHIVE — Portfolio Site Design

**Date:** 2026-07-17
**Subject:** Shyamsinh Parmar — AI & Backend Architect
**Reference:** https://to-portfolio.com/ (aesthetic and interaction genre only; no code or content reuse)

---

## 1. Goal

A portfolio site that converts prospective **freelance clients**, built as a cinematic
scroll experience in the "archive / HUD terminal" genre.

The site must do two jobs that pull against each other:

1. **Be memorable.** A striking, crafted experience that demonstrates capability by existing.
2. **Be useful.** A client who wants the email address in ten seconds must get it.

Every design decision below resolves that tension explicitly rather than pretending it
doesn't exist. Where the reference site optimizes purely for (1), we deviate.

## 2. Non-goals

- Not a clone. No code, copy, or narrative structure is lifted from the reference site.
- Not a CMS-backed blog. No posts, no comments, no admin.
- Not a job-board candidate profile. The audience is clients, not recruiters.
- Not multilingual at v1 (English only, despite Hindi/Gujarati fluency).

## 3. The subject

| Field | Value |
| --- | --- |
| Name | Shyamsinh Parmar |
| Title | AI & Backend Architect |
| Experience | 8 years (anchored to 2018 — see Open Questions #6) |
| Location | Gujarat, India — works remote |
| Email | parmarshyamsingh8@gmail.com |
| GitHub | `ssparmar8`, plus the Woyce Tech org |
| Also on | LinkedIn, Upwork, Fiverr |
| Engagement model | Freelance contract |
| Typical scope | Architecture + leading a small team |

**Systems shipped:** 18 across 9 sectors, delivered to 3 client regions (US, Canada,
Denmark) from India.

> **Corrected 2026-07-17.** This originally read "20 across 6 domains and 4 regions."
> Every number in that sentence was wrong, and the errors are instructive:
> - **20 → 18.** ServiceNow and Goodfin are omitted pending scope confirmation (§15.1).
> - **6 domains → 9 sectors.** "6 domains" was a hand-wave. The per-record `domain` field
>   holds a specific descriptor ("Healthcare · EMR"), so counting distinct values returns
>   ~one per project — a fact about project count, not breadth. `sector` is a separate,
>   deliberately coarse enum that exists to be counted. Keep it short: a sector per project
>   makes the number meaningless again.
> - **4 regions → 3 client regions.** The fourth was India — where Shyamsinh *is*, not
>   where a client is. No system carries `region: 'IN'`. `countRegions()` (= 4) counts map
>   nodes including home and exists only for the telemetry section; `countClientRegions()`
>   (= 3) is the only one permitted next to a claim about delivered work.
>
> All three were caught by implementers and reviewers refusing to fabricate data to fit
> the spec. Numbers on this site derive from `src/content/`; if a number can't be derived,
> it doesn't ship.

## 4. Concept and narrative

### 4.1 The conceit

The site presents itself as a **queryable archive of deployed systems**. Sections are
`NODE`s, projects are `RECORD`s, contact is an `UPLINK`. Text arrives by decoding out of
scramble rather than fading in.

This conceit is borrowed in *genre* from the reference site, but it fits this subject
better than it fits theirs. The reference is an archive of a single career decision —
thin content carried by mood. This is an archive of twenty production systems. The
metaphor is doing real work here, not decorating.

### 4.2 The narrative spine — "the climb"

The reference site's emotional engine is a **pivot** (liberal-arts grad, two months in
corporate sales, quit, rebuilt). That story is not available to us and must not be
imitated — the subject's story is the opposite shape.

The spine here is a **climb**, stated flatly in archive syntax:

```
2012 · ITI RAJKOT ............ TRADE      (vocational, 78%)
2015 · DIPLOMA · GTU ......... +3 YRS     (CGPA 8.68)
2018 · B.E. · GTU ............ +3 YRS     (S.P.I. 6.0)
2018 · FIRST BACKEND SYSTEM
2026 · AI & BACKEND ARCHITECT

[ CONTINUITY ] : NO BREAK SINCE 2018
```

The 2018 anchor is load-bearing and must be confirmed (Open Questions #6). It is the only
year that reconciles both source documents: the 2024-era resume claims "6+ years"
(→ 2018) and the current deck claims "8+ years" (→ 2018). If the real start year is 2019,
the headline number is 7, not 8, and every instance changes.

Vocational trade school to AI architect is an uncommon path. Stating it without
embellishment is the whole point — the restraint is what makes it land. This section is
deliberately the only place on the site that is *about the person* rather than the work.

**Constraint:** no adjectives about grit, journey, or passion. The dates carry it.

## 5. Honest attribution (a hard requirement)

Every project on this site is client contract work. Copy must state real scope and
survive being questioned in a client call. This is a correctness requirement, not a
matter of taste — a portfolio that overclaims fails at the moment it's scrutinized, which
is exactly when it matters.

Rules:

1. **State scope, not association.** "Architecture + led a small team" — never an
   implication of sole authorship where it isn't true.
2. **Never link a client's private or staging environment.** Specifically:
   `ai-uat.medicalofficeforce.co` is a UAT environment behind a login and **must not be
   linked**. The work is describable; the link is not publishable.

   This is enforced in `src/content/schema.ts` as a build failure, not a convention.
   **The comparison must normalise the hostname first.** A naive `hostname === host` check
   is bypassable: `https://ai-uat.medicalofficeforce.co./login` — one trailing dot — has a
   different `hostname` string but resolves to the *same server*, because DNS treats the
   trailing dot as the root label. `%2e` is the percent-encoded form and the URL parser
   decodes it to the same place. Strip trailing dots before comparing. (`URL.hostname`
   already lowercases, so case is handled.) Do not "simplify" this away — it was found by
   review after the naive version shipped, and the guard is worthless without it.
3. **Never let a link imply ownership of the linking company.** `servicenow.com` and
   `goodfin.com` are large third-party companies. Listing them with a bare link reads as
   claiming the company. These require explicit scope wording before publication — see
   Open Questions.
4. **Captions must match the live site.** Descriptions drift as clients pivot. Known
   stale: `lalo.app` is now "Private Family Media" (deck says "AI obituary writer");
   `sydon.ai` is now "Agentic OS for Commerce" (deck says Amazon-seller tool). Verify
   every caption against the live site before publish.

## 6. Featured systems (6)

Chosen for domain spread — the spread *is* the argument for hiring a generalist architect.

| # | System | Domain | Region | Stack highlights | Link |
| --- | --- | --- | --- | --- | --- |
| 01 | **AIVA Chat** | Voice AI | US | Twilio, ElevenLabs, OpenAI | aivachat.io |
| 02 | **Health Wealth Safe** | Healthcare / EMR | US | Node, Twilio, Jitsi, MySQL | healthwealthsafe.com |
| 03 | **VetWise** | Veterinary telehealth | CA | React, Node, Python, Postgres, Redis, AWS | getvetwise.com |
| 04 | **YellowPad AI** | Legal | US | React, Python, OpenAI | yellowpad.ai |
| 05 | **Quick Hub** | Reputation / marketing | US | React, Nest.js, GraphQL, Prisma, OpenAI | quickhub.ai |
| 06 | **Sydon AI** | Agentic commerce | US | OpenAI, analytics, automation | sydon.ai |

All six: **freelance contract, 2024–2026, primary technical builder, architecture + led a
small team.**

## 7. Archive index (14)

Compact rows — name · domain · year · link. Present, not padded.

FrontDesk Clinic · MOF Frontdesk AI *(no link — UAT)* · Stockly · Hcomb · Corprite ·
Krone *(DK)* · AdvancedCare · PCO Intelligence · Goodfin *(scope TBD)* · Lalo *(caption
stale)* · Reknew AI · OmniAI Chatbot · ServiceNow dashboards *(scope TBD)* · Flourish
Together Therapy.

## 8. Information architecture

| Route | Purpose | Intro? |
| --- | --- | --- |
| `/` | Full cinematic scroll | Gate + boot on first visit only |
| `/systems/[slug]` | One record, deep | Never |
| `/archive` | All 20, scannable | Never |
| `/contact` | Uplink | Never |

The cinematic experience lives at `/` only. Every other route is a fast, static,
SEO-indexable page. This is the core structural difference from the reference (a single
13,000px page with no addressable sub-content) and it is what makes the site usable for
client outreach: **one link to one system**, not "scroll to the middle."

## 9. Section specs

### 00 · GATE

Audio routing prompt, `ON` / `OFF`. Mirrors the reference's opening move — it sets the
expectation that this is a system rather than a webpage.

- Choice persisted to `localStorage`; **never shown twice** to the same visitor.
- `OFF` is a first-class path, not a penalty. Nothing is gated behind audio.
- Skippable by keyboard immediately.

### 01 · BOOT

Decode sequence: canvas wakes, particles resolve, `LOADING` → `COMPLETE`.

- **Hard cap: 3 seconds.** The reference runs materially longer and pays for it in
  bounced visitors. This is a deliberate deviation.
- Visible `SKIP →` from frame one.
- Fires once per visitor (session-scoped alongside the gate).

### 02 · IDENTITY

Name decodes out of scramble. Title, then `8 YRS · 18 SYSTEMS · 9 SECTORS · 3 CLIENT
REGIONS`, with `GUJARAT, INDIA · REMOTE` on its own line. Live particle constellation
behind.

**Every figure on this line is derived** from `src/content/`, never typed by hand — that
is what stops it drifting the way the three numbers in §3 originally did. Note the
deliberate separation: the region figure here is `countClientRegions()` (3). The `4` from
`countRegions()` belongs only to the telemetry map, where a home node is visibly drawn.
Putting 4 next to the system count would assert work delivered to India. There is none.

The only place the site states its claim plainly. Everything after is evidence.

### 03 · TRAJECTORY

The climb (§4.2). Horizontal timeline, nodes decoding in on scroll.

### 04 · SYSTEMS ×6

Each record: `DOMAIN` / `ROLE` / `STACK` / `YEAR` / `STATUS`, with a live screenshot
decoding in beside it. Panel slides in, text types out.

Renders from the same typed object that generates `/systems/[slug]`, so the scroll view
and the detail route cannot drift apart.

### 05 · TELEMETRY

World map, scroll-zoomed. Client nodes in US / CA / DK, subject node pulsing in Gujarat.

On the reference site this section is decoration. Here it is **factually true**, and it is
the argument for hiring a remote contractor. It earns its place; if the data ever stops
being true, the section goes.

### 06 · ARCHIVE INDEX

The other 14. Scannable in ten seconds.

### 07 · UPLINK

Email, LinkedIn, GitHub (`ssparmar8` + Woyce Tech), Upwork, Fiverr. One decisive action.

Also exposed via a persistent HUD corner bracket at **every** scroll depth.

## 10. Visual system

- **Palette:** near-white monochrome. Background `#e9e9e9`–`#f4f4f4`, ink `#2b2b2b`, dim
  `#8d8d8d`, hairlines at ~6–10% black. No accent colour at v1.
- **Rationale:** near-universally, developer portfolios are dark. Light is rarer here and
  reads as confident. It is also a genuine accessibility advantage in daylight.
- **Type:** Geist (UI) + Geist Mono (all HUD chrome, labels, records), via `next/font`.
  Wide tracking (`0.2em`–`0.42em`) on all uppercase labels.
- **Chrome:** corner brackets, 26px grid, radial white glow at focus, hairline
  connectors, small caps telemetry tags.
- **Theming:** Tailwind v4 CSS variables (`--panel`, `--border`, `--ink`, `--dim`).

## 11. Technical architecture

### 11.1 Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Static routes + SEO for `/systems/*` |
| Styling | Tailwind v4, CSS vars | Same as reference; theme in one place |
| Scroll | Lenis | Smooth scroll |
| Choreography | GSAP + ScrollTrigger | Free for commercial use incl. ScrollTrigger |
| WebGL | Three.js via react-three-fiber | Constellation layer |
| Audio | Web Audio API (synthesized) | See 11.3 |
| Deploy | Vercel | Zero-config for this stack |

### 11.2 Module boundaries

Each unit has one purpose, a stated interface, and is testable alone.

```
src/
  app/
    page.tsx                          — the cinematic scroll
    systems/[slug]/page.tsx           — record detail (static)
    archive/page.tsx
    contact/page.tsx
  components/
    gate/Gate.tsx                     — audio consent; owns localStorage key
    boot/BootSequence.tsx             — 3s cap, skippable
    hud/HudFrame.tsx                  — persistent chrome + contact bracket
    canvas/ConstellationCanvas.tsx    — r3f; input: scrollProgress, tier
    canvas/Constellation2D.tsx        — no-WebGL fallback
    canvas/useDeviceTier.ts           — particle budget by capability
    text/ScrambleText.tsx             — decode effect
    text/TypeOut.tsx                  — typewriter
    sections/{Identity,Trajectory,SystemRecord,TelemetryMap,ArchiveIndex,Uplink}.tsx
  lib/
    audio/AudioBus.ts                 — Web Audio singleton; no-op when muted
    scroll/useScrollProgress.ts       — Lenis ↔ GSAP bridge (single source of truth)
    motion/usePrefersReducedMotion.ts
    scramble.ts                       — pure, unit-tested
  content/
    identity.ts
    systems.ts                        — all 20, typed
    trajectory.ts
    schema.ts                         — zod; validated at build
```

`ConstellationCanvas` depends only on a scroll-progress number and a device tier — not on
section components. Sections never reach into the canvas. This keeps the expensive,
fragile part isolated behind a two-value interface.

### 11.3 Audio without audio files

The reference's gate advertises `SCOPE: SFX · VOICE SYNTH · NO AMBIENT LOOP` — sound is
synthesized in the Web Audio API rather than shipped as files. We do the same: a small
oscillator-based SFX bus for clicks, decode ticks, and boot tones.

- Zero asset weight, zero load delay.
- Keeps the gate's promise literally true — there is no ambient loop to mute.
- `AudioBus` is a no-op when muted; callers never branch on mute state.

### 11.4 Content model

```ts
type System = {
  slug: string
  name: string
  domain: string
  region: 'US' | 'CA' | 'DK' | 'IN'
  year: number
  role: string                  // honest scope — see §5
  stack: string[]
  summary: string
  url?: string                  // omitted for private/UAT — see §5.2
  status: 'LIVE' | 'PRIVATE'
  featured: boolean
}
```

Typed data in git, not a CMS. Content changes a few times a year; a CMS would be
permanent overhead for that. `schema.ts` validates at build so a malformed record fails
in CI rather than in front of a client.

## 12. Performance

WebGL is the primary risk — clients will open this on mid-range Android phones.

- Particle count scales to device tier; 2D canvas fallback when WebGL is unavailable.
- rAF loop **stops** when the tab is hidden or the canvas is offscreen.
- The cinematic bundle (GSAP, Three, Lenis) loads **only** on `/`. `/systems/*`,
  `/archive`, and `/contact` ship no WebGL and no GSAP.

Budgets:

| Route | LCP (mid-tier mobile, 4G) | Notes |
| --- | --- | --- |
| `/systems/*`, `/contact`, `/archive` | < 2.0s | Static, no canvas |
| `/` first visit | < 2.5s to interactive gate | Boot ≤ 3s after |
| `/` canvas | ≥ 30fps mid-tier, ≥ 60fps desktop | Degrade particles, never framerate |

## 13. Accessibility

- `prefers-reduced-motion` gets a **real** static site: no scramble, no boot, no
  parallax, content immediately present. It is a first-class path, not a degraded one.
- Scramble text: the final string is what's in the DOM and the accessibility tree from
  first paint; scrambling is a visual layer only, never announced to screen readers.
- All content reachable by keyboard; gate and boot skippable by keyboard alone.
- Near-white palette must still meet WCAG AA on all text (`#2b2b2b` on `#e9e9e9` passes;
  `#8d8d8d` dim text must be verified per size and is **not** permitted for body copy).

## 14. Testing

**Playwright** — the three paths that actually matter:

1. First visit: gate → boot → scroll works end to end.
2. Direct hit on `/systems/aiva` loads instantly, no gate, no boot.
3. `prefers-reduced-motion: reduce` renders full content with no animation.

**Vitest** — pure logic:

- `scramble.ts` converges to the target string, deterministically.
- `schema.ts` rejects a malformed `System` (notably: a `url` pointing at a known-private
  host should fail the build — see §5.2).

## 15. Open questions

1. **ServiceNow + Goodfin scope.** Both are in the archive index and both currently link
   to large third-party companies. Exact scope wording needed before publish, or drop
   them. Blocking for those two rows only.
2. **Client consent.** Six featured clients named publicly. Confirm none object to being
   cited before going live.
3. **Stale captions.** `lalo.app` and `sydon.ai` have pivoted; captions must be
   rewritten against the live sites.
4. **Screenshots.** Automated capture of the six live sites, or hand-picked? Automated
   keeps them fresh but risks capturing a broken client deploy.
5. **Domain.** No domain chosen. `shyamsinh.dev` / `woyce.tech`?
6. **The 2018 anchor.** *(Blocking — appears in the headline.)* Both source documents
   imply a 2018 start (resume: "6+ years" written ~2024; deck: "8+ years" in 2026), and
   the B.E. completed in 2018. But neither states a start year outright, so this is
   inference. Confirm the year the first paid backend work happened. If it's 2019, the
   headline is "7 years" and §3, §4.2 and §9.02 all change.
7. **Name form.** The resume reads "Parmar Shyamsinh Santansinh"; the deck reads
   "Shyamsinh Parmar". The site uses the latter. Confirm.

## 16. Out of scope for v1

Blog · Hindi/Gujarati localization · dark mode · contact form backend (mailto only) ·
analytics beyond basic page views · CMS.
