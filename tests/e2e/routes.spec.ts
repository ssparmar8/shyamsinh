import { test, expect } from '@playwright/test'

/**
 * Static-route guarantees — this is what Plan 1's own Task 11 wanted, folded into
 * Plan 2's Task 7 because the escape hatch only means something once there is
 * something to escape (the cinematic entry, built in this plan).
 *
 * `/systems/*`, `/archive`, and `/contact` are for a visitor who wants the facts
 * in ten seconds: no gate, no boot, no animation libraries, a real HTTP status,
 * and never a client's private hostname. See `entry.spec.ts` for the gate/boot/
 * decode/Lenis checks these routes must stay untouched by.
 */

const PRIVATE_HOST = 'ai-uat.medicalofficeforce.co'

test.describe('static route guarantees', () => {
  test('/systems/aiva renders its content immediately, with no gate', async ({ page }) => {
    const response = await page.goto('/systems/aiva')
    expect(response?.status()).toBe(200)
    // EntryOverlay is never mounted on a record route at all — not gate, not
    // boot, not even transiently. That is a structural guarantee (the component
    // isn't in this route's tree), so a single check is enough here, unlike `/`'s
    // gate-suppression checks in entry.spec.ts, which have to prove a *runtime
    // decision* holds rather than that a code path is simply absent.
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
  })

  test('/archive lists all 18 systems', async ({ page }) => {
    await page.goto('/archive')
    const rows = page.locator('a[href^="/systems/"]')
    await expect(rows).toHaveCount(18)
  })

  test('a record route reaches /contact via the persistent UPLINK in one click, even scrolled down', async ({ page }) => {
    // HudFrame's UPLINK link is `fixed`, not `absolute`. An earlier version used
    // `absolute` inside a height:auto box, which anchored the chrome to the
    // document instead of the viewport — on any page taller than one viewport the
    // whole chrome, UPLINK included, scrolled away with the content it was meant
    // to sit above. Scrolling to the bottom before clicking is what actually
    // exercises that regression instead of only ever testing from the top.
    await page.goto('/systems/aiva')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const uplink = page.getByRole('link', { name: /UPLINK/i })
    await expect(uplink).toBeVisible()
    await uplink.click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible()
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
