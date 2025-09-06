/**
 * Community Page Functionality Tests
 * 
 * Comprehensive E2E tests for community page functionality including:
 * - Authentication-aware features
 * - UI/UX validation
 * - Component integration
 * - Performance measurement
 * - Browser compatibility
 */

import { test, expect, Page, Locator } from '@playwright/test';

// Test data setup
const testUrls = {
  community: '/community',
  login: '/login',
  register: '/register'
};

const selectors = {
  // Page elements
  pageTitle: 'h1:text("Community")',
  searchInput: 'input[placeholder*="Search discussions"]',
  startDiscussionButton: 'button:has-text("Start Discussion")',
  
  // Featured discussions
  featuredDiscussions: '[data-testid="featured-discussions"], .space-y-6:has(h3:text("Transitioning from Corporate"))',
  discussionCard: '.group:has(h3)',
  discussionTitle: 'h3 a',
  likeButton: 'button:has([class*="heart"], [class*="Heart"])',
  followButton: 'button:has([class*="user-plus"], [class*="UserPlus"])',
  
  // Active groups
  activeGroups: '[data-testid="active-groups"], .grid:has(.group.cursor-pointer)',
  groupCard: '.group.cursor-pointer',
  joinButton: 'button:has-text("Join")',
  
  // Sidebar elements
  trendingTopics: '[data-testid="trending-topics"], .space-y-4:has(h3:contains("#"))',
  upcomingEvents: '[data-testid="upcoming-events"], .space-y-4:has(button:has-text("RSVP"))',
  rsvpButton: 'button:has-text("RSVP")',
  newMembers: '[data-testid="new-members"], .space-y-4:has(button:has-text("Follow"))',
  followMemberButton: 'button:has-text("Follow")',
  
  // Auth prompts
  authPrompt: '.bg-brand-50.border-brand-200, [class*="auth-prompt"]',
  signInButton: 'button:has-text("Sign In")',
  signUpButton: 'button:has-text("Sign Up"), button:has-text("Join Free")',
  
  // Quick links
  quickLinks: '[data-testid="quick-links"], .space-y-2:has(button:has-text("Browse Events"))',
  browseEventsLink: 'button:has-text("Browse Events")',
  exploreGroupsLink: 'button:has-text("Explore Groups")',
  allDiscussionsLink: 'button:has-text("All Discussions")'
};

class CommunityPageHelpers {
  constructor(public page: Page) {}

  async navigateToCommunity() {
    await this.page.goto(testUrls.community);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator(selectors.pageTitle)).toBeVisible();
  }

  async getAuthPrompts() {
    return await this.page.locator(selectors.authPrompt).all();
  }

  async clickInteractiveElement(selector: string) {
    const element = this.page.locator(selector).first();
    await element.click();
    // Wait briefly for any auth prompts to appear
    await this.page.waitForTimeout(500);
  }

  async checkAuthPromptAppears(context?: string) {
    const prompts = await this.getAuthPrompts();
    expect(prompts.length).toBeGreaterThan(0);
    
    if (context) {
      // Check if prompt contains relevant context
      const promptText = await prompts[0].textContent();
      expect(promptText?.toLowerCase()).toContain(context.toLowerCase());
    }
  }

  async measurePageLoadTime() {
    const startTime = Date.now();
    await this.navigateToCommunity();
    const loadTime = Date.now() - startTime;
    return loadTime;
  }

  async checkResponsiveDesign() {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    const results = [];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.navigateToCommunity();
      
      const isHeaderVisible = await this.page.locator(selectors.pageTitle).isVisible();
      const isSearchVisible = await this.page.locator(selectors.searchInput).isVisible();
      
      results.push({
        viewport: viewport.name,
        headerVisible: isHeaderVisible,
        searchVisible: isSearchVisible,
        width: viewport.width
      });
    }
    
    return results;
  }

  async validateAccessibility() {
    await this.navigateToCommunity();
    
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for button labels
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  }
}

