import { test, expect, type Page } from '@playwright/test'

/**
 * The SEO tags as a crawler receives them.
 *
 * Unit tests cover the builders in `lib/seo.ts`, but every defect this work actually hit
 * lived in the gap between a correct builder and the emitted document: `openGraph` declared
 * on a page silently dropped the inherited og:image from twenty pages, and Next normalised
 * the homepage canonical to the bare origin while the sitemap still advertised a trailing
 * slash. Neither is visible from the source — only from the HTML.
 */

const ROUTES = ['/', '/archive/', '/contact/', '/systems/aiva/', '/systems/frontdesk-clinic/']

/** Everything is prerendered, so the first response already holds every tag that counts. */
async function head(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  expect(res?.status(), `${path} did not return 200`).toBe(200)
  return page.evaluate(() => {
    const meta = (sel: string) => document.querySelector(sel)?.getAttribute('content') ?? null
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      ogTitle: meta('meta[property="og:title"]'),
      ogImage: meta('meta[property="og:image"]'),
      ogImageAlt: meta('meta[property="og:image:alt"]'),
      ogUrl: meta('meta[property="og:url"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      robots: meta('meta[name="robots"]'),
      h1s: [...document.querySelectorAll('h1')].map((h) => h.textContent?.trim() ?? ''),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (s) => s.textContent ?? '',
      ),
    }
  })
}

test.describe('every indexable route', () => {
  for (const route of ROUTES) {
    test(`${route} carries the tags a result listing is built from`, async ({ page }) => {
      const seo = await head(page, route)

      // A title over ~60 chars is truncated mid-phrase in results.
      expect(seo.title.length, `title too long: ${seo.title}`).toBeLessThanOrEqual(60)
      expect(seo.title).toContain('Shyamsinh Parmar')

      // Under ~120 wastes the snippet; over ~160 is cut off.
      expect(seo.description, `${route} has no description`).toBeTruthy()
      expect(seo.description!.length).toBeGreaterThanOrEqual(120)
      expect(seo.description!.length).toBeLessThanOrEqual(160)

      expect(seo.canonical, `${route} has no canonical`).toBeTruthy()
      expect(seo.canonical!.startsWith('https://')).toBe(true)

      // The share card. This is the assertion that would have caught the inherited-image
      // drop: it was present on / and missing everywhere else.
      expect(seo.ogImage, `${route} has no og:image`).toBeTruthy()
      expect(seo.ogTitle).toBeTruthy()
      expect(seo.twitterCard).toBe('summary_large_image')

      // Exactly one h1. Record pages had none at all, and /contact had no heading element.
      expect(seo.h1s.length, `${route} h1 count`).toBe(1)
      expect(seo.h1s[0].length).toBeGreaterThan(0)

      for (const block of seo.jsonLd) {
        expect(() => JSON.parse(block), `${route} has unparseable JSON-LD`).not.toThrow()
      }
    })
  }
})

test('the homepage canonical and the sitemap agree on one spelling of the homepage', async ({
  page,
  request,
}) => {
  const seo = await head(page, '/')
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const first = /<loc>(.*?)<\/loc>/.exec(sitemap)?.[1]

  // Two spellings of the same page compete to be the indexed one. Next strips the root's
  // trailing slash when it normalises the canonical, so the sitemap has to match that.
  expect(first).toBe(seo.canonical)
})

test('the sitemap lists every record, and only real URLs', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])

  expect(new Set(locs).size, 'duplicate URLs in the sitemap').toBe(locs.length)
  expect(locs.length).toBe(21) // home + archive + contact + 18 records
  for (const loc of locs) expect(loc.startsWith('https://')).toBe(true)
  expect(locs.filter((l) => l.includes('/systems/')).length).toBe(18)
})

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt')
  expect(res.status()).toBe(200)
  const body = await res.text()
  expect(body).toContain('Allow: /')
  expect(body).toMatch(/Sitemap: https:\/\/\S+\/sitemap\.xml/)
  // A stray Disallow: / would deindex the whole site; it has happened to better sites.
  expect(body).not.toMatch(/^Disallow: \/$/m)
})

