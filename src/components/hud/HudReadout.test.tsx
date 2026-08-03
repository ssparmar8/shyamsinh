import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HudReadout, parseUserAgent } from './HudReadout'

const originalUserAgent = window.navigator.userAgent

function mockUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

const CHROME_MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

afterEach(() => {
  vi.unstubAllGlobals()
  mockUserAgent(originalUserAgent)
})

// jsdom has no matchMedia → the reduced-motion path (stamp once, no interval).
describe('HudReadout', () => {
  it('renders a decorative, aria-hidden readout with the PID flavour', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { container } = render(<HudReadout />)
    const el = container.querySelector('[aria-hidden="true"]')
    expect(el).toBeTruthy()
    expect(el?.textContent).toMatch(/PID 4182/)
  })

  it('does not render a network line before the geo lookup resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { container } = render(<HudReadout />)
    expect(container.textContent).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
  })

  it('renders browser, OS, IP, and location once the geo lookup succeeds', async () => {
    mockUserAgent(CHROME_MAC_UA)
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              ip: '203.0.113.42',
              city: 'San Francisco',
              country_code: 'US',
            }),
        }),
      ),
    )
    const { container } = render(<HudReadout />)
    await waitFor(() => {
      expect(container.textContent).toMatch(/CHROME · MACOS · 203\.0\.113\.42 · SAN FRANCISCO, US/)
    })
  })

  it('does not render a network line when the geo lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('blocked'))))
    const { container } = render(<HudReadout />)
    await waitFor(() => {
      expect(container.textContent).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
    })
  })

  it('does not attempt to setState after unmount when the geo lookup resolves late', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let resolveFetch: (value: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      ),
    )
    const { unmount } = render(<HudReadout />)
    unmount()

    resolveFetch({
      json: () =>
        Promise.resolve({
          success: true,
          ip: '203.0.113.42',
          city: 'San Francisco',
          country_code: 'US',
        }),
    })
    // Let the resolved promise chain (json() then the state update) flush.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('parseUserAgent', () => {
  const WINDOWS_EDGE_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  const LINUX_FIREFOX_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
  const MAC_SAFARI_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  const WINDOWS_CHROME_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const ANDROID_CHROME_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  const UNKNOWN_UA = 'SomeCustomBot/1.0 (+https://example.com/bot)'

  it.each([
    ['Edge/Windows', WINDOWS_EDGE_UA, 'EDGE', 'WINDOWS'],
    ['Firefox/Linux', LINUX_FIREFOX_UA, 'FIREFOX', 'LINUX'],
    ['Safari/macOS', MAC_SAFARI_UA, 'SAFARI', 'MACOS'],
    ['Chrome/macOS', CHROME_MAC_UA, 'CHROME', 'MACOS'],
    ['Chrome/Windows', WINDOWS_CHROME_UA, 'CHROME', 'WINDOWS'],
    ['Chrome/Android', ANDROID_CHROME_UA, 'CHROME', 'ANDROID'],
    ['Safari/iPhone', IPHONE_UA, 'SAFARI', 'IOS'],
    ['Unrecognized UA', UNKNOWN_UA, 'UNKNOWN', 'UNKNOWN'],
  ])('%s', (_label, ua, expectedBrowser, expectedOs) => {
    expect(parseUserAgent(ua)).toEqual({ browser: expectedBrowser, os: expectedOs })
  })
})
