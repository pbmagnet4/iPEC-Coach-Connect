import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30 * 1000,
    actionTimeout: 10 * 1000,
  },

  projects: [
    {
      name: 'chromium-standalone',
      use: { 
        ...devices['Desktop Chrome'],
        // No auth state dependency
      },
      testMatch: /.*community.*\.spec\.ts/,
    },
  ],

  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  outputDir: 'test-results/',
});