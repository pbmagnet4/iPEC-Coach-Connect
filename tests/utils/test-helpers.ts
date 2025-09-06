/**
 * Test Helper Utilities for iPEC Coach Connect
 * 
 * Comprehensive utility functions for consistent testing across all test types:
 * - Page interaction helpers with robust waiting strategies
 * - Data verification and assertion utilities
 * - Performance monitoring and measurement helpers
 * - Accessibility testing utilities
 * - Mock data management and cleanup functions
 * - Error handling and recovery mechanisms
 * - Screenshot and visual testing utilities
 * 
 * These utilities ensure reliable, maintainable tests while reducing code duplication
 * and providing consistent testing patterns across the entire test suite.
 */

import type { Locator, Page} from '@playwright/test';
import { expect } from '@playwright/test';
import type { TestUser} from '../fixtures/test-data';
import { createTestSession, createTestUser, TestSession } from '../fixtures/test-data';

/**
 * Enhanced page interaction utilities with robust error handling
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for element with enhanced error handling and multiple selectors
   */
  async waitForElement(
    selector: string | string[], 
    options: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' } = {}
  ): Promise<Locator> {
    const { timeout = 10000, state = 'visible' } = options;
    
    if (Array.isArray(selector)) {
      // Wait for any of the selectors to match
      const promises = selector.map(s => 
        this.page.locator(s).waitFor({ state, timeout: timeout / selector.length })
      );
      
      try {
        await Promise.race(promises);
        // Return the first visible element
        for (const s of selector) {
          const element = this.page.locator(s);
          if (await element.isVisible()) {
            return element;
          }
        }
      } catch (error) {
        throw new Error(`None of the selectors [${selector.join(', ')}] became ${state} within ${timeout}ms`);
      }
    }
    
    const element = this.page.locator(selector as string);
    await element.waitFor({ state, timeout });
    return element;
  }

  /**
   * Enhanced form filling with validation
   */
  async fillForm(fields: Record<string, string>, options: { validate?: boolean } = {}) {
    const { validate = true } = options;
    
    for (const [selector, value] of Object.entries(fields)) {
      const field = await this.waitForElement(selector);
      
      // Clear field first
      await field.clear();
      
      // Fill with value
      await field.fill(value);
      
      // Validate if requested
      if (validate) {
        const actualValue = await field.inputValue();
        if (actualValue !== value) {
          throw new Error(`Field ${selector} has value "${actualValue}" but expected "${value}"`);
        }
      }
    }
  }

  /**
   * Wait for navigation with loading state handling
   */
  async waitForNavigation(expectedUrl?: string | RegExp, timeout = 30000) {
    const startTime = Date.now();
    
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle', { timeout });
    
    // Wait for any loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading-spinner"]',
      '[data-testid="page-loader"]',
      '.loading',
      '[aria-label="Loading"]'
    ];
    
    for (const selector of loadingSelectors) {
      try {
        await this.page.locator(selector).waitFor({ state: 'hidden', timeout: 2000 });
      } catch {
        // Loading indicator might not exist, continue
      }
    }
    
    // Verify URL if provided
    if (expectedUrl) {
      const currentUrl = this.page.url();
      if (expectedUrl instanceof RegExp) {
        expect(currentUrl).toMatch(expectedUrl);
      } else {
        expect(currentUrl).toContain(expectedUrl);
      }
    }
    
    console.log(`✅ Navigation completed in ${Date.now() - startTime}ms`);
  }

  /**
   * Enhanced click with retry mechanism
   */
  async clickWithRetry(selector: string, maxRetries = 3) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const element = await this.waitForElement(selector);
        
        // Ensure element is clickable
        await element.scrollIntoViewIfNeeded();
        await expect(element).toBeEnabled();
        
        // Perform click
        await element.click();
        
        // Wait a brief moment for any immediate effects
        await this.page.waitForTimeout(100);
        
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`Click attempt ${attempt} failed for ${selector}:`, error);
        
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(1000 * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Failed to click ${selector} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Upload file with progress monitoring
   */
  async uploadFile(fileInputSelector: string, filePath: string) {
    const fileInput = await this.waitForElement(fileInputSelector);
    await fileInput.setInputFiles(filePath);
    
    // Wait for upload to complete
    try {
      await this.waitForElement('[data-testid="upload-success"]', { timeout: 10000 });
    } catch {
      // Check for upload progress indicators
      const progressIndicators = [
        '[data-testid="upload-progress"]',
        '.upload-progress',
        '[aria-label="Upload progress"]'
      ];
      
      for (const selector of progressIndicators) {
        try {
          await this.page.locator(selector).waitFor({ state: 'hidden', timeout: 10000 });
          break;
        } catch {
          continue;
        }
      }
    }
  }

  /**
   * Verify toast notifications
   */
  async verifyToast(expectedMessage: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const toastSelectors = [
      `[data-testid="toast-${type}"]`,
      `[data-testid="notification-${type}"]`,
      `.toast.${type}`,
      '.notification'
    ];
    
    const toast = await this.waitForElement(toastSelectors);
    await expect(toast).toContainText(expectedMessage);
    
    // Wait for toast to disappear
    await toast.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Handle modal dialogs
   */
  async handleModal(action: 'accept' | 'dismiss', modalSelector?: string) {
    const defaultModalSelectors = [
      '[data-testid="modal"]',
      '[data-testid="dialog"]',
      '.modal',
      '[role="dialog"]'
    ];
    
    const modal = await this.waitForElement(modalSelector ? [modalSelector] : defaultModalSelectors);
    
    if (action === 'accept') {
      const confirmButtons = [
        '[data-testid="confirm-button"]',
        '[data-testid="save-button"]',
        '[data-testid="ok-button"]',
        'button:has-text("OK")',
        'button:has-text("Confirm")',
        'button:has-text("Save")'
      ];
      
      await this.clickWithRetry(confirmButtons[0]);
    } else {
      const dismissButtons = [
        '[data-testid="cancel-button"]',
        '[data-testid="close-button"]',
        '[data-testid="dismiss-button"]',
        'button:has-text("Cancel")',
        'button:has-text("Close")',
        '.modal-close'
      ];
      
      await this.clickWithRetry(dismissButtons[0]);
    }
    
    // Wait for modal to disappear
    await modal.waitFor({ state: 'hidden' });
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceHelpers {
  constructor(private page: Page) {}

  /**
   * Measure page load performance
   */
  async measurePageLoad(url: string) {
    const startTime = Date.now();
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Get Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            } else if (entry.name === 'first-input-delay') {
              vitals.FID = entry.startTime;
            } else if (entry.name === 'cumulative-layout-shift') {
              vitals.CLS = entry.value || 0;
            }
          });
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['paint', 'navigation', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    return {
      loadTime,
      ...metrics,
    };
  }

  /**
   * Monitor API response times
   */
  async monitorApiCalls(callback: () => Promise<void>) {
    const apiCalls: { url: string; method: string; responseTime: number; status: number }[] = [];
    
    this.page.on('response', (response) => {
      const request = response.request();
      const responseTime = Date.now() - request.timing().requestStart;
      
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        responseTime,
        status: response.status(),
      });
    });
    
    await callback();
    
    return apiCalls;
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityHelpers {
  constructor(private page: Page) {}

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(startSelector: string, expectedFocusOrder: string[]) {
    // Focus on starting element
    await this.page.locator(startSelector).focus();
    
    // Tab through elements and verify focus order
    for (const expectedSelector of expectedFocusOrder) {
      await this.page.keyboard.press('Tab');
      
      const focusedElement = this.page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', expectedSelector.replace('[data-testid="', '').replace('"]', ''));
    }
  }

  /**
   * Verify ARIA labels and roles
   */
  async verifyAriaAttributes(selector: string, expectedAttributes: Record<string, string>) {
    const element = this.page.locator(selector);
    
    for (const [attribute, expectedValue] of Object.entries(expectedAttributes)) {
      await expect(element).toHaveAttribute(attribute, expectedValue);
    }
  }

  /**
   * Test with screen reader simulation
   */
  async testScreenReaderAnnouncements() {
    // Enable screen reader mode
    await this.page.addInitScript(() => {
      // Mock screen reader announcements
      (window as any).screenReaderAnnouncements = [];
      
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name: string, value: string) {
        if (name === 'aria-live' || name === 'aria-label') {
          (window as any).screenReaderAnnouncements.push({ element: this, attribute: name, value });
        }
        return originalSetAttribute.call(this, name, value);
      };
    });
    
    return {
      getAnnouncements: () => this.page.evaluate(() => (window as any).screenReaderAnnouncements),
    };
  }
}

