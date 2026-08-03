# SEO Plan — shyamsinh.qzz.io

Target keywords: **shyamsinh** · **rajkot** · **ai developer**

Companion to [SEO_RULES.md](SEO_RULES.md), which is the general standard. This document is
specific to this site, audited against the live build on 2026-08-03.

---

## 1. Where the site actually stands

Measured from `out/` after `npm run build`, not from memory.

| Signal | State | Verdict |
| --- | --- | --- |
| `<title>` / `<meta description>` | Present on all routes | OK |
| Canonical URLs | Self-referential per route | OK |
| Open Graph + Twitter card | Full, with generated 1200×630 image | OK |
| Server-rendered content | Yes — content is in the HTML, boot overlay sits on top | OK |
| `h1` on `/` and `/archive` | 1 each | OK |
| **`h1` on `/contact` and all 18 `/systems/*`** | **0** | **Broken** |
| **Title template** | **None** — `/contact` titles as just `Uplink` | **Broken** |
| **`sitemap.xml`** | **Absent** | **Missing** |
| **`robots.txt`** | **Absent** | **Missing** |
| **JSON-LD structured data** | **Absent** | **Missing** |
| **"Rajkot" as a location** | **Never stated** | **Missing** |
| **"AI Developer" as a term** | **Never used** | **Missing** |

### The three keywords, honestly

**`shyamsinh`** — the only one the site currently supports. The name is the homepage `h1`,
the `og:site_name`, and half of every title. The competition is other people named
Shyamsinh, so this is an *entity* problem, not a content problem: Google needs to be
confident which Shyamsinh this is. That is what JSON-LD `sameAs` and the profile links are
for (§4.3).

**`rajkot`** — the site does not contain this word as a location. `grep -rin rajkot src/`
returns exactly one content hit: `ITI RAJKOT` in [trajectory.ts:17](src/content/trajectory.ts:17),
which is the *name of a school*, not a statement of where he works.
[identity.ts](src/content/identity.ts:22) says `location: 'Gujarat, India'`, and that string
is what the hero, the contact page, the OG card, and every meta description render.

You cannot rank for a city you never name. This is the single highest-leverage fix in this
document, and it is a one-word content change — see §3.1.

**`ai developer`** — appears nowhere. The site's chosen identity is
`AI & Backend Architect` ([identity.ts:5](src/content/identity.ts:5)). That is a *better*
positioning term and a *worse* search term: "architect" is what senior clients call the
role, "developer" is what people type. Do not rewrite the positioning to chase volume — see
§3.3 for how to carry both.

Also worth being realistic: `ai developer` unqualified is a global head term you will not
win with a portfolio site. `ai developer rajkot`, `ai developer in gujarat`, and
`voice ai developer india` are winnable. Target those; the head term arrives as a
by-product, not as a goal.

---

## 2. Keyword map — one intent per page

SEO_RULES.md §2: one article, one intent. Same rule for routes.

| Route | Primary | Secondary | Intent |
| --- | --- | --- | --- |
| `/` | shyamsinh parmar | ai developer rajkot, ai & backend architect, voice ai developer india | Branded / identity |
| `/archive` | ai projects portfolio | voice ai case studies, llm pipeline projects, ai systems built in india | Informational |
| `/contact` | hire ai developer rajkot | freelance ai developer gujarat, contract voice ai developer | Transactional |
| `/systems/<slug>` | *per project* — e.g. `twilio voice ai platform`, `ai front desk for clinics` | project stack terms (Twilio, ElevenLabs, OpenAI, RAG) | Informational / proof |

The 18 record pages are the site's real SEO asset. They are the only pages with unique,
specific, long-tail-shaped content — and they are currently the *weakest* configured pages
on the site (no `h1`, 20-character titles). Fixing them is §3.2.

---

## 3. On-page fixes, in priority order

### 3.1 — P0 · Name the city

