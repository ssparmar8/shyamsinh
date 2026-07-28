import { test, expect } from '@playwright/test'

/**
 * Static-route guarantees — this is what Plan 1's own Task 11 wanted, folded into
 * Plan 2's Task 7 because the escape hatch only means something once there is
 * something to escape (the cinematic entry, built in this plan).
 *
 * `/systems/*`, `/archive`, and `/contact` are for a visitor who wants the facts
 * in ten seconds: no boot, no animation libraries, a real HTTP status, and never
 * a client's private hostname. See `entry.spec.ts` for the boot/decode/Lenis
 * checks these routes must stay untouched by.
 */

const PRIVATE_HOST = 'ai-uat.medicalofficeforce.co'

test.describe('static route guarantees', () => {
  test('/systems/aiva renders its content immediately, with no boot', async ({ page }) => {
    const response = await page.goto('/systems/aiva')
    expect(response?.status()).toBe(200)
    // EntryOverlay is never mounted on a record route at all — not even
    // transiently. That is a structural guarantee (the component isn't in this
    // route's tree), so a single check is enough here, unlike `/`'s
    // boot-suppression checks in entry.spec.ts, which have to prove a *runtime
    // decision* holds rather than that a code path is simply absent.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
  })

  test('/archive lists all 18 systems', async ({ page }) => {
    await page.goto('/archive')
    const rows = page.locator('a[href^="/systems/"]')
    await expect(rows).toHaveCount(18)
  })

  test('a record route shows no header chrome — no route label, no UPLINK', async ({ page }) => {
    // The top row is bare by design. Check at the bottom of the page too: the
    // chrome is `fixed`, so anything still rendered there would follow the
    // viewport down and reappear rather than scroll away with the content.
    await page.goto('/systems/aiva')
    await expect(page.getByRole('link', { name: /UPLINK/i })).toHaveCount(0)
    await expect(page.getByText('ARCHIVE://')).toHaveCount(0)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByRole('link', { name: /UPLINK/i })).toHaveCount(0)
  })

  test('an unknown system slug returns a real 404, not a soft one', async ({ page }) => {
    const response = await page.goto('/systems/this-record-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/NO RECORD/i)).toBeVisible()
  })

  test(`the private client host (${PRIVATE_HOST}) appears in no page's HTML`, async ({ page }) => {
    // Derive the full set of system routes from the archive page itself instead
    // of importing content internals — this is exactly the set of records a real
    // crawler (or a client clicking around) would discover, and it doubles as
    // confirmation that /archive really does expose all of them.
    const archiveHtml = await (await page.request.get('/archive')).text()
    const slugs = [
      ...new Set([...archiveHtml.matchAll(/href="\/systems\/([a-z0-9-]+)"/g)].map((m) => m[1])),
    ]
    expect(slugs.length, 'expected to discover the full archive from /archive itself').toBeGreaterThanOrEqual(18)

    const paths = [
      '/',
      '/archive',
      '/contact',
      '/systems/this-record-does-not-exist', // the 404 page, too
      ...slugs.map((s) => `/systems/${s}`),
    ]

    for (const path of paths) {
      const body = await (await page.request.get(path)).text()
      expect(body, `${path} leaked the private host`).not.toContain(PRIVATE_HOST)
    }
  })
})
