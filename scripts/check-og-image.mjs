#!/usr/bin/env node
/**
 * Verify every og:image / twitter:image URL in the built output resolves to a real file.
 *
 * src/lib/seo.ts names the card by path ('/opengraph-image') rather than letting Next's file
 * convention attach it, because the convention only reaches the segment its file sits in —
 * which is why 20 of 21 pages shipped with no card at all. Naming a path by hand reintroduces
 * exactly one risk: the path going stale and pointing at a 404. This closes it.
 *
 * It also catches the opposite failure — a page with no card at all — since a page that
 * publishes no og:image is reported just as loudly as one publishing a broken path.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'out')

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) yield* htmlFiles(path)
    else if (path.endsWith('.html')) yield path
  }
}

const problems = []
let checked = 0

for (const file of htmlFiles(OUT)) {
  const html = readFileSync(file, 'utf8')
  const page = relative(OUT, file)

  // 404.html is the error document; it is intentionally not a shareable page.
  if (page === '404.html') continue

  // Google's site-verification file is a fixed-content file mandated by Google's own
  // spec (must contain exactly `google-site-verification: <token>`) — it can never
  // carry an og:image tag and is not a page anyone shares.
  if (/^google[a-f0-9]+\.html$/.test(page)) continue

  const urls = [
    ...html.matchAll(/<meta property="og:image" content="([^"]*)"/g),
    ...html.matchAll(/<meta name="twitter:image" content="([^"]*)"/g),
  ].map((m) => m[1])

  if (urls.length === 0) {
    problems.push(`${page}: publishes no og:image or twitter:image`)
    continue
  }

  for (const url of urls) {
    // Absolute (metadataBase made it so) with an optional cache-busting query.
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0]
    const target = join(OUT, path)
    checked++
    if (!existsSync(target)) {
      problems.push(`${page}: og/twitter image -> ${path} (no such file in out/)`)
    }
  }
}

if (problems.length > 0) {
  console.error('\ncheck-og-image: FAILED\n')
  for (const p of problems) console.error(`  ${p}`)
  console.error(
    '\nEvery page must publish a social card that resolves. If a route sets its own\n' +
      '`openGraph` block it must include `images` — Next replaces the parent openGraph\n' +
      'wholesale, so the root opengraph-image.tsx is NOT inherited. See src/lib/seo.ts.\n'
  )
  process.exit(1)
}

console.log(`check-og-image: OK — ${checked} image reference(s) across all pages resolve.`)
