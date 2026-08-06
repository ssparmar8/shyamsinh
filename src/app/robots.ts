import type { MetadataRoute } from 'next'
import { SITE_URL, canonicalUrl } from '@/lib/seo'

/**
 * Required by `output: 'export'`: these metadata files are Route Handlers, and the export
 * build will not guess whether one is static. Omitting it fails the build rather than
 * silently shipping a site with no sitemap.
 */
export const dynamic = 'force-static'

/**
 * Everything here is meant to be found — it is a portfolio, and there is no admin surface,
 * no search-result pages, and no duplicate parameterised URLs to exclude. So the rule is a
 * plain allow, and the file's real job is pointing at the sitemap.
 *
 * The `_next/` assets are disallowed only to keep crawl budget on pages rather than on
 * hashed JS chunks. It does NOT hide anything: Google must still be able to fetch the CSS
 * and JS it needs to render a page, and those are fetched as page subresources, which
 * robots.txt does not govern the same way as crawl requests for indexing.
 *
 * AI crawlers are deliberately left allowed. The site's purpose is to be cited when someone
 * asks an assistant for an AI/backend architect; blocking GPTBot or ClaudeBot would remove it
 * from exactly the surface it is trying to appear on.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/_next/static/chunks/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: canonicalUrl('/'),
  }
}
