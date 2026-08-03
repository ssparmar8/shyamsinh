import { IDENTITY, SITE_URL } from '@/content/identity'
import { SYSTEMS } from '@/content'
import type { System } from '@/content/schema'

/**
 * The Person graph for the homepage.
 *
 * Its job is entity resolution, not decoration. "Shyamsinh" is a name other people have, so
 * a search engine's problem is not finding this site — it is deciding which Shyamsinh it is
 * about. `sameAs` is the answer: it ties the name to accounts Google already has records
 * for. Everything else here is supporting detail.
 *
 * Every field is derived from content that renders on the page. Structured data that
 * disagrees with the visible page is the one kind Google penalises rather than ignores, so
 * there are no standalone string literals in this file except the schema vocabulary itself
 * and the second job title.
 */

/** `<` so a stray "</script>" in content could never close the tag it is embedded in. */
export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c')

export function personJsonLd() {
  // IDENTITY.location is "Rajkot, Gujarat, India" — locality first, then region. Split rather
  // than restated so the graph cannot drift from the string the hero renders; identity.test.ts
  // pins the shape so a reformat fails a test instead of silently emitting a blank locality.
  const [addressLocality, addressRegion] = IDENTITY.location.split(',').map((p) => p.trim())

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: IDENTITY.name,
    url: `${SITE_URL}/`,
    // Both terms, truthfully. "AI & Backend Architect" is the positioning; "AI Developer" is
    // what clients actually search for. schema.org allows a list, so neither has to be dropped.
    jobTitle: [IDENTITY.title, 'AI Developer'],
    description: IDENTITY.pitch,
    email: `mailto:${IDENTITY.email}`,
    telephone: IDENTITY.phone.replace(/\s/g, ''),
    address: {
      '@type': 'PostalAddress',
      addressLocality,
      addressRegion,
      // The ISO code, not the parsed "India" — locationCode is already the canonical form.
      addressCountry: IDENTITY.locationCode,
    },
    worksFor: {
      '@type': 'Organization',
      name: 'Woyce Tech',
      url: IDENTITY.links.find((l) => l.label === 'WOYCE TECH')?.href,
    },
    // The sectors the archive actually contains, deduped — a claim the site can back record
    // by record, rather than a keyword list.
    knowsAbout: [...new Set(SYSTEMS.map((s) => s.sector))].sort(),
    sameAs: IDENTITY.links.filter((l) => l.sameAs).map((l) => l.href),
  }
}

/**
 * The graphs for one `/systems/[slug]` record: what the thing is, and where it sits.
 *
 * `CreativeWork`, not `SoftwareApplication`. The latter's rich results need an
 * `applicationCategory` plus offers or ratings, none of which this archive has or should
 * invent — declaring the richer type without them claims a shape the data cannot fill. The
 * value here is not a rich snippet, it is telling a search engine that 18 distinct works
 * share one `creator`, which is the same entity signal the Person graph exists for.
 *
 * `BreadcrumbList` earns its place because the hierarchy is real and visible: the page
 * carries a "◂ BACK TO INDEX" link to /archive, and breadcrumbs are one of the few graphs
 * that still render visibly in a Google result.
 *
 * Returned as an array — a top-level JSON-LD array is valid, and it keeps the two graphs in
 * one script tag rather than two.
 */
export function recordJsonLd(system: System) {
  const url = `${SITE_URL}/systems/${system.slug}/`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: system.name,
      description: system.summary,
      url,
      dateCreated: String(system.year),
      inLanguage: 'en',
      creator: { '@type': 'Person', name: IDENTITY.name, url: `${SITE_URL}/` },
      about: system.sector,
      keywords: system.stack.join(', '),
      // Only public systems have a url at all — SystemSchema refuses one on a PRIVATE record
      // and on any known-private host, so a client's UAT environment cannot reach this line.
      ...(system.url ? { sameAs: system.url } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: IDENTITY.name, item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Archive Index', item: `${SITE_URL}/archive/` },
        { '@type': 'ListItem', position: 3, name: system.name, item: url },
      ],
    },
  ]
}
