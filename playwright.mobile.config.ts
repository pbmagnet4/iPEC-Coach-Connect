import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile-specific Playwright Configuration for iPEC Coach Connect
 * 
 * This configuration runs mobile navigation and responsive design tests
 * without authentication dependencies for faster execution and debugging.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/mobile-screenshot-test.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { outputDir: 'playwright-report-mobile' }],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like await page.goto('/') */
    baseURL: 'http://localhost:5175',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for navigation actions */
    navigationTimeout: 30 * 1000,
    
    /* Global timeout for actions */
    actionTimeout: 10 * 1000,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for mobile browsers only */
  projects: [
    // iPhone 12
    {
      name: 'iPhone 12',
      use: { 
        ...devices['iPhone 12'],
      },
    },
    
    // iPhone SE (small screen)
    {
      name: 'iPhone SE',
      use: { 
        ...devices['iPhone SE'],
      },
    },

    // Pixel 5 (Android)
    {
      name: 'Pixel 5',
      use: { 
        ...devices['Pixel 5'],
      },
    },

    // Galaxy S8 (older Android)
    {
      name: 'Galaxy S8',
      use: { 
        ...devices['Galaxy S8+'],
      },
    },

    // iPad (tablet)
    {
      name: 'iPad',
      use: { 
        ...devices['iPad'],
      },
    },

    // Custom mobile viewports
    {
      name: 'Small Mobile',
      use: {
        viewport: { width: 320, height: 568 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      },
    },
    
    {
      name: 'Large Mobile',
      use: {
        viewport: { width: 414, height: 896 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],

  /* Global test timeout */
  timeout: 60 * 1000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
  },

  /* Output directories */
  outputDir: 'test-results-mobile/',
});