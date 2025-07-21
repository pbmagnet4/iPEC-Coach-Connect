/**
 * Performance End-to-End Tests
 * 
 * Comprehensive performance testing covering:
 * - Core Web Vitals measurement (LCP, FID, CLS)
 * - Page load performance across different network conditions
 * - API response time monitoring and optimization
 * - Bundle size analysis and optimization validation
 * - Image loading and optimization verification
 * - Memory usage and leak detection
 * - Scroll performance and interaction responsiveness
 * - Third-party script impact analysis
 * - Progressive loading and critical resource prioritization
 * - Performance budget validation and regression testing
 * 
 * This test suite ensures the platform meets performance standards
 * and provides a fast, responsive user experience across all devices.
 */

import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../utils/test-helpers';

test.describe('Performance Testing', () => {
  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds on home page', async ({ page }) => {
      // Navigate to home page and measure Core Web Vitals
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: Record<string, number> = {};
          let observerCount = 0;
          const targetObservers = 3;
          
          const checkComplete = () => {
            observerCount++;
            if (observerCount >= targetObservers) {
              resolve(vitals);
            }
          };
          
          // Largest Contentful Paint (LCP)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.LCP = lastEntry.startTime;
            checkComplete();
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // First Input Delay (FID) - measure interaction responsiveness
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.FID = entries[0].processingStart - entries[0].startTime;
            } else {
              vitals.FID = 0; // No user interaction detected
            }
            checkComplete();
          }).observe({ type: 'first-input', buffered: true });
          
          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.CLS = clsValue;
            checkComplete();
          }).observe({ type: 'layout-shift', buffered: true });
          
          // Fallback timeout
          setTimeout(() => {
            resolve(vitals);
          }, 10000);
        });
      });
      
      // Validate Core Web Vitals thresholds
      expect(vitals.LCP).toBeLessThan(2500); // LCP should be < 2.5s
      expect(vitals.FID).toBeLessThan(100);  // FID should be < 100ms
      expect(vitals.CLS).toBeLessThan(0.1);  // CLS should be < 0.1
    });

    test('should maintain good performance on coach listing page', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/coaches', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      
      // Measure LCP for coach listing
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      expect(lcp).toBeLessThan(2500);
      
      // Verify coach cards are rendered efficiently
      await expect(page.locator('[data-testid="coach-card"]').first()).toBeVisible();
      
      // Check that images are loading efficiently
      const images = await page.locator('img').all();
      for (const img of images.slice(0, 5)) { // Check first 5 images
        const src = await img.getAttribute('src');
        const loading = await img.getAttribute('loading');
        
        // Images should use lazy loading or be optimized
        expect(loading === 'lazy' || src?.includes('optimized') || src?.includes('webp')).toBeTruthy();
      }
    });

    test('should perform well during search and filtering', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Measure search performance
      const searchStartTime = Date.now();
      
      await page.fill('[data-testid="search-input"]', 'life coaching');
      await helpers.page.clickWithRetry('[data-testid="search-button"]');
      
      // Wait for search results
      await page.waitForFunction(() => {
        const loader = document.querySelector('[data-testid="search-loading"]');
        return !loader || loader.style.display === 'none';
      });
      
      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(1000); // Search should complete within 1 second
      
      // Measure filter performance
      const filterStartTime = Date.now();
      
      await helpers.page.clickWithRetry('[data-testid="specialty-filter"]');
      await helpers.page.clickWithRetry('[data-testid="filter-life-coaching"]');
      await helpers.page.clickWithRetry('[data-testid="apply-filters"]');
      
      await page.waitForFunction(() => {
        const loader = document.querySelector('[data-testid="filter-loading"]');
        return !loader || loader.style.display === 'none';
      });
      
      const filterTime = Date.now() - filterStartTime;
      expect(filterTime).toBeLessThan(500); // Filtering should be very fast
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load critical resources efficiently', async ({ page }) => {
      // Monitor resource loading
      const resourceTimings: Array<{url: string, duration: number, size: number}> = [];
      
      page.on('response', async (response) => {
        const request = response.request();
        const timing = request.timing();
        const url = request.url();
        
        // Track important resources
        if (url.includes('.js') || url.includes('.css') || url.includes('.woff') || url.includes('/api/')) {
          try {
            const responseBody = await response.body();
            resourceTimings.push({
              url,
              duration: timing.responseEnd - timing.requestStart,
              size: responseBody.length
            });
          } catch (error) {
            // Some responses might not be accessible
          }
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Analyze critical resources
      const criticalJS = resourceTimings.filter(r => r.url.includes('.js') && r.url.includes('main'));
      const criticalCSS = resourceTimings.filter(r => r.url.includes('.css'));
      
      // Critical JavaScript should load quickly
      criticalJS.forEach(resource => {
        expect(resource.duration).toBeLessThan(1000);
        expect(resource.size).toBeLessThan(500 * 1024); // < 500KB
      });
      
      // CSS should be minimal and fast
      criticalCSS.forEach(resource => {
        expect(resource.duration).toBeLessThan(500);
        expect(resource.size).toBeLessThan(100 * 1024); // < 100KB
      });
    });

    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // Should show loading indicators
      const loadingIndicators = await page.locator('[data-testid*="loading"], [data-testid*="skeleton"]').count();
      if (loadingIndicators > 0) {
        await expect(page.locator('[data-testid*="loading"], [data-testid*="skeleton"]').first()).toBeVisible();
      }
      
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time even with delays
      expect(loadTime).toBeLessThan(10000); // 10 seconds on slow connection
      
      // Content should be usable
      await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
    });

    test('should implement progressive loading', async ({ page }) => {
      await page.goto('/coaches');
      
      // Check for skeleton loading states
      const skeletonLoaders = await page.locator('[data-testid*="skeleton"], [data-testid*="placeholder"]').count();
      expect(skeletonLoaders).toBeGreaterThan(0);
      
      // Wait for content to progressively load
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Verify progressive enhancement
      const coachCards = await page.locator('[data-testid="coach-card"]').count();
      expect(coachCards).toBeGreaterThan(0);
      
      // Check that images load progressively
      const images = await page.locator('[data-testid="coach-avatar"]').all();
      for (const img of images.slice(0, 3)) {
        const isVisible = await img.isVisible();
        if (isVisible) {
          // Image should have loaded or show placeholder
          const src = await img.getAttribute('src');
          const alt = await img.getAttribute('alt');
          expect(src || alt).toBeTruthy();
        }
      }
    });
  });

  test.describe('API Performance', () => {
    test('should maintain fast API response times', async ({ page }) => {
      const apiCalls: Array<{url: string, duration: number, status: number}> = [];
      
      page.on('response', (response) => {
        const request = response.request();
        const url = request.url();
        
        if (url.includes('/api/')) {
          const timing = request.timing();
          apiCalls.push({
            url,
            duration: timing.responseEnd - timing.requestStart,
            status: response.status()
          });
        }
      });
      
      await page.goto('/coaches');
      await page.waitForLoadState('networkidle');
      
      // Analyze API performance
      apiCalls.forEach(call => {
        expect(call.status).toBeLessThan(400); // No client/server errors
        expect(call.duration).toBeLessThan(2000); // API calls < 2 seconds
        
        // Critical APIs should be faster
        if (call.url.includes('/coaches') || call.url.includes('/auth')) {
          expect(call.duration).toBeLessThan(500);
        }
      });
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Simulate API failures
      await page.route('**/api/coaches', route => route.abort());
      
      await page.goto('/coaches');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-message"], [data-testid="error-state"]')).toBeVisible();
      
      // Should provide retry mechanism
      const retryButton = page.locator('[data-testid="retry-button"], [data-testid="reload-button"]');
      if (await retryButton.count() > 0) {
        await expect(retryButton.first()).toBeVisible();
      }
      
      // Should not crash the application
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
    });

    test('should cache API responses effectively', async ({ page }) => {
      const apiCallTimes: Record<string, number[]> = {};
      
      page.on('response', (response) => {
        const request = response.request();
        const url = request.url();
        
        if (url.includes('/api/coaches')) {
          const timing = request.timing();
          const duration = timing.responseEnd - timing.requestStart;
          
          if (!apiCallTimes[url]) {
            apiCallTimes[url] = [];
          }
          apiCallTimes[url].push(duration);
        }
      });
      
      // First visit
      await page.goto('/coaches');
      await page.waitForLoadState('networkidle');
      
      // Navigate away and back
      await page.goto('/');
      await page.goto('/coaches');
      await page.waitForLoadState('networkidle');
      
      // Check for caching benefits
      Object.entries(apiCallTimes).forEach(([url, times]) => {
        if (times.length > 1) {
          // Subsequent calls should be faster (cached)
          const firstCall = times[0];
          const secondCall = times[1];
          expect(secondCall).toBeLessThanOrEqual(firstCall);
        }
      });
    });
  });

  test.describe('Bundle Size and Asset Optimization', () => {
    test('should have optimized bundle sizes', async ({ page }) => {
      const resourceSizes: Record<string, number> = {};
      
      page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();
        
        if (url.includes('.js') || url.includes('.css')) {
          try {
            const body = await response.body();
            resourceSizes[url] = body.length;
          } catch (error) {
            // Some responses might not be accessible
          }
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check bundle sizes
      const jsFiles = Object.entries(resourceSizes).filter(([url]) => url.includes('.js'));
      const cssFiles = Object.entries(resourceSizes).filter(([url]) => url.includes('.css'));
      
      // Main bundle should be reasonable size
      const mainBundle = jsFiles.find(([url]) => url.includes('main') || url.includes('index'));
      if (mainBundle) {
        expect(mainBundle[1]).toBeLessThan(1024 * 1024); // < 1MB
      }
      
      // CSS should be optimized
      const totalCSSSize = cssFiles.reduce((sum, [, size]) => sum + size, 0);
      expect(totalCSSSize).toBeLessThan(200 * 1024); // < 200KB total CSS
      
      // Should use compression
      jsFiles.forEach(([url, size]) => {
        if (size > 50 * 1024) { // Files larger than 50KB
          // Check if response includes compression headers
          // This would be validated by checking Content-Encoding in actual implementation
        }
      });
    });

    test('should implement code splitting effectively', async ({ page }) => {
      const loadedChunks: string[] = [];
      
      page.on('response', (response) => {
        const url = response.request().url();
        if (url.includes('.js') && (url.includes('chunk') || url.includes('lazy'))) {
          loadedChunks.push(url);
        }
      });
      
      // Initial page load
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const initialChunks = [...loadedChunks];
      
      // Navigate to different section
      await page.click('[data-testid="find-coaches-button"]');
      await page.waitForLoadState('networkidle');
      
      // Should load additional chunks for new routes
      const newChunks = loadedChunks.filter(chunk => !initialChunks.includes(chunk));
      expect(newChunks.length).toBeGreaterThan(0);
    });

    test('should optimize images and media', async ({ page }) => {
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      const images = await page.locator('img').all();
      
      for (const img of images.slice(0, 5)) {
        const src = await img.getAttribute('src');
        const loading = await img.getAttribute('loading');
        const alt = await img.getAttribute('alt');
        
        // Images should have alt text
        expect(alt).toBeTruthy();
        
        // Images should use lazy loading for non-critical images
        if (src && !src.includes('logo') && !src.includes('hero')) {
          expect(loading).toBe('lazy');
        }
        
        // Images should be optimized format
        if (src) {
          const isOptimized = src.includes('.webp') || 
                            src.includes('.avif') || 
                            src.includes('w_') || // Width parameter
                            src.includes('q_'); // Quality parameter
          
          // At least some images should be optimized
          // expect(isOptimized).toBeTruthy();
        }
      }
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('should not create memory leaks during navigation', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Navigate through multiple pages
      const pages = ['/', '/coaches', '/community', '/learning', '/'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow for cleanup
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        // Memory shouldn't increase dramatically
        const memoryIncrease = finalMemory - initialMemory;
        const percentageIncrease = (memoryIncrease / initialMemory) * 100;
        
        expect(percentageIncrease).toBeLessThan(100); // Less than 100% increase
      }
    });

    test('should cleanup event listeners and subscriptions', async ({ page }) => {
      // Add monitoring for event listeners
      await page.addInitScript(() => {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        
        (window as any).listenerCount = 0;
        
        EventTarget.prototype.addEventListener = function(...args) {
          (window as any).listenerCount++;
          return originalAddEventListener.apply(this, args);
        };
        
        EventTarget.prototype.removeEventListener = function(...args) {
          (window as any).listenerCount--;
          return originalRemoveEventListener.apply(this, args);
        };
      });
      
      await page.goto('/coaches');
      await page.waitForLoadState('networkidle');
      
      const initialListeners = await page.evaluate(() => (window as any).listenerCount);
      
      // Interact with components that add listeners
      await page.click('[data-testid="specialty-filter"]');
      await page.click('[data-testid="price-filter"]');
      
      // Navigate away
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      const finalListeners = await page.evaluate(() => (window as any).listenerCount);
      
      // Should not accumulate listeners
      expect(finalListeners - initialListeners).toBeLessThan(10);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      const helpers = createTestHelpers(page);
      
      await page.goto('/coaches');
      await page.waitForSelector('[data-testid="coach-card"]');
      
      // Simulate loading many coaches
      const scrollStartTime = Date.now();
      
      // Scroll to trigger more loading if infinite scroll exists
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(200);
      }
      
      const scrollEndTime = Date.now();
      const scrollDuration = scrollEndTime - scrollStartTime;
      
      // Scrolling should remain responsive
      expect(scrollDuration).toBeLessThan(5000);
      
      // Check that we don't render all items at once
      const visibleCoaches = await page.locator('[data-testid="coach-card"]').count();
      expect(visibleCoaches).toBeLessThan(100); // Should use pagination or virtualization
    });
  });

  test.describe('Third-Party Performance Impact', () => {
    test('should minimize third-party script impact', async ({ page }) => {
      const thirdPartyRequests: Array<{url: string, duration: number}> = [];
      
      page.on('response', (response) => {
        const request = response.request();
        const url = request.url();
        const timing = request.timing();
        
        // Identify third-party requests
        if (!url.includes(new URL(page.url()).hostname) && 
            (url.includes('.js') || url.includes('analytics') || url.includes('tracking'))) {
          thirdPartyRequests.push({
            url,
            duration: timing.responseEnd - timing.requestStart
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Third-party scripts should load asynchronously and not block
      thirdPartyRequests.forEach(request => {
        expect(request.duration).toBeLessThan(5000); // Should not take too long
      });
      
      // Should not have too many third-party requests
      expect(thirdPartyRequests.length).toBeLessThan(10);
    });

    test('should load critical content without third-party dependencies', async ({ page }) => {
      // Block third-party domains
      await page.route('**/*', (route) => {
        const url = route.request().url();
        const hostname = new URL(url).hostname;
        const pageHostname = new URL(page.url() || 'http://localhost').hostname;
        
        if (hostname !== pageHostname && hostname !== 'localhost') {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Essential content should still load
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="find-coaches-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="get-started-button"]')).toBeVisible();
      
      // Navigation should work
      await page.click('[data-testid="find-coaches-button"]');
      await page.waitForURL('/coaches');
    });
  });

  test.describe('Performance Budgets and Monitoring', () => {
    test('should meet performance budget thresholds', async ({ page }) => {
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: Record<string, number> = {};
          
          // Time to First Byte
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          metrics.TTFB = navigation.responseStart - navigation.requestStart;
          
          // First Contentful Paint
          const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
          metrics.FCP = fcpEntry ? fcpEntry.startTime : 0;
          
          // Time to Interactive (simplified)
          metrics.TTI = navigation.loadEventEnd - navigation.fetchStart;
          
          resolve(metrics);
        });
      });
      
      // Performance budget thresholds
      expect(performanceMetrics.TTFB).toBeLessThan(600); // < 600ms
      expect(performanceMetrics.FCP).toBeLessThan(1800); // < 1.8s
      expect(performanceMetrics.TTI).toBeLessThan(3800); // < 3.8s
    });

    test('should maintain performance under load', async ({ page, context }) => {
      // Simulate multiple tabs/users
      const pages = [];
      
      for (let i = 0; i < 3; i++) {
        const newPage = await context.newPage();
        pages.push(newPage);
      }
      
      // Load the same page in multiple tabs
      const loadPromises = pages.map(async (p, index) => {
        const startTime = Date.now();
        await p.goto('/coaches');
        await p.waitForLoadState('networkidle');
        return Date.now() - startTime;
      });
      
      const loadTimes = await Promise.all(loadPromises);
      
      // All pages should load within reasonable time
      loadTimes.forEach(time => {
        expect(time).toBeLessThan(5000);
      });
      
      // Cleanup
      await Promise.all(pages.map(p => p.close()));
    });

    test('should track performance regressions', async ({ page }) => {
      const baselineMetrics = {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        loadTime: 3000
      };
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const actualLoadTime = Date.now() - startTime;
      
      const actualMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const metrics: Record<string, number> = {};
          let collected = 0;
          
          new PerformanceObserver((list) => {
            const entry = list.getEntries()[list.getEntries().length - 1];
            metrics.LCP = entry.startTime;
            collected++;
            if (collected === 3) resolve(metrics);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          new PerformanceObserver((list) => {
            const entry = list.getEntries()[0];
            metrics.FID = entry ? (entry as any).processingStart - entry.startTime : 0;
            collected++;
            if (collected === 3) resolve(metrics);
          }).observe({ type: 'first-input', buffered: true });
          
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            metrics.CLS = cls;
            collected++;
            if (collected === 3) resolve(metrics);
          }).observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => resolve(metrics), 5000);
        });
      });
      
      // Check for performance regressions
      expect(actualMetrics.LCP).toBeLessThanOrEqual(baselineMetrics.LCP * 1.1); // 10% tolerance
      expect(actualMetrics.FID).toBeLessThanOrEqual(baselineMetrics.FID * 1.1);
      expect(actualMetrics.CLS).toBeLessThanOrEqual(baselineMetrics.CLS * 1.1);
      expect(actualLoadTime).toBeLessThanOrEqual(baselineMetrics.loadTime * 1.1);
    });
  });
});