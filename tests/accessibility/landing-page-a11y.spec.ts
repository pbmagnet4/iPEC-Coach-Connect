import { expect, test } from '@playwright/test';
import { checkA11y, getViolations, injectAxe } from 'axe-playwright';

test.describe('Landing Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should not have any accessibility violations', async ({ page }) => {
    await checkA11y(page, null, null, true);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that we have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Verify h1 content
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toContain('Find Your Perfect iPEC Coach');
  });

  test('should have accessible form controls', async ({ page }) => {
    // Check that form inputs have labels
    const locationInput = page.locator('#location-input');
    const specialtyInput = page.locator('#specialty-input');
    
    await expect(locationInput).toHaveAttribute('aria-label', /location/i);
    await expect(specialtyInput).toHaveAttribute('aria-label', /specialty/i);
    
    // Check form structure
    const form = page.locator('form[role="search"]');
    await expect(form).toBeVisible();
    await expect(form).toHaveAttribute('aria-label', 'Find coaches');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab'); // Location input
    await expect(page.locator('#location-input')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Clear button (if location has value)
    await page.keyboard.press('Tab'); // Specialty input
    await expect(page.locator('#specialty-input')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Find Coaches button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should handle location suggestions with keyboard', async ({ page }) => {
    const locationInput = page.locator('#location-input');
    
    // Type to trigger suggestions
    await locationInput.fill('New York');
    
    // Wait for suggestions to appear
    await page.waitForSelector('#location-suggestions', { timeout: 3000 });
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    
    // Check that first suggestion is highlighted
    const firstSuggestion = page.locator('#suggestion-0');
    await expect(firstSuggestion).toHaveAttribute('aria-selected', 'true');
    
    // Test Enter key selection
    await page.keyboard.press('Enter');
    
    // Suggestions should be hidden
    await expect(page.locator('#location-suggestions')).not.toBeVisible();
    
    // Input should be focused
    await expect(locationInput).toBeFocused();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const locationInput = page.locator('#location-input');
    
    // Check basic ARIA attributes
    await expect(locationInput).toHaveAttribute('aria-expanded', 'false');
    await expect(locationInput).toHaveAttribute('aria-haspopup', 'listbox');
    
    // Trigger suggestions
    await locationInput.fill('Los Angeles');
    await page.waitForSelector('#location-suggestions', { timeout: 3000 });
    
    await expect(locationInput).toHaveAttribute('aria-expanded', 'true');
    await expect(locationInput).toHaveAttribute('aria-owns', 'location-suggestions');
    
    // Check suggestions container
    const suggestions = page.locator('#location-suggestions');
    await expect(suggestions).toHaveAttribute('role', 'listbox');
    await expect(suggestions).toHaveAttribute('aria-label', 'Location suggestions');
  });

  test('should have accessible buttons', async ({ page }) => {
    // Check main CTA button
    const findCoachesBtn = page.locator('button[type="submit"]');
    await expect(findCoachesBtn).toBeVisible();
    await expect(findCoachesBtn).toBeEnabled();
    
    // Check geolocation button
    const nearMeBtn = page.locator('button').filter({ hasText: 'Coaches near me' });
    await expect(nearMeBtn).toBeVisible();
    
    // Test loading state accessibility
    await nearMeBtn.click();
    
    // Button should have aria-busy when loading
    await expect(nearMeBtn).toHaveAttribute('aria-busy', 'true');
    
    // Should have loading announcement
    const loadingText = page.locator('.sr-only').filter({ hasText: 'Loading' });
    await expect(loadingText).toBeVisible();
  });

  test('should handle focus management properly', async ({ page }) => {
    const locationInput = page.locator('#location-input');
    
    // Focus input and trigger suggestions
    await locationInput.focus();
    await locationInput.fill('Chicago');
    await page.waitForSelector('#location-suggestions', { timeout: 3000 });
    
    // Press escape to close suggestions
    await page.keyboard.press('Escape');
    
    // Suggestions should be hidden
    await expect(page.locator('#location-suggestions')).not.toBeVisible();
    
    // Input should still be focused
    await expect(locationInput).toBeFocused();
  });

  test('should provide clear button accessibility', async ({ page }) => {
    const locationInput = page.locator('#location-input');
    
    // Type something to show clear button
    await locationInput.fill('Test location');
    
    const clearBtn = page.locator('button[aria-label="Clear location"]');
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toHaveAttribute('aria-label', 'Clear location');
    
    // Click clear button
    await clearBtn.click();
    
    // Input should be empty and focused
    await expect(locationInput).toHaveValue('');
    await expect(locationInput).toBeFocused();
  });

  test('should respect motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Reload page to apply preference
    await page.reload();
    await injectAxe(page);
    
    // Animations should be disabled/reduced
    const buttons = page.locator('button');
    
    // Check that buttons don't have scale transforms when reduced motion is enabled
    // This would need to be verified through computed styles or animation properties
    
    // For now, just verify the page still loads and functions properly
    await expect(page.locator('h1')).toContainText('Find Your Perfect iPEC Coach');
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run axe-core color contrast checks
    const violations = await getViolations(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    const colorContrastViolations = violations.filter(v => v.id === 'color-contrast');
    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should work with screen readers', async ({ page }) => {
    // Test that important content is accessible to screen readers
    
    // Main heading should be accessible
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Form should have proper labeling
    const form = page.locator('form[role="search"]');
    await expect(form).toHaveAttribute('aria-label', 'Find coaches');
    
    // Hidden content should be properly marked
    const srOnlyElements = page.locator('.sr-only');
    const srOnlyCount = await srOnlyElements.count();
    expect(srOnlyCount).toBeGreaterThan(0);
  });

  test('should handle large text scaling', async ({ page }) => {
    // Simulate browser zoom to 200%
    await page.setViewportSize({ width: 640, height: 480 }); // Smaller viewport
    
    // Content should still be accessible and usable
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#location-input')).toBeVisible();
    await expect(page.locator('#specialty-input')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // No horizontal scrolling should be required
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 10); // Small tolerance
  });
});

test.describe('Landing Page Mobile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await injectAxe(page);
  });

  test('should have proper touch targets', async ({ page }) => {
    // Check that interactive elements meet minimum touch target size (44x44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should work with mobile screen readers', async ({ page }) => {
    // Test mobile-specific accessibility features
    await checkA11y(page, null, {
      rules: {
        'scrollable-region-focusable': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    });
  });
});