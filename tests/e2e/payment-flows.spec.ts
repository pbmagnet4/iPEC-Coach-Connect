/**
 * Payment Flows E2E Tests
 * 
 * Comprehensive end-to-end tests for the payment system including:
 * - Session booking with payment processing
 * - Payment method management
 * - Subscription creation and management
 * - Invoice viewing and download
 * - Error handling and edge cases
 * 
 * Uses Stripe test cards and test mode webhooks
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_USER = {
  email: 'payment.test@example.com',
  password: 'TestPassword123!',
  name: 'Payment Test User'
};

const STRIPE_TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINE: '4000000000000002',
  VISA_INSUFFICIENT_FUNDS: '4000000000009995',
  AMEX_SUCCESS: '378282246310005',
  MASTERCARD_SUCCESS: '5555555555554444'
};

// Helper functions
async function loginUser(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

async function fillCardDetails(page: Page, cardNumber: string, expiryMonth: string = '12', expiryYear: string = '2025', cvc: string = '123') {
  // Wait for Stripe Elements to load
  const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
  await stripeFrame.locator('input[data-elements-stable-field-name="cardNumber"]').fill(cardNumber);
  await stripeFrame.locator('input[data-elements-stable-field-name="cardExpiry"]').fill(`${expiryMonth}${expiryYear.slice(-2)}`);
  await stripeFrame.locator('input[data-elements-stable-field-name="cardCvc"]').fill(cvc);
}

async function waitForPaymentSuccess(page: Page) {
  // Wait for success message or redirect
  await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 30000 });
}

test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're in test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('stripe_test_mode', 'true');
    });
  });

  test.describe('Session Booking Payment', () => {
    test('should complete session booking with successful payment', async ({ page }) => {
      await loginUser(page);

      // Navigate to coach list
      await page.click('a[href*="/coaches"]');
      await page.waitForLoadState('networkidle');

      // Select a coach
      await page.click('[data-testid="coach-card"]:first-child');
      await page.waitForLoadState('networkidle');

      // Click book session
      await page.click('[data-testid="book-session-btn"]');

      // Select session type
      await page.click('[data-testid="session-type-option"]:first-child');
      
      // Select date and time
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 1 week from now
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');

      // Add session notes
      await page.fill('[data-testid="session-notes"]', 'Test session booking');

      // Proceed to payment
      await page.click('[data-testid="proceed-to-payment-btn"]');
      await page.waitForLoadState('networkidle');

      // Verify order summary
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
      
      // Choose to use new payment method
      await page.click('input[value="new"]');

      // Fill payment details
      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);

      // Submit payment
      await page.click('[data-testid="submit-payment-btn"]');

      // Wait for payment processing
      await waitForPaymentSuccess(page);

      // Verify session was created
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
      await expect(page.locator('text=Your session has been booked')).toBeVisible();

      // Verify session appears in user's dashboard
      await page.click('a[href="/dashboard"]');
      await expect(page.locator('[data-testid="upcoming-session"]')).toBeVisible();
    });

    test('should handle declined card gracefully', async ({ page }) => {
      await loginUser(page);

      // Navigate to booking flow
      await page.click('a[href*="/coaches"]');
      await page.click('[data-testid="coach-card"]:first-child');
      await page.click('[data-testid="book-session-btn"]');
      
      // Complete booking form
      await page.click('[data-testid="session-type-option"]:first-child');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');
      await page.click('[data-testid="proceed-to-payment-btn"]');

      // Use declined test card
      await page.click('input[value="new"]');
      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_DECLINE);
      await page.click('[data-testid="submit-payment-btn"]');

      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=Your card was declined')).toBeVisible();

      // Verify user can try again with different card
      await page.click('[data-testid="try-again-btn"]');
      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
      await page.click('[data-testid="submit-payment-btn"]');
      await waitForPaymentSuccess(page);
    });

    test('should handle insufficient funds error', async ({ page }) => {
      await loginUser(page);

      // Complete booking flow up to payment
      await page.click('a[href*="/coaches"]');
      await page.click('[data-testid="coach-card"]:first-child');
      await page.click('[data-testid="book-session-btn"]');
      await page.click('[data-testid="session-type-option"]:first-child');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');
      await page.click('[data-testid="proceed-to-payment-btn"]');

      // Use insufficient funds test card
      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_INSUFFICIENT_FUNDS);
      await page.click('[data-testid="submit-payment-btn"]');

      // Verify specific error message
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=insufficient funds')).toBeVisible();
    });
  });

  test.describe('Payment Method Management', () => {
    test('should add new payment method successfully', async ({ page }) => {
      await loginUser(page);

      // Navigate to payment settings
      await page.click('[data-testid="user-menu"]');
      await page.click('a[href="/settings/payments"]');

      // Click add payment method
      await page.click('[data-testid="add-payment-method-btn"]');

      // Fill payment method form
      await fillCardDetails(page, STRIPE_TEST_CARDS.MASTERCARD_SUCCESS);
      
      // Add billing details
      await page.fill('[data-testid="billing-name"]', 'Test User');
      await page.fill('[data-testid="billing-email"]', TEST_USER.email);

      // Save payment method
      await page.click('[data-testid="save-payment-method-btn"]');

      // Verify success
      await expect(page.locator('[data-testid="payment-method-success"]')).toBeVisible();
      await expect(page.locator('text=Payment method saved successfully')).toBeVisible();

      // Verify payment method appears in list
      await expect(page.locator('[data-testid="payment-method-card"]')).toBeVisible();
      await expect(page.locator('text=Mastercard •••• 4444')).toBeVisible();
    });

    test('should set default payment method', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/payments');

      // Assuming there are already payment methods
      const paymentMethods = page.locator('[data-testid="payment-method-card"]');
      const count = await paymentMethods.count();

      if (count > 1) {
        // Set second payment method as default
        await paymentMethods.nth(1).locator('[data-testid="set-default-btn"]').click();

        // Verify default badge appears
        await expect(paymentMethods.nth(1).locator('[data-testid="default-badge"]')).toBeVisible();
        
        // Verify other methods don't have default badge
        await expect(paymentMethods.nth(0).locator('[data-testid="default-badge"]')).not.toBeVisible();
      }
    });

    test('should delete payment method', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/payments');

      // Count initial payment methods
      const initialCount = await page.locator('[data-testid="payment-method-card"]').count();

      if (initialCount > 1) {
        // Delete a non-default payment method
        const nonDefaultMethod = page.locator('[data-testid="payment-method-card"]')
          .filter({ hasNot: page.locator('[data-testid="default-badge"]') })
          .first();

        await nonDefaultMethod.locator('[data-testid="delete-payment-method-btn"]').click();

        // Confirm deletion
        await page.click('[data-testid="confirm-delete-btn"]');

        // Verify method was removed
        const finalCount = await page.locator('[data-testid="payment-method-card"]').count();
        expect(finalCount).toBe(initialCount - 1);
      }
    });
  });

  test.describe('Subscription Management', () => {
    test('should create new subscription successfully', async ({ page }) => {
      await loginUser(page);

      // Navigate to subscription management
      await page.click('[data-testid="user-menu"]');
      await page.click('a[href="/settings/subscription"]');

      // If no active subscription, click choose plan
      const hasActiveSubscription = await page.locator('[data-testid="active-subscription"]').isVisible();
      
      if (!hasActiveSubscription) {
        await page.click('[data-testid="choose-plan-btn"]');

        // Select a plan (Premium plan)
        await page.click('[data-testid="plan-card"]:has-text("Premium")');

        // If payment is required
        const needsPayment = await page.locator('[data-testid="payment-form"]').isVisible();
        
        if (needsPayment) {
          // Fill payment details
          await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
          await page.click('[data-testid="complete-subscription-btn"]');
          await waitForPaymentSuccess(page);
        }

        // Verify subscription was created
        await expect(page.locator('[data-testid="subscription-success"]')).toBeVisible();
        await expect(page.locator('text=subscription is now active')).toBeVisible();
      }
    });

    test('should display subscription usage correctly', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/subscription');

      // Verify subscription details are visible
      await expect(page.locator('[data-testid="current-subscription"]')).toBeVisible();
      await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="billing-period"]')).toBeVisible();
    });

    test('should cancel subscription', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/subscription');

      const hasActiveSubscription = await page.locator('[data-testid="active-subscription"]').isVisible();
      
      if (hasActiveSubscription) {
        // Cancel subscription
        await page.click('[data-testid="cancel-subscription-btn"]');
        
        // Confirm cancellation
        await page.click('[data-testid="confirm-cancel-btn"]');

        // Verify cancellation notice
        await expect(page.locator('[data-testid="cancellation-notice"]')).toBeVisible();
        await expect(page.locator('text=will be canceled on')).toBeVisible();
      }
    });
  });

  test.describe('Invoice and Billing', () => {
    test('should display invoice history', async ({ page }) => {
      await loginUser(page);

      // Navigate to billing/invoices
      await page.click('[data-testid="user-menu"]');
      await page.click('a[href="/settings/billing"]');

      // Verify invoices section
      await expect(page.locator('[data-testid="invoices-section"]')).toBeVisible();
      
      const invoiceCount = await page.locator('[data-testid="invoice-item"]').count();
      
      if (invoiceCount > 0) {
        // Verify invoice details
        const firstInvoice = page.locator('[data-testid="invoice-item"]').first();
        await expect(firstInvoice.locator('[data-testid="invoice-amount"]')).toBeVisible();
        await expect(firstInvoice.locator('[data-testid="invoice-status"]')).toBeVisible();
        await expect(firstInvoice.locator('[data-testid="invoice-date"]')).toBeVisible();
      }
    });

    test('should view invoice details', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/billing');

      const invoiceCount = await page.locator('[data-testid="invoice-item"]').count();
      
      if (invoiceCount > 0) {
        // Click view invoice
        await page.locator('[data-testid="view-invoice-btn"]').first().click();

        // Verify invoice details modal
        await expect(page.locator('[data-testid="invoice-details-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="invoice-line-items"]')).toBeVisible();
        await expect(page.locator('[data-testid="invoice-totals"]')).toBeVisible();
      }
    });

    test('should download invoice PDF', async ({ page }) => {
      await loginUser(page);
      await page.goto('/settings/billing');

      const invoiceWithPDF = page.locator('[data-testid="invoice-item"]')
        .filter({ has: page.locator('[data-testid="download-pdf-btn"]') })
        .first();

      if (await invoiceWithPDF.isVisible()) {
        // Start download
        const downloadPromise = page.waitForEvent('download');
        await invoiceWithPDF.locator('[data-testid="download-pdf-btn"]').click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await loginUser(page);

      // Simulate network failure during payment
      await page.route('**/api/payments/**', route => route.abort());

      // Try to make a payment
      await page.click('a[href*="/coaches"]');
      await page.click('[data-testid="coach-card"]:first-child');
      await page.click('[data-testid="book-session-btn"]');
      await page.click('[data-testid="session-type-option"]:first-child');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');
      await page.click('[data-testid="proceed-to-payment-btn"]');

      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
      await page.click('[data-testid="submit-payment-btn"]');

      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=network error')).toBeVisible();
    });

    test('should prevent double payment submission', async ({ page }) => {
      await loginUser(page);

      // Complete booking flow up to payment
      await page.click('a[href*="/coaches"]');
      await page.click('[data-testid="coach-card"]:first-child');
      await page.click('[data-testid="book-session-btn"]');
      await page.click('[data-testid="session-type-option"]:first-child');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');
      await page.click('[data-testid="proceed-to-payment-btn"]');

      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
      
      // Click submit payment button
      const submitBtn = page.locator('[data-testid="submit-payment-btn"]');
      await submitBtn.click();

      // Verify button is disabled during processing
      await expect(submitBtn).toBeDisabled();
      
      // Try to click again (should be prevented)
      await submitBtn.click({ force: true });
      
      // Should still only process one payment
      await waitForPaymentSuccess(page);
    });

    test('should handle expired card', async ({ page }) => {
      await loginUser(page);

      // Navigate to add payment method
      await page.goto('/settings/payments');
      await page.click('[data-testid="add-payment-method-btn"]');

      // Use expired card
      const expiredFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
      await expiredFrame.locator('input[data-elements-stable-field-name="cardNumber"]').fill(STRIPE_TEST_CARDS.VISA_SUCCESS);
      await expiredFrame.locator('input[data-elements-stable-field-name="cardExpiry"]').fill('1220'); // Expired date
      await expiredFrame.locator('input[data-elements-stable-field-name="cardCvc"]').fill('123');

      await page.click('[data-testid="save-payment-method-btn"]');

      // Verify expired card error
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('text=expired')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginUser(page);

      // Test mobile payment flow
      await page.click('a[href*="/coaches"]');
      await page.click('[data-testid="coach-card"]:first-child');
      
      // Verify mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-book-session-btn"]')).toBeVisible();
      
      await page.click('[data-testid="mobile-book-session-btn"]');
      await page.click('[data-testid="session-type-option"]:first-child');
      
      // Verify mobile-friendly date picker
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
      await page.selectOption('[data-testid="session-time"]', '10:00');
      
      await page.click('[data-testid="proceed-to-payment-btn"]');

      // Verify mobile payment form
      await expect(page.locator('[data-testid="mobile-payment-form"]')).toBeVisible();
      
      await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
      await page.click('[data-testid="submit-payment-btn"]');
      
      await waitForPaymentSuccess(page);
      
      // Verify mobile success screen
      await expect(page.locator('[data-testid="mobile-success-screen"]')).toBeVisible();
    });
  });
});

test.describe('Payment Security Tests', () => {
  test('should not expose sensitive payment data in client-side storage', async ({ page }) => {
    await loginUser(page);
    
    // Complete a payment flow
    await page.click('a[href*="/coaches"]');
    await page.click('[data-testid="coach-card"]:first-child');
    await page.click('[data-testid="book-session-btn"]');
    await page.click('[data-testid="session-type-option"]:first-child');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
    await page.selectOption('[data-testid="session-time"]', '10:00');
    await page.click('[data-testid="proceed-to-payment-btn"]');
    
    await fillCardDetails(page, STRIPE_TEST_CARDS.VISA_SUCCESS);
    await page.click('[data-testid="submit-payment-btn"]');
    await waitForPaymentSuccess(page);

    // Check localStorage and sessionStorage for sensitive data
    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    
    // Should not contain card numbers, CVV, or other sensitive data
    expect(localStorage).not.toContain('4242424242424242');
    expect(localStorage).not.toContain('123'); // CVC
    expect(sessionStorage).not.toContain('4242424242424242');
    expect(sessionStorage).not.toContain('123');
    
    // Should not contain Stripe secret keys
    expect(localStorage).not.toContain('sk_');
    expect(sessionStorage).not.toContain('sk_');
  });

  test('should use HTTPS for all payment-related requests', async ({ page }) => {
    await loginUser(page);
    
    const paymentRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('stripe') || url.includes('payment') || url.includes('api/payments')) {
        paymentRequests.push(url);
      }
    });

    // Trigger payment flow
    await page.click('a[href*="/coaches"]');
    await page.click('[data-testid="coach-card"]:first-child');
    await page.click('[data-testid="book-session-btn"]');
    await page.click('[data-testid="session-type-option"]:first-child');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await page.fill('[data-testid="session-date"]', futureDate.toISOString().split('T')[0]);
    await page.selectOption('[data-testid="session-time"]', '10:00');
    await page.click('[data-testid="proceed-to-payment-btn"]');

    // Verify all payment requests use HTTPS
    paymentRequests.forEach(url => {
      expect(url).toMatch(/^https:/);
    });
  });
});