import type { MetadataRoute } from 'next'
import { SYSTEMS, getFeatured } from '@/content'
import { canonicalUrl } from '@/lib/seo'

/**
 * Required by `output: 'export'`: these metadata files are Route Handlers, and the export
 * build will not guess whether one is static. Omitting it fails the build rather than
 * silently shipping a site with no sitemap.
 */
export const dynamic = 'force-static'

/**
 * Every indexable route, derived from the content rather than listed by hand — adding a
 * system to `systems.ts` puts it in the sitemap, and there is no way to ship a record that
 * crawlers never hear about.
 *
 * `/` and `/archive` are the entry points; the 18 records are the substance. Featured
 * systems get a higher priority than archive-only ones because they are the work he leads
 * with — priority is a hint about relative importance within one site, not a ranking lever,
 * so it is only worth setting where the pages genuinely differ.
 *
 * No `lastModified: new Date()`. A build clock would stamp every URL as freshly modified on
 * every deploy, including records untouched for a year; a sitemap that cries "all new" every
 * time teaches crawlers to ignore the field. The content carries no edit dates, so the honest
 * move is to omit it and let `changeFrequency` carry the hint.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const featured = new Set(getFeatured().map((s) => s.slug))

  return [
    {
      url: canonicalUrl('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: canonicalUrl('/archive'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: canonicalUrl('/contact'),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    ...SYSTEMS.map((system) => ({
      url: canonicalUrl(`/systems/${system.slug}`),
      changeFrequency: 'yearly' as const,
      priority: featured.has(system.slug) ? 0.9 : 0.6,
    })),
  ]
}
