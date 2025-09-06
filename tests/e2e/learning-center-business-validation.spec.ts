import { expect, Page, test } from '@playwright/test';

/**
 * Learning Center Business Logic Validation Tests
 * 
 * Tests verify the successful cleanup from LMS to informational content:
 * - No course enrollment or payment flows
 * - All CTAs direct to coach discovery
 * - Educational content without complex course management
 * - Clear coach discovery messaging throughout
 */

test.describe('Learning Center Business Logic Validation', () => {
  
  test.describe('Business Objective: Simplified LMS to Informational Content', () => {
    
    test('should not expose any LMS functionality across all learning pages', async ({ page }) => {
      const learningPages = [
        '/about-coaching',
        '/coaching-basics', 
        '/coaching-resources'
      ];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify NO LMS elements are present
        const lmsElements = [
          'text=Enroll',
          'text=Start Course',
          'text=My Courses', 
          'text=Course Progress',
          'text=Complete Module',
          'text=Take Quiz',
          'text=Certificate',
          'text=Enrollment',
          '[data-testid="course-enrollment"]',
          '[data-testid="progress-bar"]',
          '[data-testid="quiz-container"]',
          '[data-testid="certificate-download"]',
          'text=Purchase Course',
          'text=Subscribe',
          'text=Pay Now'
        ];

        for (const element of lmsElements) {
          const elementExists = await page.locator(element).count();
          expect(elementExists).toBe(0);
        }

        // Verify informational content indicators ARE present
        const infoElements = [
          'text=Learn',
          'text=About',
          'text=Introduction',
          'text=Overview',
          'text=Resources',
          'text=Free'
        ];

        let hasInfoContent = false;
        for (const element of infoElements) {
          const elementExists = await page.locator(element).count();
          if (elementExists > 0) {
            hasInfoContent = true;
            break;
          }
        }
        expect(hasInfoContent).toBe(true);
      }
    });

    test('should ensure all learning content is free and accessible', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify no payment requirements
        const paymentElements = [
          'text=Payment Required',
          'text=$',
          'text=Price',
          'text=Subscribe to Access',
          'text=Premium Content',
          '[data-testid="paywall"]',
          '[data-testid="subscription-required"]'
        ];

        for (const element of paymentElements) {
          const elementExists = await page.locator(element).count();
          expect(elementExists).toBe(0);
        }

        // Verify content is accessible
        const mainContent = page.locator('main, [role="main"], .content');
        await expect(mainContent).toBeVisible();
        
        // Check for free content indicators
        const freeIndicators = page.locator('text=Free, text=No Cost Required, [data-testid="free-content"]');
        const freeCount = await freeIndicators.count();
        expect(freeCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Business Objective: Focus Users on Coach Directory/Discovery', () => {
    
    test('should have all primary CTAs directing to /coaches', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Find primary CTA buttons
        const primaryCTAs = page.locator('a[href="/coaches"], button[data-href="/coaches"]');
        const ctaCount = await primaryCTAs.count();
        
        // Each learning page should have at least 2 coach discovery CTAs
        expect(ctaCount).toBeGreaterThanOrEqual(2);

        // Verify CTA text is coach-focused
        const coachCTATexts = [
          'Find Your Coach',
          'Find a Coach', 
          'Connect with a Coach',
          'Browse Coaches',
          'Discover Coaches',
          'Find Your Perfect Coach'
        ];

        let hasCoachCTA = false;
        for (const ctaText of coachCTATexts) {
          const ctaExists = await page.locator(`text=${ctaText}`).count();
          if (ctaExists > 0) {
            hasCoachCTA = true;
            break;
          }
        }
        expect(hasCoachCTA).toBe(true);
      }
    });

    test('should validate coach discovery messaging throughout content', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Check for coach discovery messaging
        const coachMessages = [
          'certified iPEC coach',
          'work with a coach',
          'connect with a coach',
          'find a coach',
          'professional coach',
          'coaching journey'
        ];

        let hasCoachMessaging = false;
        for (const message of coachMessages) {
          const messageExists = await page.locator(`text*=${message}`).count();
          if (messageExists > 0) {
            hasCoachMessaging = true;
            break;
          }
        }
        expect(hasCoachMessaging).toBe(true);
      }
    });
  });

  test.describe('Business Objective: Remove Complex Course Management', () => {
    
    test('should not have any course management interfaces', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify NO course management elements
        const courseManagementElements = [
          '[data-testid="course-dashboard"]',
          '[data-testid="module-navigation"]',
          '[data-testid="lesson-player"]',
          '[data-testid="assignment-submission"]',
          '[data-testid="grade-book"]',
          '[data-testid="completion-tracker"]',
          'text=My Progress',
          'text=Continue Learning',
          'text=Resume Course',
          'text=Mark Complete',
          'text=Submit Assignment',
          'text=View Grades'
        ];

        for (const element of courseManagementElements) {
          const elementExists = await page.locator(element).count();
          expect(elementExists).toBe(0);
        }
      }
    });

    test('should have simplified navigation structure', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify simplified navigation (no complex course hierarchy)
        const complexNavElements = [
          '[data-testid="course-menu"]',
          '[data-testid="module-dropdown"]',
          '[data-testid="lesson-sidebar"]',
          'text=Course Catalog',
          'text=My Courses',
          'text=Course Settings'
        ];

        for (const element of complexNavElements) {
          const elementExists = await page.locator(element).count();
          expect(elementExists).toBe(0);
        }

        // Verify simple, clear navigation exists
        const simpleNavElements = page.locator('nav, [role="navigation"]');
        await expect(simpleNavElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Business Objective: Maintain Educational Value', () => {
    
    test('should provide valuable educational content on each page', async ({ page }) => {
      const pageContentMap = {
        '/about-coaching': {
          expectedHeadings: ['About Professional Coaching', 'What is Professional Coaching?', 'Benefits', 'Process'],
          expectedContent: ['coaching is a collaborative partnership', 'goal achievement', 'personal development']
        },
        '/coaching-basics': {
          expectedHeadings: ['Introduction to Professional Coaching', 'Course Overview', 'Benefits of Coaching'],
          expectedContent: ['Core Energy', 'coaching framework', 'professional development']
        },
        '/coaching-resources': {
          expectedHeadings: ['Coaching Resources', 'Featured Resources', 'All Resources'],
          expectedContent: ['free resources', 'coaching process', 'personal development']
        }
      };

      for (const [pagePath, contentMap] of Object.entries(pageContentMap)) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify expected headings
        for (const heading of contentMap.expectedHeadings) {
          const headingExists = await page.locator(`h1:has-text("${heading}"), h2:has-text("${heading}"), h3:has-text("${heading}")`).count();
          expect(headingExists).toBeGreaterThan(0);
        }

        // Verify educational content
        for (const content of contentMap.expectedContent) {
          const contentExists = await page.locator(`text*=${content}`).count();
          expect(contentExists).toBeGreaterThan(0);
        }

        // Verify substantial content (not just headings)
        const paragraphs = page.locator('p');
        const paragraphCount = await paragraphs.count();
        expect(paragraphCount).toBeGreaterThan(3);
      }
    });

    test('should focus content on coaching value rather than course completion', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify coaching value messaging
        const valueMessages = [
          'benefits of coaching',
          'coaching can help',
          'professional development',
          'personal growth',
          'achieve your goals',
          'transform your life'
        ];

        let hasValueMessaging = false;
        for (const message of valueMessages) {
          const messageExists = await page.locator(`text*=${message}`).count();
          if (messageExists > 0) {
            hasValueMessaging = true;
            break;
          }
        }
        expect(hasValueMessaging).toBe(true);

        // Verify NO course completion focus
        const completionMessages = [
          'complete the course',
          'finish all modules',
          'pass the exam',
          'earn your certificate',
          'graduation requirements'
        ];

        for (const message of completionMessages) {
          const messageExists = await page.locator(`text*=${message}`).count();
          expect(messageExists).toBe(0);
        }
      }
    });
  });

  test.describe('Cross-Page Consistency Validation', () => {
    
    test('should maintain consistent coach discovery messaging across all pages', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];
      const coachingMessages: string[] = [];

      // Collect coaching messages from all pages
      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const ctaTexts = await page.locator('a[href="/coaches"]').allTextContents();
        coachingMessages.push(...ctaTexts);
      }

      // Verify consistent messaging
      expect(coachingMessages.length).toBeGreaterThan(0);
      
      // Common patterns should appear across pages
      const commonPatterns = ['coach', 'find', 'connect', 'work with'];
      for (const pattern of commonPatterns) {
        const hasPattern = coachingMessages.some(msg => 
          msg.toLowerCase().includes(pattern)
        );
        expect(hasPattern).toBe(true);
      }
    });

    test('should have consistent UI patterns and design across learning pages', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify consistent layout elements
        const layoutElements = [
          'h1', // Page title
          '[data-testid="container"], .container', // Container wrapper
          'button, a[href="/coaches"]' // Coach discovery CTAs
        ];

        for (const element of layoutElements) {
          const elementExists = await page.locator(element).count();
          expect(elementExists).toBeGreaterThan(0);
        }

        // Verify responsive design
        await page.setViewportSize({ width: 375, height: 667 }); // Mobile
        const mobileContent = page.locator('main, [role="main"]');
        await expect(mobileContent).toBeVisible();

        await page.setViewportSize({ width: 1024, height: 768 }); // Desktop
        const desktopContent = page.locator('main, [role="main"]');
        await expect(desktopContent).toBeVisible();
      }
    });
  });
});