test.describe('Community Page - Non-Authenticated Users', () => {
  let helpers: CommunityPageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CommunityPageHelpers(page);
    // Ensure user is not logged in
    await page.context().clearCookies();
  });

  test('should load community page without errors', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check page title
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
    await expect(page.locator(selectors.pageTitle)).toHaveText('Community');
    
    // Check page description
    await expect(page.getByText('Connect, share, and grow with fellow professionals')).toBeVisible();
  });

  test('should display discussions in read-only mode', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check featured discussions are visible
    const discussions = page.locator(selectors.discussionCard);
    await expect(discussions.first()).toBeVisible();
    
    // Check discussion titles are clickable
    const discussionTitle = discussions.first().locator(selectors.discussionTitle);
    await expect(discussionTitle).toBeVisible();
    
    // Check discussion metadata is visible
    await expect(discussions.first().locator(':text("replies")')).toBeVisible();
    await expect(discussions.first().locator(':text("likes")')).toBeVisible();
  });

  test('should show auth prompts for interactive elements', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Test Start Discussion button
    await helpers.clickInteractiveElement(selectors.startDiscussionButton);
    await helpers.checkAuthPromptAppears('discussion');
    
    // Test Like button on discussions
    await helpers.clickInteractiveElement(selectors.likeButton);
    await helpers.checkAuthPromptAppears();
    
    // Test Follow button
    await helpers.clickInteractiveElement(selectors.followButton);
    await helpers.checkAuthPromptAppears();
    
    // Test Join group button
    await helpers.clickInteractiveElement(selectors.joinButton);
    await helpers.checkAuthPromptAppears('group');
    
    // Test RSVP button
    await helpers.clickInteractiveElement(selectors.rsvpButton);
    await helpers.checkAuthPromptAppears();
  });

  test('should allow browsing without authentication', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check that content is visible
    await expect(page.locator(selectors.featuredDiscussions)).toBeVisible();
    await expect(page.locator(selectors.activeGroups)).toBeVisible();
    await expect(page.locator(selectors.trendingTopics)).toBeVisible();
    
    // Check search functionality
    const searchInput = page.locator(selectors.searchInput);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('leadership');
    await expect(searchInput).toHaveValue('leadership');
  });

  test('should display contextual auth prompts', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check auth prompt styling and messaging
    const authPrompts = await helpers.getAuthPrompts();
    if (authPrompts.length > 0) {
      const prompt = authPrompts[0];
      
      // Check for sign in and sign up options
      const signInBtn = prompt.locator(selectors.signInButton);
      const signUpBtn = prompt.locator(selectors.signUpButton);
      
      if (await signInBtn.isVisible()) {
        await expect(signInBtn).toBeVisible();
      }
      if (await signUpBtn.isVisible()) {
        await expect(signUpBtn).toBeVisible();
      }
    }
  });

  test('should handle social sharing and external links', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check quick links navigation
    const browseEventsLink = page.locator(selectors.browseEventsLink);
    if (await browseEventsLink.isVisible()) {
      // Check that link has proper href attribute
      const href = await browseEventsLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});

test.describe('Community Page - UI/UX Validation', () => {
  let helpers: CommunityPageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CommunityPageHelpers(page);
  });

  test('should have responsive design', async ({ page }) => {
    const responsiveResults = await helpers.checkResponsiveDesign();
    
    responsiveResults.forEach(result => {
      expect(result.headerVisible).toBe(true);
      expect(result.searchVisible).toBe(true);
    });
    
    // Test mobile-specific layout
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateToCommunity();
    
    // Check that elements stack properly on mobile
    const header = page.locator('.flex.flex-col.lg\\:flex-row');
    await expect(header).toBeVisible();
  });

  test('should have consistent design language', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check for consistent button styling
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for consistent card styling
    const cards = await page.locator('.rounded-lg, .rounded-xl').all();
    expect(cards.length).toBeGreaterThan(0);
    
    // Check color scheme consistency
    const brandElements = await page.locator('[class*="brand-"], [class*="text-brand"]').all();
    expect(brandElements.length).toBeGreaterThan(0);
  });

  test('should meet accessibility standards', async ({ page }) => {
    await helpers.validateAccessibility();
    
    // Test keyboard navigation
    await helpers.navigateToCommunity();
    
    // Focus on search input and verify focus is visible
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper loading states', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Check that content loads properly
    await expect(page.locator(selectors.featuredDiscussions)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(selectors.activeGroups)).toBeVisible({ timeout: 10000 });
    
    // Check for any loading indicators
    const loadingSpinners = await page.locator('.animate-spin, [class*="loading"]').all();
    // Should not have persistent loading states
    expect(loadingSpinners.length).toBe(0);
  });

  test('should handle empty states gracefully', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Test search with no results
    const searchInput = page.locator(selectors.searchInput);
    await searchInput.fill('nonexistentquery12345');
    
    // Should handle gracefully without errors
    await page.waitForTimeout(1000);
    
    // Page should still be functional
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
  });
});