/**
 * Database and API testing utilities
 */
export class DataHelpers {
  constructor(private page: Page) {}

  /**
   * Create test user via API
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const user = createTestUser(userData);
    
    // In a real implementation, this would make API calls to create the user
    // For now, we'll simulate the API response
    await this.page.evaluate((userData) => {
      // Store user data in localStorage for test purposes
      const users = JSON.parse(localStorage.getItem('testUsers') || '[]');
      users.push(userData);
      localStorage.setItem('testUsers', JSON.stringify(users));
    }, user);
    
    return user;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData() {
    await this.page.evaluate(() => {
      // Clear test data from localStorage
      localStorage.removeItem('testUsers');
      localStorage.removeItem('testSessions');
      localStorage.removeItem('testCommunityData');
    });
  }

  /**
   * Verify database state
   */
  async verifyDatabaseState(table: string, conditions: Record<string, any>) {
    // This would typically make a database query
    // For testing purposes, we'll check localStorage
    const data = await this.page.evaluate((table) => {
      return JSON.parse(localStorage.getItem(`test${table}`) || '[]');
    }, table);
    
    const matchingRecords = data.filter((record: any) => {
      return Object.entries(conditions).every(([key, value]) => record[key] === value);
    });
    
    expect(matchingRecords.length).toBeGreaterThan(0);
    return matchingRecords;
  }
}

