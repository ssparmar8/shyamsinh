import { jsonLdScript } from '@/lib/seo'

/**
 * A structured-data block.
 *
 * Server-rendered into the static HTML, which is the only form that counts here: the site is
 * a static export and crawlers must find this in the document they are served, not after a
 * hydration pass. `dangerouslySetInnerHTML` is required — React escapes text children, and an
 * escaped `&quot;` inside a JSON-LD body makes the block unparseable. `jsonLdScript` handles
 * the one escape that actually matters (`<`), so the tag cannot be closed from inside.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  )
}