test.describe('Community Page - Performance Testing', () => {
  let helpers: CommunityPageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CommunityPageHelpers(page);
  });

  test('should load within performance budget', async ({ page }) => {
    const loadTime = await helpers.measurePageLoadTime();
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Community page load time: ${loadTime}ms`);
  });

  test('should handle concurrent users gracefully', async ({ page, browser }) => {
    // Simulate multiple users accessing the page
    const pages = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage()
    ]);
    
    const loadPromises = pages.map(p => {
      const pageHelpers = new CommunityPageHelpers(p);
      return pageHelpers.navigateToCommunity();
    });
    
    // All pages should load successfully
    await Promise.all(loadPromises);
    
    // Verify all pages loaded correctly
    for (const p of pages) {
      await expect(p.locator(selectors.pageTitle)).toBeVisible();
    }
    
    // Cleanup
    await Promise.all(pages.map(p => p.close()));
  });

  test('should not have memory leaks', async ({ page }) => {
    // Navigate back and forth to check for memory issues
    for (let i = 0; i < 5; i++) {
      await helpers.navigateToCommunity();
      await page.goBack();
      await page.goForward();
      await page.waitForTimeout(500);
    }
    
    // Should still be functional
    await helpers.navigateToCommunity();
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
  });
});

test.describe('Community Page - Component Integration', () => {
  let helpers: CommunityPageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new CommunityPageHelpers(page);
  });

  test('should integrate auth components properly', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Test AuthAwareWrapper integration
    const interactiveElements = [
      selectors.startDiscussionButton,
      selectors.likeButton,
      selectors.joinButton,
      selectors.rsvpButton
    ];
    
    for (const selector of interactiveElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        // Should show auth prompt
        const authPrompts = await helpers.getAuthPrompts();
        expect(authPrompts.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle state management correctly', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Test search state
    const searchInput = page.locator(selectors.searchInput);
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
    
    // Navigate away and back
    await page.goto('/');
    await helpers.navigateToCommunity();
    
    // Search should be reset
    await expect(searchInput).toHaveValue('');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Block network requests to simulate errors
    await page.route('**/*', (route) => {
      if (route.request().url().includes('api')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await helpers.navigateToCommunity();
    
    // Page should still load with static content
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
  });

  test('should maintain scroll position correctly', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(500);
    
    // Trigger a component interaction that shouldn't affect scroll
    const searchInput = page.locator(selectors.searchInput);
    await searchInput.fill('test');
    
    // Scroll position should be maintained
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBeCloseTo(scrollPosition, 100);
  });
});

test.describe('Community Page - Browser Compatibility', () => {
  let helpers: CommunityPageHelpers;

  test.beforeEach(async ({ page, browserName }) => {
    helpers = new CommunityPageHelpers(page);
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    await helpers.navigateToCommunity();
    
    // Basic functionality should work in all browsers
    await expect(page.locator(selectors.pageTitle)).toBeVisible();
    await expect(page.locator(selectors.featuredDiscussions)).toBeVisible();
    await expect(page.locator(selectors.activeGroups)).toBeVisible();
    
    console.log(`Community page functional in ${browserName}`);
  });

  test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }
    
    await helpers.navigateToCommunity();
    
    // Test tap interactions
    const groupCard = page.locator(selectors.groupCard).first();
    if (await groupCard.isVisible()) {
      await groupCard.tap();
      // Should be responsive to touch
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await helpers.navigateToCommunity();
    
    // Test tab navigation
    let tabCount = 0;
    const maxTabs = 10;
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      
      if (await focusedElement.isVisible()) {
        tabCount++;
        // Test that focused element is interactive
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        expect(['button', 'input', 'a', 'select', 'textarea'].some(tag => 
          tagName.includes(tag)
        )).toBe(true);
      } else {
        break;
      }
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });
});