/**
 * Visual testing utilities
 */
export class VisualHelpers {
  constructor(private page: Page) {}

  /**
   * Take full page screenshot with comparison
   */
  async compareFullPage(name: string, options: { threshold?: number } = {}) {
    await this.page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that change between runs
    await this.page.addStyleTag({
      content: `
        [data-testid="timestamp"],
        .timestamp,
        .current-time,
        .live-indicator {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(this.page).toHaveScreenshot(`${name}-full-page.png`, {
      threshold: options.threshold || 0.2,
      animations: 'disabled',
    });
  }

  /**
   * Compare specific component
   */
  async compareComponent(selector: string, name: string, options: { threshold?: number } = {}) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    await expect(element).toHaveScreenshot(`${name}-component.png`, {
      threshold: options.threshold || 0.2,
      animations: 'disabled',
    });
  }

  /**
   * Test responsive design across viewports
   */
  async testResponsiveDesign(selector: string, name: string) {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' },
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Allow layout to settle
      
      await this.compareComponent(selector, `${name}-${viewport.name}`);
    }
  }
}

/**
 * Export utility classes as a combined helper object
 */
export function createTestHelpers(page: Page) {
  return {
    page: new PageHelpers(page),
    performance: new PerformanceHelpers(page),
    accessibility: new AccessibilityHelpers(page),
    data: new DataHelpers(page),
    visual: new VisualHelpers(page),
  };
}

/**
 * Common test patterns and assertions
 */
export class CommonAssertions {
  constructor(private page: Page) {}

  /**
   * Verify user is logged in
   */
  async verifyUserLoggedIn(userEmail?: string) {
    // Check for user menu or avatar
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    if (userEmail) {
      // Verify specific user is logged in
      await expect(this.page.locator('[data-testid="user-email"]')).toContainText(userEmail);
    }
  }

  /**
   * Verify user is logged out
   */
  async verifyUserLoggedOut() {
    await expect(this.page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  }

  /**
   * Verify error message display
   */
  async verifyErrorMessage(expectedMessage: string) {
    const errorSelectors = [
      '[data-testid="error-message"]',
      '[data-testid="form-error"]',
      '.error-message',
      '[role="alert"]'
    ];
    
    const errorElement = this.page.locator(errorSelectors.join(', ')).first();
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(expectedMessage);
  }

  /**
   * Verify success state
   */
  async verifySuccess(expectedMessage?: string) {
    const successSelectors = [
      '[data-testid="success-message"]',
      '[data-testid="confirmation"]',
      '.success-message'
    ];
    
    const successElement = this.page.locator(successSelectors.join(', ')).first();
    await expect(successElement).toBeVisible();
    
    if (expectedMessage) {
      await expect(successElement).toContainText(expectedMessage);
    }
  }
}

/**
 * Export assertion utilities
 */
export function createCommonAssertions(page: Page) {
  return new CommonAssertions(page);
}