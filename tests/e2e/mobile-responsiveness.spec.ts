import { expect, Page, test } from '@playwright/test';
import { devices } from '@playwright/test';

test.describe('Learning Center - Mobile Responsiveness Tests', () => {
  const learningRoutes = [
    '/about-coaching',
    '/coaching-resources', 
    '/coaching-basics'
  ];

  const mobileDevices = [
    { name: 'iPhone SE', ...devices['iPhone SE'] },
    { name: 'iPhone 12 Pro', ...devices['iPhone 12 Pro'] },
    { name: 'iPhone 13 Pro Max', ...devices['iPhone 13 Pro Max'] },
    { name: 'Galaxy S8', ...devices['Galaxy S8'] },
    { name: 'Pixel 5', ...devices['Pixel 5'] }
  ];

  const tabletDevices = [
    { name: 'iPad', ...devices['iPad'] },
    { name: 'iPad Pro', ...devices['iPad Pro'] },
    { name: 'Galaxy Tab S4', ...devices['Galaxy Tab S4'] }
  ];

  test.describe('Mobile Device Compatibility', () => {
    mobileDevices.forEach(device => {
      test(`should display correctly on ${device.name}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
        });
        const page = await context.newPage();

        for (const route of learningRoutes) {
          await page.goto(`http://localhost:5173${route}`);
          await page.waitForLoadState('networkidle');

          // Check basic layout elements are visible
          await expect(page.locator('h1')).toBeVisible();
          
          // Check that content doesn't overflow horizontally
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = device.viewport.width;
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance

          // Check navigation elements
          const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
          await expect(mobileMenuButton).toBeVisible();

          // Verify main content is readable
          const mainContent = page.locator('main, [role="main"], .min-h-screen').first();
          await expect(mainContent).toBeVisible();
        }

        await context.close();
      });
    });
  });

  test.describe('Tablet Device Compatibility', () => {
    tabletDevices.forEach(device => {
      test(`should display correctly on ${device.name}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
        });
        const page = await context.newPage();

        for (const route of learningRoutes) {
          await page.goto(`http://localhost:5173${route}`);
          await page.waitForLoadState('networkidle');

          // Check layout elements
          await expect(page.locator('h1')).toBeVisible();
          
          // On tablet, navigation might be desktop or mobile style
          const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
          const desktopNav = page.locator('nav .hidden.md\\:flex');
          
          // Either mobile or desktop nav should be visible
          const hasMobileNav = await mobileMenuButton.isVisible();
          const hasDesktopNav = await desktopNav.isVisible();
          expect(hasMobileNav || hasDesktopNav).toBeTruthy();

          // Content should be well-formatted
          const gridElements = page.locator('.grid');
          const gridCount = await gridElements.count();
          expect(gridCount).toBeGreaterThan(0);
        }

        await context.close();
      });
    });
  });

  test.describe('Mobile Navigation Functionality', () => {
    test('should open and close mobile menu correctly', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      await page.goto('http://localhost:5173/about-coaching');
      await page.waitForLoadState('networkidle');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Toggle menu"]');
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Check menu is open
      const mobileMenu = page.locator('#mobile-menu, .mobile-menu, [data-testid="mobile-menu"]').first();
      await expect(mobileMenu).toBeVisible();

      // Check coaching section is present
      const coachingButton = page.locator('button:has-text("Coaching")').first();
      await expect(coachingButton).toBeVisible();

      // Expand coaching section
      await coachingButton.click();
      await page.waitForTimeout(300); // Wait for animation

      // Check coaching links are visible
      await expect(page.locator('text=About Coaching')).toBeVisible();
      await expect(page.locator('text=Coaching Resources')).toBeVisible();
      await expect(page.locator('text=Coaching Basics')).toBeVisible();

      // Close menu by clicking close button
      const closeButton = page.locator('button[aria-label="Close menu"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Fallback: click outside menu
        await page.locator('body').click({ position: { x: 10, y: 10 } });
      }

      // Menu should be closed
      await expect(mobileMenu).not.toBeVisible();

      await context.close();
    });

    test('should navigate via mobile coaching links', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      const mobileLinks = [
        { text: 'About Coaching', url: '/about-coaching' },
        { text: 'Coaching Resources', url: '/coaching-resources' },
        { text: 'Coaching Basics', url: '/coaching-basics' }
      ];

      for (const link of mobileLinks) {
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');

        // Open mobile menu
        await page.locator('button[aria-label="Toggle menu"]').click();
        
        // Expand coaching section
        await page.locator('button:has-text("Coaching")').first().click();
        await page.waitForTimeout(200);

        // Click the link
        await page.locator(`text=${link.text}`).first().click();
        await page.waitForLoadState('networkidle');

        // Verify navigation
        await expect(page).toHaveURL(new RegExp(link.url));
        
        // Menu should close automatically
        const mobileMenu = page.locator('#mobile-menu, .mobile-menu');
        await expect(mobileMenu).not.toBeVisible();
      }

      await context.close();
    });
  });

  test.describe('Bottom Navigation on Mobile', () => {
    test('should show bottom navigation with coaching item', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      await page.goto('http://localhost:5173/about-coaching');
      await page.waitForLoadState('networkidle');

      // Check bottom navigation exists
      const bottomNav = page.locator('nav').last();
      await expect(bottomNav).toBeVisible();

      // Check coaching item in bottom nav
      const coachingBottomNavItem = page.locator('text=Coaching').last();
      await expect(coachingBottomNavItem).toBeVisible();

      // Should be marked as active when on coaching page
      const activeCoachingItem = page.locator('.text-brand-600, .text-blue-600').locator('text=Coaching').first();
      await expect(activeCoachingItem).toBeVisible();

      await context.close();
    });

    test('should handle bottom navigation item clicks', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Click coaching item in bottom nav
      const coachingBottomNavItem = page.locator('nav').last().locator('text=Coaching').first();
      if (await coachingBottomNavItem.isVisible()) {
        await coachingBottomNavItem.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to about-coaching (default coaching page)
        await expect(page).toHaveURL(/\/(about-coaching|coaching)/);
      }

      await context.close();
    });
  });

  test.describe('Touch Target Accessibility', () => {
    test('should have adequate touch targets on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check main CTAs have adequate touch targets
        const buttons = page.locator('button, a[role="button"]');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const boundingBox = await button.boundingBox();
            if (boundingBox) {
              // Touch targets should be at least 44x44px (iOS guidelines)
              expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Allow small tolerance
              expect(boundingBox.height).toBeGreaterThanOrEqual(40);
            }
          }
        }

        // Check navigation elements
        const menuButton = page.locator('button[aria-label="Toggle menu"]');
        if (await menuButton.isVisible()) {
          const menuButtonBox = await menuButton.boundingBox();
          if (menuButtonBox) {
            expect(menuButtonBox.width).toBeGreaterThanOrEqual(44);
            expect(menuButtonBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }

      await context.close();
    });
  });

  test.describe('Content Readability on Mobile', () => {
    test('should have readable text on mobile devices', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE'], // Smallest screen
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check main heading is visible and readable
        const mainHeading = page.locator('h1');
        await expect(mainHeading).toBeVisible();
        
        const headingBox = await mainHeading.boundingBox();
        expect(headingBox?.width).toBeGreaterThan(0);

        // Check paragraph text doesn't overflow
        const paragraphs = page.locator('p');
        const paragraphCount = await paragraphs.count();
        
        for (let i = 0; i < Math.min(paragraphCount, 5); i++) {
          const paragraph = paragraphs.nth(i);
          if (await paragraph.isVisible()) {
            const paragraphBox = await paragraph.boundingBox();
            if (paragraphBox) {
              expect(paragraphBox.width).toBeLessThanOrEqual(devices['iPhone SE'].viewport.width);
            }
          }
        }

        // Check cards/content blocks are responsive
        const cards = page.locator('.card, [class*="card"], .bg-white');
        const cardCount = await cards.count();
        
        if (cardCount > 0) {
          const firstCard = cards.first();
          const cardBox = await firstCard.boundingBox();
          if (cardBox) {
            expect(cardBox.width).toBeLessThanOrEqual(devices['iPhone SE'].viewport.width);
          }
        }
      }

      await context.close();
    });
  });

  test.describe('Image and Media Responsiveness', () => {
    test('should display images responsively on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check images are responsive
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const image = images.nth(i);
          if (await image.isVisible()) {
            const imageBox = await image.boundingBox();
            if (imageBox) {
              // Images should not exceed viewport width
              expect(imageBox.width).toBeLessThanOrEqual(devices['iPhone 12 Pro'].viewport.width);
              expect(imageBox.height).toBeGreaterThan(0);
            }
          }
        }
      }

      await context.close();
    });
  });

  test.describe('Scroll Behavior', () => {
    test('should handle vertical scrolling correctly on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check initial scroll position
        const initialScrollY = await page.evaluate(() => window.scrollY);
        expect(initialScrollY).toBe(0);

        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(200);

        const scrolledY = await page.evaluate(() => window.scrollY);
        expect(scrolledY).toBeGreaterThan(0);

        // Check that navigation remains accessible during scroll
        const menuButton = page.locator('button[aria-label="Toggle menu"]');
        await expect(menuButton).toBeVisible();

        // Bottom navigation should still be visible (if present)
        const bottomNav = page.locator('nav').last();
        if (await bottomNav.isVisible()) {
          const bottomNavBox = await bottomNav.boundingBox();
          expect(bottomNavBox?.y).toBeGreaterThan(0);
        }
      }

      await context.close();
    });

    test('should prevent horizontal scrolling', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone SE'], // Smallest viewport
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check body width doesn't exceed viewport
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = devices['iPhone SE'].viewport.width;
        
        expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 20); // Small tolerance

        // Check no horizontal scrollbar
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBeFalsy();
      }

      await context.close();
    });
  });

  test.describe('Form and Interactive Elements', () => {
    test('should handle form inputs correctly on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check for any input elements (search, newsletter, etc.)
        const inputs = page.locator('input');
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          if (await input.isVisible()) {
            const inputBox = await input.boundingBox();
            if (inputBox) {
              // Input should be adequately sized for touch
              expect(inputBox.height).toBeGreaterThanOrEqual(44);
              expect(inputBox.width).toBeGreaterThan(100);
            }
          }
        }

        // Test button interactions
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();

        if (buttonCount > 0) {
          const firstButton = buttons.first();
          if (await firstButton.isVisible()) {
            // Should be able to tap button
            await firstButton.tap();
            // No need to check result, just ensure it doesn't crash
          }
        }
      }

      await context.close();
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should load quickly on mobile networks', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12 Pro'],
      });
      const page = await context.newPage();

      // Simulate slow 3G
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 50); // Add 50ms delay
      });

      for (const route of learningRoutes) {
        const startTime = Date.now();
        
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Should load within reasonable time even on slow connection
        expect(loadTime).toBeLessThan(5000); // 5 seconds max
        
        // Main content should be visible
        await expect(page.locator('h1')).toBeVisible();
      }

      await context.close();
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle landscape orientation correctly', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 812, height: 375 }, // iPhone landscape
        userAgent: devices['iPhone 12 Pro'].userAgent,
      });
      const page = await context.newPage();

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check layout adapts to landscape
        await expect(page.locator('h1')).toBeVisible();
        
        // Navigation should still be accessible
        const menuButton = page.locator('button[aria-label="Toggle menu"]');
        await expect(menuButton).toBeVisible();

        // Content should not overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(812 + 20);
      }

      await context.close();
    });
  });
});