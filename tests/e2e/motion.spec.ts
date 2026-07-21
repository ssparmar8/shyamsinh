import { test, expect } from '@playwright/test'

// Dismisses the gate + boot so the scroll experience is what a visitor sees.
async function enter(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /OFF/i }).click()
  await page.getByRole('button', { name: /SKIP/i }).click()
  await expect(page.getByText(/LOADING/i)).toHaveCount(0)
}

test.describe('per-record reveal', () => {
  test('a below-the-fold record starts hidden and reveals on scroll', async ({ page }) => {
    await enter(page)

    // The last featured record ("Health Wealth Safe") is well below the fold. Its
    // Reveal wrapper is the article's parent; before scrolling it is opacity 0.
    const wrapper = page.locator('div:has(> article:has-text("Health Wealth Safe"))').first()
    const before = await wrapper.evaluate((el) => Number(getComputedStyle(el).opacity))
    expect(before).toBeLessThan(0.5)

    await page.getByRole('heading', { name: 'Health Wealth Safe' }).scrollIntoViewIfNeeded()
    // ScrollTrigger fires at top 85% and the wrapper transitions to opacity 1.
    await expect
      .poll(async () => wrapper.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 3000 })
      .toBeGreaterThan(0.9)
  })
})

test.describe('reduced motion gets full record content', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('a record shows its full summary with no animated layer', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Full content present and, under reduced motion, no decode/type noise layer
    // anywhere in the systems section.
    const record = page.locator('article:has-text("AIVA Chat")')
    await expect(record).toBeVisible()
    await expect(record.getByText(/agents/i)).toBeVisible()
    expect(await record.locator('[aria-hidden="true"]').count()).toBe(0)
  })
})

test.describe('the animated canvas', () => {
  test('is present on / (constellation + centerpiece)', async ({ page }) => {
    await enter(page)
    // The renderer is a dynamic(ssr:false) import and the device tier resolves a
    // beat after hydration, so the <canvas> attaches asynchronously — wait for it
    // rather than sampling the count immediately.
    await expect(page.locator('canvas').first()).toBeAttached({ timeout: 5000 })
  })

  test('the animated constellation is absent under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Reduced motion → tier 'none' → the fixed, full-screen constellation renders
    // nothing. The telemetry map IS a canvas, but it's static content (drawn once, no
    // rAF loop) and a block element, so it's intentionally still present — assert only
    // that no FIXED (i.e. animated-background) canvas exists.
    const fixedCanvases = await page.evaluate(
      () =>
        [...document.querySelectorAll('canvas')].filter((c) => getComputedStyle(c).position === 'fixed')
          .length,
    )
    expect(fixedCanvases).toBe(0)
    await context.close()
  })
})
