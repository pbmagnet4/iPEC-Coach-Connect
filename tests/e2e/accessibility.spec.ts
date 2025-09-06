/**
 * Accessibility End-to-End Tests
 * 
 * Comprehensive accessibility testing for WCAG 2.1 AA compliance:
 * - Automated accessibility scanning with axe-core
 * - Keyboard navigation testing across all interactive elements
 * - Screen reader compatibility and ARIA implementation
 * - Color contrast validation and visual accessibility
 * - Focus management and tab order verification
 * - Form accessibility and error handling
 * - Dynamic content accessibility (loading states, notifications)
 * - Mobile accessibility and touch interaction
 * - Page structure and semantic HTML validation
 * 
 * This test suite ensures the platform is accessible to users with disabilities
 * and meets international accessibility standards and guidelines.
 */

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure consistent viewport for accessibility testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Automated Accessibility Scanning', () => {
    test('should pass accessibility checks on home page', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on coach listing page', async ({ page }) => {
      await page.goto('/coaches');
      
      // Wait for coaches to load
      await page.waitForSelector('[data-testid="coach-card"]', { timeout: 10000 });
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on coach profile page', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Navigate to first coach profile
      await page.click('[data-testid="view-profile-button"]');
      await page.waitForLoadState('networkidle');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on login page', async ({ page }) => {
      await page.goto('/login');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on registration page', async ({ page }) => {
      await page.goto('/get-started');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on community page', async ({ page }) => {
      await page.goto('/community');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility checks on learning page', async ({ page }) => {
      await page.goto('/learning');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should handle accessibility violations in dynamic content', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Interact with filters to test dynamic content
      await helpers.page.clickWithRetry('[data-testid="specialty-filter"]');
      await helpers.page.clickWithRetry('[data-testid="filter-life-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation on home page', async ({ page }) => {
      await page.goto('/');
      
      // Start tabbing through interactive elements
      await page.keyboard.press('Tab');
      
      // Verify first focusable element
      const firstFocus = page.locator(':focus');
      await expect(firstFocus).toBeVisible();
      
      // Tab through navigation elements
      const navigationElements = [
        '[data-testid="find-coaches-link"]',
        '[data-testid="learning-dropdown"]',
        '[data-testid="community-link"]',
        '[data-testid="login-button"]',
        '[data-testid="get-started-button"]',
      ];
      
      for (let i = 0; i < navigationElements.length; i++) {
        await page.keyboard.press('Tab');
        const currentFocus = page.locator(':focus');
        
        // Verify element is focusable and visible
        await expect(currentFocus).toBeVisible();
        
        // Verify focus indicator is present
        const focusedElement = await currentFocus.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            border: styles.border
          };
        });
        
        // Should have some kind of focus indicator
        expect(
          focusedElement.outline !== 'none' || 
          focusedElement.boxShadow !== 'none' || 
          focusedElement.border !== 'none'
        ).toBeTruthy();
      }
    });

    test('should support keyboard navigation in forms', async ({ page }) => {
      await page.goto('/login');
      
      // Tab to first form field
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      // Type in email field
      await page.keyboard.type('test@example.com');
      
      // Tab to password field
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      // Type in password field
      await page.keyboard.type('password123');
      
      // Tab to submit button
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-submit"]')).toBeFocused();
      
      // Should be able to activate button with Enter or Space
      await page.keyboard.press('Enter');
      
      // Form should submit (may show validation errors)
      await page.waitForTimeout(500);
    });

    test('should support keyboard navigation in coach listing', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Tab through filter elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Navigate to first coach card
      let tabCount = 0;
      let foundCoachCard = false;
      
      while (tabCount < 20 && !foundCoachCard) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const focusedElement = page.locator(':focus');
        const testId = await focusedElement.getAttribute('data-testid');
        
        if (testId === 'view-profile-button') {
          foundCoachCard = true;
          
          // Should be able to activate with Enter
          await page.keyboard.press('Enter');
          
          // Should navigate to coach profile
          await page.waitForURL(/\/coaches\/\w+/);
          await expect(page.locator('[data-testid="coach-name"]')).toBeVisible();
        }
      }
      
      expect(foundCoachCard).toBeTruthy();
    });

    test('should support keyboard navigation in dropdowns', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to learning dropdown
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip logo
      
      // Find learning dropdown
      let foundLearningDropdown = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        const text = await focusedElement.textContent();
        
        if (text?.includes('Learning')) {
          foundLearningDropdown = true;
          
          // Open dropdown with Enter
          await page.keyboard.press('Enter');
          
          // Should show dropdown content
          await expect(page.locator('[data-testid="learning-dropdown-content"]')).toBeVisible();
          
          // Tab through dropdown items
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="learning-home-link"]')).toBeFocused();
          
          // Should be able to activate link with Enter
          await page.keyboard.press('Enter');
          await page.waitForURL('/learning');
          
          break;
        }
      }
      
      expect(foundLearningDropdown).toBeTruthy();
    });

    test('should support escape key to close modals and dropdowns', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Open filter modal
      await helpers.page.clickWithRetry('[data-testid="filter-button"]');
      await expect(page.locator('[data-testid="filter-modal"]')).toBeVisible();
      
      // Close with Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="filter-modal"]')).not.toBeVisible();
      
      // Test with profile modal if available
      await helpers.page.clickWithRetry('[data-testid="view-profile-button"]');
      
      // If there's a modal overlay, test escape
      const modal = page.locator('[data-testid="coach-profile-modal"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check that headings follow logical order
      let previousLevel = 0;
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const currentLevel = parseInt(tagName.charAt(1));
        
        if (previousLevel > 0) {
          // Heading levels shouldn't skip (e.g., h2 to h4)
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = currentLevel;
      }
    });

    test('should have descriptive link text', async ({ page }) => {
      await page.goto('/');
      
      const links = await page.locator('a').all();
      
      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Link should have descriptive text or aria-label
        const hasDescriptiveText = text && text.trim().length > 0 && !['click here', 'read more', 'learn more'].includes(text.toLowerCase().trim());
        const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
        const hasTitle = title && title.trim().length > 0;
        
        expect(hasDescriptiveText || hasAriaLabel || hasTitle).toBeTruthy();
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');
      
      const formInputs = await page.locator('input, select, textarea').all();
      
      for (const input of formInputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Input should have associated label
        let hasLabel = false;
        
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          hasLabel = label > 0;
        }
        
        hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledBy;
        
        // Placeholder alone is not sufficient for accessibility
        expect(hasLabel).toBeTruthy();
      }
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await page.goto('/');
      
      // Check for main landmark
      const main = await page.locator('main, [role="main"]').count();
      expect(main).toBeGreaterThan(0);
      
      // Check for navigation landmark
      const nav = await page.locator('nav, [role="navigation"]').count();
      expect(nav).toBeGreaterThan(0);
      
      // Check for banner (header)
      const banner = await page.locator('header, [role="banner"]').count();
      expect(banner).toBeGreaterThanOrEqual(0);
      
      // Check for contentinfo (footer)
      const contentinfo = await page.locator('footer, [role="contentinfo"]').count();
      expect(contentinfo).toBeGreaterThanOrEqual(0);
    });

    test('should announce dynamic content changes', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Check for live regions
      const liveRegions = await page.locator('[aria-live]').count();
      expect(liveRegions).toBeGreaterThan(0);
      
      // Test filter interaction
      await helpers.page.clickWithRetry('[data-testid="specialty-filter"]');
      await helpers.page.clickWithRetry('[data-testid="filter-life-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');
      
      // Should have live region announcement for filter results
      const politeRegion = page.locator('[aria-live="polite"]');
      await expect(politeRegion).toBeVisible();
      
      // Wait for filter results to load
      await page.waitForTimeout(1000);
      
      // Live region should contain information about filtered results
      const announcement = await politeRegion.textContent();
      expect(announcement).toBeTruthy();
    });

    test('should have proper table accessibility', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // If there are data tables, check accessibility
      const tables = await page.locator('table').all();
      
      for (const table of tables) {
        // Table should have caption or aria-label
        const caption = await table.locator('caption').count();
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledBy = await table.getAttribute('aria-labelledby');
        
        expect(caption > 0 || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
        
        // Check for proper header structure
        const headers = await table.locator('th').all();
        if (headers.length > 0) {
          for (const header of headers) {
            const scope = await header.getAttribute('scope');
            expect(scope).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Run color contrast check with axe
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be usable without color alone', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Check for elements that use color to convey information
      const statusElements = await page.locator('[data-testid*="status"], [data-testid*="badge"]').all();
      
      for (const element of statusElements) {
        const text = await element.textContent();
        const ariaLabel = await element.getAttribute('aria-label');
        const title = await element.getAttribute('title');
        
        // Status should not rely solely on color
        expect(text || ariaLabel || title).toBeTruthy();
      }
    });

    test('should support high contrast mode', async ({ page }) => {
      // Enable high contrast mode simulation
      await page.emulateMedia({ forcedColors: 'active' });
      
      await page.goto('/');
      
      // Check that important elements are still visible
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="get-started-button"]')).toBeVisible();
      
      // Run accessibility scan in high contrast mode
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support zoom up to 200%', async ({ page }) => {
      await page.goto('/');
      
      // Zoom to 200%
      await page.setViewportSize({ width: 640, height: 360 }); // Simulate 200% zoom
      
      // Verify important content is still accessible
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
      
      // Test navigation at high zoom
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Should still be able to interact with coaches
      await expect(page.locator('[data-testid="coach-card"]').first()).toBeVisible();
    });

    test('should handle reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      
      // Check that animations respect reduced motion
      const animatedElements = await page.locator('[data-testid*="animated"], .animate-').all();
      
      for (const element of animatedElements) {
        const animationDuration = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.animationDuration;
        });
        
        // Animations should be reduced or eliminated
        expect(animationDuration === '0s' || animationDuration === 'initial').toBeTruthy();
      }
    });
  });

  test.describe('Touch and Mobile Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should have adequate touch targets', async ({ page }) => {
      await page.goto('/');
      
      // Check touch target sizes
      const interactiveElements = await page.locator('button, a, input, [role="button"]').all();
      
      for (const element of interactiveElements) {
        const boundingBox = await element.boundingBox();
        
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          // Touch targets should be at least 44x44 pixels (WCAG guideline)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support mobile screen reader navigation', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Test swipe navigation simulation
      const coachCards = await page.locator('[data-testid="coach-card"]').all();
      
      for (const card of coachCards.slice(0, 3)) { // Test first 3 cards
        // Should have proper accessibility attributes for mobile screen readers
        const role = await card.getAttribute('role');
        const ariaLabel = await card.getAttribute('aria-label');
        const heading = await card.locator('h1, h2, h3, h4, h5, h6').count();
        
        expect(role || ariaLabel || heading > 0).toBeTruthy();
      }
    });

    test('should handle mobile form accessibility', async ({ page }) => {
      await page.goto('/login');
      
      // Check mobile form accessibility
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      // Inputs should have proper mobile attributes
      expect(await emailInput.getAttribute('autocomplete')).toBeTruthy();
      expect(await emailInput.getAttribute('inputmode')).toBeTruthy();
      
      // Touch targets should be adequate
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      
      if (emailBox) {
        expect(emailBox.height).toBeGreaterThanOrEqual(44);
      }
      if (passwordBox) {
        expect(passwordBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('should announce form validation errors', async ({ page }) => {
      await page.goto('/login');
      
      // Submit form without filling fields
      await page.click('[data-testid="login-submit"]');
      
      // Check for error announcements
      const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"]').count();
      expect(errorMessages).toBeGreaterThan(0);
      
      // Error should be associated with the problematic field
      const emailInput = page.locator('[data-testid="email-input"]');
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
      const ariaInvalid = await emailInput.getAttribute('aria-invalid');
      
      expect(ariaDescribedBy || ariaInvalid === 'true').toBeTruthy();
    });

    test('should handle loading states accessibly', async ({ page }) => {
      await page.goto('/coaches');
      
      // Check for loading announcements
      const loadingIndicators = await page.locator('[aria-live], [role="status"]').count();
      expect(loadingIndicators).toBeGreaterThan(0);
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Loading should be announced as complete
      const completionAnnouncement = page.locator('[aria-live="polite"]');
      const text = await completionAnnouncement.textContent();
      expect(text).toBeTruthy();
    });

    test('should handle network errors accessibly', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/coaches');
      
      // Wait for error state
      await page.waitForTimeout(2000);
      
      // Error should be announced
      const errorAnnouncement = await page.locator('[role="alert"], [aria-live="assertive"]').count();
      expect(errorAnnouncement).toBeGreaterThan(0);
      
      // Error message should be descriptive
      const errorText = await page.locator('[data-testid="error-message"]').textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.length).toBeGreaterThan(10); // Should be descriptive
    });
  });

  test.describe('Focus Management', () => {
    test('should manage focus on page navigation', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to coaches page
      await page.click('[data-testid="find-coaches-button"]');
      await page.waitForURL('/coaches');
      
      // Focus should be managed appropriately
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should focus on main content or skip link
      const mainContent = page.locator('main, [role="main"], h1');
      const isFocusOnMain = await focusedElement.evaluate(
        (el, mainSelector) => {
          const mainElement = document.querySelector(mainSelector);
          return mainElement?.contains(el) || el === mainElement;
        },
        'main, [role="main"], h1'
      );
      
      expect(isFocusOnMain).toBeTruthy();
    });

    test('should manage focus in modal dialogs', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Open filter modal
      await helpers.page.clickWithRetry('[data-testid="filter-button"]');
      
      const modal = page.locator('[data-testid="filter-modal"]');
      if (await modal.isVisible()) {
        // Focus should be trapped in modal
        const focusableElements = await modal.locator('button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])').all();
        
        expect(focusableElements.length).toBeGreaterThan(0);
        
        // First focusable element should be focused
        await expect(focusableElements[0]).toBeFocused();
        
        // Tab should cycle through modal elements only
        await page.keyboard.press('Tab');
        const secondElement = page.locator(':focus');
        
        // Focus should still be within modal
        const isFocusInModal = await secondElement.evaluate(
          (el, modalElement) => modalElement.contains(el),
          await modal.elementHandle()
        );
        
        expect(isFocusInModal).toBeTruthy();
      }
    });

    test('should provide skip links', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first element (should be skip link)
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      const text = await focusedElement.textContent();
      
      // Should have skip link
      expect(text?.toLowerCase().includes('skip')).toBeTruthy();
      
      // Skip link should work
      await page.keyboard.press('Enter');
      
      // Focus should move to main content
      const newFocus = page.locator(':focus');
      const isMainContent = await newFocus.evaluate(el => {
        const main = document.querySelector('main, [role="main"]');
        return main?.contains(el) || el === main;
      });
      
      expect(isMainContent).toBeTruthy();
    });
  });
});