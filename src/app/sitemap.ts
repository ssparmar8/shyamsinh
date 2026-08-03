import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/content'
import { SITE_URL } from '@/content/identity'

// Required under `output: 'export'` — see the same const in opengraph-image.tsx.
export const dynamic = 'force-static'

/**
 * Every indexable URL, derived from the archive rather than listed by hand — a sitemap that
 * has to be edited when a system is added is a sitemap that goes stale on the first one.
 *
 * URLs carry a trailing slash to match `trailingSlash: true` (next.config.ts) and therefore
 * the canonical each page publishes. A sitemap advertising the un-slashed twin of a
 * self-canonicalising page just hands Google two URLs to reconcile.
 *
 * `lastModified` is deliberately absent. The content has no per-record modification date —
 * only a `year` — so anything emitted here would be either the build clock (which changes on
 * every deploy whether or not the page did, training crawlers to ignore the field) or a
 * fabricated date. An honest omission beats a dishonest signal. `changeFrequency` and
 * `priority` are absent for a simpler reason: Google ignores both.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/archive/', '/contact/', ...getAllSlugs().map((s) => `/systems/${s}/`)]
  return routes.map((path) => ({ url: `${SITE_URL}${path}` }))
}
