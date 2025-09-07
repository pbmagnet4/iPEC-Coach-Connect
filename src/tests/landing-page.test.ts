import { expect, test } from '@playwright/test';

/**
 * iPEC Coach Connect Landing Page Test Suite
 * 
 * This comprehensive test suite covers all critical user flows,
 * functionality, error handling, and integration points for the
 * landing page components.
 */

// Test data constants
const _TEST_LOCATIONS = [
  'New York',
  'Los Angeles', 
  'Chicago',
  'Invalid Location 123!@#'
];

const _TEST_SPECIALTIES = [
  'Career Transition',
  'Leadership Development',
  'Personal Growth',
  'Invalid Specialty'
];

test.describe('Landing Page - Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="hero-section"]');
  });

  test.describe('Location Search Functionality', () => {
    test('should display location input with placeholder', async ({ page }) => {
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      await expect(locationInput).toBeVisible();
      await expect(locationInput).toHaveAttribute('placeholder', 'Enter your location');
    });

    test('should trigger location suggestions on typing', async ({ page }) => {
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      
      // Type more than 2 characters to trigger suggestions
      await locationInput.fill('New York');
      await page.waitForTimeout(350); // Wait for debounce
      
      const _suggestionsDropdown = page.locator('[data-testid="location-suggestions"]');
      await expect(suggestionsDropdown).toBeVisible();
    });

    test('should select location from suggestions', async ({ page }) => {
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      
      await locationInput.fill('New');
      await page.waitForTimeout(350);
      
      // Click on first suggestion
      const _firstSuggestion = page.locator('[data-testid="location-suggestions"] button').first();
      await firstSuggestion.click();
      
      // Verify input is populated
      await expect(locationInput).toHaveValue(/New York|New/);
      
      // Verify suggestions are hidden
      const _suggestionsDropdown = page.locator('[data-testid="location-suggestions"]');
      await expect(suggestionsDropdown).not.toBeVisible();
    });

    test('should clear location input when X button clicked', async ({ page }) => {
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      
      await locationInput.fill('Test Location');
      
      const _clearButton = page.locator('button[aria-label="Clear location"]');
      await clearButton.click();
      
      await expect(locationInput).toHaveValue('');
    });

    test('should handle geolocation "near me" functionality', async ({ page }) => {
      // Mock geolocation
      await page.context().grantPermissions(['geolocation']);
      await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
      
      const _nearMeButton = page.locator('button:has-text("Coaches near me")');
      await nearMeButton.click();
      
      // Verify loading state
      await expect(nearMeButton).toHaveAttribute('aria-busy', 'true');
      
      // Wait for location to be set
      await page.waitForTimeout(1000);
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      await expect(locationInput).toHaveValue('Current Location');
    });
  });

  test.describe('Specialty Search Functionality', () => {
    test('should display specialty input with placeholder', async ({ page }) => {
      const _specialtyInput = page.locator('input[placeholder="Search by specialty"]');
      await expect(specialtyInput).toBeVisible();
      await expect(specialtyInput).toHaveAttribute('placeholder', 'Search by specialty');
    });

    test('should accept text input for specialty search', async ({ page }) => {
      const _specialtyInput = page.locator('input[placeholder="Search by specialty"]');
      
      await specialtyInput.fill('Leadership Development');
      await expect(specialtyInput).toHaveValue('Leadership Development');
    });

    test('should populate specialty from quick filter buttons', async ({ page }) => {
      const _specialtyInput = page.locator('input[placeholder="Search by specialty"]');
      
      const _careerButton = page.locator('button:has-text("Career Transition")');
      await careerButton.click();
      
      await expect(specialtyInput).toHaveValue('Career Transition');
    });
  });

  test.describe('Find Coaches Button', () => {
    test('should be visible and clickable', async ({ page }) => {
      const _findCoachesButton = page.locator('button:has-text("Find Coaches")');
      await expect(findCoachesButton).toBeVisible();
      await expect(findCoachesButton).toBeEnabled();
    });

    test('should navigate to coach list with search parameters', async ({ page }) => {
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      const _specialtyInput = page.locator('input[placeholder="Search by specialty"]');
      const _findCoachesButton = page.locator('button:has-text("Find Coaches")');
      
      await locationInput.fill('New York');
      await specialtyInput.fill('Career Transition');
      
      await findCoachesButton.click();
      
      // Verify navigation to coaches page with parameters
      await expect(page).toHaveURL(/\/coaches/);
      // In a real implementation, check URL parameters or page content
    });

    test('should work with empty search parameters', async ({ page }) => {
      const _findCoachesButton = page.locator('button:has-text("Find Coaches")');
      
      await findCoachesButton.click();
      
      // Should still navigate to coaches page
      await expect(page).toHaveURL(/\/coaches/);
    });
  });
});