**Why first:** zero-cost, unblocks the entire `rajkot` keyword, and every other local signal
(JSON-LD `addressLocality`, local long-tails, map-intent queries) depends on it.

In [src/content/identity.ts](src/content/identity.ts:22):

```ts
location: 'Rajkot, Gujarat, India',
```

That one string propagates automatically to the hero, the contact page, the OG card, and the
meta descriptions on `/` and `/contact`, because they all read `IDENTITY.location`.

> **Confirm this is accurate before shipping it.** The repo's own note in
> [systems.ts:15](src/content/systems.ts:15) records that AIVA's live footer reads "Made with
> care in Rajkot", which supports it — but a location claim on a freelance site is a
> commitment to clients about timezone and availability, so it is yours to confirm, not
> mine to infer. If the honest answer is "Gujarat, remote", then drop `rajkot` as a target
> rather than manufacturing a signal. A city you do not work in is not a keyword, it is a
> lie that ranks briefly.

Related: `locationCode: 'IN'` stays as is — it feeds the telemetry map, not SEO.

### 3.2 — P0 · Give every page exactly one `h1`

19 of 21 pages have no `h1` at all. SEO_RULES.md §8 requires one.

- **`/systems/<slug>`** — the record title currently renders as `h2`
  ([SystemRecord.tsx](src/components/record/SystemRecord.tsx)). Promote it to `h1` and
  demote the section headings below it one level. This is 18 pages of the site's best
  content, all currently headless.
- **`/contact`** — [contact/page.tsx](src/app/contact/page.tsx) renders no `h1`. Add one.
  `UPLINK` is on-brand but says nothing to a crawler; something like
  `Contact Shyamsinh Parmar — AI Developer, Rajkot` carries the intent.

Keep the HUD styling. An `h1` styled at 10px with wide tracking is still an `h1`; heading
*level* and visual weight are independent, and the site already proves this on `/archive`.

### 3.3 — P1 · Title template, and carrying "AI Developer"

Right now `<title>Uplink</title>` is the entire title of the contact page. Six characters,
no name, no keyword, no brand. Same shape on every record: `AIVA Chat — Voice AI`.

Add a template to the root layout ([layout.tsx](src/app/layout.tsx:18)):

```ts
title: {
  default: SITE_TITLE,
  template: '%s — Shyamsinh Parmar',
},
```

Every child title then ends in the brand for free: `Uplink — Shyamsinh Parmar`,
`AIVA Chat — Voice AI — Shyamsinh Parmar`. Targets 55–60 chars (SEO_RULES.md §5).

For the `ai developer` term specifically — carry it in the *supporting* copy, not by
replacing `AI & Backend Architect`:

- meta descriptions (already keyword-bearing, keep them 140–160)
- the JSON-LD `jobTitle` array (§4.3), where both terms can coexist truthfully
- one `h2` or intro line on `/contact`

This is SEO_RULES.md §9 keyword placement, without the §9 warning about stuffing.

### 3.4 — P2 · Description lengths

Measured: `/` = 103 chars, `/archive` = 136, `/contact` = 155. Target is 140–160.
Only `/` is meaningfully short — it has room for the city and one more capability term.

---

## 4. Technical SEO

### 4.1 — `sitemap.xml`

Absent. Add [src/app/sitemap.ts](src/app/sitemap.ts) generating all 21 URLs from
`getAllSlugs()`, so it can never drift from the archive.

Under `output: 'export'` this needs `export const dynamic = 'force-static'`, exactly like
the metadata image routes — see the note in
[opengraph-image.tsx](src/app/opengraph-image.tsx:47) for why the build fails without it.

It emits `/sitemap.xml`, which carries an extension, so it needs **no** entry in the
CloudFront passthrough in [infra/shyamsinh-rewrite.js](infra/shyamsinh-rewrite.js).

### 4.2 — `robots.txt`

Absent. Add [src/app/robots.ts](src/app/robots.ts): allow all, and point at the sitemap.
Same `force-static` requirement, same "has an extension, no passthrough needed" note.

