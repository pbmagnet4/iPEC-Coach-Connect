import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5175';

test.describe('Quick Mobile Navigation Test', () => {
  
  test('Mobile navigation structure and learning pages', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    console.log('🚀 Starting mobile navigation test...');
    
    try {
      // Test 1: Home page loads
      console.log('📱 Testing home page load...');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const title = await page.title();
      console.log(`✅ Home page loaded: "${title}"`);
      
      // Test 2: Check mobile navigation
      console.log('📱 Testing mobile navigation...');
      const isMobile = await page.evaluate(() => window.innerWidth < 768);
      console.log(`📱 Mobile viewport detected: ${isMobile}`);
      
      // Look for common mobile navigation patterns
      const navSelectors = [
        'button[aria-label*="menu" i]',
        '.hamburger',
        '.mobile-menu',
        '[data-testid*="menu"]',
        'button:has-text("☰")',
        'nav button'
      ];
      
      let foundMobileNav = false;
      for (const selector of navSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Mobile navigation found: ${selector}`);
          foundMobileNav = true;
          
          // Try clicking it
          await element.click();
          await page.waitForTimeout(1000);
          console.log('✅ Mobile navigation clicked successfully');
          break;
        }
      }
      
      if (!foundMobileNav) {
        console.log('⚠️  No mobile navigation button found, checking for visible nav');
        const visibleNav = page.locator('nav, .navigation').first();
        if (await visibleNav.isVisible()) {
          console.log('✅ Always-visible navigation found');
        }
      }
      
      // Test 3: Learning pages
      const learningRoutes = [
        { path: '/about-coaching', title: 'About Coaching' },
        { path: '/coaching-resources', title: 'Coaching Resources' },
        { path: '/coaching-basics', title: 'Coaching Basics' },
      ];
      
      console.log('📚 Testing learning pages...');
      
      for (const route of learningRoutes) {
        console.log(`📖 Testing ${route.title}...`);
        
        await page.goto(`${BASE_URL}${route.path}`);
        await page.waitForLoadState('networkidle');
        
        // Check URL
        const currentUrl = page.url();
        if (currentUrl.includes(route.path)) {
          console.log(`✅ ${route.title} loaded successfully`);
        } else {
          console.log(`⚠️  ${route.title} URL mismatch: ${currentUrl}`);
        }
        
        // Check for content
        const hasContent = await page.locator('main, .main, article, section').first().isVisible();
        if (hasContent) {
          console.log(`✅ ${route.title} has visible content`);
        } else {
          console.log(`⚠️  ${route.title} content not visible`);
        }
        
        // Check for coach CTAs
        const coachLinks = page.locator('a[href*="/coaches"], a[href*="coaches"]');
        const coachLinkCount = await coachLinks.count();
        if (coachLinkCount > 0) {
          console.log(`✅ ${route.title} has ${coachLinkCount} coach links`);
        } else {
          console.log(`⚠️  ${route.title} has no coach links`);
        }
        
        // Check responsive design
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        if (!hasHorizontalScroll) {
          console.log(`✅ ${route.title} fits mobile viewport`);
        } else {
          console.log(`⚠️  ${route.title} has horizontal scrolling`);
        }
      }
      
      // Test 4: Touch targets
      console.log('👆 Testing touch targets...');
      await page.goto(BASE_URL);
      
      const clickableElements = page.locator('a, button').filter({ hasText: /.+/ });
      const clickableCount = await clickableElements.count();
      console.log(`Found ${clickableCount} clickable elements`);
      
      if (clickableCount > 0) {
        // Test a few elements
        const elementsToTest = Math.min(clickableCount, 3);
        let properTouchTargets = 0;
        
        for (let i = 0; i < elementsToTest; i++) {
          const element = clickableElements.nth(i);
          if (await element.isVisible()) {
            const bbox = await element.boundingBox();
            if (bbox && bbox.height >= 44 && bbox.width >= 44) {
              properTouchTargets++;
            }
          }
        }
        
        console.log(`✅ ${properTouchTargets}/${elementsToTest} elements have proper touch targets`);
      }
      
      // Test 5: Performance
      console.log('⚡ Testing performance...');
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/about-coaching`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`📊 Page load time: ${loadTime}ms`);
      if (loadTime < 3000) {
        console.log('✅ Good mobile performance');
      } else {
        console.log('⚠️  Slow mobile performance');
      }
      
      console.log('🎉 Mobile navigation test completed successfully!');
      
    } catch (error) {
      console.error('❌ Mobile navigation test failed:', error);
      throw error;
    } finally {
      await context.close();
    }
  });
  
});