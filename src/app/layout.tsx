import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { IDENTITY } from '@/content/identity'
import { SITE_NAME, SITE_URL, canonicalUrl, sectorsCovered } from '@/lib/seo'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const TITLE = `${IDENTITY.name} — ${IDENTITY.title}`

/**
 * The description a search result actually shows. Written to say what he does, for whom, and
 * from where, in the 120–160 characters Google will display — the previous one
 * ("AI & Backend Architect. AI systems, backend architecture, and cloud infrastructure.")
 * repeated the title and named no domain a client would search for.
 */
const DESCRIPTION =
  'AI and backend architect in Gujarat, India. I design and ship production voice agents, LLM pipelines, and the backends that carry them.'

export const metadata: Metadata = {
  // Every relative URL below (canonical, OG image) resolves against this. Without it, a
  // relative metadata URL is a build error rather than a silently wrong tag.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Child routes set only their subject; the name is appended once, here, so no page can
    // ship a title that fails to identify whose site it is.
    template: `%s — ${IDENTITY.name}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: IDENTITY.name, url: canonicalUrl('/') }],
  creator: IDENTITY.name,
  publisher: IDENTITY.name,
  alternates: { canonical: canonicalUrl('/') },
  // Derived from the archive's own sectors, so this can never claim a specialism with no
  // project behind it. Keywords are a weak signal at best, but a false one is a liability.
  keywords: [
    'AI architect',
    'backend architect',
    'voice AI developer',
    'LLM engineer',
    'RAG',
    'freelance AI developer',
    'Gujarat',
    'India',
    ...sectorsCovered(),
  ],
  category: 'technology',
  openGraph: {
    type: 'profile',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: canonicalUrl('/'),
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Without these, Google may show only a thumbnail and a clipped snippet. They are the
      // difference between a result that shows the OG image and one that shows a grey box.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
