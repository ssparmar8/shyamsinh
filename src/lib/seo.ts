import { IDENTITY } from '@/content/identity'
import { SYSTEMS } from '@/content'

/**
 * The canonical origin. ONE constant — every canonical tag, sitemap entry, OG URL and
 * JSON-LD `url` derives from it, so moving the site is a one-line change.
 *
 * https, not http. The apex serves HTTPS with a 200 and http 301-redirects to it, so an
 * http canonical would point every page at a URL that redirects — telling crawlers the
 * preferred address is one that immediately sends them somewhere else.
 *
 * No trailing slash: `canonicalUrl()` adds the path, and a doubled slash is a different URL
 * to a crawler than the one being served.
 */
export const SITE_URL = 'https://shyamsinh.qzz.io'

export const SITE_NAME = IDENTITY.name

/**
 * Paths carry a trailing slash, and the homepage is exactly `/`.
 *
 * Both forms return 200 on this host, which is precisely why a single form has to be chosen
 * and used everywhere: given two URLs serving identical content and no signal, a crawler
 * picks one itself and may not pick the one in the sitemap. Trailing slash is what the site
 * already had indexed, so matching it avoids re-consolidating URLs that already rank.
 */
export function canonicalPath(path = '/'): string {
  // Strip the outer slashes first and collapse any interior run, THEN decide whether what is
  // left is the root. Testing `path === '/'` up front looked equivalent and was not: '//'
  // fell through it, survived the trim as an empty string, and came back out as '//' — a
  // canonical of `https://shyamsinh.qzz.io//`, which is a different URL to every crawler.
  const bare = path.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/')
  return bare === '' ? '/' : `/${bare}/`
}

/**
 * Absolute URL for a site-relative path, in the one canonical form.
 *
 * The homepage is the bare origin with NO trailing slash, because that is what Next emits
 * for `alternates.canonical` after it normalises the URL against `metadataBase` — it strips
 * the root slash and nothing here can stop it. Matching that everywhere is the point: the
 * first build had the sitemap advertising `https://…/` while the page's own canonical said
 * `https://…`, which is two spellings of the homepage competing to be the indexed one.
 * Sub-paths keep their trailing slash; Next leaves those alone.
 */
export function canonicalUrl(path = '/'): string {
  const p = canonicalPath(path)
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`
}

/**
 * A route's own generated share card, as a metadata `images` entry.
 *
 * Used only where the alt text has to vary per page. Everywhere else the co-located
 * `opengraph-image.tsx` file convention supplies the tag by itself, with a cache-busting hash
 * this cannot reproduce — so prefer the convention, and reach for this only when a static
 * `alt` export would be wrong. The 18 record pages are exactly that case: one shared alt
 * string would describe the person on a card that shows a project.
 *
 * The path is built from `canonicalPath`, so it matches the emitted file; `seo.spec.ts`
 * fetches every declared og:image and asserts it is a real PNG, which is what keeps a
 * hand-built URL here from silently pointing at nothing.
 */
export function ogImageFor(path: string, alt: string) {
  const dir = canonicalPath(path)
  return [{ url: `${SITE_URL}${dir}opengraph-image`, width: 1200, height: 630, alt }]
}

/**
 * Trim to fit a search snippet without cutting a word in half.
 *
 * Search engines truncate around 160 characters; doing it here means the cut lands at a word
 * boundary with an ellipsis, rather than mid-word wherever the renderer happens to stop.
 */
export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).replace(/[\s,.;:—-]+\S*$/, '')}…`
}

/**
 * Titles are capped at 60 characters because Google truncates around there, and a title cut
 * mid-phrase in a result listing is worse than a shorter one that reads whole. The suffix is
 * dropped before the name is, since a page whose title is only a suffix says nothing.
 */
export const TITLE_MAX = 60
export const DESCRIPTION_MIN = 120
export const DESCRIPTION_MAX = 160

export function pageTitle(subject: string): string {
  const full = `${subject} — ${IDENTITY.name}`
  return full.length <= TITLE_MAX ? full : subject.slice(0, TITLE_MAX)
}

/**
 * The sectors the archive actually contains, deduped and sorted — the `knowsAbout` claim is
 * derived from the work rather than asserted, so it cannot drift into listing a specialism
 * with no project behind it.
 */
export function sectorsCovered(): string[] {
  return [...new Set(SYSTEMS.map((s) => s.sector))].sort()
}

