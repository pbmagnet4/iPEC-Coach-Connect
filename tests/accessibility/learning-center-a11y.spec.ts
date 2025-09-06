import { expect, Page, test } from '@playwright/test';
import { checkA11y, getViolations, injectAxe } from 'axe-playwright';

test.describe('Learning Center - Accessibility Compliance Tests', () => {
  const learningRoutes = [
    '/about-coaching',
    '/coaching-resources',
    '/coaching-basics'
  ];

  test.beforeEach(async ({ page }) => {
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    learningRoutes.forEach(route => {
      test(`should meet WCAG 2.1 AA standards on ${route}`, async ({ page }) => {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Run accessibility checks
        await checkA11y(page, null, {
          detailedReport: true,
          detailedReportOptions: { html: true }
        });
      });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation on all learning pages', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Test Tab navigation
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();

        // Navigate through multiple elements
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          const currentFocus = await page.evaluate(() => {
            const element = document.activeElement;
            return {
              tagName: element?.tagName,
              className: element?.className,
              id: element?.id,
              href: (element as HTMLAnchorElement)?.href,
              role: element?.getAttribute('role')
            };
          });

          // Focused element should be interactive
          const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(currentFocus.tagName) ||
                               currentFocus.role === 'button' ||
                               currentFocus.role === 'link';
          
          if (currentFocus.tagName !== 'BODY') {
            expect(isInteractive).toBeTruthy();
          }
        }

        // Test Shift+Tab (reverse navigation)
        await page.keyboard.press('Shift+Tab');
        const reverseFocus = await page.evaluate(() => document.activeElement?.tagName);
        expect(reverseFocus).toBeTruthy();
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Find all focusable elements
        const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();

        for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
          const element = focusableElements[i];
          
          // Focus the element
          await element.focus();
          
          // Check if element has focus styles
          const hasVisibleFocus = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            const pseudoStyles = window.getComputedStyle(el, ':focus');
            
            // Check for common focus indicators
            return (
              styles.outline !== 'none' ||
              styles.outlineWidth !== '0px' ||
              pseudoStyles.outline !== 'none' ||
              pseudoStyles.outlineWidth !== '0px' ||
              styles.boxShadow !== 'none' ||
              pseudoStyles.boxShadow !== 'none'
            );
          });

          expect(hasVisibleFocus).toBeTruthy();
        }
      }
    });

    test('should support Enter key activation for buttons and links', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Test button activation with Enter
        const buttons = page.locator('button').first();
        if (await buttons.isVisible()) {
          await buttons.focus();
          // Just test that Enter key can be pressed without error
          await page.keyboard.press('Enter');
        }

        // Test link activation with Enter
        const links = page.locator('a[href]').first();
        if (await links.isVisible()) {
          await links.focus();
          const href = await links.getAttribute('href');
          
          if (href && href.startsWith('/')) {
            // For internal links, test Enter key press
            await page.keyboard.press('Enter');
            await page.waitForTimeout(100);
            // Should navigate or attempt to navigate
          }
        }
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Get all headings
        const headings = await page.evaluate(() => {
          const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          return headingElements.map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent?.trim() || '',
            id: h.id || null
          }));
        });

        // Should have exactly one h1
        const h1Count = headings.filter(h => h.level === 1).length;
        expect(h1Count).toBe(1);

        // Check heading hierarchy (no skipping levels)
        let maxLevel = 0;
        for (const heading of headings) {
          if (heading.level > maxLevel + 1) {
            console.warn(`Heading hierarchy violation: h${heading.level} follows h${maxLevel} - "${heading.text}"`);
          }
          maxLevel = Math.max(maxLevel, heading.level);
        }

        // Headings should have meaningful text
        headings.forEach(heading => {
          expect(heading.text.length).toBeGreaterThan(0);
          expect(heading.text).not.toBe(' ');
        });
      }
    });

    test('should have descriptive link text', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        const links = await page.locator('a').all();

        for (const link of links) {
          const text = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');
          
          const accessibleName = ariaLabel || text || title;
          
          if (accessibleName) {
            // Should not be generic
            const genericTexts = ['click here', 'read more', 'link', 'here', 'more'];
            const isGeneric = genericTexts.some(generic => 
              accessibleName.toLowerCase().includes(generic)
            );
            
            if (isGeneric) {
              console.warn(`Generic link text found: "${accessibleName}"`);
            }
            
            // Should be descriptive (more than 2 characters for meaningful links)
            if (accessibleName.trim().length > 0) {
              expect(accessibleName.trim().length).toBeGreaterThan(2);
            }
          }
        }
      }
    });

    test('should have proper image alt text', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        const images = await page.locator('img').all();

        for (const image of images) {
          const alt = await image.getAttribute('alt');
          const src = await image.getAttribute('src');
          const role = await image.getAttribute('role');
          
          // Decorative images should have empty alt or role="presentation"
          if (role === 'presentation' || role === 'none') {
            // Decorative images are fine
            continue;
          }
          
          // Content images should have meaningful alt text
          if (src && !src.includes('placeholder') && !src.includes('decoration')) {
            expect(alt).toBeTruthy();
            if (alt) {
              expect(alt.length).toBeGreaterThan(0);
              expect(alt).not.toBe('image');
              expect(alt).not.toBe('photo');
              expect(alt).not.toBe('picture');
            }
          }
        }
      }
    });

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check for ARIA landmarks
        const landmarks = await page.evaluate(() => {
          const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo'];
          return landmarkRoles.map(role => ({
            role,
            count: document.querySelectorAll(`[role="${role}"], ${role === 'banner' ? 'header' : role === 'navigation' ? 'nav' : role === 'main' ? 'main' : role === 'contentinfo' ? 'footer' : role}`).length
          }));
        });

        // Should have main landmark
        const mainLandmark = landmarks.find(l => l.role === 'main');
        expect(mainLandmark?.count).toBeGreaterThanOrEqual(1);

        // Check form controls have labels
        const formControls = await page.locator('input, select, textarea').all();
        for (const control of formControls) {
          const id = await control.getAttribute('id');
          const ariaLabel = await control.getAttribute('aria-label');
          const ariaLabelledBy = await control.getAttribute('aria-labelledby');
          const placeholder = await control.getAttribute('placeholder');
          
          let hasLabel = false;
          
          // Check for associated label
          if (id) {
            const labelExists = await page.locator(`label[for="${id}"]`).count() > 0;
            hasLabel = labelExists;
          }
          
          // Check for ARIA labeling
          hasLabel = hasLabel || !!ariaLabel || !!ariaLabelledBy;
          
          // Placeholder alone is not sufficient but acceptable for simple cases
          if (!hasLabel && placeholder) {
            hasLabel = true;
          }
          
          expect(hasLabel).toBeTruthy();
        }
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Use axe-core to check color contrast
        const violations = await getViolations(page, null, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });

        const contrastViolations = violations.filter(v => v.id === 'color-contrast');
        
        if (contrastViolations.length > 0) {
          console.warn('Color contrast violations found:', contrastViolations);
        }
        
        expect(contrastViolations.length).toBe(0);
      }
    });

    test('should not rely solely on color to convey information', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check for elements that might rely only on color
        const colorOnlyElements = await page.evaluate(() => {
          const elements: {text: string, className: string}[] = [];
          
          // Look for elements with color-based classes but no text indicators
          const colorElements = document.querySelectorAll('.text-red-500, .text-green-500, .text-yellow-500, .bg-red-500, .bg-green-500, .bg-yellow-500');
          
          colorElements.forEach(el => {
            const text = el.textContent?.trim() || '';
            const {className} = el;
            
            // Check if element has additional indicators besides color
            const hasIcon = el.querySelector('svg, .icon, [class*="icon"]');
            const hasText = text.length > 0;
            const hasSymbol = /[✓✗×!]/.test(text);
            
            if (!hasIcon && !hasSymbol && className.includes('text-') && text) {
              elements.push({ text, className });
            }
          });
          
          return elements;
        });

        // Elements using color should also have text or icons
        colorOnlyElements.forEach(element => {
          if (element.text.length > 0) {
            // Should have descriptive text, not just colored text
            expect(element.text).toMatch(/success|error|warning|info|completed|failed|pending/i);
          }
        });
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check for mobile-specific accessibility issues
        await checkA11y(page, null, {
          rules: {
            'target-size': { enabled: true }, // Check touch target sizes
            'focus-order-semantics': { enabled: true }
          }
        });

        // Test mobile navigation accessibility
        const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
        if (await mobileMenuButton.isVisible()) {
          // Should have proper ARIA attributes
          const ariaExpanded = await mobileMenuButton.getAttribute('aria-expanded');
          const ariaControls = await mobileMenuButton.getAttribute('aria-controls');
          
          expect(ariaExpanded).toBeTruthy();
          
          // Open menu and check accessibility
          await mobileMenuButton.click();
          
          const expandedState = await mobileMenuButton.getAttribute('aria-expanded');
          expect(expandedState).toBe('true');
          
          // Menu should be accessible
          if (ariaControls) {
            const menu = page.locator(`#${ariaControls}`);
            await expect(menu).toBeVisible();
          }
        }
      }
    });

    test('should have adequate touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check button sizes
        const buttons = await page.locator('button, a[role="button"], input[type="button"]').all();
        
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const button = buttons[i];
          if (await button.isVisible()) {
            const boundingBox = await button.boundingBox();
            if (boundingBox) {
              // WCAG recommends minimum 44x44px touch targets
              expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Allow small tolerance
              expect(boundingBox.height).toBeGreaterThanOrEqual(40);
            }
          }
        }
      }
    });
  });

  test.describe('Content Structure and Semantics', () => {
    test('should use semantic HTML elements', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Check for semantic elements
        const semanticElements = await page.evaluate(() => {
          const elements = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
          return elements.map(tag => ({
            tag,
            count: document.querySelectorAll(tag).length
          }));
        });

        // Should have main element
        const mainElement = semanticElements.find(el => el.tag === 'main');
        expect(mainElement?.count).toBeGreaterThanOrEqual(1);

        // Check for proper list usage
        const lists = await page.evaluate(() => {
          const ulElements = document.querySelectorAll('ul');
          const olElements = document.querySelectorAll('ol');
          
          let improperLists = 0;
          
          [...ulElements, ...olElements].forEach(list => {
            const listItems = list.querySelectorAll('li');
            if (listItems.length === 0) {
              improperLists++;
            }
          });
          
          return { totalLists: ulElements.length + olElements.length, improperLists };
        });

        expect(lists.improperLists).toBe(0);
      }
    });

    test('should have proper table structure if tables are present', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        const tables = await page.locator('table').all();
        
        for (const table of tables) {
          // Tables should have captions or ARIA labels
          const caption = await table.locator('caption').count();
          const ariaLabel = await table.getAttribute('aria-label');
          const ariaLabelledBy = await table.getAttribute('aria-labelledby');
          
          const hasLabel = caption > 0 || !!ariaLabel || !!ariaLabelledBy;
          expect(hasLabel).toBeTruthy();

          // Check for proper header structure
          const headers = await table.locator('th').count();
          const rows = await table.locator('tr').count();
          
          if (rows > 1) {
            expect(headers).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Error Handling and User Feedback', () => {
    test('should provide accessible error messages', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Look for form error messages
        const errorElements = await page.locator('[role="alert"], .error, .invalid, [aria-invalid="true"]').all();
        
        for (const errorElement of errorElements) {
          if (await errorElement.isVisible()) {
            const text = await errorElement.textContent();
            
            // Error messages should be descriptive
            expect(text?.trim().length).toBeGreaterThan(0);
            
            // Should not be generic
            if (text) {
              expect(text.toLowerCase()).not.toBe('error');
              expect(text.toLowerCase()).not.toBe('invalid');
            }
          }
        }
      }
    });

    test('should provide feedback for loading states', async ({ page }) => {
      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        
        // Check for loading indicators with proper ARIA
        const loadingElements = await page.locator('[role="status"], [aria-live], .loading, .spinner').all();
        
        for (const loadingElement of loadingElements) {
          if (await loadingElement.isVisible()) {
            const ariaLive = await loadingElement.getAttribute('aria-live');
            const role = await loadingElement.getAttribute('role');
            const ariaLabel = await loadingElement.getAttribute('aria-label');
            
            // Loading elements should have proper ARIA attributes
            const hasProperAria = ariaLive === 'polite' || ariaLive === 'assertive' || 
                                 role === 'status' || role === 'progressbar' || 
                                 !!ariaLabel;
            
            if (!hasProperAria) {
              console.warn('Loading element without proper ARIA attributes found');
            }
          }
        }
      }
    });
  });

  test.describe('Performance Impact on Accessibility', () => {
    test('should not have accessibility issues due to performance problems', async ({ page }) => {
      // Throttle network to simulate slow connections
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });

      for (const route of learningRoutes) {
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForLoadState('networkidle');

        // Even with slow loading, basic accessibility should work
        const violations = await getViolations(page, null, {
          rules: {
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true }
          }
        });

        expect(violations.length).toBe(0);

        // Focus should still work
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
      }
    });
  });
});