import { devices, expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:5175';

// Learning center routes to test
const learningRoutes = [
  { path: '/about-coaching', title: 'About Coaching' },
  { path: '/coaching-resources', title: 'Coaching Resources' },
  { path: '/coaching-basics', title: 'Coaching Basics' },
];

// Mobile devices to test
const mobileDevices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
  { name: 'Pixel 5', viewport: { width: 393, height: 851 } },
  { name: 'Galaxy S8', viewport: { width: 360, height: 740 } },
];

// Standalone mobile navigation tests without authentication dependency
test.describe('Mobile Navigation Tests (Standalone)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport and user agent
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
  });

  test('Home page mobile navigation structure', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if we're on mobile by looking for mobile navigation elements
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    
    if (isMobile) {
      // Look for mobile menu button (hamburger menu)
      const possibleMobileMenuSelectors = [
        '[data-testid="mobile-menu-toggle"]',
        'button[aria-label*="menu" i]',
        'button[aria-label*="navigation" i]',
        '.hamburger',
        '.mobile-menu-button',
        'button:has-text("Menu")',
        '[role="button"]:has-text("☰")',
        'button svg[viewBox="0 0 24 24"]' // hamburger icon
      ];
      
      let mobileMenuButton = null;
      for (const selector of possibleMobileMenuSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          mobileMenuButton = element;
          break;
        }
      }
      
      if (mobileMenuButton) {
        console.log('✅ Mobile menu button found');
        await expect(mobileMenuButton).toBeVisible();
        
        // Test clicking the mobile menu
        await mobileMenuButton.click();
        await page.waitForTimeout(1000); // Wait for animation
        
        // Look for navigation content
        const navContent = page.locator('nav, .navigation, .menu-content, [role="navigation"]');
        if (await navContent.count() > 0) {
          console.log('✅ Navigation content is accessible');
        }
      } else {
        console.log('⚠️  No mobile menu button found, checking for alternative navigation');
        
        // Look for always-visible navigation
        const navigation = page.locator('nav, .navigation, header nav, [role="navigation"]');
        await expect(navigation.first()).toBeVisible();
      }
    }
  });

  test('Learning pages accessibility on mobile', async ({ page }) => {
    for (const route of learningRoutes) {
      console.log(`Testing ${route.title} page...`);
      
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      
      // Verify page loads
      await expect(page).toHaveURL(new RegExp(route.path));
      
      // Check page has content
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Look for main content
      const mainContent = page.locator('main, .main, .content, article, section').first();
      if (await mainContent.isVisible()) {
        console.log(`✅ ${route.title} main content is visible`);
      }
      
      // Check for CTA links to coaches
      const coachLinks = page.locator('a[href*="/coaches"], a[href*="coaches"]');
      const coachLinkCount = await coachLinks.count();
      if (coachLinkCount > 0) {
        console.log(`✅ ${route.title} has ${coachLinkCount} coach-related links`);
        
        // Verify at least one CTA is visible and properly sized for mobile
        const firstCoachLink = coachLinks.first();
        if (await firstCoachLink.isVisible()) {
          const bbox = await firstCoachLink.boundingBox();
          if (bbox && bbox.height >= 44 && bbox.width >= 44) {
            console.log(`✅ Coach CTA has proper touch target size: ${bbox.width}x${bbox.height}`);
          }
        }
      }
      
      // Check text readability (font size)
      const textElements = page.locator('p, span, div, h1, h2, h3').filter({ hasText: /\w{5,}/ });
      if (await textElements.count() > 0) {
        const fontSize = await textElements.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return parseInt(style.fontSize);
        });
        
        if (fontSize >= 14) {
          console.log(`✅ Text is readable on mobile (${fontSize}px)`);
        } else {
          console.log(`⚠️  Text might be too small on mobile (${fontSize}px)`);
        }
      }
      
      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (!hasHorizontalScroll) {
        console.log(`✅ ${route.title} has no horizontal scrolling`);
      } else {
        console.log(`⚠️  ${route.title} has horizontal scrolling`);
      }
    }
  });

  test('Responsive design across different mobile sizes', async ({ page }) => {
    const viewportSizes = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Galaxy S8', width: 360, height: 740 },
      { name: 'Pixel 5', width: 393, height: 851 },
    ];

    for (const viewport of viewportSizes) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Test home page
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Check no horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (!hasOverflow) {
        console.log(`✅ ${viewport.name} home page fits viewport`);
      } else {
        console.log(`⚠️  ${viewport.name} home page has horizontal overflow`);
      }
      
      // Test one learning page per viewport
      const testRoute = learningRoutes[0];
      await page.goto(`${BASE_URL}${testRoute.path}`);
      await page.waitForLoadState('networkidle');
      
      const hasOverflowLearning = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (!hasOverflowLearning) {
        console.log(`✅ ${viewport.name} ${testRoute.title} fits viewport`);
      } else {
        console.log(`⚠️  ${viewport.name} ${testRoute.title} has horizontal overflow`);
      }
    }
  });

  test('Navigation between learning pages', async ({ page }) => {
    console.log('Testing navigation between learning pages...');
    
    // Start from first page
    await page.goto(`${BASE_URL}${learningRoutes[0].path}`);
    await page.waitForLoadState('networkidle');
    
    // Look for navigation menu
    const possibleNavSelectors = [
      'nav a',
      '.navigation a',
      'header a',
      '[role="navigation"] a',
      '.menu a'
    ];
    
    let navigationLinks = null;
    for (const selector of possibleNavSelectors) {
      const links = page.locator(selector);
      if (await links.count() > 0) {
        navigationLinks = links;
        break;
      }
    }
    
    if (navigationLinks) {
      console.log(`Found ${await navigationLinks.count()} navigation links`);
      
      // Try to find links to other learning pages
      for (const route of learningRoutes.slice(1)) {
        const routeLink = page.locator(`a[href="${route.path}"], a[href*="${route.path}"]`);
        
        if (await routeLink.count() > 0 && await routeLink.first().isVisible()) {
          console.log(`✅ Found link to ${route.title}`);
          
          // Click the link
          await routeLink.first().click();
          await page.waitForLoadState('networkidle');
          
          // Verify navigation worked
          await expect(page).toHaveURL(new RegExp(route.path));
          console.log(`✅ Successfully navigated to ${route.title}`);
          
          break; // Test one navigation to avoid timeout
        }
      }
    } else {
      console.log('⚠️  No navigation links found');
    }
  });

  test('Touch target accessibility', async ({ page }) => {
    console.log('Testing touch target accessibility...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find clickable elements
    const clickableElements = page.locator('a, button, [role="button"], input[type="submit"]');
    const count = await clickableElements.count();
    
    console.log(`Found ${count} clickable elements`);
    
    if (count > 0) {
      // Test first few elements for proper touch target size
      const elementsToTest = Math.min(count, 5);
      
      for (let i = 0; i < elementsToTest; i++) {
        const element = clickableElements.nth(i);
        
        if (await element.isVisible()) {
          const bbox = await element.boundingBox();
          
          if (bbox) {
            const meetsStandard = bbox.height >= 44 && bbox.width >= 44;
            const elementText = await element.textContent() || await element.getAttribute('aria-label') || 'Unknown';
            
            if (meetsStandard) {
              console.log(`✅ "${elementText.slice(0, 30)}" has proper touch target (${bbox.width}x${bbox.height})`);
            } else {
              console.log(`⚠️  "${elementText.slice(0, 30)}" has small touch target (${bbox.width}x${bbox.height})`);
            }
          }
        }
      }
    }
  });

  test('Mobile performance and loading', async ({ page }) => {
    console.log('Testing mobile performance...');
    
    // Simulate slower mobile connection
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay
    });
    
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Home page load time: ${loadTime}ms`);
    
    if (loadTime < 5000) {
      console.log('✅ Home page loads in acceptable time for mobile');
    } else {
      console.log('⚠️  Home page load time is slow for mobile');
    }
    
    // Test learning page load time
    const learningStartTime = Date.now();
    await page.goto(`${BASE_URL}${learningRoutes[0].path}`);
    await page.waitForLoadState('networkidle');
    
    const learningLoadTime = Date.now() - learningStartTime;
    console.log(`Learning page load time: ${learningLoadTime}ms`);
    
    if (learningLoadTime < 5000) {
      console.log('✅ Learning page loads in acceptable time for mobile');
    } else {
      console.log('⚠️  Learning page load time is slow for mobile');
    }
  });

});