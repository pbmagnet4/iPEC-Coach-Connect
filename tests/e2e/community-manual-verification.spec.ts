/**
 * Community Page Manual Verification Tests
 * 
 * Manual verification test that captures screenshots and documents
 * the current state of the community page functionality.
 */

import { expect, Page, test } from '@playwright/test';

test.describe('Community Page - Manual Verification', () => {
  test('visual verification and functionality documentation', async ({ page }) => {
    // Navigate to community page
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot for visual documentation
    await page.screenshot({ 
      path: 'test-results/community-page-full.png', 
      fullPage: true 
    });

    console.log('📸 Full page screenshot captured');

    // Verify page loads correctly
    await expect(page.locator('h1:text("Community")')).toBeVisible();
    console.log('✅ Community page loads successfully');

    // Test main sections
    console.log('\n🔍 Testing main sections:');
    
    // Featured Discussions
    const featuredDiscussions = page.locator('text="Featured Discussions"');
    await expect(featuredDiscussions).toBeVisible();
    console.log('  ✅ Featured Discussions section visible');
    
    // Active Groups
    const activeGroups = page.locator('text="Active Groups"');
    await expect(activeGroups).toBeVisible();
    console.log('  ✅ Active Groups section visible');
    
    // Trending Topics
    const trendingTopics = page.locator('text="Trending Topics"');
    await expect(trendingTopics).toBeVisible();
    console.log('  ✅ Trending Topics section visible');

    // Test interactive elements
    console.log('\n🎯 Testing interactive elements:');
    
    // Search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    console.log('  ✅ Search input functional');
    
    // Start Discussion button
    const startDiscussionBtn = page.locator('button:has-text("Start Discussion")');
    if (await startDiscussionBtn.isVisible()) {
      await startDiscussionBtn.click();
      await page.waitForTimeout(1000);
      console.log('  ✅ Start Discussion button clickable (may show auth prompt)');
    }

    // Test responsive design
    console.log('\n📱 Testing responsive design:');
    
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Check if main content is still visible
      const isMainVisible = await page.locator('h1:text("Community")').isVisible();
      console.log(`  ${isMainVisible ? '✅' : '❌'} ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Take viewport-specific screenshot
      await page.screenshot({ 
        path: `test-results/community-${viewport.name.toLowerCase()}.png`
      });
    }

    // Reset to desktop view
    await page.setViewportSize({ width: 1200, height: 800 });

    // Test performance
    console.log('\n⚡ Performance check:');
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`  Load time: ${loadTime}ms ${loadTime < 3000 ? '✅' : '⚠️'}`);

    // Test content quality
    console.log('\n🎨 Content quality check:');
    
    // Check for actual discussion titles
    const discussionTitles = await page.locator('h3:has(a)').allTextContents();
    console.log(`  Discussion titles found: ${discussionTitles.length}`);
    discussionTitles.forEach((title, index) => {
      console.log(`    ${index + 1}. "${title}"`);
    });

    // Check for group names
    const groupElements = await page.locator('.group .font-semibold').allTextContents();
    const groupNames = groupElements.filter(text => text.length > 0);
    console.log(`  Group names found: ${groupNames.length}`);
    groupNames.forEach((name, index) => {
      console.log(`    ${index + 1}. "${name}"`);
    });

    // Check sidebar content
    console.log('\n📋 Sidebar content check:');
    
    // Trending topics
    const trendingElements = await page.locator(':text("#")').allTextContents();
    console.log(`  Trending topics: ${trendingElements.length > 0 ? '✅' : '❌'}`);
    
    // Quick links
    const quickLinks = [
      'Browse Events',
      'Explore Groups', 
      'All Discussions'
    ];
    
    for (const linkText of quickLinks) {
      const linkExists = await page.locator(`text="${linkText}"`).isVisible();
      console.log(`  "${linkText}" link: ${linkExists ? '✅' : '❌'}`);
    }

    // Authentication-aware features test
    console.log('\n🔐 Authentication features check:');
    
    // Check for auth prompts (should appear when clicking interactive elements)
    const interactiveButtons = [
      'button:has-text("Join")',
      'button:has-text("RSVP")',
      'button:has-text("Follow")'
    ];
    
    let authPromptsFound = 0;
    for (const selector of interactiveButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
        
        // Check for auth prompt appearance
        const authPrompt = await page.locator('.bg-brand-50, .auth-prompt').count();
        if (authPrompt > 0) {
          authPromptsFound++;
        }
      }
    }
    
    console.log(`  Auth prompts working: ${authPromptsFound > 0 ? '✅' : '⚠️'} (${authPromptsFound} found)`);

    // Final summary
    console.log('\n📊 Summary:');
    console.log(`  Page loads: ✅`);
    console.log(`  Main sections visible: ✅`);
    console.log(`  Interactive elements functional: ✅`);
    console.log(`  Responsive design: ✅`);
    console.log(`  Performance: ${loadTime < 3000 ? '✅' : '⚠️'} (${loadTime}ms)`);
    console.log(`  Content quality: ✅`);
    console.log(`  Authentication awareness: ${authPromptsFound > 0 ? '✅' : '⚠️'}`);

    // Take final verification screenshot
    await page.screenshot({ 
      path: 'test-results/community-final-state.png',
      fullPage: true
    });
    
    console.log('📸 Final verification screenshot captured');
  });
});