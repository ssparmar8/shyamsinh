# ARCHIVE Portfolio — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working, deployable portfolio site — typed content model, HUD design system, and fast static routes (`/systems/[slug]`, `/archive`, `/contact`) — with zero WebGL and zero scroll choreography.

**Architecture:** Next.js App Router with all content as typed, build-validated data in `src/content/`. Every route in this plan is statically generated and ships no animation libraries. The cinematic layer (Plan 2) will mount only at `/`, so the routes built here stay permanently fast. Presentation primitives (`ScrambleText`, `HudFrame`) are built animation-capable but degrade to plain static text, which is exactly what this plan renders.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind v4 · Zod · Vitest + Testing Library · Playwright · Vercel

**Spec:** [`docs/superpowers/specs/2026-07-17-archive-portfolio-design.md`](../specs/2026-07-17-archive-portfolio-design.md)

---

## Blocked content (does not block this plan)

Three spec items are unresolved. **None block the build** — all live in `src/content/`, editable in one line each. They block *publishing*, not implementing.

| Item | Spec ref | Placeholder used here |
| --- | --- | --- |
| The 2018 experience anchor | §15.6 | `2018` (with `YEARS_EXPERIENCE` derived, not hardcoded) |
| ServiceNow / Goodfin scope | §15.1 | **Both omitted from `systems.ts` entirely.** Adding them later is one object each. Better absent than wrong. |
| Stale captions (Lalo, Sydon) | §15.3 | Captions written from the **live sites** as verified 2026-07-17, not from the deck. |

## File structure

```
src/
  content/
    schema.ts          — Zod schemas + the private-host guard (§5.2). Pure.
    identity.ts        — name, title, links, the experience anchor
    trajectory.ts      — the climb (§4.2)
    systems.ts         — all systems, typed; validated at import
    index.ts           — public accessors (getFeatured, getBySlug, …)
  lib/
    scramble.ts        — pure decode algorithm. No React, no DOM.
  components/
    hud/CornerBracket.tsx
    hud/HudFrame.tsx
    text/ScrambleText.tsx
    record/SystemRecord.tsx
  app/
    layout.tsx
    globals.css
    systems/[slug]/page.tsx
    archive/page.tsx
    contact/page.tsx
tests/
  e2e/routes.spec.ts
```

**Boundary rules.** `src/content/` never imports from `src/components/`. `src/lib/scramble.ts` is pure and never imports React. Components never read content files directly — they take props, so they're testable without fixtures.

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js**

Run from the repo root (`/Users/woyce/shyamsinh`). The directory already contains `README.md`, `.gitignore`, and `docs/`, so scaffold into `.`:

```bash
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --yes
```

If it refuses due to the non-empty directory, scaffold to a temp dir and move the files in:

```bash
npx create-next-app@latest /tmp/scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude README.md /tmp/scaffold/ ./
rm -rf /tmp/scaffold
```

Confirm before continuing: `src/app/` exists, `package.json` lists `tailwindcss` v4, and
`.gitignore` still contains `.superpowers/` (the scaffold may have overwritten it — if so,
re-add that line, or the brainstorm mockups will be committed).

- [ ] **Step 2: Verify the scaffold builds**

Run: `npm run build`
Expected: `✓ Compiled successfully`. Any failure here is a toolchain problem — fix before continuing.

- [ ] **Step 3: Add test dependencies**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
npm i zod
npx playwright install chromium
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Add scripts to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 7: Verify the test runner starts**

Run: `npm test`
Expected: exits 0 with `No test files found` — that's success at this stage.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest + Playwright"
```

---

### Task 2: Content schema with the private-host guard

Encodes spec §5.2 (never link a client's private environment) as a **build-time failure**. This is the one rule that must not depend on anyone remembering it.

**Files:**
- Create: `src/content/schema.ts`, `src/content/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/content/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SystemSchema, PRIVATE_HOSTS } from './schema'

const valid = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  region: 'US' as const,
  year: 2025,
  role: 'Architecture + led a small team',
  stack: ['Twilio', 'ElevenLabs', 'OpenAI'],
  summary: 'AI voice agents and embeddable chat widgets.',
  url: 'https://aivachat.io/',
  status: 'LIVE' as const,
  featured: true,
}

