import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5175';

// Test configurations for different mobile devices
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S8', device: devices['Galaxy S8+'] },
];

const tabletDevices = [
  { name: 'iPad', device: devices['iPad'] },
  { name: 'iPad Mini', device: devices['iPad Mini'] },
];

// Learning center routes to test
const learningRoutes = [
  { path: '/about-coaching', title: 'About Coaching' },
  { path: '/coaching-resources', title: 'Coaching Resources' },
  { path: '/coaching-basics', title: 'Coaching Basics' },
];

test.describe('Mobile Navigation Tests', () => {
  
  // Test mobile navigation functionality across different devices
  for (const { name, device } of mobileDevices) {
    test(`Mobile navigation functionality on ${name}`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Check if mobile navigation menu button exists
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
      await expect(mobileMenuButton.first()).toBeVisible();
      
      // Click mobile menu to open navigation
      await mobileMenuButton.first().click();
      await page.waitForTimeout(500); // Wait for animation
      
      // Check if Coaching section is visible in mobile menu
      const coachingSection = page.locator('text=Coaching, [data-testid="coaching-nav"], .coaching-nav');
      await expect(coachingSection.first()).toBeVisible();
      
      // Test collapsible Coaching section
      await coachingSection.first().click();
      await page.waitForTimeout(500);
      
      // Verify all three learning center links are visible
      for (const route of learningRoutes) {
        const link = page.locator(`a[href="${route.path}"], text="${route.title}"`);
        await expect(link.first()).toBeVisible();
      }
      
      await context.close();
    });
  }
  
  test('Mobile dropdown/collapsible behavior', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
    await mobileMenuButton.first().click();
    await page.waitForTimeout(500);
    
    // Test Coaching section collapsible behavior
    const coachingSection = page.locator('text=Coaching, [data-testid="coaching-nav"], .coaching-nav');
    
    // Initially collapsed state
    const learningLinks = page.locator('a[href="/about-coaching"], a[href="/coaching-resources"], a[href="/coaching-basics"]');
    const visibleLinksCount = await learningLinks.count();
    
    // Expand coaching section
    await coachingSection.first().click();
    await page.waitForTimeout(500);
    
    // Verify links are now visible
    for (const route of learningRoutes) {
      const link = page.locator(`a[href="${route.path}"]`);
      await expect(link.first()).toBeVisible();
    }
    
    // Collapse again
    await coachingSection.first().click();
    await page.waitForTimeout(500);
    
    await context.close();
  });
  
  test('Touch target accessibility on mobile', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
    await mobileMenuButton.first().click();
    await page.waitForTimeout(500);
    
    // Expand coaching section
    const coachingSection = page.locator('text=Coaching, [data-testid="coaching-nav"], .coaching-nav');
    await coachingSection.first().click();
    await page.waitForTimeout(500);
    
    // Check touch target sizes for all navigation links
    for (const route of learningRoutes) {
      const link = page.locator(`a[href="${route.path}"]`).first();
      if (await link.isVisible()) {
        const boundingBox = await link.boundingBox();
        if (boundingBox) {
          // Minimum touch target should be 44x44px (iOS) or 48x48px (Material Design)
          expect(boundingBox.height).toBeGreaterThanOrEqual(40);
          expect(boundingBox.width).toBeGreaterThanOrEqual(40);
        }
      }
    }
    
    await context.close();
  });
  
});

