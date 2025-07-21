import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright Configuration for iPEC Coach Connect
 * 
 * This configuration provides:
 * - Multi-browser testing (Chrome, Firefox, Safari, Edge)
 * - Mobile device testing
 * - Visual regression testing
 * - Authentication state management
 * - CI/CD integration
 * - Performance monitoring
 * - Accessibility testing
 * - Parallel execution optimization
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputDir: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [['github']] : [['list']]),
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
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
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Tablet testing
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Visual regression testing (specific viewport)
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.visual\.spec\.ts/,
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.a11y\.spec\.ts/,
    },

    // Performance testing
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.perf\.spec\.ts/,
    },

    // API testing (no browser)
    {
      name: 'api',
      use: {
        baseURL: process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:54321',
      },
      testMatch: /.*\.api\.spec\.ts/,
    },
  ],

  /* Environment-specific configuration */
  ...(process.env.NODE_ENV === 'development' && {
    webServer: {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  }),

  /* Test directory structure */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],

  /* Global test timeout */
  timeout: 60 * 1000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10 * 1000,
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: { 
      threshold: 0.2, 
      animations: 'disabled',
      mode: 'default',
    },
    toMatchAriaSnapshot: {
      mode: 'default',
    },
  },

  /* Output directories */
  outputDir: 'test-results/',
  
  /* Metadata for reporting */
  metadata: {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  },
});