describe('SystemSchema', () => {
  it('accepts a well-formed system', () => {
    expect(SystemSchema.parse(valid)).toMatchObject({ slug: 'aiva' })
  })

  it('rejects a slug that is not url-safe', () => {
    expect(() => SystemSchema.parse({ ...valid, slug: 'AIVA Chat' })).toThrow()
  })

  it('rejects a url pointing at a known-private host', () => {
    const host = PRIVATE_HOSTS[0]
    expect(() =>
      SystemSchema.parse({ ...valid, url: `https://${host}/login` }),
    ).toThrow(/private/i)
  })

  it('rejects a PRIVATE system that carries a url', () => {
    expect(() =>
      SystemSchema.parse({ ...valid, status: 'PRIVATE' }),
    ).toThrow(/PRIVATE/)
  })

  it('accepts a PRIVATE system with no url', () => {
    const { url, ...rest } = valid
    expect(() =>
      SystemSchema.parse({ ...rest, status: 'PRIVATE' }),
    ).not.toThrow()
  })

  it('rejects a year before the 2018 anchor', () => {
    expect(() => SystemSchema.parse({ ...valid, year: 2017 })).toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- schema`
Expected: FAIL — `Failed to resolve import "./schema"`.

- [ ] **Step 3: Write the implementation**

Create `src/content/schema.ts`:

```ts
import { z } from 'zod'

/**
 * Hosts that must never appear in a published link.
 * `ai-uat.medicalofficeforce.co` is a client's UAT environment behind a login.
 * Publishing it would expose a client's internal system — see spec §5.2.
 */
export const PRIVATE_HOSTS = ['ai-uat.medicalofficeforce.co'] as const

/** First paid backend work. Every "years of experience" figure derives from this. */
export const CAREER_START_YEAR = 2018

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export const SystemSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase, url-safe'),
    name: z.string().min(1),
    domain: z.string().min(1),
    region: z.enum(['US', 'CA', 'DK', 'IN']),
    year: z.number().int().min(CAREER_START_YEAR).max(2030),
    role: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    summary: z.string().min(1),
    url: z.string().url().optional(),
    status: z.enum(['LIVE', 'PRIVATE']),
    featured: z.boolean(),
  })
  .refine((s) => !(s.url && (PRIVATE_HOSTS as readonly string[]).includes(hostOf(s.url) ?? '')), {
    message: 'url points at a known-private host and must not be published',
    path: ['url'],
  })
  .refine((s) => !(s.status === 'PRIVATE' && s.url), {
    message: 'a PRIVATE system must not carry a url',
    path: ['url'],
  })

export type System = z.infer<typeof SystemSchema>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- schema`
Expected: PASS — 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "feat(content): add System schema with private-host guard"
```

---

### Task 3: The content

Captions below were written against the **live sites, verified 2026-07-17** — not from the source deck, which has drifted (spec §5.4).

**Files:**
- Create: `src/content/identity.ts`, `src/content/trajectory.ts`, `src/content/systems.ts`, `src/content/index.ts`, `src/content/systems.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/content/systems.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SYSTEMS } from './systems'
import { SystemSchema, PRIVATE_HOSTS } from './schema'
import { getFeatured, getBySlug, getArchive } from './index'

describe('SYSTEMS content', () => {
  it('every system satisfies the schema', () => {
    for (const s of SYSTEMS) {
      expect(() => SystemSchema.parse(s), `${s.slug} failed`).not.toThrow()
    }
  })

  it('has exactly 6 featured systems', () => {
    expect(getFeatured()).toHaveLength(6)
  })

  it('has unique slugs', () => {
    const slugs = SYSTEMS.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('never links a private host', () => {
    const urls = SYSTEMS.map((s) => s.url).filter(Boolean) as string[]
    for (const u of urls) {
      for (const host of PRIVATE_HOSTS) {
        expect(u).not.toContain(host)
      }
    }
  })

  it('resolves a featured system by slug', () => {
    expect(getBySlug('aiva')?.name).toBe('AIVA Chat')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getBySlug('nope')).toBeUndefined()
  })

  it('archive excludes featured systems', () => {
    expect(getArchive().every((s) => !s.featured)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- systems`
Expected: FAIL — cannot resolve `./systems`.

- [ ] **Step 3: Write `src/content/identity.ts`**

```ts
import { CAREER_START_YEAR } from './schema'

export const IDENTITY = {
  name: 'Shyamsinh Parmar',
  title: 'AI & Backend Architect',
  location: 'Gujarat, India',
  locationCode: 'IN',
  email: 'parmarshyamsingh8@gmail.com',
  links: [
    { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/shyamsinh-parmar' },
    { label: 'GITHUB', href: 'https://github.com/ssparmar8' },
    { label: 'WOYCE TECH', href: 'https://github.com/woyce-tech' },
    { label: 'UPWORK', href: 'https://www.upwork.com/freelancers/~shyamsinhparmar' },
    { label: 'FIVERR', href: 'https://www.fiverr.com/ssparmar8' },
  ],
} as const

/** Derived, never hardcoded — so correcting the anchor corrects the whole site. */
export const yearsExperience = (now = new Date().getFullYear()): number =>
  now - CAREER_START_YEAR
```

> **Note for the implementer:** the LinkedIn, Upwork, and Fiverr hrefs above are
> **constructed guesses** — the source documents give display names, not URLs. Verify each
> one resolves before the site goes live, or drop the row. A dead link in the contact
> section is worse than a missing one. Task 11 asserts they are at least well-formed; it
> cannot assert they exist.

- [ ] **Step 4: Write `src/content/trajectory.ts`**

```ts
/**
 * "The climb" — spec §4.2.
 * Deliberately unadorned: dates and facts only. No adjectives about grit or
 * journey. The restraint is the point.
 */
export const TRAJECTORY = [
  { year: 2012, label: 'ITI RAJKOT',          note: 'TRADE',   detail: 'N.C.V.T. · 78%' },
  { year: 2015, label: 'DIPLOMA · GTU',       note: '+3 YRS',  detail: 'Sanjaybhai Rajguru · CGPA 8.68' },
  { year: 2018, label: 'B.E. · GTU',          note: '+3 YRS',  detail: 'Marwadi · S.P.I. 6.0' },
  { year: 2018, label: 'FIRST BACKEND SYSTEM', note: '',       detail: '' },
  { year: 2026, label: 'AI & BACKEND ARCHITECT', note: '',     detail: '20 SYSTEMS · 6 DOMAINS · 4 REGIONS' },
] as const

export const CONTINUITY = 'NO BREAK SINCE 2018'
```

- [ ] **Step 5: Write `src/content/systems.ts`**

```ts
import type { System } from './schema'

const CONTRACT_ROLE = 'Architecture + led a small team · freelance contract'

export const SYSTEMS: System[] = [
  // ---------- FEATURED (6) ----------
  {
    slug: 'aiva',
    name: 'AIVA Chat',
    domain: 'Voice AI',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['Twilio', 'ElevenLabs', 'OpenAI', 'Node.js'],
    summary:
      'A platform for deploying AI voice agents and embeddable chat widgets across web, phone, and apps — with full call recordings, logs, and per-conversation analytics.',
    url: 'https://aivachat.io/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'health-wealth-safe',
    name: 'Health Wealth Safe',
    domain: 'Healthcare · EMR',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Node.js', 'Twilio', 'Jitsi', 'MySQL', 'AWS'],
    summary:
      'A healthcare platform handling patient records, EMR, and billing, with real-time chat and video consultations across separate patient and staff applications.',
    url: 'https://www.healthwealthsafe.com/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'vetwise',
    name: 'VetWise',
    domain: 'Veterinary telehealth',
    region: 'CA',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS'],
    summary:
      'After-hours veterinary phone support and virtual consultations across Canada, booked in three steps.',
    url: 'https://getvetwise.com/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'yellowpad',
    name: 'YellowPad AI',
    domain: 'Legal',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Python', 'OpenAI', 'LLM prompt engineering'],
    summary:
      'Document data infrastructure for legal work — automated drafting of contracts, briefs, and standard agreements with intelligent templates.',
    url: 'https://www.yellowpad.ai/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'quickhub',
    name: 'Quick Hub',
    domain: 'Reputation · marketing',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Nest.js', 'GraphQL', 'Prisma', 'OpenAI'],
    summary:
      'An AI operating system for local business: review management, campaign automation, social scheduling, and WhatsApp automation in one console.',
    url: 'https://www.quickhub.ai/',
    status: 'LIVE',
    featured: true,
  },
  {
    slug: 'sydon',
    name: 'Sydon AI',
    domain: 'Agentic commerce',
    region: 'US',
    year: 2026,
    role: CONTRACT_ROLE,
    stack: ['OpenAI', 'AI agents', 'Data analytics', 'Amazon FBA'],
    summary:
      'An agentic operating system for commerce — account health, margin and FBA insight, competitor analysis, plus AI-driven outreach and reply automation.',
    url: 'https://sydon.ai/',
    status: 'LIVE',
    featured: true,
  },

  // ---------- ARCHIVE ----------
  {
    slug: 'frontdesk-clinic',
    name: 'FrontDesk Clinic',
    domain: 'Healthcare automation',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Node.js', 'OpenAI', 'Twilio'],
    summary:
      'Secure phone, fax, and text for healthcare practices, with an AI assistant handling scheduling, reminders, refills, and insurance verification.',
    url: 'https://frontdesk.clinic/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'mof-frontdesk',
    name: 'MOF FrontDesk AI',
    domain: 'Healthcare automation',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'PostgreSQL', 'OpenAI', 'Twilio', 'AWS'],
    summary:
      'An AI phone agent for medical offices: books, cancels, and reschedules appointments, with call logs, transcription, and a configurable agent voice.',
    // No url — client UAT environment behind a login. See spec §5.2.
    status: 'PRIVATE',
    featured: false,
  },
  {
    slug: 'hcomb',
    name: 'Hcomb',
    domain: 'Hiring · training',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'OpenAI'],
    summary:
      'AI-driven training and hiring — matches candidates to roles, automates job posting, and runs AI-conducted interviews.',
    url: 'https://www.hcomb.ai/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'corprite',
    name: 'CorpRite',
    domain: 'Governance · compliance',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Node.js', 'Blockchain', 'PostgreSQL'],
    summary:
      'Entity and equity management — secure records for shareholders, directors, and executives, with corporate governance tracking.',
    url: 'https://corprite.co/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'krone',
    name: 'Krone',
    domain: 'Compliance consulting',
    region: 'DK',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Node.js', 'React'],
    summary:
      'A Danish consultancy platform covering compliance, anti-corruption, financial management, and ESG advisory.',
    url: 'https://www.krone.one/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'advancedcare',
    name: 'AdvancedCare',
    domain: 'Healthcare · RCM',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Node.js', 'PostgreSQL', 'AWS'],
    summary:
      'Healthcare revenue-cycle management and EHR — patient data, telehealth consultation, and insurance claims processing.',
    url: 'https://advancedcare.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'pco-intelligence',
    name: 'PCO Intelligence',
    domain: 'Conversational AI',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['Amazon Lex', 'Amazon Connect', 'AWS Lambda'],
    summary:
      'AI-handled customer queries over a cloud call centre, with custom widget support for voice and chatbot interaction.',
    url: 'https://pcointelligence.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'lalo',
    name: 'Lalo',
    domain: 'Consumer AI',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['OpenAI', 'Node.js', 'AWS'],
    // Caption written from the live site (private family media), NOT the deck's
    // stale "free AI obituary writer" description. Spec §5.4.
    summary:
      'A private family media platform. Built the OpenAI-backed generation service behind its written content features.',
    url: 'https://www.lalo.app/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'reknew',
    name: 'ReKnew AI',
    domain: 'Enterprise modernization',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'OpenAI'],
    summary:
      'Data-platform modernization for enterprises — accelerating AI adoption and automating manual processes across legacy systems.',
    url: 'https://reknew.ai/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'omniai',
    name: 'OmniAI Chatbot',
    domain: 'Omnichannel support',
    region: 'US',
    year: 2025,
    role: CONTRACT_ROLE,
    stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Dialogflow', 'Shopify API'],
    summary:
      'A unified inbox for WhatsApp, Instagram, and email, with sentiment-aware AI replies, human handoff, and Shopify order sync.',
    url: 'https://omniaichatbot.com/',
    status: 'LIVE',
    featured: false,
  },
  {
    slug: 'stockly',
    name: 'Stockly',
    domain: 'Fintech · social',
    region: 'US',
    year: 2024,
    role: CONTRACT_ROLE,
    stack: ['React', 'React Native', 'Node.js', 'Python', 'PostgreSQL', 'Polygon API'],
    summary:
      'A social platform for stock-market discussion, connecting users with investors, experts, and AI assistants over real-time financial data.',
    status: 'PRIVATE',
    featured: false,
  },
  {
    slug: 'flourish-therapy',
    name: 'Flourish Together Therapy',
    domain: 'Healthcare · booking',
    region: 'US',
    year: 2024,
    role: 'Chatbot design and integration · freelance contract',
    stack: ['Landbot', 'Asana', 'Zapier'],
    summary:
      'A booking chatbot for a therapy practice — matches therapists, surfaces insurance providers, and books appointments via Asana and Zapier.',
    url: 'https://www.flourishtogethertherapy.com/',
    status: 'LIVE',
    featured: false,
  },
]
```

> **Implementer note:** this is **18** systems, not 20. `ServiceNow dashboards` and
> `Goodfin` are deliberately omitted pending scope confirmation (spec §15.1) — a bare link
> to either would read as claiming the company. Task 11 asserts the *featured* count is 6;
> nothing asserts a total of 20, so adding them later needs no test changes. Until they're
> resolved, no site copy may claim "20 systems" — Task 9 derives the count from
> `SYSTEMS.length`.

- [ ] **Step 6: Write `src/content/index.ts`**

```ts
import { SYSTEMS } from './systems'
import type { System } from './schema'

export const getFeatured = (): System[] =>
  SYSTEMS.filter((s) => s.featured).sort((a, b) => b.year - a.year)

export const getArchive = (): System[] =>
  SYSTEMS.filter((s) => !s.featured).sort((a, b) => b.year - a.year)

export const getBySlug = (slug: string): System | undefined =>
  SYSTEMS.find((s) => s.slug === slug)

export const getAllSlugs = (): string[] => SYSTEMS.map((s) => s.slug)

export const countSystems = (): number => SYSTEMS.length
export const countDomains = (): number => new Set(SYSTEMS.map((s) => s.domain)).size
export const countRegions = (): number => new Set(SYSTEMS.map((s) => s.region)).size

export { SYSTEMS }
export type { System }
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test -- systems`
Expected: PASS — 7 passed.

- [ ] **Step 8: Commit**

```bash
git add src/content/
git commit -m "feat(content): add identity, trajectory, and 18 typed systems"
```

---

### Task 4: The scramble algorithm

Pure, deterministic, no React. Plan 2's `ScrambleText` animation will drive this; Task 5 renders its output statically.

**Files:**
- Create: `src/lib/scramble.ts`, `src/lib/scramble.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/scramble.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { scrambleFrame } from './scramble'

describe('scrambleFrame', () => {
  it('returns the exact target at progress 1', () => {
    expect(scrambleFrame('SHYAMSINH', 1, 0)).toBe('SHYAMSINH')
  })

  it('returns a string of target length at progress 0', () => {
    expect(scrambleFrame('SHYAMSINH', 0, 0)).toHaveLength(9)
  })

  it('resolves left to right — an early char settles before a late one', () => {
    const mid = scrambleFrame('SHYAMSINH', 0.5, 0)
    expect(mid.slice(0, 4)).toBe('SHYA')
    expect(mid).toHaveLength(9)
  })

  it('is deterministic for the same seed', () => {
    expect(scrambleFrame('SHYAMSINH', 0.3, 7)).toBe(scrambleFrame('SHYAMSINH', 0.3, 7))
  })

  it('preserves spaces at any progress', () => {
    const out = scrambleFrame('AI ARCHITECT', 0.2, 3)
    expect(out[2]).toBe(' ')
  })

  it('clamps progress above 1', () => {
    expect(scrambleFrame('AB', 5, 0)).toBe('AB')
  })

  it('handles the empty string', () => {
    expect(scrambleFrame('', 0.5, 0)).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- scramble`
Expected: FAIL — cannot resolve `./scramble`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/scramble.ts`:

```ts
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*<>/#$%&_'

/** Deterministic PRNG — animation must be reproducible for tests and for resume-on-scroll. */
const rand = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * One frame of the decode effect.
 *
 * Characters resolve left to right: at progress p, the first p*length characters
 * are settled and the rest are glyph noise. Spaces never scramble — they hold the
 * word shape steady so the layout doesn't jitter.
 *
 * @param target   the final string
 * @param progress 0 = fully scrambled, 1 = fully resolved (clamped)
 * @param seed     varies the noise; same seed + same progress = same output
 */
export const scrambleFrame = (target: string, progress: number, seed = 0): string => {
  const p = Math.min(1, Math.max(0, progress))
  const settled = Math.floor(target.length * p)

  let out = ''
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    if (i < settled || ch === ' ') {
      out += ch
    } else {
      const g = Math.floor(rand(seed + i * 7.13) * GLYPHS.length)
      out += GLYPHS[g]
    }
  }
  return out
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- scramble`
Expected: PASS — 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scramble.ts src/lib/scramble.test.ts
git commit -m "feat(lib): add deterministic scramble frame function"
```

---

### Task 5: Design tokens, fonts, and `ScrambleText`

`ScrambleText` is built **accessibility-first**: the real string is in the DOM and the accessibility tree from first paint, always. The scramble is a decorative overlay (spec §13). On these static routes it renders plain text — Plan 2 turns the animation on at `/`.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/text/ScrambleText.tsx`, `src/components/text/ScrambleText.test.tsx`

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg:     #e9e9e9;
  --color-panel:  #f4f4f4;
  --color-ink:    #2b2b2b;

  /*
   * TEXT greys must clear WCAG AA 4.5:1 at the 10px label sizes this site uses.
   * The reference site's #8d8d8d scores 2.73:1 on #e9e9e9 — it fails badly for text,
   * and copying it verbatim would make every HUD label on this site unreadable to
   * anyone with low vision or a sunlit screen. Measured values:
   *   --color-dim   #696969 → 4.52:1 on bg, 4.99:1 on panel. Safe for any text.
   *   --color-ghost #8d8d8d → decorative ONLY. Never on text. Brackets and lines.
   * Do not use --color-ghost for a label, however small. See spec §13.
   */
  --color-dim:    #696969;
  --color-ghost:  #8d8d8d;

  --color-border: #00000022;
  --color-hair:   #00000010;

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace;

  --tracking-hud:  0.2em;
  --tracking-wide: 0.42em;
}

body {
  background-color: var(--color-bg);
  color: var(--color-ink);
}

/* The 26px archive grid — spec §10. */
.hud-grid {
  background-image:
    linear-gradient(var(--color-hair) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-hair) 1px, transparent 1px);
  background-size: 26px 26px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { IDENTITY } from '@/content/identity'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${IDENTITY.name} — ${IDENTITY.title}`,
  description: `${IDENTITY.title}. AI systems, backend architecture, and cloud infrastructure. ${IDENTITY.location}.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Write the failing test**

Create `src/components/text/ScrambleText.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrambleText } from './ScrambleText'

describe('ScrambleText', () => {
  it('exposes the real text to the accessibility tree', () => {
    render(<ScrambleText text="SHYAMSINH PARMAR" />)
    expect(screen.getByText('SHYAMSINH PARMAR')).toBeInTheDocument()
  })

  it('renders as plain text when not animated', () => {
    const { container } = render(<ScrambleText text="AI ARCHITECT" />)
    expect(container.textContent).toBe('AI ARCHITECT')
  })

  it('renders the given element type', () => {
    render(<ScrambleText as="h1" text="RECORD" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RECORD')
  })

  it('applies the supplied class name', () => {
    const { container } = render(<ScrambleText text="X" className="text-dim" />)
    expect(container.firstChild).toHaveClass('text-dim')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- ScrambleText`
Expected: FAIL — cannot resolve `./ScrambleText`.

- [ ] **Step 5: Write the implementation**

Create `src/components/text/ScrambleText.tsx`:

```tsx
import type { ElementType } from 'react'

type Props = {
  text: string
  as?: ElementType
  className?: string
}

/**
 * Renders text that Plan 2 will animate with a decode effect.
 *
 * The real string is always the DOM's text content, so screen readers and search
 * engines see it from first paint (spec §13). The animation, when added, mutates a
 * separate aria-hidden layer only — it must never become the accessible name.
 */
export function ScrambleText({ text, as: Tag = 'span', className }: Props) {
  return <Tag className={className}>{text}</Tag>
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- ScrambleText`
Expected: PASS — 4 passed.

- [ ] **Step 7: Verify the build still succeeds**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/text/
git commit -m "feat(ui): add design tokens, fonts, and accessible ScrambleText"
```

---

### Task 6: HUD primitives

**Files:**
- Create: `src/components/hud/CornerBracket.tsx`, `src/components/hud/HudFrame.tsx`, `src/components/hud/HudFrame.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/HudFrame.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HudFrame } from './HudFrame'

describe('HudFrame', () => {
  it('renders its children', () => {
    render(<HudFrame><p>RECORD_LOG</p></HudFrame>)
    expect(screen.getByText('RECORD_LOG')).toBeInTheDocument()
  })

  it('renders the label when given one', () => {
    render(<HudFrame label="ARCHIVE://"><p>x</p></HudFrame>)
    expect(screen.getByText('ARCHIVE://')).toBeInTheDocument()
  })

  it('exposes a persistent contact link at every depth', () => {
    render(<HudFrame><p>x</p></HudFrame>)
    const link = screen.getByRole('link', { name: /uplink/i })
    expect(link).toHaveAttribute('href', '/contact')
  })

  it('marks decorative brackets as hidden from assistive tech', () => {
    const { container } = render(<HudFrame><p>x</p></HudFrame>)
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- HudFrame`
Expected: FAIL — cannot resolve `./HudFrame`.

- [ ] **Step 3: Write `src/components/hud/CornerBracket.tsx`**

```tsx
type Corner = 'tl' | 'tr' | 'bl' | 'br'

const EDGES: Record<Corner, string> = {
  tl: 'top-3 left-3 border-l border-t',
  tr: 'top-3 right-3 border-r border-t',
  bl: 'bottom-3 left-3 border-l border-b',
  br: 'bottom-3 right-3 border-r border-b',
}

/** Purely decorative chrome — always hidden from assistive tech. */
export function CornerBracket({ corner }: { corner: Corner }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute h-4 w-4 border-[var(--color-ghost)] ${EDGES[corner]}`}
    />
  )
}
```

- [ ] **Step 4: Write `src/components/hud/HudFrame.tsx`**

```tsx
import Link from 'next/link'
import { CornerBracket } from './CornerBracket'

type Props = {
  children: React.ReactNode
  label?: string
}

/**
 * The persistent chrome: grid, corner brackets, and a contact link that is
 * reachable at every scroll depth (spec §9.07).
 */
export function HudFrame({ children, label }: Props) {
  return (
    <div className="hud-grid relative min-h-dvh w-full">
      <CornerBracket corner="tl" />
      <CornerBracket corner="tr" />
      <CornerBracket corner="bl" />
      <CornerBracket corner="br" />

      {label && (
        <div className="absolute top-6 left-8 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]">
          {label}
        </div>
      )}

      <Link
        href="/contact"
        className="absolute top-6 right-8 z-20 font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
      >
        ◂ UPLINK
      </Link>

      {children}
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- HudFrame`
Expected: PASS — 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/hud/
git commit -m "feat(ui): add HUD frame and corner bracket primitives"
```

---

### Task 7: The SystemRecord component

**Files:**
- Create: `src/components/record/SystemRecord.tsx`, `src/components/record/SystemRecord.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/record/SystemRecord.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemRecord } from './SystemRecord'
import type { System } from '@/content/schema'

const live: System = {
  slug: 'aiva',
  name: 'AIVA Chat',
  domain: 'Voice AI',
  region: 'US',
  year: 2025,
  role: 'Architecture + led a small team · freelance contract',
  stack: ['Twilio', 'OpenAI'],
  summary: 'AI voice agents.',
  url: 'https://aivachat.io/',
  status: 'LIVE',
  featured: true,
}

const priv: System = { ...live, slug: 'mof', name: 'MOF', status: 'PRIVATE', url: undefined }

describe('SystemRecord', () => {
  it('renders name, domain, role, and year', () => {
    render(<SystemRecord system={live} index={0} />)
    expect(screen.getByText('AIVA Chat')).toBeInTheDocument()
    expect(screen.getByText(/Voice AI/)).toBeInTheDocument()
    expect(screen.getByText(/led a small team/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
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
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- SystemRecord`
Expected: FAIL — cannot resolve `./SystemRecord`.

- [ ] **Step 3: Write the implementation**

Create `src/components/record/SystemRecord.tsx`:

```tsx
import type { System } from '@/content/schema'
import { ScrambleText } from '@/components/text/ScrambleText'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export function SystemRecord({ system, index }: { system: System; index: number }) {
  const num = String(index + 1).padStart(2, '0')
  const host = system.url ? new URL(system.url).hostname.replace(/^www\./, '') : null

  return (
    <article className="relative border border-[var(--color-border)] bg-[var(--color-panel)]/60 px-7 py-7 md:px-8">
      <div className={LABEL}>RECORD {num}</div>

      <ScrambleText
        as="h2"
        text={system.name}
        className="mt-3 font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]"
      />

      <dl className="mt-5 space-y-1">
        <div className="flex gap-3">
          <dt className={LABEL}>DOMAIN</dt>
          <dd className={LABEL}>{system.domain} · {system.region}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={LABEL}>ROLE</dt>
          <dd className={LABEL}>{system.role}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={LABEL}>YEAR</dt>
          <dd className={LABEL}>{system.year}</dd>
        </div>
      </dl>

      <p className="mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-ink)]">
        {system.summary}
      </p>

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- SystemRecord`
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/record/
git commit -m "feat(ui): add SystemRecord component"
```

---

### Task 8: The `/systems/[slug]` route

**Files:**
- Create: `src/app/systems/[slug]/page.tsx`
- Delete: `src/app/page.tsx` default scaffold content (replaced in Step 4)

- [ ] **Step 1: Write the route**

Create `src/app/systems/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getBySlug, getAllSlugs, getFeatured } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { SystemRecord } from '@/components/record/SystemRecord'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const system = getBySlug(slug)
  if (!system) return {}
  return {
    title: `${system.name} — ${system.domain}`,
    description: system.summary,
  }
}

export default async function SystemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const system = getBySlug(slug)
  if (!system) notFound()

  const index = getFeatured().findIndex((s) => s.slug === slug)

  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <SystemRecord system={system} index={index === -1 ? 0 : index} />
        <Link
          href="/archive"
          className="mt-8 inline-block font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] hover:text-[var(--color-ink)]"
        >
          ◂ BACK TO INDEX
        </Link>
      </main>
    </HudFrame>
  )
}
```

- [ ] **Step 2: Verify it builds as static pages**

Run: `npm run build`
Expected: `✓ Compiled successfully`, and the route table lists `/systems/[slug]` as `SSG` with **18** generated paths.

- [ ] **Step 3: Verify it renders**

Run: `npm run dev`, then open `http://localhost:3000/systems/aiva`
Expected: the AIVA record renders with the HUD grid, corner brackets, and an `aivachat.io` link. Stop the server when done.

- [ ] **Step 4: Replace the scaffold home page with a temporary index**

Plan 2 replaces this entirely with the cinematic scroll. This exists so `/` isn't the Next.js default page.

Create `src/app/page.tsx`:

```tsx
import Link from 'next/link'
import { IDENTITY, yearsExperience } from '@/content/identity'
import { getFeatured, countSystems, countDomains, countRegions } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import { ScrambleText } from '@/components/text/ScrambleText'

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export default function Home() {
  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        <div className={LABEL}>// IDENTITY</div>
        <ScrambleText
          as="h1"
          text={IDENTITY.name}
          className="mt-3 font-mono text-2xl tracking-[var(--tracking-wide)] text-[var(--color-ink)] md:text-4xl"
        />
        <div className={`${LABEL} mt-3`}>{IDENTITY.title.toUpperCase()}</div>
        <div className={`${LABEL} mt-1`}>
          {yearsExperience()} YRS · {countSystems()} SYSTEMS · {countDomains()} DOMAINS ·{' '}
          {countRegions()} REGIONS · {IDENTITY.locationCode}
        </div>

        <ul className="mt-14 space-y-3">
          {getFeatured().map((s) => (
            <li key={s.slug}>
              <Link
                href={`/systems/${s.slug}`}
                className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-3 hover:border-[var(--color-ink)]"
              >
                <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
                  {s.name}
                </span>
                <span className={LABEL}>{s.domain} · {s.year} ▸</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/archive" className={`${LABEL} mt-8 hover:text-[var(--color-ink)]`}>
          ▸ FULL ARCHIVE INDEX
        </Link>
      </main>
    </HudFrame>
  )
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/app/
git commit -m "feat(routes): add static /systems/[slug] route and interim home"
```

---

### Task 9: The `/archive` route

**Files:**
- Create: `src/app/archive/page.tsx`

- [ ] **Step 1: Write the route**

Create `src/app/archive/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeatured, getArchive, countSystems } from '@/content'
import { HudFrame } from '@/components/hud/HudFrame'
import type { System } from '@/content/schema'

export const metadata: Metadata = {
  title: 'Archive Index',
  description: 'Every system, by year.',
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

function Row({ system }: { system: System }) {
  return (
    <li>
      <Link
        href={`/systems/${system.slug}`}
        className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--color-border)] py-3 hover:border-[var(--color-ink)] md:grid-cols-[1fr_1fr_auto]"
      >
        <span className="font-mono text-sm tracking-[var(--tracking-hud)] text-[var(--color-ink)]">
          {system.name}
        </span>
        <span className={`${LABEL} hidden md:block`}>{system.domain}</span>
        <span className={LABEL}>
          {system.region} · {system.year} ▸
        </span>
      </Link>
    </li>
  )
}

export default function ArchivePage() {
  return (
    <HudFrame label="ARCHIVE://">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
        <h1 className="font-mono text-xl tracking-[var(--tracking-wide)] text-[var(--color-ink)]">
          ARCHIVE INDEX
        </h1>
        <div className={`${LABEL} mt-2`}>{countSystems()} SYSTEMS · BY YEAR</div>

        <div className={`${LABEL} mt-12`}>// FEATURED</div>
        <ul className="mt-3">
          {getFeatured().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        <div className={`${LABEL} mt-12`}>// INDEX</div>
        <ul className="mt-3">
          {getArchive().map((s) => <Row key={s.slug} system={s} />)}
        </ul>

        <Link href="/" className={`${LABEL} mt-10 inline-block hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `/archive` listed as static.

- [ ] **Step 3: Commit**

```bash
git add src/app/archive/
git commit -m "feat(routes): add /archive index"
```

---

### Task 10: The `/contact` route

**Files:**
- Create: `src/app/contact/page.tsx`

- [ ] **Step 1: Write the route**

Create `src/app/contact/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { IDENTITY } from '@/content/identity'
import { HudFrame } from '@/components/hud/HudFrame'

export const metadata: Metadata = {
  title: 'Uplink',
  description: `Contact ${IDENTITY.name}.`,
}

const LABEL = 'font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)]'

export default function ContactPage() {
  return (
    <HudFrame label="UPLINK://">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-24">
        <div className={LABEL}>// UPLINK</div>

        <a
          href={`mailto:${IDENTITY.email}`}
          className="mt-4 font-mono text-lg tracking-[0.14em] text-[var(--color-ink)] underline underline-offset-8 md:text-2xl"
        >
          {IDENTITY.email}
        </a>

        <div className={`${LABEL} mt-3`}>
          {IDENTITY.location.toUpperCase()} · REMOTE · FREELANCE CONTRACT
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3">
          {IDENTITY.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-[var(--tracking-hud)] text-[var(--color-dim)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
              >
                {l.label} ▸
              </a>
            </li>
          ))}
        </ul>

        <Link href="/" className={`${LABEL} mt-16 hover:text-[var(--color-ink)]`}>
          ◂ BACK
        </Link>
      </main>
    </HudFrame>
  )
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/contact/
git commit -m "feat(routes): add /contact uplink"
```

---

### Task 11: End-to-end tests

Covers spec §14 items 2 and 3. (Item 1 — gate → boot → scroll — belongs to Plan 2.)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/routes.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

- [ ] **Step 2: Write the failing test**

Create `tests/e2e/routes.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('static routes are fast and intro-free', () => {
  test('a direct hit on a system record renders immediately', async ({ page }) => {
    await page.goto('/systems/aiva')
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
    await expect(page.getByText(/OUTPUT ROUTING/i)).toHaveCount(0)
    await expect(page.getByText(/LOADING/i)).toHaveCount(0)
  })

  test('a record route ships no WebGL and no GSAP', async ({ page }) => {
    const heavy: string[] = []
    page.on('request', (r) => {
      const u = r.url()
      if (/three|gsap|lenis/i.test(u)) heavy.push(u)
    })
    await page.goto('/systems/aiva')
    await page.waitForLoadState('networkidle')
    expect(heavy).toEqual([])
  })

  test('contact is reachable from a record in one click', async ({ page }) => {
    await page.goto('/systems/aiva')
    await page.getByRole('link', { name: /uplink/i }).click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('link', { name: /parmarshyamsingh8@gmail.com/ })).toBeVisible()
  })

  test('the archive index lists every system', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.getByRole('heading', { name: 'ARCHIVE INDEX' })).toBeVisible()
    const rows = page.locator('main ul li a')
    expect(await rows.count()).toBe(18)
  })

  test('no page links a known-private host', async ({ page }) => {
    for (const path of ['/', '/archive', '/contact', '/systems/mof-frontdesk']) {
      await page.goto(path)
      const html = await page.content()
      expect(html).not.toContain('ai-uat.medicalofficeforce.co')
    }
  })

  test('an unknown slug 404s', async ({ page }) => {
    const res = await page.goto('/systems/does-not-exist')
    expect(res?.status()).toBe(404)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('full content renders with reduced motion', async ({ page }) => {
    await page.goto('/systems/aiva')
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
    await expect(page.getByText(/AI voice agents/i)).toBeVisible()
  })
})
```

- [ ] **Step 3: Run the tests**

Run: `npm run e2e`
Expected: PASS — 7 passed. If the archive count assertion fails, the count in the test must match `SYSTEMS.length`; update the test only if a system was intentionally added or removed.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/
git commit -m "test(e2e): verify routes are instant, light, and private-host clean"
```

---

### Task 12: Ship it

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add CI**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2: Verify the full suite locally**

Run: `npm run lint && npm test && npm run build && npm run e2e`
Expected: all four pass. **Do not proceed until they do.**

- [ ] **Step 3: Verify the performance budget (spec §12)**

The spec sets LCP < 2.0s on these static routes. Measure rather than assume:

```bash
npm run build && npm start &
npx lighthouse http://localhost:3000/systems/aiva \
  --only-categories=performance,accessibility \
  --preset=desktop --quiet --chrome-flags="--headless" \
  --output=json --output-path=/tmp/lh.json
node -e "const r=require('/tmp/lh.json');console.log('LCP',r.audits['largest-contentful-paint'].displayValue);console.log('perf',r.categories.performance.score);console.log('a11y',r.categories.accessibility.score)"
kill %1
```

Expected: LCP well under 2.0s and accessibility scoring 1.0. These routes are static text
with no images or animation libraries — anything slow here means something heavy leaked in
from Plan 2's dependencies, which is exactly what this check exists to catch.

If the accessibility score is below 1.0, **do not paper over it** — the contrast tokens in
Task 5 were chosen specifically to pass, so a failure means a component is using
`--color-ghost` on text somewhere.

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "ci: run lint, unit, and e2e on push"
```

- [ ] **Step 5: Deploy**

Deployment touches an account and a public URL, so **stop here and confirm with Shyamsinh** rather than deploying unprompted. When approved:

```bash
npx vercel --prod
```

Expected: a live URL serving `/`, `/systems/aiva`, `/archive`, `/contact`.

---

## Definition of done

- [ ] `npm run lint && npm test && npm run build && npm run e2e` all pass
- [ ] `/systems/aiva` loads with no gate, no boot, and no WebGL or GSAP requests
- [ ] `ai-uat.medicalofficeforce.co` appears **nowhere** in the built output
- [ ] Every outbound link in `identity.ts` has been opened and confirmed to resolve
  (the LinkedIn/Upwork/Fiverr URLs are constructed guesses — see Task 3 Step 3)
- [ ] `prefers-reduced-motion` renders complete content
- [ ] Lighthouse accessibility = 1.0 and LCP < 2.0s on `/systems/aiva`
- [ ] No component uses `--color-ghost` on text
- [ ] The site is deployable and genuinely usable **before** Plan 2 exists

## Then

Plan 2 (the cinematic layer — gate, boot, constellation canvas, pinned scroll at `/`) gets written once this lands. It replaces `src/app/page.tsx` and touches nothing else in this plan.

**Before any of this is published**, spec §15 must be resolved: the 2018 anchor, ServiceNow/Goodfin scope, and client consent to be named.
