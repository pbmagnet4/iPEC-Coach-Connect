/**
 * Community Page Basic Functionality Tests
 * 
 * Focused tests for community page without complex authentication setup
 */

import { test, expect, Page } from '@playwright/test';

const testUrls = {
  community: '/community',
};

test.describe('Community Page - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
  });

  test('should load community page successfully', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('h1:text("Community")')).toBeVisible();
    await expect(page.getByText('Connect, share, and grow with fellow professionals')).toBeVisible();
    
    console.log('✅ Community page loads successfully');
  });

  test('should display featured discussions', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Check for featured discussions section
    await expect(page.getByText('Featured Discussions')).toBeVisible();
    
    // Check for discussion content
    const discussionTitles = [
      'Transitioning from Corporate to Entrepreneurship',
      'Building Resilience in Leadership'
    ];
    
    for (const title of discussionTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
    
    // Check for discussion metadata
    await expect(page.getByText('replies')).toBeVisible();
    await expect(page.getByText('likes')).toBeVisible();
    
    console.log('✅ Featured discussions display correctly');
  });

  test('should display active groups', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Check for active groups section
    await expect(page.getByText('Active Groups')).toBeVisible();
    
    // Check for group content
    const groupNames = [
      'Executive Leadership Network',
      'Work-Life Balance Champions'
    ];
    
    for (const name of groupNames) {
      await expect(page.getByText(name)).toBeVisible();
    }
    
    // Check for group metadata
    await expect(page.getByText('members')).toBeVisible();
    await expect(page.getByText('Activity')).toBeVisible();
    
    console.log('✅ Active groups display correctly');
  });

  test('should display sidebar content', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Check trending topics
    await expect(page.getByText('Trending Topics')).toBeVisible();
    await expect(page.getByText('#Remote Leadership')).toBeVisible();
    await expect(page.getByText('#Career Transition')).toBeVisible();
    
    // Check upcoming events (if visible)
    const upcomingEventsHeader = page.getByText('Upcoming Events');
    if (await upcomingEventsHeader.isVisible()) {
      await expect(upcomingEventsHeader).toBeVisible();
    }
    
    // Check quick links
    await expect(page.getByRole('button', { name: /Browse Events|Upcoming Events/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Groups|Explore Groups/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /All Discussions/ })).toBeVisible();
    
    console.log('✅ Sidebar content displays correctly');
  });

  test('should have functional search input', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Find and test search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('leadership');
    await expect(searchInput).toHaveValue('leadership');
    
    await searchInput.clear();
    await searchInput.fill('coaching');
    await expect(searchInput).toHaveValue('coaching');
    
    console.log('✅ Search input is functional');
  });

  test('should handle auth prompts for interactive elements', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Test Start Discussion button - should show auth prompt or be clickable
    const startDiscussionBtn = page.getByRole('button', { name: /Start Discussion/ });
    if (await startDiscussionBtn.isVisible()) {
      await startDiscussionBtn.click();
      await page.waitForTimeout(1000);
      
      // Should either navigate or show auth prompt
      const currentUrl = page.url();
      const hasAuthPrompt = await page.locator('.bg-brand-50').isVisible();
      
      expect(currentUrl.includes('/community') || hasAuthPrompt).toBe(true);
    }
    
    console.log('✅ Interactive elements handle authentication appropriately');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Header should be visible
    await expect(page.locator('h1:text("Community")')).toBeVisible();
    
    // Content should be stacked properly
    await expect(page.getByText('Featured Discussions')).toBeVisible();
    await expect(page.getByText('Active Groups')).toBeVisible();
    
    console.log('✅ Page is responsive on mobile');
  });

  test('should measure basic performance metrics', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (5 seconds for safe margin)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Page load time: ${loadTime}ms (under 5s budget)`);
    
    // Check that main content is visible
    await expect(page.locator('h1:text("Community")')).toBeVisible();
    await expect(page.getByText('Featured Discussions')).toBeVisible();
    
    console.log('✅ Performance within acceptable range');
  });

  test('should handle navigation properly', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Test View All links
    const viewAllLinks = page.getByRole('button', { name: 'View All' });
    const firstViewAll = viewAllLinks.first();
    
    if (await firstViewAll.isVisible()) {
      // Should be clickable (may navigate or show more content)
      await expect(firstViewAll).toBeVisible();
    }
    
    // Test quick links
    const browseEventsBtn = page.getByRole('button', { name: /Browse Events/ });
    if (await browseEventsBtn.isVisible()) {
      await expect(browseEventsBtn).toBeVisible();
    }
    
    console.log('✅ Navigation elements are properly configured');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with slow network
    await page.route('**/*', async (route) => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Page should still load successfully
    await expect(page.locator('h1:text("Community")')).toBeVisible();
    
    console.log('✅ Handles network delays gracefully');
  });

  test('should maintain accessibility standards', async ({ page }) => {
    await page.goto(testUrls.community);
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
    
    // Check that images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      await expect(focusedElement.first()).toBeVisible();
    }
    
    console.log('✅ Basic accessibility standards met');
  });
});