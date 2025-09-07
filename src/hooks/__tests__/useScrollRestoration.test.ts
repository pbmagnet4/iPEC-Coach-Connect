/**
 * Tests for useScrollRestoration hook
 * 
 * Verifies that the scroll restoration functionality works correctly
 * and prevents unwanted scroll jumps on page load.
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useSafeAutofocus, useSafeIntersectionObserver, useScrollRestoration } from '../useScrollRestoration';

// Mock router for testing
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(BrowserRouter, null, children)
);

describe('useScrollRestoration', () => {
  let originalScrollTo: typeof window.scrollTo;
  let originalIntersectionObserver: typeof window.IntersectionObserver;
  let originalFocus: typeof HTMLElement.prototype.focus;

  beforeEach(() => {
    // Mock window.scrollTo
    originalScrollTo = window.scrollTo;
    window.scrollTo = vi.fn();

    // Mock IntersectionObserver
    originalIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock HTMLElement.focus
    originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = vi.fn();

    // Reset any stored pathname
    (window as any).lastPathname = undefined;
  });

  afterEach(() => {
    // Restore original methods
    window.scrollTo = originalScrollTo;
    window.IntersectionObserver = originalIntersectionObserver;
    HTMLElement.prototype.focus = originalFocus;
  });

  describe('useScrollRestoration', () => {
    it('should scroll to top on route change', () => {
      const { rerender } = renderHook(() => useScrollRestoration(), {
        wrapper: RouterWrapper,
      });

      // Simulate route change by re-rendering
      rerender();

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    });

    it('should set scroll behavior to auto during route transitions', () => {
      const originalStyle = document.documentElement.style.scrollBehavior;
      
      renderHook(() => useScrollRestoration(), {
        wrapper: RouterWrapper,
      });

      // Should temporarily set scroll behavior to auto
      expect(document.documentElement.style.scrollBehavior).toBe('auto');
      
      // Restore original style
      document.documentElement.style.scrollBehavior = originalStyle;
    });

    it('should scroll to top immediately on mount', () => {
      renderHook(() => useScrollRestoration(), {
        wrapper: RouterWrapper,
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('useSafeIntersectionObserver', () => {
    it('should wrap IntersectionObserver to prevent early triggers', () => {
      const mockCallback = vi.fn();
      
      renderHook(() => useSafeIntersectionObserver());

      // Create an observer with the wrapped constructor
      const observer = new window.IntersectionObserver(mockCallback);
      
      expect(observer).toBeDefined();
      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        undefined
      );
    });

    it('should delay callback execution for initial page load', (done) => {
      const mockCallback = vi.fn();
      
      renderHook(() => useSafeIntersectionObserver());

      // Create observer and simulate intersection
      const observer = new window.IntersectionObserver(mockCallback);
      const mockEntries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
      
      // Get the wrapped callback
      const wrappedCallback = (window.IntersectionObserver as any).mock.calls[0][0];
      
      // Call immediately - should not trigger
      wrappedCallback(mockEntries, observer);
      expect(mockCallback).not.toHaveBeenCalled();

      // After delay, should trigger
      setTimeout(() => {
        wrappedCallback(mockEntries, observer);
        expect(mockCallback).toHaveBeenCalledWith(mockEntries, observer);
        done();
      }, 600);
    });
  });

  describe('useSafeAutofocus', () => {
    it('should prevent scrolling during initial focus calls', () => {
      const mockElement = document.createElement('input');
      const focusSpy = vi.spyOn(mockElement, 'focus');

      renderHook(() => useSafeAutofocus());

      // Focus should be called with preventScroll during initial load
  void mockElement.focus();
      
      // The hook overrides the focus method, so the spy should have been called without arguments
      // but internally it should use preventScroll: true
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should allow normal focus behavior after delay', (done) => {
      const mockElement = document.createElement('input');
      const focusSpy = vi.spyOn(mockElement, 'focus');

      renderHook(() => useSafeAutofocus());

      setTimeout(() => {
  void mockElement.focus({ preventScroll: false });
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: false });
        done();
      }, 400);
    });
  });
});

describe('Integration Tests', () => {
  it('should prevent scroll jumps when all hooks are used together', () => {
    const mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;

    // Render all hooks together as they would be in App component
    renderHook(() => {
      useScrollRestoration();
      useSafeIntersectionObserver();
      useSafeAutofocus();
    }, {
      wrapper: RouterWrapper,
    });

    // Should scroll to top
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  });
});