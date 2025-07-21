import React, { Suspense, lazy } from 'react';
import { LoadingSpinner, InlineLoadingSpinner } from './ui/LoadingSpinner';

// Lazy load heavy components that are not immediately visible
// Home page sections - loaded when needed
export const LazyFeaturedCoaches = lazy(() => 
  import('./sections/FeaturedCoaches').then(module => ({ 
    default: module.FeaturedCoaches 
  }))
);

export const LazyTestimonials = lazy(() => 
  import('./sections/Testimonials').then(module => ({ 
    default: module.Testimonials 
  }))
);

export const LazyHowItWorks = lazy(() => 
  import('./sections/HowItWorks').then(module => ({ 
    default: module.HowItWorks 
  }))
);

export const LazyBenefits = lazy(() => 
  import('./sections/Benefits').then(module => ({ 
    default: module.Benefits 
  }))
);

export const LazyCommunityHighlights = lazy(() => 
  import('./sections/CommunityHighlights').then(module => ({ 
    default: module.CommunityHighlights 
  }))
);

export const LazyNewsletter = lazy(() => 
  import('./sections/Newsletter').then(module => ({ 
    default: module.Newsletter 
  }))
);

// Heavy form components
export const LazyEnhancedAuthForm = lazy(() => 
  import('./auth/EnhancedAuthForm').then(module => ({ 
    default: module.EnhancedAuthForm 
  }))
);

export const LazyGoogleSignInButton = lazy(() => 
  import('./GoogleSignInButton').then(module => ({ 
    default: module.GoogleSignInButton 
  }))
);

// Development and debugging components
export const LazyDevTools = lazy(() => 
  import('./DevTools').then(module => ({ 
    default: module.DevTools 
  }))
);

export const LazyMemoryMonitor = lazy(() => 
  import('./MemoryMonitor').then(module => ({ 
    default: module.MemoryMonitor 
  }))
);

export const LazyCacheDemo = lazy(() => 
  import('./CacheDemo').then(module => ({ 
    default: module.CacheDemo 
  }))
);

// Notification system
export const LazyNotificationCenter = lazy(() => 
  import('./NotificationCenter').then(module => ({ 
    default: module.NotificationCenter 
  }))
);

// HOC for wrapping lazy components with suspense
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback?: React.ReactNode
) => {
  const LazyWrapper: React.FC<P> = (props) => (
    <Suspense fallback={fallback || <InlineLoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = `withLazyLoading(${LazyComponent.displayName || 'Component'})`;
  return LazyWrapper;
};

// Intersection Observer based lazy loading for components
export const withIntersectionLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  options?: IntersectionObserverInit
) => {
  const IntersectionLazyWrapper: React.FC<P> = (props) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {isIntersecting ? (
          <Suspense fallback={<InlineLoadingSpinner />}>
            <LazyComponent {...props} />
          </Suspense>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 h-32 w-full rounded-lg"></div>
          </div>
        )}
      </div>
    );
  };

  IntersectionLazyWrapper.displayName = `withIntersectionLoading(${LazyComponent.displayName || 'Component'})`;
  return IntersectionLazyWrapper;
};

// Preload components for better UX
export const preloadComponent = (
  LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>
) => {
  const componentImport = LazyComponent._payload?._result;
  if (!componentImport) {
    LazyComponent._payload?._result;
  }
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload auth forms since they're likely to be needed
  import('./auth/EnhancedAuthForm');
  import('./GoogleSignInButton');
  
  // Preload notification center for better UX
  import('./NotificationCenter');
};

// Auto-preload on idle
if (typeof window !== 'undefined') {
  requestIdleCallback(() => {
    preloadCriticalComponents();
  });
}

// Optimized lazy components with proper error boundaries
export const OptimizedLazyFeaturedCoaches = withLazyLoading(LazyFeaturedCoaches);
export const OptimizedLazyTestimonials = withLazyLoading(LazyTestimonials);
export const OptimizedLazyHowItWorks = withLazyLoading(LazyHowItWorks);
export const OptimizedLazyBenefits = withLazyLoading(LazyBenefits);
export const OptimizedLazyCommunityHighlights = withLazyLoading(LazyCommunityHighlights);
export const OptimizedLazyNewsletter = withLazyLoading(LazyNewsletter);

// Intersection-based lazy loading for below-the-fold components
export const IntersectionLazyFeaturedCoaches = withIntersectionLoading(LazyFeaturedCoaches);
export const IntersectionLazyTestimonials = withIntersectionLoading(LazyTestimonials);
export const IntersectionLazyBenefits = withIntersectionLoading(LazyBenefits);
export const IntersectionLazyCommunityHighlights = withIntersectionLoading(LazyCommunityHighlights);
export const IntersectionLazyNewsletter = withIntersectionLoading(LazyNewsletter);