/**
 * X/Twitter reads og:image when twitter:image is absent, so this file is belt-and-braces —
 * but only braces cost a build step, and an explicit twitter:image is what the card
 * validator actually reports on. Same image, no second design to keep in sync.
 */
export { default, alt, size, contentType } from './opengraph-image'

// Declared here rather than re-exported: Next parses the route segment config statically at
// compile time, and `export { dynamic } from ...` is not a form it can read — it fails the
// build with "mustn't be reexported". See the same const in opengraph-image.tsx for why it
// is required at all under `output: export`.
export const dynamic = 'force-static'
