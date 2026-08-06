/**
 * The Twitter/X card is the same card. The renderer and its dimensions are re-exported rather
 * than duplicated, so the two can never drift into showing different claims about the same
 * person.
 */
export { default, size, contentType, alt } from './opengraph-image'

/**
 * Declared here rather than re-exported: Next parses route-segment config statically at build
 * time, so it has to be a literal in this file — `export { dynamic } from './opengraph-image'`
 * fails the build with "mustn't be reexported".
 */
export const dynamic = 'force-static'
