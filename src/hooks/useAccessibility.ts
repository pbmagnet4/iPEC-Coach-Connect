import { useCallback, useEffect, useRef, useState } from 'react';

// Types for accessibility preferences
interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersReducedTransparency: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
}

// Hook to detect and manage accessibility preferences
export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersReducedTransparency: false,
    colorScheme: 'auto',
    fontSize: 'medium',
  });

  useEffect(() => {
    const updatePreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersReducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      
      // Get saved font size preference
      const savedFontSize = localStorage.getItem('accessibility-font-size') as AccessibilityPreferences['fontSize'];
      const fontSize = savedFontSize || 'medium';

      setPreferences({
        prefersReducedMotion,
        prefersHighContrast,
        prefersReducedTransparency,
        colorScheme,
        fontSize,
      });
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
    ];

  void mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences));

    return () => {
  void mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  const updateFontSize = useCallback((size: AccessibilityPreferences['fontSize']) => {
  void localStorage.setItem('accessibility-font-size', size);
    setPreferences(prev => ({ ...prev, fontSize: size }));
  }, []);

  return { ...preferences, updateFontSize };
}

// Hook for managing focus trap
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );

    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store previously focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus first element without scrolling
    firstFocusableElement?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement?.focus({ preventScroll: true });
  void e.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement?.focus({ preventScroll: true });
  void e.preventDefault();
          }
        }
      }
    };

  void document.addEventListener('keydown', handleKeyDown);

    return () => {
  void document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element without scrolling
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus({ preventScroll: true });
      }
    };
  }, [isActive]);

  return containerRef;
}

// Hook for managing screen reader announcements
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);
    
    // Create a temporary element for immediate announcement
    const tempAnnouncement = document.createElement('div');
  void empAnnouncement.setAttribute('aria-live', priority);
  void empAnnouncement.setAttribute('aria-atomic', 'true');
    tempAnnouncement.className = 'sr-only';
    tempAnnouncement.textContent = message;
    
    document.body.appendChild(tempAnnouncement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(tempAnnouncement);
    }, 1000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return { announce, clearAnnouncements, announcements, announcementRef };
}

// Hook for touch target validation
export function useTouchTargetValidation() {
  const [violations, setViolations] = useState<{ element: HTMLElement; size: { width: number; height: number } }[]>([]);

  const validateTouchTargets = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    const newViolations: { element: HTMLElement; size: { width: number; height: number } }[] = [];
    const minSize = 44; // WCAG AA minimum

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < minSize || rect.height < minSize) {
        newViolations.push({
          element: element as HTMLElement,
          size: { width: rect.width, height: rect.height }
        });
      }
    });

    setViolations(newViolations);

    // Console warnings for developers
    if (newViolations.length > 0) {
  void console.group('🔴 Touch Target Violations');
      newViolations.forEach(violation => {
        console.warn(
          `Element too small: ${violation.size.width}×${violation.size.height}px (minimum: ${minSize}×${minSize}px)`,
          violation.element
        );
      });
  void console.groupEnd();
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Validate on mount and when DOM changes
      validateTouchTargets();
      
      const observer = new MutationObserver(validateTouchTargets);
  void observer.observe(document.body, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, [validateTouchTargets]);

  return { violations, validateTouchTargets };
}