Do not block AI crawlers (GPTBot, ClaudeBot, PerplexityBot) unless you want to. For a
freelance portfolio, being quotable by an assistant answering "AI developers in Rajkot" is
the point — see SEO_RULES.md §19.

### 4.3 — JSON-LD structured data

The biggest missing *entity* signal, and the one that most directly serves the `shyamsinh`
keyword. SEO_RULES.md §14 asks for it; the site has none.

Add a `Person` (or `ProfilePage`) block to the homepage, built from `IDENTITY` so it cannot
drift from the rendered content:

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Shyamsinh Parmar",
  "url": "https://shyamsinh.qzz.io",
  "jobTitle": ["AI & Backend Architect", "AI Developer"],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Rajkot",
    "addressRegion": "Gujarat",
    "addressCountry": "IN"
  },
  "knowsAbout": ["Voice AI", "LLM pipelines", "Backend architecture", "Cloud infrastructure"],
  "sameAs": [ /* every href in IDENTITY.links */ ]
}
```

`sameAs` is what resolves the ambiguity between this Shyamsinh and every other one — it ties
the name to the GitHub, Upwork, and Fiverr profiles Google already knows about.

> One caveat from the repo's own records: the LinkedIn URL in
> [identity.ts:41](src/content/identity.ts:41) is flagged **UNCONFIRMED**. Do not put an
> unverified profile in `sameAs` — a wrong `sameAs` actively teaches Google the wrong entity.
> Confirm it or omit that one row.

Per-record pages can additionally carry `CreativeWork` / `SoftwareApplication`, but do that
only after §3.2; a structured-data block on a page with no `h1` is polish over a crack.

### 4.4 — Already handled, do not redo

Canonicals, OG/Twitter cards, the generated social image, favicons, `metadataBase`, and
clean-URL routing are all done and verified live. See
[src/lib/seo.ts](src/lib/seo.ts) for the per-route metadata contract before adding pages —
a new route that forgets `pageMetadata()` inherits nothing route-shaped and will publish no
canonical at all.

---

## 5. Off-site — the part the codebase cannot do

Ranking for a personal name and a city is mostly won off-site.

1. **Google Search Console** — verify the domain, submit the sitemap, confirm indexing. The
   site has never been submitted; until it is, everything above is theoretical.
2. **Consistent NAP** — name, area, and role identical across GitHub, Upwork, Fiverr, and
   LinkedIn. Inconsistency is the most common reason a personal-entity query stays ambiguous.
3. **The `.qzz.io` domain is a real constraint.** It is a free subdomain, not a registrable
   root domain, which gives it no independent domain authority and makes it harder to build
   the trust signals a name query needs. If this site matters commercially, a
   `shyamsinh.com`-class domain is worth more than every on-page fix in §3 combined. Migrate
   with 301s before building links, not after.
4. **Proof content** — the archive already contains 18 real systems. Writing even three of
   them up as full case studies (per the SEO_RULES.md template) would give the site its
   first genuinely rankable long-tail pages.

---

## 6. Suggested order of work

| # | Change | Effort | Impact |
| --- | --- | --- | --- |
| 1 | `location: 'Rajkot, Gujarat, India'` (§3.1) | 1 line | Unblocks `rajkot` entirely |
| 2 | `h1` on `/contact` + 18 records (§3.2) | small | Fixes 19 pages |
| 3 | Title template (§3.3) | 4 lines | Every title gains the brand |
| 4 | `sitemap.ts` + `robots.ts` (§4.1–4.2) | small | Indexation |
| 5 | JSON-LD `Person` (§4.3) | medium | `shyamsinh` entity resolution |
| 6 | Search Console + sitemap submission (§5.1) | small | Makes 1–5 measurable |
| 7 | Domain decision (§5.3) | large | Ceiling on everything else |

Items 1–5 are all in this repo and verifiable with `npm run build` plus a `grep` over
`out/`. Item 6 is where you find out whether any of it worked.
