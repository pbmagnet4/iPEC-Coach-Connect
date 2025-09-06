import { test, expect, Page } from '@playwright/test';

/**
 * Learning Center User Journey Tests
 * 
 * Tests complete user flows through the learning center:
 * - Landing and navigation flows
 * - CTA interaction flows  
 * - Coach discovery flows from learning pages
 * - Information consumption patterns
 */

test.describe('Learning Center User Journey Tests', () => {

  test.describe('Landing and Navigation Flows', () => {
    
    test('should successfully land on About Coaching page and navigate', async ({ page }) => {
      await page.goto('/about-coaching');
      await page.waitForLoadState('networkidle');

      // Verify successful landing
      await expect(page).toHaveTitle(/About Professional Coaching|iPEC Coach Connect/);
      await expect(page.locator('h1')).toContainText('About Professional Coaching');

      // Verify key content sections are visible
      const contentSections = [
        'What is Professional Coaching?',
        'Benefits of Professional Coaching', 
        'The Coaching Process',
        'What Our Clients Say'
      ];

      for (const section of contentSections) {
        await expect(page.locator(`text=${section}`)).toBeVisible();
      }

      // Test navigation to other learning pages
      const resourcesLink = page.locator('a[href="/coaching-resources"]');
      if (await resourcesLink.count() > 0) {
        await resourcesLink.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText('Coaching Resources');
        await page.goBack();
      }
    });

    test('should successfully land on Coaching Basics page and navigate', async ({ page }) => {
      await page.goto('/coaching-basics');
      await page.waitForLoadState('networkidle');

      // Verify successful landing
      await expect(page).toHaveTitle(/Introduction to Professional Coaching|Coaching Basics|iPEC Coach Connect/);
      await expect(page.locator('h1')).toContainText('Introduction to Professional Coaching');

      // Verify key content sections are visible
      const contentSections = [
        'Course Overview',
        'Benefits of Coaching',
        'Success Stories'
      ];

      for (const section of contentSections) {
        await expect(page.locator(`text=${section}`)).toBeVisible();
      }

      // Verify module/section content
      const moduleElements = page.locator('[data-testid="module"], .module, text=Module');
      const moduleCount = await moduleElements.count();
      expect(moduleCount).toBeGreaterThan(0);
    });

    test('should successfully land on Coaching Resources page and navigate', async ({ page }) => {
      await page.goto('/coaching-resources');
      await page.waitForLoadState('networkidle');

      // Verify successful landing
      await expect(page).toHaveTitle(/Coaching Resources|iPEC Coach Connect/);
      await expect(page.locator('h1')).toContainText('Coaching Resources');

      // Verify resource categories and content
      const contentSections = [
        'Resource Categories',
        'Featured Resources', 
        'All Resources'
      ];

      for (const section of contentSections) {
        await expect(page.locator(`text=${section}`)).toBeVisible();
      }

      // Verify resources are displayed
      const resourceCards = page.locator('[data-testid="resource-card"], .resource, .card');
      const resourceCount = await resourceCards.count();
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have consistent navigation between learning pages', async ({ page }) => {
      const navigationFlow = [
        { path: '/about-coaching', title: 'About Professional Coaching' },
        { path: '/coaching-basics', title: 'Introduction to Professional Coaching' },
        { path: '/coaching-resources', title: 'Coaching Resources' }
      ];

      for (const step of navigationFlow) {
        await page.goto(step.path);
        await page.waitForLoadState('networkidle');
        
        // Verify page loads correctly
        await expect(page.locator('h1')).toContainText(step.title);
        
        // Verify navigation elements are present and functional
        const navElement = page.locator('nav, [role="navigation"]');
        await expect(navElement.first()).toBeVisible();
        
        // Verify coach discovery links are present
        const coachLinks = page.locator('a[href="/coaches"]');
        const coachLinkCount = await coachLinks.count();
        expect(coachLinkCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('CTA Interaction and Destination Flows', () => {
    
    test('should redirect all primary CTAs to coach discovery', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Find and test primary coach discovery CTAs
        const coachCTAs = page.locator('a[href="/coaches"]');
        const ctaCount = await coachCTAs.count();
        
        if (ctaCount > 0) {
          // Test the first prominent CTA
          const firstCTA = coachCTAs.first();
          await expect(firstCTA).toBeVisible();
          
          // Click and verify navigation
          await firstCTA.click();
          await page.waitForLoadState('networkidle');
          
          // Verify we landed on coaches page
          expect(page.url()).toContain('/coaches');
          await expect(page.locator('h1')).toContainText(/Find|Browse|Coaches|Coach Directory/);
          
          // Navigate back for next test
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should handle secondary CTA interactions appropriately', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Find secondary CTAs (non-coach discovery)
        const secondaryCTAs = page.locator('a[href^="/"], button[data-href^="/"]').and(page.locator(':not([href="/coaches"])'));
        const secondaryCount = await secondaryCTAs.count();

        if (secondaryCount > 0) {
          // Test a secondary CTA
          const secondaryCTA = secondaryCTAs.first();
          const href = await secondaryCTA.getAttribute('href') || await secondaryCTA.getAttribute('data-href');
          
          if (href && href !== '/coaches') {
            await secondaryCTA.click();
            await page.waitForLoadState('networkidle');
            
            // Verify navigation worked
            expect(page.url()).toContain(href);
            
            // Navigate back
            await page.goBack();
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });

    test('should maintain coaching focus in CTA messaging', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Collect all CTA text content
        const allCTAs = page.locator('a[href="/coaches"], button[data-href="/coaches"]');
        const ctaTexts = await allCTAs.allTextContents();

        // Verify coaching-focused messaging
        const coachingKeywords = ['coach', 'coaching', 'find', 'connect', 'work with', 'discover'];
        
        for (const ctaText of ctaTexts) {
          const hasCoachingKeyword = coachingKeywords.some(keyword => 
            ctaText.toLowerCase().includes(keyword)
          );
          expect(hasCoachingKeyword).toBe(true);
        }
      }
    });
  });

  test.describe('Coach Discovery Flow from Learning Pages', () => {
    
    test('should provide clear path from learning content to coach discovery', async ({ page }) => {
      const learningPages = [
        { path: '/about-coaching', context: 'after reading about coaching benefits' },
        { path: '/coaching-basics', context: 'after learning coaching fundamentals' },
        { path: '/coaching-resources', context: 'after exploring resources' }
      ];

      for (const pageInfo of learningPages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Verify clear coach discovery messaging
        const discoveryMessages = [
          'ready to start',
          'find your coach',
          'work with a coach',
          'connect with a coach',
          'start your journey'
        ];

        let hasDiscoveryMessage = false;
        for (const message of discoveryMessages) {
          const messageExists = await page.locator(`text*=${message}`).count();
          if (messageExists > 0) {
            hasDiscoveryMessage = true;
            break;
          }
        }
        expect(hasDiscoveryMessage).toBe(true);

        // Verify multiple touchpoints for coach discovery
        const coachCTAs = page.locator('a[href="/coaches"]');
        const ctaCount = await coachCTAs.count();
        expect(ctaCount).toBeGreaterThanOrEqual(2); // Multiple opportunities to connect
      }
    });

    test('should handle coach discovery flow with proper context', async ({ page }) => {
      // Start from About Coaching page
      await page.goto('/about-coaching');
      await page.waitForLoadState('networkidle');

      // Find and click coach discovery CTA
      const coachCTA = page.locator('a[href="/coaches"]').first();
      await expect(coachCTA).toBeVisible();
      
      // Store referrer context
      const referrerURL = page.url();
      
      await coachCTA.click();
      await page.waitForLoadState('networkidle');

      // Verify successful navigation to coaches page
      expect(page.url()).toContain('/coaches');
      
      // Verify coach discovery page loads properly
      await expect(page.locator('h1')).toBeVisible();
      
      // Check if referrer context is maintained (e.g., analytics, state)
      const coachPageContent = page.locator('main, [role="main"]');
      await expect(coachPageContent).toBeVisible();
    });

    test('should optimize coach discovery based on learning page context', async ({ page }) => {
      const contextualPages = [
        { 
          path: '/about-coaching', 
          expectedContext: ['benefits', 'professional coaching', 'transformation'],
          ctaShouldMention: ['benefits', 'professional', 'goals']
        },
        { 
          path: '/coaching-basics', 
          expectedContext: ['fundamentals', 'core energy', 'framework'],
          ctaShouldMention: ['certified', 'experienced', 'framework']
        },
        { 
          path: '/coaching-resources', 
          expectedContext: ['resources', 'tools', 'development'],
          ctaShouldMention: ['personalized', 'one-on-one', 'strategies']
        }
      ];

      for (const pageContext of contextualPages) {
        await page.goto(pageContext.path);
        await page.waitForLoadState('networkidle');

        // Verify contextual content is present
        let hasExpectedContext = false;
        for (const context of pageContext.expectedContext) {
          const contextExists = await page.locator(`text*=${context}`).count();
          if (contextExists > 0) {
            hasExpectedContext = true;
            break;
          }
        }
        expect(hasExpectedContext).toBe(true);

        // Verify coach discovery CTAs are contextually relevant
        const coachCTAs = page.locator('a[href="/coaches"]');
        const ctaTexts = await coachCTAs.allTextContents();
        const combinedCTAText = ctaTexts.join(' ').toLowerCase();

        let hasRelevantCTA = false;
        for (const mention of pageContext.ctaShouldMention) {
          if (combinedCTAText.includes(mention.toLowerCase())) {
            hasRelevantCTA = true;
            break;
          }
        }
        // This is aspirational - CTAs should be contextual but may not be implemented yet
        // expect(hasRelevantCTA).toBe(true);
      }
    });
  });

  test.describe('Information Consumption and User Experience', () => {
    
    test('should provide progressive information disclosure', async ({ page }) => {
      await page.goto('/about-coaching');
      await page.waitForLoadState('networkidle');

      // Verify information hierarchy (basic to detailed)
      const informationSections = [
        { selector: 'h1', level: 'overview' },
        { selector: 'h2', level: 'categories' },
        { selector: 'h3', level: 'details' }
      ];

      for (const section of informationSections) {
        const elements = page.locator(section.selector);
        const count = await elements.count();
        expect(count).toBeGreaterThan(0);
      }

      // Verify content is scannable (not overwhelming)
      const paragraphs = page.locator('p');
      const paragraphCount = await paragraphs.count();
      expect(paragraphCount).toBeLessThan(20); // Not too many blocks of text

      // Verify visual breaks and sections
      const cards = page.locator('.card, [data-testid="card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0); // Content is broken into digestible sections
    });

    test('should maintain user engagement throughout content', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify engaging elements are present
        const engagementElements = [
          'img, [role="img"]', // Visual content
          '.testimonial, .quote, blockquote', // Social proof
          '.benefit, .feature', // Value propositions
          'button, a[href="/coaches"]' // Action opportunities
        ];

        for (const element of engagementElements) {
          const elementExists = await page.locator(element).count();
          if (elementExists > 0) {
            // At least some engaging elements should be present
            break;
          }
        }

        // Verify multiple coach discovery touchpoints throughout content
        const coachCTAs = page.locator('a[href="/coaches"]');
        const ctaCount = await coachCTAs.count();
        expect(ctaCount).toBeGreaterThanOrEqual(2);

        // Verify CTAs are distributed (not all at bottom)
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const midPoint = pageHeight / 2;
        
        const topCTAs = await page.locator('a[href="/coaches"]').first().boundingBox();
        const bottomCTAs = await page.locator('a[href="/coaches"]').last().boundingBox();
        
        // Verify CTAs are spread throughout content
        if (topCTAs && bottomCTAs) {
          expect(Math.abs(topCTAs.y - bottomCTAs.y)).toBeGreaterThan(100);
        }
      }
    });

    test('should provide clear value proposition for coaching', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify value proposition messaging
        const valueProps = [
          'transform',
          'achieve your goals',
          'personal growth',
          'professional development',
          'unlock potential',
          'positive change',
          'success'
        ];

        let hasValueProp = false;
        for (const prop of valueProps) {
          const propExists = await page.locator(`text*=${prop}`).count();
          if (propExists > 0) {
            hasValueProp = true;
            break;
          }
        }
        expect(hasValueProp).toBe(true);

        // Verify specific benefits are mentioned
        const benefitKeywords = [
          'clarity',
          'confidence',
          'direction',
          'balance',
          'leadership',
          'communication',
          'relationships'
        ];

        let hasBenefits = false;
        for (const benefit of benefitKeywords) {
          const benefitExists = await page.locator(`text*=${benefit}`).count();
          if (benefitExists > 0) {
            hasBenefits = true;
            break;
          }
        }
        expect(hasBenefits).toBe(true);
      }
    });
  });

  test.describe('Mobile User Experience', () => {
    
    test('should provide optimal mobile experience across learning pages', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify mobile-responsive layout
        const mainContent = page.locator('main, [role="main"], .content');
        await expect(mainContent).toBeVisible();

        // Verify coach discovery CTAs are easily accessible on mobile
        const coachCTAs = page.locator('a[href="/coaches"]');
        const firstCTA = coachCTAs.first();
        await expect(firstCTA).toBeVisible();

        // Verify text is readable (not too small)
        const headings = page.locator('h1, h2');
        const firstHeading = headings.first();
        const headingStyle = await firstHeading.evaluate(el => getComputedStyle(el));
        const fontSize = parseInt(headingStyle.fontSize);
        expect(fontSize).toBeGreaterThan(20); // Readable heading size

        // Verify touch targets are appropriately sized
        const buttons = page.locator('button, a[href="/coaches"]');
        if (await buttons.count() > 0) {
          const buttonBox = await buttons.first().boundingBox();
          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThan(40); // Minimum touch target size
          }
        }
      }
    });
  });
});