import type { Metadata } from 'next'
import { IDENTITY } from '@/content/identity'

/**
 * The per-route metadata every page must build its own copy of.
 *
 * This exists because Next merges metadata SHALLOWLY down the tree, and the two fields
 * that must never be inherited are exactly the two that look harmless in a root layout:
 *
 *   - `alternates.canonical`. A canonical set once in the root layout resolves to the
 *     homepage on every route below it, which tells Google that /archive, /contact and all
 *     18 records are duplicates of the front page and should not be indexed separately.
 *     A wrong canonical is worse than none — it is a machine-readable instruction to throw
 *     the page away.
 *   - `openGraph`. A child that sets only `title`/`description` does NOT get a merged
 *     openGraph object; it inherits the parent's whole block, so a shared record unfurls
 *     under the homepage's og:title and og:url.
 *
 * So the whole block is rebuilt per route rather than patched. Callers pass a root-relative
 * `path`; `metadataBase` (root layout) makes it absolute.
 *
 * `path` must carry a trailing slash, because next.config.ts sets `trailingSlash: true` and
 * that is the form every internal href and every exported directory actually uses. A
 * canonical pointing at the un-slashed twin is a self-inflicted redirect hop.
 */
/**
 * Applied by the root layout to every child title. `/contact` shipped as the six-character
 * `<title>Uplink</title>` — no name, no brand, nothing for a result page to show.
 */
export const TITLE_TEMPLATE = `%s — ${IDENTITY.name}`

/** The template's effect, spelled out — Next never applies templates to og:/twitter titles. */
const brand = (title: string) => `${title} — ${IDENTITY.name}`

/**
 * Where Google stops rendering. Both are approximations of a pixel budget, not hard limits —
 * nothing rejects a longer string, it is just invisible, which is the worst of both worlds:
 * the words are written, indexed, and never read.
 */
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 160

/**
 * A record's title, composed so the brand suffix cannot push it past the truncation point.
 *
 * The domain is the useful half — "Flourish Together Therapy" alone says nothing about the
 * work — so it is included whenever it fits and dropped only when it cannot. That was the
 * case for exactly one record ("Flourish Together Therapy — Healthcare · booking" branded to
 * 67 characters), and hardcoding a shorter string for it would leave the next long name to
 * fail the same way silently.
 */
export function recordTitle(name: string, domain: string): string {
  const withDomain = `${name} — ${domain}`
  return brand(withDomain).length <= TITLE_MAX ? withDomain : name
}

/**
 * The social card, stated explicitly on every route.
 *
 * This is NOT belt-and-braces over the opengraph-image.tsx file convention — it is load
 * bearing. Next merges metadata field-by-field but REPLACES `openGraph` wholesale when a
 * child segment defines one, and the file convention only attaches its image to the segment
 * the file sits in (the app root). So the moment pageMetadata() started emitting its own
 * `openGraph` block for /archive, /contact and all 18 records, those 20 pages silently lost
 * og:image entirely — verified against the live site: the homepage had og:image and every
 * other page had none, so any shared record link unfurled as a bare text row.
 *
 * The size and alt live here rather than in opengraph-image.tsx so the route file and these
 * tags cannot disagree; that file imports them back. The path is the metadata route's own
 * URL, and `npm run build` fails if the file is missing (scripts/check-og-image.mjs), which
 * covers the one risk of naming it by hand.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }
export const OG_IMAGE_ALT = `${IDENTITY.name} — ${IDENTITY.title}. ${IDENTITY.pitch}`
const OG_IMAGE = { url: '/opengraph-image', ...OG_IMAGE_SIZE, alt: OG_IMAGE_ALT }
const TWITTER_IMAGE = { url: '/twitter-image', ...OG_IMAGE_SIZE, alt: OG_IMAGE_ALT }

export function pageMetadata({
  title,
  description,
  path,
  titleIsBranded = false,
}: {
  title: string
  description: string
  path: `/${string}`
  /**
   * Set on the homepage, whose title already ends in the brand. Without it the root
   * layout's template would compose "Shyamsinh Parmar — AI & Backend Architect —
   * Shyamsinh Parmar"; `title.absolute` is the documented way to opt a route out.
   */
  titleIsBranded?: boolean
}): Metadata {
  // og:title and twitter:title are NOT template-aware — Next passes them through verbatim.
  // Branding them here is what stops a shared /contact link unfurling as just "Uplink".
  const social = titleIsBranded ? title : brand(title)

  return {
    title: titleIsBranded ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'profile',
      url: path,
      siteName: IDENTITY.name,
      locale: 'en_US',
      title: social,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: social,
      description,
      images: [TWITTER_IMAGE],
    },
  }
}