/**
 * Profile URLs, for `sameAs` — the strongest entity signal a personal site can send.
 *
 * Filtered to `sameAs: true` rows only (see the field note on IDENTITY.links): an
 * organisation account or an unconfirmed profile asserted here does not fail quietly, it
 * actively teaches a search engine the wrong entity.
 */
function profileUrls(): string[] {
  return IDENTITY.links.filter((l) => l.sameAs).map((l) => l.href)
}

type JsonLd = Record<string, unknown>

/**
 * The Person entity. `sameAs` links this site to the profiles that already carry reputation
 * (Upwork, GitHub, Fiverr — see the `sameAs` note on IDENTITY.links for who is excluded and
 * why), which is how a search engine resolves "Shyamsinh Parmar the AI architect" to one
 * identity rather than to an unknown string.
 */
export function personJsonLd(): JsonLd {
  // IDENTITY.location is "City, Region, Country"; identity.test.ts pins that shape so a
  // reformat fails a test instead of silently emitting a blank locality here.
  const [addressLocality, addressRegion] = IDENTITY.location.split(',').map((p) => p.trim())

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: IDENTITY.name,
    url: canonicalUrl('/'),
    jobTitle: IDENTITY.title,
    description: IDENTITY.pitch,
    email: `mailto:${IDENTITY.email}`,
    telephone: IDENTITY.phone.replace(/\s/g, ''),
    address: {
      '@type': 'PostalAddress',
      addressLocality,
      addressRegion,
      addressCountry: IDENTITY.locationCode,
    },
    worksFor: {
      '@type': 'Organization',
      name: 'Woyce Tech',
      url: 'https://github.com/woyce-tech',
    },
    knowsAbout: sectorsCovered(),
    sameAs: profileUrls(),
  }
}

/** The site entity, tied to the Person by @id so the two are one graph, not two islands. */
export function webSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: canonicalUrl('/'),
    name: SITE_NAME,
    description: IDENTITY.pitch,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#person` },
  }
}

/**
 * Breadcrumbs. Google renders these in place of the raw URL in results, so a record shows
 * "Archive › AIVA Chat" rather than a path — and it is the cheapest way to communicate that
 * the 18 records are one collection rather than 18 orphans.
 */
export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  }
}

/**
 * One archived system. `CreativeWork` rather than `SoftwareApplication`: the records describe
 * delivered client engagements, not products a visitor can download or install, and claiming
 * an app that has no price, platform or download is the kind of overreach that gets structured
 * data ignored. A LIVE system with a public URL also gets `sameAs` pointing at the real thing.
 */
export function systemJsonLd(system: (typeof SYSTEMS)[number]): JsonLd {
  const base: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: system.name,
    headline: system.name,
    description: system.summary,
    url: canonicalUrl(`/systems/${system.slug}`),
    dateCreated: String(system.year),
    inLanguage: 'en',
    about: system.sector,
    genre: system.domain,
    keywords: system.stack.join(', '),
    creator: { '@id': `${SITE_URL}/#person` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  }
  // Only when there is something public to point at — schema.org `sameAs` on a private
  // client system would advertise a URL the record deliberately withholds.
  return system.url ? { ...base, sameAs: system.url } : base
}

/** The archive as a collection, with the records as an itemList. */
export function collectionJsonLd(
  items: Array<{ name: string; slug: string }>,
  path: string,
  name: string,
  description: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl(path)}#collection`,
    url: canonicalUrl(path),
    name,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#person` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: canonicalUrl(`/systems/${item.slug}`),
      })),
    },
  }
}

/** The contact page, carrying the reachable channels as machine-readable facts. */
export function contactJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: canonicalUrl('/contact'),
    name: `Contact ${IDENTITY.name}`,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@id': `${SITE_URL}/#person`,
      '@type': 'Person',
      name: IDENTITY.name,
      email: `mailto:${IDENTITY.email}`,
      telephone: IDENTITY.phone.replace(/\s/g, ''),
    },
  }
}

/**
 * Serialise for a `<script type="application/ld+json">` body.
 *
 * Every `<` becomes the JSON escape `\u003c`, which is not cosmetic: a string containing `</script>` would
 * otherwise close the tag early and inject whatever followed into the document. Everything
 * here is authored content today, but this is the function every future block will go
 * through, and JSON-LD is exactly where untrusted data eventually ends up.
 */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