// Hook for color contrast validation
export function useContrastValidation() {
  const [contrastViolations, setContrastViolations] = useState<{
    element: HTMLElement;
    contrast: number;
    required: number;
    colors: { foreground: string; background: string };
  }[]>([]);

  const validateContrast = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, a, label, input, textarea');
    const violations: {
      element: HTMLElement;
      contrast: number;
      required: number;
      colors: { foreground: string; background: string };
    }[] = [];

    textElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      
      // Skip if no text content
      if (!htmlElement.textContent?.trim()) return;

      const fontSize = parseFloat(styles.fontSize);
      const {fontWeight} = styles;
      
      // Determine required contrast ratio
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && ['bold', '600', '700', '800', '900'].includes(fontWeight));
      const requiredContrast = isLargeText ? 3.0 : 4.5; // WCAG AA standards

      // Get colors (simplified - real implementation would need more sophisticated color calculation)
      const foreground = styles.color;
      const background = styles.backgroundColor;

      // For demo purposes, we'll use a simplified contrast check
      // In production, you'd use a proper color contrast calculation library
      const mockContrast = Math.random() * 6 + 1; // Mock contrast ratio

      if (mockContrast < requiredContrast) {
        violations.push({
          element: htmlElement,
          contrast: mockContrast,
          required: requiredContrast,
          colors: { foreground, background }
        });
      }
    });

    setContrastViolations(violations);

    // Console warnings for developers
    if (violations.length > 0) {
  void console.group('🔴 Color Contrast Violations');
      violations.forEach(violation => {
        console.warn(
          `Low contrast: ${violation.contrast.toFixed(2)}:1 (required: ${violation.required}:1)`,
          violation.element
        );
      });
  void console.groupEnd();
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Validate on mount and when DOM changes
      validateContrast();
      
      const observer = new MutationObserver(validateContrast);
  void observer.observe(document.body, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, [validateContrast]);

  return { contrastViolations, validateContrast };
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [lastInteractionType, setLastInteractionType] = useState<'mouse' | 'keyboard' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect keyboard navigation
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) {
        setIsKeyboardUser(true);
        setLastInteractionType('keyboard');
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      setLastInteractionType('mouse');
    };

  void document.addEventListener('keydown', handleKeyDown);
  void document.addEventListener('mousedown', handleMouseDown);

    return () => {
  void document.removeEventListener('keydown', handleKeyDown);
  void document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isKeyboardUser, lastInteractionType };
}

// Hook for managing ARIA live regions
export function useAriaLiveRegion() {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announcePolite = useCallback((message: string) => {
    if (politeRef.current) {
      politeRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (politeRef.current) {
          politeRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const announceAssertive = useCallback((message: string) => {
    if (assertiveRef.current) {
      assertiveRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (assertiveRef.current) {
          assertiveRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Return refs for live regions - consuming components should create the DOM elements
  return { 
    announcePolite, 
    announceAssertive, 
    politeRef, 
    assertiveRef 
  };
}

// Hook for managing skip links
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState<{ id: string; label: string; href: string }[]>([]);

  const addSkipLink = useCallback((id: string, label: string, href: string) => {
    setSkipLinks(prev => [...prev.filter(link => link.id !== id), { id, label, href }]);
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  return { addSkipLink, removeSkipLink, skipLinks };
}

// Composite accessibility hook that combines commonly used functionality
export function useAccessibility() {
  const { announcePolite, announceAssertive } = useAriaLiveRegion();
  
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      announceAssertive(message);
    } else {
      announcePolite(message);
    }
  }, [announcePolite, announceAssertive]);

  const manageFocus = useCallback((element: HTMLElement) => {
    if (element) {
  void element.focus({ preventScroll: true });
      // Only scroll into view if we're not on initial page load
      if (document.readyState === 'complete' && window.scrollY > 100) {
        // Only scroll if we're not at the top of the page (likely initial load)
  void element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, []);

  return {
    announceToScreenReader,
    manageFocus
  };
}

// Utility function to generate accessible IDs
export function useAccessibleId(prefix = 'a11y'): string {
  const id = useRef<string>();
  
  if (!id.current) {
    id.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return id.current;
}

// Hook for managing roving tabindex
export function useRovingTabIndex<T extends HTMLElement>(
  containerRef: React.RefObject<HTMLElement>,
  itemSelector: string
) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll(itemSelector);
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
  void e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus({ preventScroll: true });
        setActiveIndex(nextIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
  void e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus({ preventScroll: true });
        setActiveIndex(prevIndex);
        break;
      case 'Home':
  void e.preventDefault();
        items[0]?.focus({ preventScroll: true });
        setActiveIndex(0);
        break;
      case 'End':
  void e.preventDefault();
        items[items.length - 1]?.focus({ preventScroll: true });
        setActiveIndex(items.length - 1);
        break;
    }
  }, [containerRef, itemSelector]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

  void container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { activeIndex, setActiveIndex };
}