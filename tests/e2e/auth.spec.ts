/**
 * Authentication End-to-End Tests
 * 
 * Comprehensive E2E testing for authentication flows including:
 * - User registration (email/password and Google OAuth)
 * - Login and logout scenarios
 * - Password reset and recovery
 * - Session management and persistence
 * - Role-based access control
 * - Error handling and edge cases
 * 
 * These tests ensure secure, reliable authentication across all user types
 * and verify proper handling of authentication state throughout the application.
 */

import { test, expect } from '@playwright/test';
import { createTestHelpers, createCommonAssertions } from '../utils/test-helpers';
import { createTestUser, testData } from '../fixtures/test-data';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test on the home page
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register new client user with email/password', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);
      const testUser = createTestUser({ role: 'client' });

      // Navigate to registration
      await helpers.page.clickWithRetry('[data-testid="get-started-button"]');
      await helpers.page.waitForNavigation('/get-started');

      // Fill registration form
      await helpers.page.fillForm({
        '[data-testid="signup-email"]': testUser.email,
        '[data-testid="signup-password"]': 'TestPassword123!',
        '[data-testid="signup-fullname"]': testUser.fullName,
        '[data-testid="signup-phone"]': testUser.phone || '',
      });

      // Select client role
      await page.selectOption('[data-testid="signup-role"]', 'client');

      // Submit registration
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');

      // Wait for successful registration
      await helpers.page.waitForNavigation();

      // Verify user is logged in and redirected appropriately
      await assertions.verifyUserLoggedIn(testUser.email);

      // Verify client-specific elements are visible
      await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-dashboard"]')).toBeVisible();

      // Verify profile information is saved
      await page.goto('/profile');
      await expect(page.locator('[data-testid="profile-name"]')).toContainText(testUser.fullName);
      await expect(page.locator('[data-testid="profile-email"]')).toContainText(testUser.email);
    });

    test('should register new coach user and redirect to application', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);
      const testCoach = createTestUser({ role: 'coach' });

      // Navigate to coach registration
      await page.goto('/become-coach');
      await helpers.page.clickWithRetry('[data-testid="apply-now-button"]');

      // Fill coach registration form
      await helpers.page.fillForm({
        '[data-testid="signup-email"]': testCoach.email,
        '[data-testid="signup-password"]': 'TestPassword123!',
        '[data-testid="signup-fullname"]': testCoach.fullName,
        '[data-testid="signup-phone"]': testCoach.phone || '',
      });

      // Select coach role
      await page.selectOption('[data-testid="signup-role"]', 'coach');

      // Submit registration
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');

      // Wait for successful registration
      await helpers.page.waitForNavigation();

      // Verify user is logged in
      await assertions.verifyUserLoggedIn(testCoach.email);

      // Verify coach application form is displayed
      await expect(page.locator('[data-testid="coach-application-form"]')).toBeVisible();
      
      // Fill coach-specific information
      await helpers.page.fillForm({
        '[data-testid="ipec-certification"]': 'IPEC-TEST-12345',
        '[data-testid="certification-level"]': 'Professional',
        '[data-testid="experience-years"]': '5',
        '[data-testid="hourly-rate"]': '150',
        '[data-testid="bio"]': 'Experienced coach specializing in career transitions.',
      });

      // Select specializations
      await page.check('[data-testid="specialty-career"]');
      await page.check('[data-testid="specialty-leadership"]');

      // Submit coach application
      await helpers.page.clickWithRetry('[data-testid="submit-application"]');

      // Verify application submitted successfully
      await helpers.page.verifyToast('Coach application submitted successfully');
      await expect(page.locator('[data-testid="application-pending"]')).toBeVisible();
    });

    test('should handle registration validation errors', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      await page.goto('/get-started');

      // Try to submit with empty form
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');
      await assertions.verifyErrorMessage('Please fill in all required fields');

      // Try with invalid email
      await helpers.page.fillForm({
        '[data-testid="signup-email"]': 'invalid-email',
        '[data-testid="signup-password"]': 'TestPassword123!',
        '[data-testid="signup-fullname"]': 'Test User',
      });
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');
      await assertions.verifyErrorMessage('Please enter a valid email address');

      // Try with weak password
      await helpers.page.fillForm({
        '[data-testid="signup-email"]': 'test@example.com',
        '[data-testid="signup-password"]': '123',
      });
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');
      await assertions.verifyErrorMessage('Password must be at least 8 characters');

      // Try with existing email
      await helpers.page.fillForm({
        '[data-testid="signup-email"]': 'existing@example.com',
        '[data-testid="signup-password"]': 'ValidPassword123!',
      });
      await helpers.page.clickWithRetry('[data-testid="signup-button"]');
      await assertions.verifyErrorMessage('An account with this email already exists');
    });

    test('should register with Google OAuth', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/get-started');

      // Mock Google OAuth flow (in real tests, this would use OAuth testing strategies)
      await page.route('https://accounts.google.com/oauth/authorize*', async route => {
        // Simulate successful OAuth callback
        await route.fulfill({
          status: 302,
          headers: {
            'Location': `${page.url()}?code=mock_oauth_code&state=mock_state`
          }
        });
      });

      // Click Google sign-in button
      await helpers.page.clickWithRetry('[data-testid="google-signin-button"]');

      // Wait for OAuth redirect and completion
      await helpers.page.waitForNavigation();

      // Verify user is logged in (OAuth would create account automatically)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // Verify Google user is prompted to complete profile if needed
      const profileIncomplete = await page.locator('[data-testid="complete-profile"]').isVisible();
      if (profileIncomplete) {
        await expect(page.locator('[data-testid="profile-completion-form"]')).toBeVisible();
      }
    });
  });

  test.describe('User Login', () => {
    test('should login with valid email/password', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      // Navigate to login
      await helpers.page.clickWithRetry('[data-testid="login-button"]');
      await helpers.page.waitForNavigation('/login');

      // Fill login form with test credentials
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });

      // Submit login
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Wait for successful login
      await helpers.page.waitForNavigation('/dashboard');

      // Verify user is logged in
      await assertions.verifyUserLoggedIn('test.client@ipeccoach.com');

      // Verify dashboard is accessible
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    });

    test('should handle login validation errors', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      await page.goto('/login');

      // Try with empty credentials
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await assertions.verifyErrorMessage('Email and password are required');

      // Try with invalid email format
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'invalid-email',
        '[data-testid="password-input"]': 'password',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await assertions.verifyErrorMessage('Please enter a valid email address');

      // Try with wrong credentials
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'wrong@example.com',
        '[data-testid="password-input"]': 'wrongpassword',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await assertions.verifyErrorMessage('Invalid email or password');
    });

    test('should login with Google OAuth', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/login');

      // Mock successful Google OAuth
      await page.route('https://accounts.google.com/oauth/authorize*', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': `${page.url()}?code=mock_oauth_code&state=mock_state`
          }
        });
      });

      // Click Google login button
      await helpers.page.clickWithRetry('[data-testid="google-login-button"]');

      // Wait for OAuth completion
      await helpers.page.waitForNavigation();

      // Verify successful login
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should remember login state across sessions', async ({ page, context }) => {
      const helpers = createTestHelpers(page);
      
      // Login first
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await helpers.page.waitForNavigation('/dashboard');

      // Close browser and open new page (simulating session restart)
      await page.close();
      const newPage = await context.newPage();
      
      // Navigate to protected route
      await newPage.goto('/dashboard');

      // Verify user is still logged in
      await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(newPage.locator('[data-testid="dashboard-header"]')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/login');

      // Click forgot password link
      await helpers.page.clickWithRetry('[data-testid="forgot-password-link"]');
      await helpers.page.waitForNavigation('/forgot-password');

      // Enter email for reset
      await helpers.page.fillForm({
        '[data-testid="reset-email"]': 'test.client@ipeccoach.com',
      });

      // Submit reset request
      await helpers.page.clickWithRetry('[data-testid="send-reset-button"]');

      // Verify success message
      await helpers.page.verifyToast('Password reset email sent');
      await expect(page.locator('[data-testid="reset-sent-message"]')).toBeVisible();
    });

    test('should handle invalid email for password reset', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      await page.goto('/forgot-password');

      // Try with invalid email
      await helpers.page.fillForm({
        '[data-testid="reset-email"]': 'invalid-email',
      });
      await helpers.page.clickWithRetry('[data-testid="send-reset-button"]');
      await assertions.verifyErrorMessage('Please enter a valid email address');

      // Try with non-existent email
      await helpers.page.fillForm({
        '[data-testid="reset-email"]': 'nonexistent@example.com',
      });
      await helpers.page.clickWithRetry('[data-testid="send-reset-button"]');
      await assertions.verifyErrorMessage('No account found with this email address');
    });

    test('should reset password with valid token', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Simulate clicking reset link from email (with valid token)
      await page.goto('/reset-password?token=valid_reset_token');

      // Verify reset form is displayed
      await expect(page.locator('[data-testid="new-password-form"]')).toBeVisible();

      // Fill new password
      await helpers.page.fillForm({
        '[data-testid="new-password"]': 'NewPassword123!',
        '[data-testid="confirm-password"]': 'NewPassword123!',
      });

      // Submit new password
      await helpers.page.clickWithRetry('[data-testid="reset-password-button"]');

      // Verify success and redirect to login
      await helpers.page.verifyToast('Password reset successfully');
      await helpers.page.waitForNavigation('/login');

      // Verify can login with new password
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'NewPassword123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await helpers.page.waitForNavigation('/dashboard');

      // Verify successful login
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      // Login first
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await helpers.page.waitForNavigation('/dashboard');

      // Open user menu and logout
      await helpers.page.clickWithRetry('[data-testid="user-menu"]');
      await helpers.page.clickWithRetry('[data-testid="logout-button"]');

      // Wait for logout redirect
      await helpers.page.waitForNavigation('/');

      // Verify user is logged out
      await assertions.verifyUserLoggedOut();

      // Verify protected routes redirect to login
      await page.goto('/dashboard');
      await helpers.page.waitForNavigation('/login');
    });

    test('should clear session data on logout', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login and verify session data exists
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Check that auth token exists
      const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(tokenBefore).toBeTruthy();

      // Logout
      await helpers.page.clickWithRetry('[data-testid="user-menu"]');
      await helpers.page.clickWithRetry('[data-testid="logout-button"]');

      // Verify session data is cleared
      const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(tokenAfter).toBeNull();

      const userData = await page.evaluate(() => localStorage.getItem('user_data'));
      expect(userData).toBeNull();
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should redirect coaches to coach dashboard', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login as coach
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.coach@ipeccoach.com',
        '[data-testid="password-input"]': 'TestCoach123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Verify redirected to coach dashboard
      await helpers.page.waitForNavigation('/coach/dashboard');
      await expect(page.locator('[data-testid="coach-dashboard"]')).toBeVisible();

      // Verify coach-specific features are accessible
      await expect(page.locator('[data-testid="manage-sessions"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-calendar"]')).toBeVisible();
    });

    test('should restrict access to coach-only features for clients', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login as client
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Try to access coach dashboard
      await page.goto('/coach/dashboard');
      
      // Should be redirected to unauthorized page or client dashboard
      await expect(
        page.locator('[data-testid="unauthorized-message"]').or(
          page.locator('[data-testid="client-dashboard"]')
        )
      ).toBeVisible();

      // Verify coach-specific features are not visible
      await expect(page.locator('[data-testid="manage-sessions"]')).not.toBeVisible();
    });

    test('should handle admin access correctly', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login as admin
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.admin@ipeccoach.com',
        '[data-testid="password-input"]': 'TestAdmin123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Verify admin dashboard access
      await page.goto('/admin');
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

      // Verify admin-specific features
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-verification"]')).toBeVisible();
    });
  });

  test.describe('Session Security', () => {
    test('should handle session timeout', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Simulate session expiration
      await page.evaluate(() => {
        localStorage.setItem('auth_token_expires', Date.now() - 1000);
      });

      // Try to access protected resource
      await page.goto('/dashboard');

      // Should be redirected to login due to expired session
      await helpers.page.waitForNavigation('/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
    });

    test('should handle concurrent login sessions', async ({ page, context }) => {
      const helpers = createTestHelpers(page);

      // Login in first session
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Open second browser session
      const secondPage = await context.newPage();
      const secondHelpers = createTestHelpers(secondPage);
      
      await secondPage.goto('/login');
      await secondHelpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await secondHelpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Both sessions should be valid (depending on security policy)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(secondPage.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });
});