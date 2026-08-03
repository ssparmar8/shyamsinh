import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { IDENTITY, SITE_URL, GOOGLE_SITE_VERIFICATION } from '@/content/identity'
import { TITLE_TEMPLATE } from '@/lib/seo'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const SITE_TITLE = `${IDENTITY.name} — ${IDENTITY.title}`
/**
 * 153 characters, inside the 140-160 band SEO_RULES.md §6 asks for — it was 111, which left
 * a result snippet half empty.
 *
 * Opens "AI developer and backend architect" rather than the site's own title string. The
 * title is `AI & Backend Architect`, which is the better positioning term and the one nobody
 * types into a search box; this is the one place both forms can appear truthfully. The city
 * comes from IDENTITY.location so it stays in step with the hero and the JSON-LD.
 */
export const SITE_DESCRIPTION = `AI developer and backend architect in ${IDENTITY.location}. I design and ship production voice agents, LLM pipelines, and the backends that carry them.`

/**
 * The ROOT layout carries only what is genuinely site-wide: the base URL and the fallback
 * title/description. Anything route-shaped — canonical, og:url, og:title — is deliberately
 * NOT here, because metadata inherits and a route that forgets to override would then
 * publish the homepage's identity as its own. Routes call `pageMetadata()`; see seo.ts for
 * what that inheritance actually costs.
 *
 * `openGraph.images` is absent for a different reason: opengraph-image.tsx is a file
 * convention, and Next injects og:image (plus type/width/height) from it. Setting `images`
 * by hand would override that with a path nothing keeps in step. Same for twitter-image.
 */
export const metadata: Metadata = {
  // Without this, every relative metadata URL resolves against http://localhost:3000.
  metadataBase: new URL(SITE_URL),
  // `default` covers any route that sets no title of its own; `template` brands the ones
  // that do. Routes going through pageMetadata() pass a bare page title and let the template
  // add the name — except the homepage, which opts out via `absolute`. See src/lib/seo.ts.
  title: {
    default: SITE_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  // Spread conditionally: `verification: { google: '' }` would emit a meta tag with an empty
  // content attribute, which Search Console reads as a failed verification rather than none.
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variable classes belong on <html>, not <body> — this is what
    // create-next-app and the Next.js 16 docs both do. Tailwind's @theme resolves
    // theme variables at :root; if --font-geist-* is only defined on a descendant,
    // the resolution fails silently and every element falls back to the system font.
    // globals.css guards the same failure from the other side with `@theme inline`.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
