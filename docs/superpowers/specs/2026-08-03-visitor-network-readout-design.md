# Visitor Network Readout

**Date:** 2026-08-03
**Subject:** Shyamsinh Parmar — portfolio (`/`)

---

## 1. Goal

Revive `HudReadout` (bottom-left HUD corner, removed earlier this session) with a new top
line that shows the *visitor's own* network details — browser, OS, public IP, and
approximate city/country — instead of the old decorative `NEURAL_NODE · LINK STABLE`
placeholder. The existing `FACILITY // ARCHIVE_DAEMON · PID 4182` and clock lines return
unchanged below it.

## 2. Constraint: static export, no server

`next.config.ts` sets `output: 'export'`; the site deploys to S3 + CloudFront
(`deploy-shyamsinh.sh`) with no server or edge runtime at request time. Anything shown
must be resolved **entirely client-side, after mount** — there is no `headers()`,
middleware, or edge geo API available. This rules out any approach that needs a backend
to hide an API key or proxy a request.

## 3. Data sources

- **Browser / OS** — parsed synchronously from `navigator.userAgent` with a small inline
  matcher (Chrome/Firefox/Safari/Edge × macOS/Windows/Linux/iOS/Android). No library, no
  network call, cannot fail.
- **IP + city/country** — one `fetch('https://ipwho.is/')` on mount. Free, no API key,
  CORS-enabled — the only realistic option for a keyless static site (a keyed provider
  like ipinfo.io would expose its token in the client bundle with no server to hide it
  behind).

## 4. Component & rendering

- `useVisitorNetwork()` hook, colocated in `HudReadout.tsx` (same pattern as the existing
  `useClock`): returns `{ line: string | null }`.
  - `line` is `null` until the `ipwho.is` fetch resolves successfully; browser/OS alone is
    never shown without the IP/location, to avoid a half-populated line popping in twice.
  - On fetch failure or rejection (ad-blockers commonly block IP-lookup requests), `line`
    stays `null` permanently — no retry, no visible error state.
- `HudReadout` renders the new line above `FACILITY // ARCHIVE_DAEMON · PID 4182` **only
  when `line` is non-null**; the facility and clock lines render unconditionally, exactly
  as before this feature.
- Format: `CHROME · MACOS · 203.0.113.42 · SAN FRANCISCO, US` — same `LINE` style
  constant (`font-mono text-[9px] ... text-[var(--color-dim)]`), city/country upper-cased
  in code since the API returns mixed case.
- One fetch attempt on mount. No polling, no re-fetch on visibility change or focus.

## 5. Privacy

This shows visitors their *own* IP and approximate location, resolved by a third-party
(`ipwho.is`) that necessarily receives the request to answer it. Nothing is sent to or
stored by this site. No consent banner — consistent with how "your IP" widgets commonly
work, and no different in kind from any third-party asset (fonts, analytics) a browser
already contacts on page load. This is a conscious scope decision, not an oversight.

## 6. Error handling

- `fetch` throws / rejects / times out → caught, `line` stays `null`, no console noise
  beyond the browser's own network-error logging.
- Malformed/unexpected JSON shape → treated the same as failure (`line` stays `null`).

## 7. Testing

Extend `HudReadout.test.tsx`:
- Mock `navigator.userAgent` and `global.fetch`.
- **Loading**: fetch pending → network line absent, facility/clock lines present.
- **Success**: fetch resolves with a sample `ipwho.is` payload → network line renders the
  formatted string.
- **Failure**: fetch rejects → network line absent, facility/clock lines unaffected.

## 8. Out of scope

- Retries, polling, or refresh on network change.
- A visible loading/placeholder state for the network line.
- Any consent UI or opt-out control.
- IP masking (visitor sees their own full IP; decided explicitly, not a gap).
