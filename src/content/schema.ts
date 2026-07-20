import { z } from 'zod'

/**
 * Hosts that must never appear in a published link.
 * `ai-uat.medicalofficeforce.co` is a client's UAT environment behind a login.
 * Publishing it would expose a client's internal system — see spec §5.2.
 */
export const PRIVATE_HOSTS: readonly string[] = ['ai-uat.medicalofficeforce.co']

/** First paid backend work. Every "years of experience" figure derives from this. */
export const CAREER_START_YEAR = 2018

/**
 * The hostname, normalised for comparison.
 *
 * The trailing dot matters. `ai-uat.example.co.` is the fully-qualified form of
 * `ai-uat.example.co` — DNS treats the trailing dot as the root label and both
 * names resolve to the SAME server. `new URL()` preserves it verbatim, so a naive
 * `hostname === host` check lets `https://ai-uat.example.co./login` through while
 * still loading the client's private environment. The URL parser also decodes
 * `%2e` into a literal dot, which lands in the same place.
 *
 * Stripping trailing dots closes both. `URL.hostname` already lowercases, so case
 * variation is handled for free.
 */
const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/\.+$/, '')
  } catch {
    return null
  }
}

/**
 * Is this hostname the private host, or anything under it?
 *
 * Matches the host itself and any subdomain of it (`app.ai-uat.example.co`), since
 * a subdomain of a client's UAT environment is still that client's UAT environment.
 * The dot in the suffix check is what keeps it precise: `ai-uat.example.co.evil.com`
 * does NOT end with `.ai-uat.example.co`, so a lookalike registered elsewhere is
 * correctly left alone. Over-blocking would silently drop legitimate client links,
 * which is its own kind of failure.
 */
const isPrivateHost = (host: string): boolean =>
  PRIVATE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))

export const SystemSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase, url-safe'),
    name: z.string().min(1),
    domain: z.string().min(1),
    /**
     * The broad vertical, from a fixed list — deliberately coarse.
     *
     * `domain` is the specific descriptor shown on a record ("Healthcare · EMR");
     * `sector` is the rollup used for counting. They are different jobs: counting
     * distinct `domain` strings returns ~one-per-project, which is not a fact about
     * breadth, it's a fact about how many projects there are. Keep this list short —
     * if every project gets its own sector, the count is worthless again.
     */
    sector: z.enum([
      'Healthcare',
      'Conversational AI',
      'Compliance',
      'Legal',
      'Commerce',
      'Marketing',
      'Hiring',
      'Enterprise',
      'Fintech',
    ]),
    region: z.enum(['US', 'CA', 'DK', 'IN']),
    /**
     * Who this was built for.
     *
     * Most of the archive is client contract work. AIVA is not — it is Shyamsinh's
     * own product, built and operated under Woyce Tech. That distinction has to live
     * in the data rather than in prose, because two counts depend on it:
     * `countClientRegions()` must only consider work actually delivered to a client,
     * and no record may carry the "freelance contract" role unless it was one.
     *
     * This field exists because the first draft labelled AIVA a client contract in
     * the US. It is neither. Getting that wrong on the most prominent record is
     * exactly the kind of error a client would catch.
     */
    engagement: z.enum(['Client contract', 'Own product']),
    year: z.number().int().min(CAREER_START_YEAR).max(2030),
    role: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    summary: z.string().min(1),
    url: z.url().optional(),
    status: z.enum(['LIVE', 'PRIVATE']),
    featured: z.boolean(),
    /**
     * Optional deep-dive, shown ONLY on the `/systems/[slug]` detail page — never on
     * the home scroll. Problem → Decisions → Delivered is how the work reads in a
     * client call: what was broken, the architecture calls made, what shipped. Written
     * only where scope is confirmed accurate (spec §5) — notably YellowPad's `delivered`
     * describes extraction + citation, NOT the "drafting" the source docs wrongly
     * claimed and this file already corrected (see the note on that record).
     */
    caseStudy: z
      .object({
        problem: z.string().min(1),
        decisions: z.string().min(1),
        delivered: z.string().min(1),
      })
      .optional(),
  })
  .refine((s) => !(s.url && isPrivateHost(hostOf(s.url) ?? '')), {
    message: 'url points at a known-private host and must not be published',
    path: ['url'],
  })
  .refine((s) => !(s.status === 'PRIVATE' && s.url), {
    message: 'a PRIVATE system must not carry a url',
    path: ['url'],
  })
  .refine((s) => !(s.engagement === 'Own product' && /contract/i.test(s.role)), {
    message:
      'an Own product must not claim a contract role — it was not client work',
    path: ['role'],
  })

export type System = z.infer<typeof SystemSchema>
