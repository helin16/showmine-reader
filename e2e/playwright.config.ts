import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_READER_URL || 'https://r.showmine66.com',
    // src/pages/item/[id].tsx leaves this out of the visit count, so opening an article changes nothing.
    userAgent: 'ShowMine-E2E',
    trace: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: process.env.CI ? 'off' : 'only-on-failure'
  }
});