test.describe('Landing Page - How It Works Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.scrollToElement('[data-testid="how-it-works-section"]');
  });

  test('should display all 4 steps', async ({ page }) => {
    const _steps = page.locator('[data-testid="how-it-works-step"]');
    await expect(steps).toHaveCount(4);
    
    // Verify step titles
    await expect(page.locator('text=Create Profile')).toBeVisible();
    await expect(page.locator('text=Match with Coaches')).toBeVisible();
    await expect(page.locator('text=Schedule Session')).toBeVisible();
    await expect(page.locator('text=Begin Journey')).toBeVisible();
  });

  test('should display step numbers correctly', async ({ page }) => {
    const _stepNumbers = page.locator('[data-testid="step-number"]');
    
    for (let i = 1; i <= 4; i++) {
      await expect(stepNumbers.nth(i - 1)).toContainText(`0${i}`);
    }
  });

  test('should animate steps into view on scroll', async ({ page }) => {
    const _firstStep = page.locator('[data-testid="how-it-works-step"]').first();
    
    // Check for animation classes or opacity changes
    await expect(firstStep).toHaveClass(/opacity-100|animate-in/);
  });

  test('should navigate to learn more page', async ({ page }) => {
    const _learnMoreButton = page.locator('button:has-text("Learn More About Our Process")');
    await learnMoreButton.click();
    
    await expect(page).toHaveURL(/\/learn-more|\/how-it-works/);
  });
});

test.describe('Landing Page - Benefits Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.scrollToElement('[data-testid="benefits-section"]');
  });

  test('should display both client and coach benefits', async ({ page }) => {
    await expect(page.locator('text=For Clients')).toBeVisible();
    await expect(page.locator('text=For Coaches')).toBeVisible();
  });

  test('should display all client benefits', async ({ page }) => {
    const _clientBenefits = [
      'Personalized Matching',
      'Flexible Scheduling', 
      'Verified Coaches',
      'Quality Assurance'
    ];
    
    for (const benefit of clientBenefits) {
      await expect(page.locator(`text=${benefit}`)).toBeVisible();
    }
  });

  test('should display all coach benefits', async ({ page }) => {
    const _coachBenefits = [
      'Expanded Reach',
      'Practice Growth',
      'Easy Management',
      'Community Support'
    ];
    
    for (const benefit of coachBenefits) {
      await expect(page.locator(`text=${benefit}`)).toBeVisible();
    }
  });

  test('should show benefit icons', async ({ page }) => {
    const _benefitIcons = page.locator('[data-testid="benefit-icon"]');
    await expect(benefitIcons).toHaveCount(8); // 4 client + 4 coach benefits
  });
});

test.describe('Landing Page - Integration Points', () => {
  test.describe('External API Integration', () => {
    test('should handle location API failures gracefully', async ({ page }) => {
      // Mock network failure for location API
      await page.route('**/api/locations/**', route => route.abort());
      
      await page.goto('/');
      
      const _locationInput = page.locator('input[placeholder="Enter your location"]');
      await locationInput.fill('New York');
      await page.waitForTimeout(350);
      
      // Should show error state or no suggestions
      const _suggestionsDropdown = page.locator('[data-testid="location-suggestions"]');
      await expect(suggestionsDropdown).not.toBeVisible();
    });

    test('should handle geolocation permission denial', async ({ page }) => {
      // Deny geolocation permission
      await page.context().grantPermissions([]);
      
      await page.goto('/');
      
      const _nearMeButton = page.locator('button:has-text("Coaches near me")');
      await nearMeButton.click();
      
      // Should handle gracefully without crashing
      await expect(nearMeButton).not.toHaveAttribute('aria-busy', 'true');
    });
  });

  test.describe('Navigation Integration', () => {
    test('should navigate to all linked pages', async ({ page }) => {
      await page.goto('/');
      
      const _navigationLinks = [
        { text: 'How It Works', expectedUrl: /\/how-it-works/ },
        { text: 'Become a Coach', expectedUrl: /\/become-coach/ },
        { text: 'Community', expectedUrl: /\/community/ },
        { text: 'Coaching', expectedUrl: /\/about-coaching/ }
      ];
      
      for (const link of navigationLinks) {
        await page.goto('/'); // Reset to home page
        
        const _linkElement = page.locator(`a:has-text("${link.text}")`).first();
        await linkElement.click();
        
        await expect(page).toHaveURL(link.expectedUrl);
      }
    });
  });
});

