import { z } from 'zod'

/**
 * Hosts that must never appear in a published link.
 * `ai-uat.medicalofficeforce.co` is a client's UAT environment behind a login.
 * Publishing it would expose a client's internal system — see spec §5.2.
 */
export const PRIVATE_HOSTS = ['ai-uat.medicalofficeforce.co'] as const

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
    url: z.url().optional(),
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
