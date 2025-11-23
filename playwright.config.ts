import { defineConfig, devices } from '@playwright/test';

if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
 
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const PLAYWRIGHT_WEB_SERVER_CMD = process.env.PLAYWRIGHT_WEB_SERVER_CMD;

export default defineConfig({

  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  webServer: PLAYWRIGHT_WEB_SERVER_CMD
    ? {
        command: PLAYWRIGHT_WEB_SERVER_CMD,
        url: PLAYWRIGHT_BASE_URL,
        reuseExistingServer: true, // 기존 서버 재사용
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
});
