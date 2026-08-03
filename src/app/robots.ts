import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/content/identity'

// Required under `output: 'export'` — see the same const in opengraph-image.tsx.
export const dynamic = 'force-static'

/**
 * Open to everything, including AI crawlers (GPTBot, ClaudeBot, PerplexityBot).
 *
 * That is a choice, not an oversight. This is a freelance portfolio whose whole purpose is
 * to be found, and being quotable by an assistant answering "AI developers in Rajkot" is
 * worth more here than withholding the content — see SEO_RULES.md §19. Block them by adding
 * a rule below if that ever stops being true.
 *
 * Nothing is disallowed because nothing on the site is private; the exported bundle is
 * entirely public pages. There is no admin path to hide, and listing one that does not exist
 * only advertises a shape for someone to go looking for.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
