import { test, expect } from '@playwright/test'

/**
 * The entry experience (Plan 2): audio gate, boot sequence, decode-animated
 * hero text, and Lenis smooth scroll — mounted at `/` only, as an overlay ON TOP
 * of server-rendered content, never a replacement for it.
 *
 * Every one of these was a manual, throwaway check during Plan 2's execution
 * (each task's "MANDATORY browser verification" step). This file exists to make
 * them permanent — Task 7 exists because Plan 1 proved that per-task green tests
 * do not add up to a working system. See `routes.spec.ts` for the static-route
 * guarantees these checks must never leak into.
 */

test.describe('the entry experience', () => {
  test('a first-time visitor gets the gate, and content is still in the HTML', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.getByText(/OUTPUT ROUTING/i)).toBeVisible()
    // The gate must COVER content, never replace it — crawlers and no-JS visitors
    // see the page regardless.
    expect(await page.content()).toContain('Shyamsinh Parmar')
  })

  test('the gate never returns once a choice is made', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: /OFF/i }).click()
    await page.getByRole('button', { name: /SKIP/i }).click()
    await page.reload()

    // The "should I show the gate" decision is made in an effect after
    // hydration, not at first paint. A single immediate check could pass merely
    // because the effect hasn't run yet — a false pass that would hide a
    // regression where `readGate()` stops being consulted. Hold the assertion
    // over a real window instead of trusting one poll.
    const deadline = Date.now() + 1000
    while (Date.now() < deadline) {
      expect(await page.getByText(/OUTPUT ROUTING/i).count()).toBe(0)
      await page.waitForTimeout(50)
    }
  })

  test('a record route never shows the gate', async ({ page }) => {
    await page.evaluate(() => localStorage.clear()).catch(() => {})
    await page.goto('/systems/aiva')
    await expect(page.getByText(/OUTPUT ROUTING/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'AIVA Chat' })).toBeVisible()
  })

  // A JS chunk "is" an animation lib if its BODY contains a marker string. Hashed
  // chunk NAMES never contain "lenis"/"three"/"gsap", so matching r.url() gives a
  // false pass while the chunk loads — this is exactly how a Lenis prefetch leak
  // into /archive and /contact hid until it was checked by content. Also scroll to
  // the bottom first: Next viewport-prefetches a static route's whole bundle when a
  // <Link> to it enters view, so a leak only appears once the link is on screen.
  async function animLibLoaded(page: import('@playwright/test').Page, path: string) {
    const jsUrls: string[] = []
    page.on('response', (r) => { if (r.url().endsWith('.js')) jsUrls.push(r.url()) })
    await page.goto(path)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
    for (const u of jsUrls) {
      const body = await page.request.get(u).then((r) => r.text()).catch(() => '')
      if (/lenisVersion|smoothWheel|THREE\.|gsap/i.test(body)) return u
    }
    return null
  }

  for (const path of ['/systems/aiva', '/archive', '/contact']) {
    test(`${path} ships no animation library, even scrolled to the bottom`, async ({ page }) => {
      expect(await animLibLoaded(page, path), `an animation lib leaked into ${path}`).toBeNull()
    })
  }

  test('/ DOES load Lenis — proves the detector actually works', async ({ page }) => {
    // A green "no leak" result is worthless if the detector can't detect. This is
    // the control: if it fails, the checks above are passing vacuously.
    expect(await animLibLoaded(page, '/')).not.toBeNull()
  })
})

test.describe('reduced motion gets the site, not a performance', () => {
  // The installed Playwright version (1.61.1) does not promote `reducedMotion` to
  // a top-level `use` fixture — only `contextOptions.reducedMotion` type-checks
  // (confirmed against node_modules/playwright/types/test.d.ts). Same emulated
  // media feature as `test.use({ reducedMotion: 'reduce' })` in older Playwright
  // versions, just through the API shape this version actually exposes.
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('no gate, no boot, content immediately', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Content must be visible right away regardless of JS — it's server-rendered
    // either way, so this alone does not prove reduced motion was honored.
    await expect(page.getByRole('heading', { name: /Shyamsinh Parmar/i })).toBeVisible()

    // The real proof: the gate/boot decision runs in an effect after hydration,
    // not at first paint. Checking absence exactly once, immediately, risks a
    // false pass — it could succeed merely because the effect hasn't run yet,
    // which would hide a regression where reduced-motion detection silently
    // breaks and the gate shows up a beat later. Poll across a window comfortably
    // longer than hydration, so a gate that appears late is still caught.
    const deadline = Date.now() + 1000
    while (Date.now() < deadline) {
      expect(await page.getByText(/OUTPUT ROUTING/i).count()).toBe(0)
      expect(await page.getByText(/LOADING/i).count()).toBe(0)
      await page.waitForTimeout(50)
    }
  })
})

test.describe('above-the-fold decode', () => {
  test('the hero name decodes from glyph noise and settles on the real text; the accessible name is always correct', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const hero = page.locator('h1')
    await hero.waitFor({ state: 'attached' })
    const srOnly = hero.locator('.sr-only')
    const noise = hero.locator('[aria-hidden="true"]')

    // The real name must be the accessible name from the moment the hero exists —
    // before, during, and after the decode — never only once it settles. A screen
    // reader must never hear scramble noise.
    await expect(srOnly).toHaveText('Shyamsinh Parmar')

    // Sample the noise layer across frames, in-browser (the same technique the
    // plan used in Task 3 to catch this exact defect). Sampling starts
    // immediately: the decode may already be running under the gate/boot overlay,
    // since EntryOverlay always renders its children — the overlay only covers
    // them visually and marks them `inert`, which does not pause rAF — so a
    // window that only starts after dismissal risks sampling nothing but an
    // already-settled frame. If the count is never more than 1, the decode
    // rendered a frozen mask and never animated — this exact defect shipped in
    // Plan 1 with all 7 of its tests green.
    const distinctFrames = await noise.evaluate(
      (el) =>
        new Promise<number>((resolve) => {
          const seen = new Set<string>()
          const id = setInterval(() => seen.add(el.textContent ?? ''), 16)
          setTimeout(() => {
            clearInterval(id)
            resolve(seen.size)
          }, 1500)
        }),
    )
    expect(
      distinctFrames,
      'the decode noise layer never produced more than one distinct frame',
    ).toBeGreaterThan(10)

    // Dismiss gate + boot so the hero — genuinely above the fold once the overlay
    // is gone — is what a visitor actually sees. This exercises the above-fold
    // rootMargin fix: an earlier `useOnScreen` shrank all four edges of its IO
    // root, so an element already at the top of the viewport never intersected,
    // and its decode never ran, leaving raw noise forever.
    await page.getByRole('button', { name: /OFF/i }).click()
    await page.getByRole('button', { name: /SKIP/i }).click()
    await expect(page.getByText(/LOADING/i)).toHaveCount(0)
    await expect(hero).toBeVisible()

    await expect(noise).toHaveText('Shyamsinh Parmar', { timeout: 3000 })
    await expect(srOnly).toHaveText('Shyamsinh Parmar')
  })
})
