import { test, expect, Page, BrowserContext } from '@playwright/test';
import { devices } from '@playwright/test';

test.describe('Learning Center Cleanup - E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Route Functionality and Navigation', () => {
    test('should navigate to all learning center routes successfully', async () => {
      const routes = [
        { path: '/about-coaching', title: 'About Professional Coaching' },
        { path: '/coaching-resources', title: 'Coaching Resources' },
        { path: '/coaching-basics', title: 'Introduction to Professional Coaching' }
      ];

      for (const route of routes) {
        await page.goto(`http://localhost:5173${route.path}`);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Check that the page loads without errors
        await expect(page).toHaveURL(new RegExp(route.path));
        await expect(page.locator('h1')).toContainText(route.title);
        
        // Check for absence of error messages
        await expect(page.locator('[data-testid="error-message"]')).toHaveCount(0);
        await expect(page.locator('text=404')).toHaveCount(0);
        await expect(page.locator('text=Page not found')).toHaveCount(0);
      }
    });

    test('should handle direct URL access for each route', async () => {
      const routes = ['/about-coaching', '/coaching-resources', '/coaching-basics'];
      
      for (const route of routes) {
        // Test direct navigation
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');
        
        // Should not redirect to error page
        await expect(page).toHaveURL(new RegExp(route));
        
        // Page should have main content
        await expect(page.locator('main, [role="main"], .min-h-screen')).toBeVisible();
      }
    });

    test('should redirect from old learning routes to new routes', async () => {
      // Test that old LMS routes would redirect or show 404
      const oldRoutes = [
        '/learning',
        '/learning/courses',
        '/learning/course-details'
      ];

      for (const oldRoute of oldRoutes) {
        await page.goto(`http://localhost:5173${oldRoute}`, { waitUntil: 'networkidle' });
        
        // Should either redirect to valid route or show appropriate handling
        const currentUrl = page.url();
        const isValidRedirect = currentUrl.includes('/about-coaching') || 
                                currentUrl.includes('/coaching-resources') || 
                                currentUrl.includes('/coaching-basics');
        const is404 = await page.locator('text=404').count() > 0 || 
                      await page.locator('text=Page not found').count() > 0;
        
        expect(isValidRedirect || is404).toBeTruthy();
      }
    });
  });

  test.describe('Desktop Navigation', () => {
    test('should show coaching dropdown in desktop navigation', async () => {
      await page.goto('http://localhost:5173');
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Find coaching dropdown button
      const coachingDropdown = page.locator('button:has-text("Coaching"), a:has-text("Coaching")').first();
      await expect(coachingDropdown).toBeVisible();
      
      // Hover over coaching to open dropdown
      await coachingDropdown.hover();
      
      // Check dropdown menu appears
      const dropdownMenu = page.locator('.group .absolute, [role="menu"], .dropdown-menu').first();
      await expect(dropdownMenu).toBeVisible();
      
      // Check all three links are present
      await expect(page.locator('text=About Coaching')).toBeVisible();
      await expect(page.locator('text=Coaching Resources')).toBeVisible();
      await expect(page.locator('text=Coaching Basics')).toBeVisible();
    });

    test('should navigate via coaching dropdown links', async () => {
      await page.goto('http://localhost:5173');
      await page.setViewportSize({ width: 1024, height: 768 });
      
      const links = [
        { text: 'About Coaching', expectedUrl: '/about-coaching' },
        { text: 'Coaching Resources', expectedUrl: '/coaching-resources' },
        { text: 'Coaching Basics', expectedUrl: '/coaching-basics' }
      ];

      for (const link of links) {
        await page.goto('http://localhost:5173'); // Reset to home
        
        // Open dropdown
        await page.locator('button:has-text("Coaching"), a:has-text("Coaching")').first().hover();
        await page.waitForTimeout(200); // Wait for dropdown animation
        
        // Click the link
        await page.locator(`text=${link.text}`).first().click();
        
        // Verify navigation
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(link.expectedUrl));
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show coaching section in mobile menu', async () => {
      await page.goto('http://localhost:5173');
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first();
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      
      // Check mobile menu is open
      const mobileMenu = page.locator('#mobile-menu, .mobile-menu, [data-testid="mobile-menu"]').first();
      await expect(mobileMenu).toBeVisible();
      
      // Find coaching section
      const coachingSection = page.locator('button:has-text("Coaching")').first();
      await expect(coachingSection).toBeVisible();
      
      // Expand coaching section
      await coachingSection.click();
      
      // Check all coaching links are visible
      await expect(page.locator('text=About Coaching')).toBeVisible();
      await expect(page.locator('text=Coaching Resources')).toBeVisible();
      await expect(page.locator('text=Coaching Basics')).toBeVisible();
    });

    test('should navigate via mobile coaching links', async () => {
      const links = [
        { text: 'About Coaching', expectedUrl: '/about-coaching' },
        { text: 'Coaching Resources', expectedUrl: '/coaching-resources' },
        { text: 'Coaching Basics', expectedUrl: '/coaching-basics' }
      ];

      for (const link of links) {
        await page.goto('http://localhost:5173');
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Open mobile menu
        await page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first().click();
        
        // Expand coaching section
        await page.locator('button:has-text("Coaching")').first().click();
        
        // Click the link
        await page.locator(`text=${link.text}`).first().click();
        
        // Verify navigation
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(link.expectedUrl));
        
        // Menu should close on navigation
        const mobileMenu = page.locator('#mobile-menu, .mobile-menu');
        await expect(mobileMenu).toHaveCount(0);
      }
    });

    test('should show coaching in bottom navigation on mobile', async () => {
      await page.goto('http://localhost:5173/about-coaching');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check bottom navigation exists
      const bottomNav = page.locator('nav').last(); // Assuming bottom nav is last nav element
      await expect(bottomNav).toBeVisible();
      
      // Check coaching item in bottom nav
      const coachingBottomNavItem = page.locator('text=Coaching').last();
      await expect(coachingBottomNavItem).toBeVisible();
      
      // Verify it's properly styled as active when on coaching page
      const activeItem = page.locator('.text-brand-600, .text-blue-600').locator('text=Coaching').first();
      await expect(activeItem).toBeVisible();
    });
  });

  test.describe('CTA and Business Logic Alignment', () => {
    test('should direct all CTAs to coach discovery (/coaches)', async () => {
      const pages = [
        '/about-coaching',
        '/coaching-resources', 
        '/coaching-basics'
      ];

      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // Find all buttons and links that should go to coach discovery
        const ctaButtons = page.locator('a[href="/coaches"], button[href="/coaches"]');
        const findCoachButtons = page.locator('text=Find Your Coach, text=Find a Coach, text=Find Your Perfect Coach');
        
        // Check that coach discovery CTAs exist
        const coachCtaCount = await ctaButtons.count() + await findCoachButtons.count();
        expect(coachCtaCount).toBeGreaterThan(0);
        
        // Test clicking the primary CTA
        const primaryCta = page.locator('text=Find Your Coach, text=Find a Coach').first();
        if (await primaryCta.count() > 0) {
          await primaryCta.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/\/coaches/);
        }
      }
    });

    test('should not contain old LMS-specific CTAs', async () => {
      const pages = ['/about-coaching', '/coaching-resources', '/coaching-basics'];
      
      // Terms that should NOT appear in the new simplified learning center
      const oldLmsTerms = [
        'Enroll Now',
        'Start Course', 
        'Course Progress',
        'My Learning',
        'Certificate',
        'Complete Module',
        'Course Materials',
        'Download Course'
      ];

      for (const pagePath of pages) {
        await page.goto(`http://localhost:5173${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        for (const term of oldLmsTerms) {
          await expect(page.locator(`text=${term}`)).toHaveCount(0);
        }
      }
    });

    test('should contain appropriate informational content', async () => {
      // About Coaching should focus on what coaching is
      await page.goto('http://localhost:5173/about-coaching');
      await expect(page.locator('text=Professional Coaching')).toBeVisible();
      await expect(page.locator('text=Benefits')).toBeVisible();
      await expect(page.locator('text=Process')).toBeVisible();
      
      // Coaching Resources should focus on free materials
      await page.goto('http://localhost:5173/coaching-resources');
      await expect(page.locator('text=Resources')).toBeVisible();
      await expect(page.locator('text=articles, text=videos, text=tools')).toBeVisible();
      
      // Coaching Basics should be introductory
      await page.goto('http://localhost:5173/coaching-basics');
      await expect(page.locator('text=Introduction')).toBeVisible();
      await expect(page.locator('text=modules, text=minutes')).toBeVisible();
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ browser }) => {
        if (browser.browserType().name() !== browserName) {
          test.skip();
        }
        
        const routes = ['/about-coaching', '/coaching-resources', '/coaching-basics'];
        
        for (const route of routes) {
          await page.goto(`http://localhost:5173${route}`);
          await page.waitForLoadState('networkidle');
          
          // Basic functionality should work
          await expect(page.locator('h1')).toBeVisible();
          await expect(page.locator('main, [role="main"], .min-h-screen')).toBeVisible();
          
          // CTAs should be clickable
          const ctaButtons = page.locator('a[href="/coaches"]');
          if (await ctaButtons.count() > 0) {
            await expect(ctaButtons.first()).toBeVisible();
          }
        }
      });
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages within acceptable time limits', async () => {
      const routes = ['/about-coaching', '/coaching-resources', '/coaching-basics'];
      
      for (const route of routes) {
        const startTime = Date.now();
        
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Should load within 3 seconds (3000ms)
        expect(loadTime).toBeLessThan(3000);
        
        // Content should be visible
        await expect(page.locator('h1')).toBeVisible();
      }
    });

    test('should handle slow network conditions gracefully', async () => {
      // Simulate slow 3G
      await context.route('**/*', route => route.continue());
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
      
      await page.goto('http://localhost:5173/about-coaching');
      
      // Should show loading state or skeleton
      const loadingIndicators = page.locator('.spinner, .loading, .skeleton, [data-testid="loading"]');
      // Loading indicator may or may not be visible depending on timing
      
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure for resources
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('http://localhost:5173/coaching-resources');
      await page.waitForLoadState('networkidle');
      
      // Page should still render even if API calls fail
      await expect(page.locator('h1')).toBeVisible();
      
      // Should not show JavaScript errors in console
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Filter out known acceptable errors
      const criticalErrors = errors.filter(error => 
        !error.includes('Failed to fetch') && 
        !error.includes('Network request failed')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should handle JavaScript errors gracefully', async () => {
      const jsErrors: string[] = [];
      page.on('pageerror', error => jsErrors.push(error.message));
      
      const routes = ['/about-coaching', '/coaching-resources', '/coaching-basics'];
      
      for (const route of routes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');
        
        // Interact with page elements to trigger potential JS errors
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          try {
            await buttons.nth(i).click({ timeout: 1000 });
          } catch (e) {
            // Some buttons might not be clickable, that's ok
          }
        }
      }
      
      // Should not have critical JavaScript errors
      const criticalErrors = jsErrors.filter(error => 
        !error.includes('ResizeObserver') &&
        !error.includes('Non-Error promise rejection')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });
});