/**
 * Checks the BYTES, not the Content-Type header.
 *
 * Next emits these routes without a file extension (`out/opengraph-image`), so the header is
 * a property of whatever is serving them rather than of the artifact: the local `serve` sends
 * none at all, while CloudFront sends image/png. Asserting the header here would fail on a
 * perfectly good build. The PNG magic number is the part that has to be true everywhere.
 */
test('the generated share card and icons are real PNGs', async ({ request }) => {
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
  // Per-asset floors. A flat 32×32 icon compresses to ~155 bytes and is perfectly valid, so
  // one shared "must be big" threshold fails a good build; the share card is the only one
  // that carries real text and therefore real weight.
  for (const [path, minBytes] of [
    ['/opengraph-image', 5000],
    ['/icon', 100],
    ['/apple-icon', 300],
  ] as const) {
    const res = await request.get(path)
    expect(res.status(), `${path} missing`).toBe(200)
    const body = await res.body()
    expect(body.subarray(0, 4).equals(PNG_MAGIC), `${path} is not a PNG`).toBe(true)
    expect(body.length, `${path} is suspiciously small`).toBeGreaterThan(minBytes)
  }
})

/**
 * Follows the og:image each page actually declares and proves it resolves to a real image.
 *
 * This is the test that makes a hand-built image URL safe. Record pages set their `images`
 * explicitly (the only way to give 18 pages 18 different alt texts), which means the URL is
 * constructed rather than emitted by Next — and a constructed URL that points at nothing
 * fails silently: the tag is present, the card is blank, and nothing in a build log says so.
 */
test.describe('declared share images resolve', () => {
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

  /**
   * og:image must be absolute for any platform to fetch it, so the tag holds the production
   * origin. Fetching that verbatim would test the DEPLOYED site rather than this build — and
   * would pass on a stale deploy while the local build was broken. Only the path is ours.
   */
  const local = (absolute: string) => new URL(absolute).pathname + new URL(absolute).search

  for (const route of ROUTES) {
    test(`${route} og:image is a real PNG`, async ({ page, request }) => {
      const seo = await head(page, route)
      expect(seo.ogImage, `${route} declares no og:image`).toBeTruthy()
      expect(seo.ogImage!.startsWith('https://'), 'og:image must be absolute').toBe(true)

      const res = await request.get(local(seo.ogImage!))
      expect(res.status(), `${route} og:image 404s at ${seo.ogImage}`).toBe(200)
      const body = await res.body()
      expect(body.subarray(0, 4).equals(PNG_MAGIC), `${route} og:image is not a PNG`).toBe(true)
    })
  }

  /** Each route must have its OWN card; one shared card says nothing about the page shared. */
  test('every route type declares a distinct card', async ({ page }) => {
    // Sequential: these all drive the same `page`, and Promise.all would race the navigations.
    const urls: string[] = []
    for (const route of ROUTES) urls.push((await head(page, route)).ogImage!.split('?')[0])
    expect(new Set(urls).size, `routes share a card: ${urls.join(', ')}`).toBe(ROUTES.length)
  })

  /** A card describing the person on a page about a project is worse than no alt at all. */
  test('a record card is described by its own project', async ({ page }) => {
    const seo = await head(page, '/systems/aiva/')
    expect(seo.ogImageAlt).toBeTruthy()
    expect(seo.ogImageAlt).toContain('AIVA Chat')
  })
})

test('the manifest is served and names the site', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.status()).toBe(200)
  expect((await res.json()).name).toContain('Shyamsinh Parmar')
})

/**
 * The private client host must not appear anywhere a crawler can read it — including inside
 * a JSON-LD `sameAs`, which is published just as loudly as an anchor tag.
 */
test('no page leaks the private client host through structured data', async ({ page }) => {
  for (const route of ['/', '/archive/', '/systems/mof-frontdesk/']) {
    const res = await page.goto(route, { waitUntil: 'domcontentloaded' })
    if (res?.status() !== 200) continue
    expect(await page.content()).not.toContain('ai-uat.medicalofficeforce.co')
  }
})
