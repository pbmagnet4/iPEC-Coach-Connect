/**
 * Authentication Setup for Playwright E2E Tests
 * 
 * This setup file handles authentication state preparation for E2E tests.
 * It creates authenticated user sessions that can be reused across tests
 * to avoid repeated login operations and improve test performance.
 */

import { expect, test as setup } from '@playwright/test';
import path from 'path';

// File paths for storing authentication states
const authFiles = {
  client: 'playwright/.auth/client.json',
  coach: 'playwright/.auth/coach.json',
  admin: 'playwright/.auth/admin.json',
  user: 'playwright/.auth/user.json', // Generic authenticated user
};

// Test user credentials for setup
const setupUsers = {
  client: {
    email: 'test.client@example.com',
    password: 'ClientPassword123!',
    role: 'client'
  },
  coach: {
    email: 'test.coach@example.com',
    password: 'CoachPassword123!',
    role: 'coach'
  },
  admin: {
    email: 'test.admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin'
  }
};

/**
 * Helper function to perform login and save auth state
 */
async function authenticateUser(
  page: any, 
  user: typeof setupUsers.client, 
  authFile: string
) {
  // Navigate to login page
  await page.goto('/auth/login');
  
  // Wait for login form to be visible
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  
  // Fill login credentials
  await page.fill('[data-testid="login-email"]', user.email);
  await page.fill('[data-testid="login-password"]', user.password);
  
  // Submit login form
  await page.click('[data-testid="login-submit"]');
  
  // Wait for successful authentication
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  // Verify user is authenticated
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log(`✅ Authentication setup complete for ${user.role}: ${authFile}`);
}

/**
 * Setup authenticated client user
 */
setup('authenticate as client', async ({ page }) => {
  await authenticateUser(page, setupUsers.client, authFiles.client);
});

/**
 * Setup authenticated coach user
 */
setup('authenticate as coach', async ({ page }) => {
  await authenticateUser(page, setupUsers.coach, authFiles.coach);
});

/**
 * Setup authenticated admin user
 */
setup('authenticate as admin', async ({ page }) => {
  await authenticateUser(page, setupUsers.admin, authFiles.admin);
});

/**
 * Setup generic authenticated user (client by default)
 */
setup('authenticate as user', async ({ page }) => {
  await authenticateUser(page, setupUsers.client, authFiles.user);
});

/**
 * Setup test data and environment
 */
setup('prepare test environment', async ({ page }) => {
  // Check if the application is running
  try {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Application is accessible');
  } catch (error) {
    console.error('❌ Application is not accessible. Make sure the dev server is running.');
    throw error;
  }
  
  // Verify test database is available (if applicable)
  if (process.env.NODE_ENV === 'test') {
    try {
      // Make a test API call to verify backend
      const response = await page.request.get('/api/health');
      if (response.ok()) {
        console.log('✅ Test API is accessible');
      }
    } catch (error) {
      console.warn('⚠️  Test API not accessible, using frontend-only tests');
    }
  }
  
  // Clear any existing auth state
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  console.log('✅ Test environment prepared');
});

/**
 * Cleanup setup - runs after all tests
 */
setup.afterAll(async () => {
  console.log('🧹 Authentication setup cleanup complete');
});