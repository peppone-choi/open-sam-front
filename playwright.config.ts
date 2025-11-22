import { defineConfig, devices } from '@playwright/test';

if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
 
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
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npm run dev', // fallback to dev
    url: 'http://localhost:3100',
    reuseExistingServer: true, // 기존 서버 재사용
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
