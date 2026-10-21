import { defineConfig, devices } from '@playwright/test';

const PORT = 5179;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'en-US',
  },
  projects: [
    { name: 'android-phone', use: { ...devices['Pixel 7'] } },
    { name: 'tablet-desktop', use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: `node scripts/serve.mjs`,
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
