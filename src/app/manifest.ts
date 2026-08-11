import type { MetadataRoute } from 'next'
import { IDENTITY } from '@/content/identity'
import { SITE_NAME } from '@/lib/seo'

/**
 * Required by `output: 'export'`: these metadata files are Route Handlers, and the export
 * build will not guess whether one is static. Omitting it fails the build rather than
 * silently shipping a site with no sitemap.
 */
export const dynamic = 'force-static'

/**
 * The web manifest — the live site returns 404 for it today.
 *
 * Not a ranking factor, but it is what a browser reads when someone adds the site to a phone
 * home screen, and it is the difference between a saved bookmark titled "shyamsinh.qzz.io"
 * and one titled with his name. `display: browser` on purpose: this is a document, not an
 * app, and a standalone window would strip the back button off a site built around links.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${IDENTITY.name} — ${IDENTITY.title}`,
    short_name: SITE_NAME,
    description: IDENTITY.pitch,
    start_url: '/',
    display: 'browser',
    background_color: '#e9e9e9',
    theme_color: '#e9e9e9',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
