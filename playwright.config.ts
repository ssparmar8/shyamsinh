import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `output: 'export'` (next.config.ts) makes `next start` refuse to run; serve the
    // static out/ instead — the same artifact deploy-shyamsinh.sh ships to CloudFront.
    command: 'npm run build && npx serve@latest -l 3000 out',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
