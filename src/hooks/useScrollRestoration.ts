import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to handle scroll restoration and prevent unwanted scroll jumps
 * Fixes the critical issue where landing page jumps to middle instead of staying at top
 */
export function useScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // Only run on route changes
    const isRouteChange = location.pathname !== (window as any).lastPathname;
    (window as any).lastPathname = location.pathname;

    if (isRouteChange) {
      // Prevent any existing scroll behaviors from interfering
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };

      // Temporarily disable smooth scrolling during route transitions
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      // Prevent any autofocus or scroll behaviors during initial render
      document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
      
      // Force scroll to top immediately
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      // Use requestAnimationFrame to ensure DOM is settled before removing restrictions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Remove scroll prevention
          document.removeEventListener('scroll', preventScroll, { capture: true });
          
          // Restore original scroll behavior after a short delay
          setTimeout(() => {
            document.documentElement.style.scrollBehavior = originalScrollBehavior;
          }, 100);
        });
      });
    }
  }, [location.pathname]);

  // Additional safeguard: ensure page stays at top on mount
  useEffect(() => {
    // Immediate scroll to top when component mounts
    window.scrollTo(0, 0);

    // Backup check after all async operations complete
    const timeoutId = setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);
}

/**
 * Hook to safely manage intersection observer scroll behavior
 * Prevents observers from triggering scroll during initial page load
 */
export function useSafeIntersectionObserver() {
  useEffect(() => {
    let isPageLoaded = false;

    // Mark page as loaded after initial render cycle
    const timeoutId = setTimeout(() => {
      isPageLoaded = true;
    }, 500); // Give enough time for page to settle

    // Override IntersectionObserver to prevent early triggers
    const OriginalIntersectionObserver = window.IntersectionObserver;
    
    window.IntersectionObserver = class extends OriginalIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        const safeCallback: IntersectionObserverCallback = (entries, observer) => {
          // Only trigger callbacks after page has fully loaded
          if (isPageLoaded) {
            callback(entries, observer);
          }
        };
        
        super(safeCallback, options);
      }
    };

    return () => {
      clearTimeout(timeoutId);
      window.IntersectionObserver = OriginalIntersectionObserver;
    };
  }, []);
}

/**
 * Hook to prevent autofocus from causing scroll jumps during initial page load
 */
export function useSafeAutofocus() {
  useEffect(() => {
    let allowFocus = false;

    // Temporarily override focus method during initial load
    const originalFocus = HTMLElement.prototype.focus;
    
    HTMLElement.prototype.focus = function(this: HTMLElement, options?: FocusOptions) {
      // Only allow focus after page has settled, and don't scroll to focused element initially
      if (allowFocus) {
        originalFocus.call(this, { ...options, preventScroll: false });
      } else {
        // Focus without scrolling during initial load
        originalFocus.call(this, { ...options, preventScroll: true });
      }
    };

    // Allow normal focus behavior after page settles
    const timeoutId = setTimeout(() => {
      allowFocus = true;
      HTMLElement.prototype.focus = originalFocus;
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      HTMLElement.prototype.focus = originalFocus;
    };
  }, []);
}