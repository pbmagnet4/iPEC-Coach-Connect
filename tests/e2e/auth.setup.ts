/**
 * Authentication Setup for Playwright E2E Tests
 * 
 * Comprehensive authentication state management for testing different user roles:
 * - Client users (regular users seeking coaching)
 * - Coach users (certified coaches providing services)
 * - Admin users (platform administrators)
 * - Guest users (unauthenticated users)
 * 
 * This setup ensures consistent authentication state across test runs and
 * provides isolated user contexts for comprehensive testing scenarios.
 */

import { expect, test as setup } from '@playwright/test';
import path from 'path';

// Authentication file paths for different user roles
const authFiles = {
  client: 'playwright/.auth/client.json',
  coach: 'playwright/.auth/coach.json',
  admin: 'playwright/.auth/admin.json',
  user: 'playwright/.auth/user.json', // Default user for general tests
} as const;

// Test user credentials (should be environment variables in real scenarios)
const testUsers = {
  client: {
    email: process.env.PLAYWRIGHT_CLIENT_EMAIL || 'test.client@ipeccoach.com',
    password: process.env.PLAYWRIGHT_CLIENT_PASSWORD || 'TestClient123!',
    fullName: 'Test Client User',
    role: 'client' as const,
  },
  coach: {
    email: process.env.PLAYWRIGHT_COACH_EMAIL || 'test.coach@ipeccoach.com',
    password: process.env.PLAYWRIGHT_COACH_PASSWORD || 'TestCoach123!',
    fullName: 'Test Coach User',
    role: 'coach' as const,
  },
  admin: {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL || 'test.admin@ipeccoach.com',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'TestAdmin123!',
    fullName: 'Test Admin User',
    role: 'admin' as const,
  },
} as const;

/**
 * Helper function to perform authentication flow
 */
async function authenticateUser(page: any, userCredentials: typeof testUsers.client) {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', userCredentials.email);
  await page.fill('[data-testid="password-input"]', userCredentials.password);
  
  // Submit login form
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful authentication - check for dashboard or profile indicator
  await expect(
    page.locator('[data-testid="user-menu"]').or(
      page.locator('[data-testid="dashboard-header"]')
    )
  ).toBeVisible({ timeout: 10000 });
  
  // Verify authentication state by checking for user-specific elements
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  
  console.log(`✅ Successfully authenticated as ${userCredentials.role}: ${userCredentials.email}`);
}

/**
 * Helper function to create user account if it doesn't exist
 */
async function ensureUserExists(page: any, userCredentials: typeof testUsers.client) {
  try {
    // Try to login first
    await authenticateUser(page, userCredentials);
    return true;
  } catch (error) {
    console.log(`User ${userCredentials.email} doesn't exist, creating account...`);
    
    // Navigate to signup page
    await page.goto('/get-started');
    
    // Wait for signup form
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();
    
    // Fill signup form
    await page.fill('[data-testid="signup-email"]', userCredentials.email);
    await page.fill('[data-testid="signup-password"]', userCredentials.password);
    await page.fill('[data-testid="signup-fullname"]', userCredentials.fullName);
    
    // Select user role
    await page.selectOption('[data-testid="signup-role"]', userCredentials.role);
    
    // Submit signup form
    await page.click('[data-testid="signup-button"]');
    
    // Handle email verification if required
    // Note: In test environment, this might be automatically handled
    
    // Wait for successful registration
    await expect(
      page.locator('[data-testid="welcome-message"]').or(
        page.locator('[data-testid="dashboard-header"]')
      )
    ).toBeVisible({ timeout: 15000 });
    
    console.log(`✅ Successfully created account for ${userCredentials.role}: ${userCredentials.email}`);
    return true;
  }
}

/**
 * Setup authentication for client user
 */
setup('authenticate as client', async ({ page }) => {
  await ensureUserExists(page, testUsers.client);
  await authenticateUser(page, testUsers.client);
  
  // Verify client-specific features are accessible
  await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFiles.client });
  console.log(`💾 Saved client authentication state to ${authFiles.client}`);
});

/**
 * Setup authentication for coach user
 */
setup('authenticate as coach', async ({ page }) => {
  await ensureUserExists(page, testUsers.coach);
  await authenticateUser(page, testUsers.coach);
  
  // Verify coach-specific features are accessible
  await expect(
    page.locator('[data-testid="coach-dashboard"]').or(
      page.locator('[data-testid="manage-sessions"]')
    )
  ).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFiles.coach });
  console.log(`💾 Saved coach authentication state to ${authFiles.coach}`);
});

/**
 * Setup authentication for admin user
 */
setup('authenticate as admin', async ({ page }) => {
  await ensureUserExists(page, testUsers.admin);
  await authenticateUser(page, testUsers.admin);
  
  // Verify admin-specific features are accessible
  await expect(
    page.locator('[data-testid="admin-panel"]').or(
      page.locator('[data-testid="user-management"]')
    )
  ).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFiles.admin });
  console.log(`💾 Saved admin authentication state to ${authFiles.admin}`);
});

/**
 * Setup default user authentication (using client credentials)
 */
setup('authenticate as default user', async ({ page }) => {
  await ensureUserExists(page, testUsers.client);
  await authenticateUser(page, testUsers.client);
  
  // Save as default user authentication state
  await page.context().storageState({ path: authFiles.user });
  console.log(`💾 Saved default user authentication state to ${authFiles.user}`);
});

/**
 * Cleanup function to clear authentication states
 */
setup('cleanup auth states', async ({ page }) => {
  // This test can be used to clear authentication states when needed
  // Useful for testing logout scenarios or starting fresh
  
  await page.goto('/');
  
  // Clear any existing authentication
  await page.context().clearCookies();
  await page.context().clearPermissions();
  
  // Navigate to logout if user is logged in
  try {
    await page.click('[data-testid="logout-button"]', { timeout: 2000 });
  } catch {
    // User might not be logged in, continue
  }
  
  console.log('🧹 Cleared authentication states');
});

// Export authentication utilities for use in other tests
export { authFiles, testUsers, authenticateUser, ensureUserExists };