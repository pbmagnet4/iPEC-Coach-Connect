/**
 * Coach Booking End-to-End Tests
 * 
 * Comprehensive E2E testing for the complete coach discovery and booking flow:
 * - Coach search and filtering functionality
 * - Coach profile viewing and information validation
 * - Session type selection and customization
 * - Calendar availability viewing and time slot selection
 * - Payment processing integration with Stripe
 * - Booking confirmation and email notifications
 * - Session management and rescheduling
 * - Review and rating system
 * - Mobile responsiveness and accessibility
 * 
 * This test suite ensures the entire booking funnel works seamlessly from
 * initial coach discovery through successful session booking and payment.
 */

import { expect, test } from '@playwright/test';
import { createCommonAssertions, createTestHelpers } from '../utils/test-helpers';
import { createTestSession, createTestUser, testData } from '../fixtures/test-data';

test.describe('Coach Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start on home page and ensure clean state
    await page.goto('/');
  });

  test.describe('Coach Discovery', () => {
    test('should display coaches with proper information', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Navigate to coach listing
      await helpers.page.clickWithRetry('[data-testid="find-coaches-button"]');
      await helpers.page.waitForNavigation('/coaches');

      // Verify page title and loading
      await expect(page.locator('h1')).toContainText('Find Your Coach');
      
      // Wait for coaches to load
      await helpers.page.waitForElement('[data-testid="coach-card"]', { timeout: 10000 });

      // Verify coach cards display essential information
      const coachCards = page.locator('[data-testid="coach-card"]');
      const firstCoach = coachCards.first();

      await expect(firstCoach.locator('[data-testid="coach-name"]')).toBeVisible();
      await expect(firstCoach.locator('[data-testid="coach-specialties"]')).toBeVisible();
      await expect(firstCoach.locator('[data-testid="coach-rating"]')).toBeVisible();
      await expect(firstCoach.locator('[data-testid="coach-hourly-rate"]')).toBeVisible();
      await expect(firstCoach.locator('[data-testid="view-profile-button"]')).toBeVisible();

      // Verify coach certification badges
      await expect(firstCoach.locator('[data-testid="ipec-certified-badge"]')).toBeVisible();
    });

    test('should filter coaches by specialty', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Get initial coach count
      const initialCoaches = await page.locator('[data-testid="coach-card"]').count();
      expect(initialCoaches).toBeGreaterThan(0);

      // Apply specialty filter
      await helpers.page.clickWithRetry('[data-testid="specialty-filter"]');
      await helpers.page.clickWithRetry('[data-testid="filter-life-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify filtered results
      const filteredCoaches = await page.locator('[data-testid="coach-card"]').count();
      expect(filteredCoaches).toBeGreaterThan(0);

      // Verify all displayed coaches have the selected specialty
      const coachCards = page.locator('[data-testid="coach-card"]');
      for (let i = 0; i < await coachCards.count(); i++) {
        const specialties = coachCards.nth(i).locator('[data-testid="coach-specialties"]');
        await expect(specialties).toContainText('Life Coaching');
      }
    });

    test('should filter coaches by price range', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Open price filter
      await helpers.page.clickWithRetry('[data-testid="price-filter"]');

      // Set price range
      await page.fill('[data-testid="min-price-input"]', '100');
      await page.fill('[data-testid="max-price-input"]', '200');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify price range filtering
      const coachCards = page.locator('[data-testid="coach-card"]');
      for (let i = 0; i < await coachCards.count(); i++) {
        const rateText = await coachCards.nth(i).locator('[data-testid="coach-hourly-rate"]').textContent();
        const rate = parseInt(rateText?.replace(/\D/g, '') || '0');
        expect(rate).toBeGreaterThanOrEqual(100);
        expect(rate).toBeLessThanOrEqual(200);
      }
    });

    test('should filter coaches by location', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Set location preference
      await helpers.page.clickWithRetry('[data-testid="location-filter"]');
      await helpers.page.clickWithRetry('[data-testid="remote-only"]');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify location filtering
      const coachCards = page.locator('[data-testid="coach-card"]');
      for (let i = 0; i < await coachCards.count(); i++) {
        const locationInfo = coachCards.nth(i).locator('[data-testid="coach-location"]');
        await expect(locationInfo).toContainText(/Remote|Online/i);
      }
    });

    test('should search coaches by name', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Get a coach name from the first card
      const firstCoachName = await page.locator('[data-testid="coach-name"]').first().textContent();
      const searchTerm = firstCoachName?.split(' ')[0] || 'Test';

      // Search by name
      await page.fill('[data-testid="search-input"]', searchTerm);
      await helpers.page.clickWithRetry('[data-testid="search-button"]');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Verify search results
      const searchResults = page.locator('[data-testid="coach-card"]');
      const resultCount = await searchResults.count();
      expect(resultCount).toBeGreaterThan(0);

      // Verify at least one result contains the search term
      const firstResult = await searchResults.first().locator('[data-testid="coach-name"]').textContent();
      expect(firstResult?.toLowerCase()).toContain(searchTerm.toLowerCase());
    });

    test('should handle no search results gracefully', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Search for non-existent coach
      await page.fill('[data-testid="search-input"]', 'NonExistentCoach12345');
      await helpers.page.clickWithRetry('[data-testid="search-button"]');

      // Wait for search completion
      await page.waitForTimeout(1000);

      // Verify no results message
      await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-results-message"]')).toContainText('No coaches found');

      // Verify suggestion to refine search
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    });
  });

  test.describe('Coach Profile Viewing', () => {
    test('should display complete coach profile information', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Click on first coach profile
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.waitForNavigation(/\/coaches\/\w+/);

      // Verify profile header information
      await expect(page.locator('[data-testid="coach-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-avatar"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-specialties"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-experience"]')).toBeVisible();

      // Verify certification information
      await expect(page.locator('[data-testid="ipec-certification"]')).toBeVisible();
      await expect(page.locator('[data-testid="certification-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="certification-date"]')).toBeVisible();

      // Verify bio and description
      await expect(page.locator('[data-testid="coach-bio"]')).toBeVisible();
      
      // Verify pricing information
      await expect(page.locator('[data-testid="hourly-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="package-rates"]')).toBeVisible();

      // Verify availability information
      await expect(page.locator('[data-testid="availability-calendar"]')).toBeVisible();

      // Verify languages and location
      await expect(page.locator('[data-testid="languages-spoken"]')).toBeVisible();
      await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
    });

    test('should display coach reviews and ratings', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Navigate to coach profile
      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');

      // Scroll to reviews section
      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

      // Verify reviews section
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-reviews"]')).toBeVisible();

      // Verify individual reviews
      const reviewCards = page.locator('[data-testid="review-card"]');
      if (await reviewCards.count() > 0) {
        const firstReview = reviewCards.first();
        await expect(firstReview.locator('[data-testid="reviewer-name"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-rating"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-text"]')).toBeVisible();
        await expect(firstReview.locator('[data-testid="review-date"]')).toBeVisible();
      }
    });

    test('should show book session button and pricing', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');

      // Verify booking section
      await expect(page.locator('[data-testid="book-session-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="book-session-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-types"]')).toBeVisible();

      // Verify session type options
      const sessionTypes = page.locator('[data-testid="session-type-option"]');
      expect(await sessionTypes.count()).toBeGreaterThan(0);

      for (let i = 0; i < await sessionTypes.count(); i++) {
        const sessionType = sessionTypes.nth(i);
        await expect(sessionType.locator('[data-testid="session-name"]')).toBeVisible();
        await expect(sessionType.locator('[data-testid="session-duration"]')).toBeVisible();
        await expect(sessionType.locator('[data-testid="session-price"]')).toBeVisible();
      }
    });
  });

  test.describe('Session Booking Process', () => {
    test.beforeEach(async ({ page }) => {
      // Authenticate as client user for booking tests
      const helpers = createTestHelpers(page);
      
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');
      await helpers.page.waitForNavigation('/dashboard');
    });

    test('should complete full booking flow with payment', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Navigate to coach profile
      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');

      // Start booking process
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');
      await helpers.page.waitForNavigation(/\/booking/);

      // Step 1: Select session type
      await expect(page.locator('[data-testid="booking-step-1"]')).toBeVisible();
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Step 2: Select date and time
      await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();
      await helpers.page.waitForElement('[data-testid="calendar-widget"]');

      // Select available date (future date)
      const availableDates = page.locator('[data-testid="available-date"]');
      await availableDates.first().click();

      // Select available time slot
      await helpers.page.waitForElement('[data-testid="time-slot"]');
      const availableSlots = page.locator('[data-testid="time-slot"]:not([disabled])');
      await availableSlots.first().click();

      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Step 3: Add session details
      await expect(page.locator('[data-testid="booking-step-3"]')).toBeVisible();
      await helpers.page.fillForm({
        '[data-testid="session-notes"]': 'Looking forward to working on my career goals and leadership skills.',
        '[data-testid="preparation-notes"]': 'I have been thinking about my current challenges and goals.',
      });
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Step 4: Review and confirm
      await expect(page.locator('[data-testid="booking-step-4"]')).toBeVisible();
      
      // Verify booking summary
      await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-name-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-type-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-date-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-time-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-price-summary"]')).toBeVisible();

      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      // Step 5: Payment processing
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

      // Fill payment information (using Stripe test data)
      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4242424242424242',
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');

      // Wait for payment processing
      await helpers.page.waitForElement('[data-testid="payment-processing"]');
      await helpers.page.waitForElement('[data-testid="booking-confirmation"]', { timeout: 15000 });

      // Verify booking confirmation
      await expect(page.locator('[data-testid="booking-success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="booking-reference-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-invite-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="coach-contact-info"]')).toBeVisible();

      // Verify navigation options
      await expect(page.locator('[data-testid="view-my-sessions"]')).toBeVisible();
      await expect(page.locator('[data-testid="book-another-session"]')).toBeVisible();
    });

    test('should handle payment failures gracefully', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Go through booking process to payment step
      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Quick path through booking steps
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      await helpers.page.waitForElement('[data-testid="available-date"]');
      await page.locator('[data-testid="available-date"]').first().click();
      await helpers.page.waitForElement('[data-testid="time-slot"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      // Use declined test card
      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4000000000000002', // Stripe declined card
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');

      // Verify payment error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('card was declined');

      // Verify user can retry payment
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-booking"]')).toBeVisible();

      // Test retry with valid card
      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4242424242424242',
      });

      await helpers.page.clickWithRetry('[data-testid="retry-payment"]');
      await helpers.page.waitForElement('[data-testid="booking-confirmation"]', { timeout: 15000 });
      await expect(page.locator('[data-testid="booking-success-message"]')).toBeVisible();
    });

    test('should validate booking form inputs', async ({ page }) => {
      const helpers = createTestHelpers(page);
      const assertions = createCommonAssertions(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Try to proceed without selecting session type
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await assertions.verifyErrorMessage('Please select a session type');

      // Select session type and proceed
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Try to proceed without selecting date/time
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await assertions.verifyErrorMessage('Please select a date and time');

      // Select date and time
      await helpers.page.waitForElement('[data-testid="available-date"]');
      await page.locator('[data-testid="available-date"]').first().click();
      await helpers.page.waitForElement('[data-testid="time-slot"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Try invalid payment card
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      await helpers.page.fillForm({
        '[data-testid="card-number"]': '1234567890123456', // Invalid card
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');
      await assertions.verifyErrorMessage('Your card number is invalid');
    });

    test('should handle session rescheduling', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // First, book a session (simplified flow)
      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Complete booking flow quickly
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      await helpers.page.waitForElement('[data-testid="available-date"]');
      await page.locator('[data-testid="available-date"]').first().click();
      await helpers.page.waitForElement('[data-testid="time-slot"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4242424242424242',
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');
      await helpers.page.waitForElement('[data-testid="booking-confirmation"]');

      // Navigate to sessions to reschedule
      await helpers.page.clickWithRetry('[data-testid="view-my-sessions"]');
      await helpers.page.waitForNavigation('/sessions');

      // Find the booked session and reschedule
      await helpers.page.waitForElement('[data-testid="session-card"]');
      await helpers.page.clickWithRetry('[data-testid="reschedule-session"]');

      // Select new date and time
      await helpers.page.waitForElement('[data-testid="reschedule-calendar"]');
      const newAvailableDates = page.locator('[data-testid="available-date"]');
      await newAvailableDates.nth(1).click(); // Select different date

      await helpers.page.waitForElement('[data-testid="time-slot"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();

      await helpers.page.clickWithRetry('[data-testid="confirm-reschedule"]');

      // Verify reschedule confirmation
      await helpers.page.verifyToast('Session rescheduled successfully');
      await expect(page.locator('[data-testid="updated-session-time"]')).toBeVisible();
    });
  });

  test.describe('Mobile Booking Experience', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should complete booking flow on mobile', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login first
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      // Navigate to coaches
      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Verify mobile layout
      const coachCard = page.locator('[data-testid="coach-card"]').first();
      await expect(coachCard).toBeVisible();

      // View coach profile on mobile
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      
      // Verify mobile-friendly profile layout
      await expect(page.locator('[data-testid="coach-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="book-session-button"]')).toBeVisible();

      // Start booking on mobile
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Verify mobile booking steps work
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Mobile calendar interaction
      await helpers.page.waitForElement('[data-testid="mobile-calendar"]');
      await page.locator('[data-testid="available-date"]').first().click();
      
      // Mobile time slot selection
      await helpers.page.waitForElement('[data-testid="mobile-time-picker"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
      
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      // Mobile payment form
      await expect(page.locator('[data-testid="mobile-payment-form"]')).toBeVisible();
      
      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4242424242424242',
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');
      await helpers.page.waitForElement('[data-testid="booking-confirmation"]');

      // Verify mobile confirmation page
      await expect(page.locator('[data-testid="mobile-booking-success"]')).toBeVisible();
    });

    test('should handle mobile navigation during booking', async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login and start booking
      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Test back navigation between steps
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Go back to step 1
      await helpers.page.clickWithRetry('[data-testid="back-button"]');
      await expect(page.locator('[data-testid="booking-step-1"]')).toBeVisible();

      // Proceed forward again
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();

      // Test mobile menu during booking
      await helpers.page.clickWithRetry('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

      // Verify booking progress is maintained
      await helpers.page.clickWithRetry('[data-testid="close-mobile-menu"]');
      await expect(page.locator('[data-testid="booking-step-2"]')).toBeVisible();
    });
  });

  test.describe('Accessibility in Booking Flow', () => {
    test('should support keyboard navigation throughout booking', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Test keyboard navigation on coach cards
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Navigate to coach profile with Enter key
      await page.keyboard.press('Enter');
      await helpers.page.waitForNavigation(/\/coaches\/\w+/);

      // Test keyboard navigation in booking form
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Click book session

      // Navigate through session types with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space'); // Select session type
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Next step

      // Verify calendar is keyboard accessible
      await helpers.page.waitForElement('[data-testid="calendar-widget"]');
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowRight'); // Navigate calendar
      await page.keyboard.press('Enter'); // Select date
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');

      // Check ARIA labels on coach cards
      const coachCard = page.locator('[data-testid="coach-card"]').first();
      await expect(coachCard).toHaveAttribute('role', 'article');

      const viewProfileButton = coachCard.locator('[data-testid="view-profile-button"]');
      await expect(viewProfileButton).toHaveAttribute('aria-label');

      // Navigate to booking and check form accessibility
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Check booking form accessibility
      const bookingForm = page.locator('[data-testid="booking-form"]');
      await expect(bookingForm).toHaveAttribute('role', 'form');

      const sessionTypeButtons = page.locator('[data-testid="session-type-option"]');
      for (let i = 0; i < await sessionTypeButtons.count(); i++) {
        const button = sessionTypeButtons.nth(i);
        await expect(button).toHaveAttribute('role', 'button');
        await expect(button).toHaveAttribute('aria-label');
      }
    });

    test('should announce important booking status changes', async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto('/login');
      await helpers.page.fillForm({
        '[data-testid="email-input"]': 'test.client@ipeccoach.com',
        '[data-testid="password-input"]': 'TestClient123!',
      });
      await helpers.page.clickWithRetry('[data-testid="login-submit"]');

      await page.goto('/coaches');
      await helpers.page.waitForElement('[data-testid="coach-card"]');
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      await helpers.page.clickWithRetry('[data-testid="book-session-button"]');

      // Check for live regions for status updates
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();

      // Progress through booking and verify announcements
      await helpers.page.clickWithRetry('[data-testid="session-type-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');

      // Verify step progression is announced
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText(/step 2/i);

      // Test payment processing announcements
      await helpers.page.waitForElement('[data-testid="available-date"]');
      await page.locator('[data-testid="available-date"]').first().click();
      await helpers.page.waitForElement('[data-testid="time-slot"]');
      await page.locator('[data-testid="time-slot"]:not([disabled])').first().click();
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="next-step-button"]');
      await helpers.page.clickWithRetry('[data-testid="proceed-to-payment"]');

      await helpers.page.fillForm({
        '[data-testid="card-number"]': '4242424242424242',
        '[data-testid="card-expiry"]': '12/25',
        '[data-testid="card-cvc"]': '123',
        '[data-testid="card-zip"]': '12345',
      });

      await helpers.page.clickWithRetry('[data-testid="complete-payment"]');

      // Verify payment processing is announced
      await expect(liveRegion).toContainText(/processing payment/i);
      
      await helpers.page.waitForElement('[data-testid="booking-confirmation"]');
      
      // Verify success is announced
      await expect(liveRegion).toContainText(/booking confirmed/i);
    });
  });
});