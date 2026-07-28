import { test, expect, type Page } from '@playwright/test'

// Dismisses the boot so the scroll experience is what a visitor sees.
async function enter(page: Page) {
  await page.goto('/')
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
    //
    // The step size is load-bearing. Systems pins for `length={0.5}` — about 360px of scroll
    // at a 720px viewport — so at the 150px step this used to take, only two samples could
    // land inside the near-top window and ySpan measured the gap between two arbitrary sample
    // points, not the pin. Any change to a beat ABOVE Systems shifted that phase and flipped
    // the result: the hero growing by a few lines took it from comfortably passing to 148.
    // 60px steps put ~7 samples inside a real pin, so ySpan converges on the actual hold.
    const samples: { y: number; top: number }[] = []
    for (let i = 0; i < 200; i++) {
      const s = await page.evaluate(() => ({
        y: Math.round(window.scrollY),
        top: Math.round((document.querySelector('#systems') as HTMLElement).getBoundingClientRect().top),
      }))
      samples.push(s)
      if (s.top < -120) break // scrolled well past the pin
      await page.mouse.wheel(0, 60)
      await page.waitForTimeout(60)
    }

    const nearTop = samples.filter((s) => s.top >= -25 && s.top <= 35)
    expect(nearTop.length).toBeGreaterThan(0)
    const ySpan = Math.max(...nearTop.map((s) => s.y)) - Math.min(...nearTop.map((s) => s.y))
    // The pin held Systems' top near the viewport top across a meaningful scroll span.
    expect(ySpan).toBeGreaterThan(150)
  })
})

/**
 * Scroll animates position, never opacity.
 *
 * Every layer used to ride an `autoAlpha: 0 → 1` ramp, and a released beat faded to 0.5 while
 * it was still on screen — so under a scrub, where progress is tied to the wheel rather than
 * to a short duration, text spent most of its time part-way through an alpha tween and read
 * as blurred. Checking the computed opacity of everything actually on screen is the only
 * assertion that holds for the whole rule: a class-name check would miss a gsap inline style,
 * and a per-component check would miss the next component.
 */
test.describe('nothing dims while scrolling', () => {
  for (const [label, viewport] of [
    ['desktop (scrub + pin)', { width: 1280, height: 720 }],
    ['narrow (one-shot reveal)', { width: 390, height: 844 }],
  ] as const) {
    test(`no on-screen element drops below full opacity — ${label}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await enter(page)

      /**
       * Two deliberate exemptions, both decoration rather than content, and neither driven
       * by scroll:
       *   - the typewriter's block caret, which is a cursor and is meant to sit faint;
       *   - textless marker glyphs running their own CSS animation (the availability dot,
       *     the timeline's current-node dot), which breathe like a status light.
       * Anything carrying words is held to full opacity, always.
       */
      const dimmed = async () =>
        page.evaluate(() =>
          [...document.querySelectorAll('main *')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              if (!r.height || r.bottom < 0 || r.top > innerHeight) return false
              const text = el.textContent?.trim() ?? ''
              if (text === '▍') return false
              const cs = getComputedStyle(el)
              if (text === '' && cs.animationName !== 'none') return false
              return cs.visibility === 'hidden' || parseFloat(cs.opacity) < 1
            })
            .map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`),
        )

      const offenders: string[] = []
      for (let i = 0; i < 40; i++) {
        await page.mouse.wheel(0, 240)
        await page.waitForTimeout(70)
        offenders.push(...(await dimmed()))
      }
      expect([...new Set(offenders)]).toEqual([])
    })
  }
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

test.describe('custom cursor + scroll progress (desktop)', () => {
  test('the glyph-trail caret mounts on / for a fine pointer', async ({ page }) => {
    await enter(page)
    await page.mouse.move(640, 400)
    await expect(page.getByTestId('cursor-caret')).toBeAttached({ timeout: 5000 })
  })

  test('the scroll-progress readout advances as the page scrolls', async ({ page }) => {
    await enter(page)
    const pct = page.getByTestId('scroll-pct')
    await expect(pct).toHaveText('000')
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(60)
    }
    const value = Number(await pct.textContent())
    expect(value).toBeGreaterThan(5)
  })
})

test.describe('custom cursor: absent when motion is off', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('no caret under reduced motion', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.mouse.move(640, 400)
    await page.waitForTimeout(300)
    await expect(page.getByTestId('cursor-caret')).toHaveCount(0)
  })
})
