import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5175';

test.describe('Mobile Navigation Screenshots', () => {
  
  test('Capture mobile navigation screenshots', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 12']);
    const page = await context.newPage();
    
    // Home page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results-mobile/home-mobile.png', fullPage: true });
    
    // Look for mobile menu button and click it
    const mobileMenuButton = page.locator('button[aria-label*="menu" i]').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results-mobile/navigation-open-mobile.png', fullPage: true });
    }
    
    // Learning pages
    const learningRoutes = [
      { path: '/about-coaching', title: 'About Coaching' },
      { path: '/coaching-resources', title: 'Coaching Resources' },
      { path: '/coaching-basics', title: 'Coaching Basics' },
    ];
    
    for (const route of learningRoutes) {
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle');
      const filename = route.path.replace('/', '').replace('-', '_');
      await page.screenshot({ path: `test-results-mobile/${filename}_mobile.png`, fullPage: true });
    }
    
    await context.close();
  });
  
});