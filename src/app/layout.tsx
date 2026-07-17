import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { IDENTITY } from '@/content/identity'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${IDENTITY.name} — ${IDENTITY.title}`,
  description: `${IDENTITY.title}. AI systems, backend architecture, and cloud infrastructure. ${IDENTITY.location}.`,
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
