import { expect, Page, test } from '@playwright/test';

/**
 * Learning Center Content Analysis Tests
 * 
 * Tests content quality and alignment with business objectives:
 * - Content focuses on coaching value vs course completion
 * - Educational value without complex course management
 * - Coach discovery messaging integration
 * - Content accessibility and readability
 */

test.describe('Learning Center Content Analysis', () => {

  test.describe('Content Focus: Coaching Value vs Course Completion', () => {
    
    test('should emphasize coaching benefits over course metrics', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Count coaching benefit mentions
        const coachingBenefits = [
          'transform', 'achieve goals', 'personal growth', 'professional development',
          'unlock potential', 'clarity', 'confidence', 'direction', 'balance',
          'leadership', 'communication', 'relationships', 'self-awareness'
        ];

        let benefitCount = 0;
        for (const benefit of coachingBenefits) {
          const count = await page.locator(`text*=${benefit}`).count();
          benefitCount += count;
        }

        // Count course completion mentions (should be minimal/zero)
        const courseCompletionTerms = [
          'complete course', 'finish modules', 'graduation', 'certificate',
          'pass exam', 'course progress', 'final grade', 'completion rate'
        ];

        let completionCount = 0;
        for (const term of courseCompletionTerms) {
          const count = await page.locator(`text*=${term}`).count();
          completionCount += count;
        }

        // Coaching benefits should significantly outweigh course completion focus
        expect(benefitCount).toBeGreaterThan(completionCount * 3);
        expect(benefitCount).toBeGreaterThan(5); // Substantial coaching benefit messaging
      }
    });

    test('should use outcome-focused rather than process-focused language', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Count outcome-focused language
        const outcomeTerms = [
          'results', 'success', 'achievement', 'transformation', 'breakthrough',
          'improvement', 'growth', 'change', 'progress', 'advancement'
        ];

        let outcomeCount = 0;
        for (const term of outcomeTerms) {
          const count = await page.locator(`text*=${term}`).count();
          outcomeCount += count;
        }

        // Count process-focused language (course mechanics)
        const processTerms = [
          'lesson', 'assignment', 'quiz', 'test', 'exam', 'homework',
          'submission', 'grading', 'attendance', 'participation'
        ];

        let processCount = 0;
        for (const term of processTerms) {
          const count = await page.locator(`text*=${term}`).count();
          processCount += count;
        }

        // Outcome language should dominate over process language
        expect(outcomeCount).toBeGreaterThan(processCount);
        expect(outcomeCount).toBeGreaterThan(3); // Meaningful outcome messaging
      }
    });
  });

  test.describe('Educational Value Assessment', () => {
    
    test('should provide substantial educational content per page', async ({ page }) => {
      const contentRequirements = {
        '/about-coaching': {
          minParagraphs: 8,
          requiredTopics: ['what is coaching', 'benefits', 'process', 'testimonials'],
          minWordCount: 500
        },
        '/coaching-basics': {
          minParagraphs: 10,
          requiredTopics: ['introduction', 'core energy', 'framework', 'modules'],
          minWordCount: 600
        },
        '/coaching-resources': {
          minParagraphs: 6,
          requiredTopics: ['resources', 'categories', 'tools', 'materials'],
          minWordCount: 400
        }
      };

      for (const [pagePath, requirements] of Object.entries(contentRequirements)) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify paragraph count (content depth)
        const paragraphs = page.locator('p');
        const paragraphCount = await paragraphs.count();
        expect(paragraphCount).toBeGreaterThanOrEqual(requirements.minParagraphs);

        // Verify required topics are covered
        for (const topic of requirements.requiredTopics) {
          const topicExists = await page.locator(`text*=${topic}`).count();
          expect(topicExists).toBeGreaterThan(0);
        }

        // Verify content word count (content substantiveness)
        const textContent = await page.locator('main, [role="main"]').textContent() || '';
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        expect(wordCount).toBeGreaterThanOrEqual(requirements.minWordCount);
      }
    });

    test('should provide actionable insights and takeaways', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Look for actionable language
        const actionableTerms = [
          'how to', 'you can', 'steps to', 'ways to', 'techniques',
          'strategies', 'approach', 'method', 'framework', 'process'
        ];

        let actionableCount = 0;
        for (const term of actionableTerms) {
          const count = await page.locator(`text*=${term}`).count();
          actionableCount += count;
        }

        expect(actionableCount).toBeGreaterThan(2); // Meaningful actionable content

        // Look for specific examples or case studies
        const exampleIndicators = [
          'example', 'for instance', 'such as', 'case study', 'story',
          'testimonial', 'experience', 'client', 'success'
        ];

        let exampleCount = 0;
        for (const indicator of exampleIndicators) {
          const count = await page.locator(`text*=${indicator}`).count();
          exampleCount += count;
        }

        expect(exampleCount).toBeGreaterThan(1); // Examples and stories present
      }
    });
  });

  test.describe('Coach Discovery Integration Analysis', () => {
    
    test('should seamlessly integrate coach discovery messaging', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify coach discovery integration points
        const integrationMethods = [
          { type: 'contextual', patterns: ['certified iPEC coach', 'work with a coach', 'professional coach'] },
          { type: 'transitional', patterns: ['ready to', 'next step', 'start your journey'] },
          { type: 'benefit-linked', patterns: ['find a coach who', 'coach can help you', 'with the right coach'] }
        ];

        let totalIntegrations = 0;
        for (const method of integrationMethods) {
          let methodCount = 0;
          for (const pattern of method.patterns) {
            const count = await page.locator(`text*=${pattern}`).count();
            methodCount += count;
          }
          
          if (methodCount > 0) {
            totalIntegrations++;
          }
        }

        // Should have multiple types of coach discovery integration
        expect(totalIntegrations).toBeGreaterThanOrEqual(2);
      }
    });

    test('should maintain coaching context throughout content flow', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify consistent coaching vocabulary throughout
        const coachingVocabulary = [
          'coach', 'coaching', 'client', 'session', 'goals', 'development',
          'growth', 'transformation', 'awareness', 'clarity'
        ];

        let vocabularyDistribution = 0;
        for (const term of coachingVocabulary) {
          const count = await page.locator(`text*=${term}`).count();
          if (count >= 2) { // Term appears multiple times
            vocabularyDistribution++;
          }
        }

        // Should have consistent coaching vocabulary throughout
        expect(vocabularyDistribution).toBeGreaterThanOrEqual(5);

        // Verify coaching context in different content sections
        const sections = await page.locator('section, [role="region"], .section').count();
        if (sections > 0) {
          // At least half of major sections should mention coaching
          const sectionsWithCoaching = await page.locator('section:has-text("coach"), [role="region"]:has-text("coach"), .section:has-text("coach")').count();
          expect(sectionsWithCoaching).toBeGreaterThan(sections / 2);
        }
      }
    });
  });

  test.describe('Content Accessibility and Readability', () => {
    
    test('should maintain readable content structure', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify heading hierarchy
        const h1Count = await page.locator('h1').count();
        const h2Count = await page.locator('h2').count();
        const h3Count = await page.locator('h3').count();

        expect(h1Count).toBe(1); // Single main heading
        expect(h2Count).toBeGreaterThan(0); // Section headings
        expect(h3Count).toBeGreaterThanOrEqual(0); // Subsection headings

        // Verify reasonable paragraph lengths
        const paragraphs = page.locator('p');
        const paragraphCount = await paragraphs.count();
        
        for (let i = 0; i < Math.min(5, paragraphCount); i++) {
          const paragraph = paragraphs.nth(i);
          const text = await paragraph.textContent() || '';
          const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
          
          // Paragraphs should be readable length (not too long or short)
          expect(wordCount).toBeGreaterThan(5);
          expect(wordCount).toBeLessThan(100);
        }

        // Verify use of lists for better readability
        const lists = page.locator('ul, ol');
        const listCount = await lists.count();
        expect(listCount).toBeGreaterThan(0); // Uses lists for better structure
      }
    });

    test('should provide scannable content layout', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify visual breaks and spacing
        const cards = page.locator('.card, [data-testid="card"], section');
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(1); // Content broken into sections

        // Verify use of visual elements
        const visualElements = [
          'img', 'svg', '.icon', '[data-testid="icon"]',
          '.badge', '.button', 'button'
        ];

        let visualCount = 0;
        for (const element of visualElements) {
          const count = await page.locator(element).count();
          visualCount += count;
        }

        expect(visualCount).toBeGreaterThan(5); // Adequate visual elements

        // Verify reasonable content density
        const mainContent = page.locator('main, [role="main"]');
        const textContent = await mainContent.textContent() || '';
        const contentLength = textContent.length;
        
        // Content should be substantial but not overwhelming
        expect(contentLength).toBeGreaterThan(1000);
        expect(contentLength).toBeLessThan(10000);
      }
    });
  });

  test.describe('Content Quality and Consistency', () => {
    
    test('should maintain consistent tone and messaging', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];
      const toneIndicators = {
        professional: ['professional', 'certified', 'expertise', 'qualified'],
        supportive: ['help', 'support', 'guide', 'journey', 'together'],
        empowering: ['potential', 'growth', 'achieve', 'success', 'transform'],
        approachable: ['you', 'your', 'discover', 'explore', 'learn']
      };

      const toneScores: Record<string, number> = {};

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        for (const [tone, words] of Object.entries(toneIndicators)) {
          if (!toneScores[tone]) toneScores[tone] = 0;
          
          for (const word of words) {
            const count = await page.locator(`text*=${word}`).count();
            toneScores[tone] += count;
          }
        }
      }

      // All tone categories should be represented
      for (const [tone, score] of Object.entries(toneScores)) {
        expect(score).toBeGreaterThan(3); // Each tone present across pages
      }

      // Professional and empowering tones should be prominent
      expect(toneScores.professional).toBeGreaterThan(toneScores.approachable);
      expect(toneScores.empowering).toBeGreaterThan(5);
    });

    test('should provide credible and trustworthy content', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Look for credibility indicators
        const credibilityMarkers = [
          'certified', 'iPEC', 'professional', 'accredited', 'qualified',
          'experience', 'expertise', 'proven', 'established', 'recognized'
        ];

        let credibilityCount = 0;
        for (const marker of credibilityMarkers) {
          const count = await page.locator(`text*=${marker}`).count();
          credibilityCount += count;
        }

        expect(credibilityCount).toBeGreaterThan(3); // Multiple credibility indicators

        // Look for social proof elements
        const socialProofElements = [
          '.testimonial', 'blockquote', 'text=client', 'text=success',
          'text=story', 'text=experience', '[data-testid="testimonial"]'
        ];

        let socialProofCount = 0;
        for (const element of socialProofElements) {
          const count = await page.locator(element).count();
          socialProofCount += count;
        }

        expect(socialProofCount).toBeGreaterThan(0); // Some social proof present
      }
    });
  });

  test.describe('Content Performance and Optimization', () => {
    
    test('should optimize content for user engagement', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Verify engaging content elements
        const engagementElements = {
          questions: ['?', 'how', 'what', 'why', 'when'],
          callouts: ['.highlight', '.callout', '.important', 'strong', 'em'],
          interactions: ['button', 'a[href]', '.link', '[data-testid="cta"]']
        };

        for (const [type, selectors] of Object.entries(engagementElements)) {
          let elementCount = 0;
          for (const selector of selectors) {
            const count = await page.locator(selector).count();
            elementCount += count;
          }
          expect(elementCount).toBeGreaterThan(0); // Each engagement type present
        }

        // Verify content pacing (not too dense)
        const paragraphs = page.locator('p');
        const headings = page.locator('h1, h2, h3, h4');
        const paragraphCount = await paragraphs.count();
        const headingCount = await headings.count();

        // Good content pacing ratio
        const pacingRatio = headingCount / paragraphCount;
        expect(pacingRatio).toBeGreaterThan(0.1); // At least 1 heading per 10 paragraphs
        expect(pacingRatio).toBeLessThan(0.8); // Not too many headings
      }
    });

    test('should maintain appropriate content length for web consumption', async ({ page }) => {
      const learningPages = ['/about-coaching', '/coaching-basics', '/coaching-resources'];

      for (const pagePath of learningPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Measure reading time (approximate)
        const mainContent = page.locator('main, [role="main"]');
        const textContent = await mainContent.textContent() || '';
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 WPM average

        // Content should be consumable but substantial
        expect(estimatedReadingTime).toBeGreaterThan(2); // At least 2 minutes of content
        expect(estimatedReadingTime).toBeLessThan(15); // Not overwhelming

        // Verify content is well-structured for web consumption
        const contentSections = page.locator('section, .section, .card');
        const sectionCount = await contentSections.count();
        
        if (estimatedReadingTime > 5) {
          expect(sectionCount).toBeGreaterThan(3); // Longer content should be well-sectioned
        }
      }
    });
  });
});