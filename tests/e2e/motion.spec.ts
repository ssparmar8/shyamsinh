import { test, expect, type Page } from '@playwright/test'

// Dismisses the gate + boot so the scroll experience is what a visitor sees.
async function enter(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: /OFF/i }).click()
  await page.getByRole('button', { name: /SKIP/i }).click()
  await expect(page.getByText(/LOADING/i)).toHaveCount(0)
}

const sysTop = (page: Page) =>
  page.locator('#systems').evaluate((el) => Math.round(el.getBoundingClientRect().top))

test.describe('pinned scrub scenes (desktop)', () => {
  test('a beat pins: its top holds near the viewport top across a scroll span', async ({ page }) => {
    await enter(page)

    // Wheel down in small steps through the Systems beat, sampling its top each step. A
    // pinned section's top stays near 0 while the scroll position keeps advancing.
    const samples: { y: number; top: number }[] = []
    for (let i = 0; i < 80; i++) {
      const s = await page.evaluate(() => ({
        y: Math.round(window.scrollY),
        top: Math.round((document.querySelector('#systems') as HTMLElement).getBoundingClientRect().top),
      }))
      samples.push(s)
      if (s.top < -120) break // scrolled well past the pin
      await page.mouse.wheel(0, 150)
      await page.waitForTimeout(90)
    }

    const nearTop = samples.filter((s) => s.top >= -25 && s.top <= 35)
    expect(nearTop.length).toBeGreaterThan(0)
    const ySpan = Math.max(...nearTop.map((s) => s.y)) - Math.min(...nearTop.map((s) => s.y))
    // The pin held Systems' top near the viewport top across a meaningful scroll span.
    expect(ySpan).toBeGreaterThan(150)
  })
})

test.describe('reduced motion: full content, no pinning', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('content is fully present, no noise layer, and sections are not pinned', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Full content present, and under reduced motion no decode/type noise layer anywhere in a
    // record (every animated string renders as one plain node).
    const record = page.locator('article:has-text("AIVA Chat")')
    await expect(record).toBeVisible()
    await expect(record.getByText(/agents/i)).toBeVisible()
    expect(await record.locator('[aria-hidden="true"]').count()).toBe(0)

    // Not pinned: Systems' top moves with the scroll (Lenis is off under reduced motion, so
    // this is a native scroll).
    const before = await sysTop(page)
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(150)
    const after = await sysTop(page)
    expect(before - after).toBeGreaterThan(350)
  })
})

test.describe('touch: one-shot reveal, no pinning', () => {
  // Narrow viewport (< 768) → reveal mode regardless of pointer type, so no pinning.
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('a beat is not pinned on a narrow/touch viewport', async ({ page }) => {
    await enter(page)
    const before = await sysTop(page)
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 250)
      await page.waitForTimeout(120)
    }
    const after = await sysTop(page)
    // Scrolls normally (not pinned).
    expect(before - after).toBeGreaterThan(300)
  })
})

test.describe('the animated canvas', () => {
  test('is present on / (constellation + centerpiece)', async ({ page }) => {
    await enter(page)
    // The renderer is a dynamic(ssr:false) import and the device tier resolves a beat after
    // hydration, so the <canvas> attaches asynchronously — wait for it.
    await expect(page.locator('canvas').first()).toBeAttached({ timeout: 5000 })
  })

  test('the animated constellation is absent under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Reduced motion → tier 'none' → no fixed animated-background canvas (the telemetry map
    // is a static block canvas and intentionally still present).
    const fixedCanvases = await page.evaluate(
      () =>
        [...document.querySelectorAll('canvas')].filter((c) => getComputedStyle(c).position === 'fixed')
          .length,
    )
    expect(fixedCanvases).toBe(0)
    await context.close()
  })
})