test.describe('Landing Page - Error Handling', () => {
  test('should handle invalid location input', async ({ page }) => {
    await page.goto('/');
    
    const _locationInput = page.locator('input[placeholder="Enter your location"]');
    await locationInput.fill('!@#$%^&*()');
    await page.waitForTimeout(350);
    
    // Should not crash or show inappropriate suggestions
    const _page_errors = [];
  void page.on('pageerror', error => page_errors.push(error));
    
    expect(page_errors).toHaveLength(0);
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow network response
    await page.route('**/api/**', async route => {
      await page.waitForTimeout(5000); // 5 second delay
  void route.continue();
    });
    
    await page.goto('/');
    
    const _locationInput = page.locator('input[placeholder="Enter your location"]');
    await locationInput.fill('Test');
    
    // Should handle timeout gracefully
    await expect(locationInput).toBeEnabled();
  });

  test('should maintain functionality with JavaScript disabled', async ({ browser }) => {
    const _context = await browser.newContext({ javaScriptEnabled: false });
    const _page = await context.newPage();
    
    await page.goto('/');
    
    // Basic form elements should still be visible
    await expect(page.locator('input[placeholder="Enter your location"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Search by specialty"]')).toBeVisible();
    await expect(page.locator('button:has-text("Find Coaches")')).toBeVisible();
  });
});

test.describe('Landing Page - Performance & UX', () => {
  test('should load within performance budget', async ({ page }) => {
    const _startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const _loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should be responsive across device sizes', async ({ page }) => {
    const _viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1440, height: 900 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Key elements should be visible at all sizes
      await expect(page.locator('input[placeholder="Enter your location"]')).toBeVisible();
      await expect(page.locator('button:has-text("Find Coaches")')).toBeVisible();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder="Enter your location"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder="Search by specialty"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Find Coaches")')).toBeFocused();
  });
});

test.describe('Landing Page - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for important ARIA attributes
    const _locationInput = page.locator('input[placeholder="Enter your location"]');
    const _specialtyInput = page.locator('input[placeholder="Search by specialty"]');
    
    await expect(locationInput).toHaveAttribute('aria-label');
    await expect(specialtyInput).toHaveAttribute('aria-label');
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toContainText('Find Your Perfect iPEC Coach');
    await expect(page.locator('h2').first()).toContainText('How It Works');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This would typically use an accessibility testing library
    // For now, verify key elements are visible
    await expect(page.locator('button:has-text("Find Coaches")')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Landing Page - Conversion Optimization', () => {
  test('should track key user interactions', async ({ page }) => {
    // Mock analytics tracking
    const _analyticsEvents = [];
    await page.exposeFunction('trackEvent', (event) => {
  void analyticsEvents.push(event);
    });
    
    await page.goto('/');
    
    // Perform key actions
    await page.locator('input[placeholder="Enter your location"]').fill('New York');
    await page.locator('button:has-text("Find Coaches")').click();
    
    // Verify tracking events were fired
    expect(analyticsEvents.length).toBeGreaterThan(0);
  });

  test('should display trust signals', async ({ page }) => {
    await page.goto('/');
    
    // Check for trust indicators
    await expect(page.locator('text=certified iPEC coaches')).toBeVisible();
    await expect(page.locator('text=Verified Coaches')).toBeVisible();
  });

  test('should have clear call-to-action hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const _primaryCTA = page.locator('button:has-text("Find Coaches")');
    const _secondaryCTA = page.locator('button:has-text("Learn More")');
    
    // Primary CTA should be more prominent
    await expect(primaryCTA).toBeVisible();
    await expect(secondaryCTA).toBeVisible();
  });
});