test.describe('Learning Pages Mobile Tests', () => {
  
  // Test each learning page loads correctly on mobile
  for (const route of learningRoutes) {
    for (const { name, device } of mobileDevices) {
      test(`${route.title} page loads correctly on ${name}`, async ({ browser }) => {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        await page.goto(`${BASE_URL}${route.path}`);
        await page.waitForLoadState('networkidle');
        
        // Check page loads without errors
        await expect(page).toHaveURL(new RegExp(route.path));
        
        // Verify page content is visible
        const mainContent = page.locator('main, .main-content, [role="main"]');
        await expect(mainContent.first()).toBeVisible();
        
        // Check for CTA buttons that should direct to /coaches
        const ctaButtons = page.locator('a[href="/coaches"], button:has-text("Find"), button:has-text("Browse"), button:has-text("Discover")');
        const ctaCount = await ctaButtons.count();
        
        if (ctaCount > 0) {
          // Verify at least one CTA is visible
          await expect(ctaButtons.first()).toBeVisible();
          
          // Check CTA links to coaches page
          for (let i = 0; i < Math.min(ctaCount, 3); i++) {
            const cta = ctaButtons.nth(i);
            if (await cta.isVisible()) {
              const href = await cta.getAttribute('href');
              if (href) {
                expect(href).toContain('/coaches');
              }
            }
          }
        }
        
        await context.close();
      });
    }
  }
  
  test('Navigation between learning pages on mobile', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    // Start from first learning page
    await page.goto(`${BASE_URL}${learningRoutes[0].path}`);
    await page.waitForLoadState('networkidle');
    
    // Navigate through all learning pages
    for (let i = 1; i < learningRoutes.length; i++) {
      const currentRoute = learningRoutes[i];
      
      // Open mobile menu
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
      await mobileMenuButton.first().click();
      await page.waitForTimeout(500);
      
      // Expand coaching section
      const coachingSection = page.locator('text=Coaching, [data-testid="coaching-nav"], .coaching-nav');
      await coachingSection.first().click();
      await page.waitForTimeout(500);
      
      // Click on next learning page
      const nextPageLink = page.locator(`a[href="${currentRoute.path}"]`);
      await nextPageLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify navigation worked
      await expect(page).toHaveURL(new RegExp(currentRoute.path));
      
      // Verify page content loaded
      const mainContent = page.locator('main, .main-content, [role="main"]');
      await expect(mainContent.first()).toBeVisible();
    }
    
    await context.close();
  });
  
});

test.describe('Responsive Design Tests', () => {
  
  // Test responsive design across different screen sizes
  const viewportSizes = [
    { name: 'Mobile Small', width: 320, height: 568 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop Small', width: 1280, height: 720 },
  ];
  
  for (const viewport of viewportSizes) {
    test(`Responsive design at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Check if navigation adapts to screen size
      if (viewport.width < 768) {
        // Mobile: should show hamburger menu
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
        await expect(mobileMenuButton.first()).toBeVisible();
        
        // Desktop navigation should be hidden
        const desktopNav = page.locator('.desktop-nav, nav:not(.mobile-nav)');
        if (await desktopNav.count() > 0) {
          await expect(desktopNav.first()).not.toBeVisible();
        }
      } else {
        // Desktop/Tablet: should show full navigation
        const desktopNav = page.locator('nav, .navigation, .navbar');
        await expect(desktopNav.first()).toBeVisible();
      }
      
      // Test each learning page at this viewport
      for (const route of learningRoutes) {
        await page.goto(`${BASE_URL}${route.path}`);
        await page.waitForLoadState('networkidle');
        
        // Check page content is properly responsive
        const mainContent = page.locator('main, .main-content, [role="main"]');
        await expect(mainContent.first()).toBeVisible();
        
        // Verify no horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
        
        // Check text is readable (not too small)
        const textElements = page.locator('p, span, div').filter({ hasText: /\w{10,}/ });
        const textCount = await textElements.count();
        
        if (textCount > 0) {
          const firstText = textElements.first();
          const fontSize = await firstText.evaluate((el) => {
            return parseInt(window.getComputedStyle(el).fontSize);
          });
          expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable font size
        }
      }
      
      await context.close();
    });
  }
  
});

test.describe('Accessibility Tests', () => {
  
  test('Mobile navigation accessibility', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check mobile menu button has proper accessibility attributes
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
    
    if (await mobileMenuButton.count() > 0) {
      const button = mobileMenuButton.first();
      
      // Check aria-label or accessible name
      const ariaLabel = await button.getAttribute('aria-label');
      const buttonText = await button.textContent();
      expect(ariaLabel || buttonText).toBeTruthy();
      
      // Check if button is focusable
      await button.focus();
      await expect(button).toBeFocused();
      
      // Test keyboard navigation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Verify menu opened
      const menuContainer = page.locator('[role="navigation"], nav, .mobile-menu');
      await expect(menuContainer.first()).toBeVisible();
    }
    
    await context.close();
  });
  
  test('Learning page links keyboard navigation', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label="Toggle navigation"], .hamburger-menu, [role="button"]:has-text("Menu")');
    await mobileMenuButton.first().click();
    await page.waitForTimeout(500);
    
    // Expand coaching section
    const coachingSection = page.locator('text=Coaching, [data-testid="coaching-nav"], .coaching-nav');
    await coachingSection.first().click();
    await page.waitForTimeout(500);
    
    // Test keyboard navigation through learning links
    for (const route of learningRoutes) {
      const link = page.locator(`a[href="${route.path}"]`).first();
      
      if (await link.isVisible()) {
        // Check link is focusable
        await link.focus();
        await expect(link).toBeFocused();
        
        // Check link has accessible name
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        expect(linkText || ariaLabel).toBeTruthy();
      }
    }
    
    await context.close();
  });
  
});