// Advanced preloading and dynamic import strategies
// This file implements intelligent resource preloading for optimal performance

// Critical resource preloading with priority queues
interface PreloadResource {
  url: string;
  type: 'script' | 'style' | 'font' | 'image';
  priority: 'high' | 'medium' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

interface DynamicImportCache {
  [key: string]: Promise<any>;
}

// Cache for dynamic imports to prevent duplicate requests
const importCache: DynamicImportCache = {};

// Performance budget thresholds
const PERFORMANCE_BUDGETS = {
  // Maximum chunk sizes (in KB)
  INITIAL_CHUNK_SIZE: 500,
  ROUTE_CHUNK_SIZE: 250,
  VENDOR_CHUNK_SIZE: 800,
  
  // Network timing thresholds
  FAST_CONNECTION_THRESHOLD: 1000, // 1 second
  SLOW_CONNECTION_THRESHOLD: 3000, // 3 seconds
  
  // Cache strategies
  CACHE_STRATEGY_AGGRESSIVE: 'aggressive',
  CACHE_STRATEGY_CONSERVATIVE: 'conservative'
};

// Network-aware loading strategies
class NetworkAwareLoader {
  private connection: any;
  private strategy: 'aggressive' | 'conservative' = 'conservative';
  
  constructor() {
    // @ts-ignore - Navigator.connection is experimental
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.updateStrategy();
  }
  
  private updateStrategy() {
    if (this.connection) {
      const { effectiveType, downlink, saveData } = this.connection;
      
      if (saveData) {
        this.strategy = 'conservative';
      } else if (effectiveType === '4g' && downlink > 2) {
        this.strategy = 'aggressive';
      } else {
        this.strategy = 'conservative';
      }
    }
  }
  
  shouldPreload(priority: 'high' | 'medium' | 'low'): boolean {
    this.updateStrategy();
    
    if (this.strategy === 'aggressive') {
      return true;
    }
    
    // Conservative loading: only preload high priority resources
    return priority === 'high';
  }
  
  getLoadingStrategy(): 'aggressive' | 'conservative' {
    return this.strategy;
  }
}

const networkLoader = new NetworkAwareLoader();

// Preload critical resources with intelligent prioritization
export const preloadResource = (resource: PreloadResource): void => {
  if (!networkLoader.shouldPreload(resource.priority)) {
    return;
  }
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = resource.url;
  link.as = resource.type;
  
  if (resource.crossOrigin) {
    link.crossOrigin = resource.crossOrigin;
  }
  
  // Add to head
  document.head.appendChild(link);
};

// Critical CSS preloading
export const preloadCriticalCSS = (): void => {
  const criticalResources: PreloadResource[] = [
    {
      url: '/assets/css/critical.css',
      type: 'style',
      priority: 'high'
    }
  ];
  
  criticalResources.forEach(preloadResource);
};

// Font preloading with font-display optimization
export const preloadFonts = (): void => {
  const fonts: PreloadResource[] = [
    {
      url: '/assets/fonts/inter-variable.woff2',
      type: 'font',
      priority: 'high',
      crossOrigin: 'anonymous'
    },
    {
      url: '/assets/fonts/inter-medium.woff2',
      type: 'font',
      priority: 'medium',
      crossOrigin: 'anonymous'
    }
  ];
  
  fonts.forEach(preloadResource);
};

// Dynamic import with caching and error handling
export const dynamicImport = <T = any>(
  importFn: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> => {
  const key = importFn.toString();
  
  if (importCache[key]) {
    return importCache[key];
  }
  
  const importPromise = importFn().catch((error) => {
    console.error('Dynamic import failed:', error);
    delete importCache[key]; // Remove from cache on error
    
    if (fallback) {
      return fallback();
    }
    
    throw error;
  });
  
  importCache[key] = importPromise;
  return importPromise;
};

// Heavy library loaders with intelligent splitting
export const loadFramerMotion = () => {
  return dynamicImport(() => import('framer-motion'));
};

export const loadEmblaCarousel = () => {
  return dynamicImport(() => import('embla-carousel-react'));
};

export const loadStripe = () => {
  return dynamicImport(() => import('stripe'));
};

export const loadSupabaseClient = () => {
  return dynamicImport(() => import('@supabase/supabase-js'));
};

// Route-based preloading with intelligent prefetching
export const preloadRouteResources = (route: string): void => {
  // Skip preloading in development mode as chunk names are different
  if (import.meta.env.DEV) {
    return;
  }
  
  const routePreloadMap: Record<string, PreloadResource[]> = {
    '/': [
      { url: '/assets/images/hero-bg.webp', type: 'image', priority: 'high' },
      { url: '/assets/js/pages-core.js', type: 'script', priority: 'high' }
    ],
    '/coaches': [
      { url: '/assets/js/pages-coaching.js', type: 'script', priority: 'high' },
      { url: '/assets/js/components-sections.js', type: 'script', priority: 'medium' }
    ],
    '/community': [
      { url: '/assets/js/pages-community.js', type: 'script', priority: 'high' },
      { url: '/assets/js/components-ui.js', type: 'script', priority: 'medium' }
    ],
    '/learning': [
      { url: '/assets/js/pages-learning.js', type: 'script', priority: 'high' },
      { url: '/assets/js/animation-engine.js', type: 'script', priority: 'low' }
    ]
  };
  
  const resources = routePreloadMap[route];
  if (resources) {
    resources.forEach(preloadResource);
  }
};

// Intersection Observer for lazy loading optimization
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Image lazy loading with WebP support
export const loadImage = (src: string, alt: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Check for WebP support
    const supportsWebP = () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };
    
    // Use WebP if supported, otherwise fallback to original
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
    img.src = supportsWebP() ? webpSrc : src;
    img.alt = alt;
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback to original format on WebP error
      if (img.src === webpSrc) {
        img.src = src;
      } else {
        reject(new Error(`Failed to load image: ${src}`));
      }
    };
  });
};

// Progressive image loading with blur-up technique
export const loadProgressiveImage = (
  lowResSrc: string,
  highResSrc: string,
  container: HTMLElement
): void => {
  const lowResImg = new Image();
  const highResImg = new Image();
  
  lowResImg.onload = () => {
    lowResImg.style.filter = 'blur(5px)';
    lowResImg.style.transition = 'filter 0.3s';
    container.appendChild(lowResImg);
    
    highResImg.onload = () => {
      highResImg.style.opacity = '0';
      highResImg.style.transition = 'opacity 0.3s';
      container.appendChild(highResImg);
      
      // Fade in high-res image
      requestAnimationFrame(() => {
        highResImg.style.opacity = '1';
        lowResImg.style.filter = 'blur(0px)';
      });
    };
    
    highResImg.src = highResSrc;
  };
  
  lowResImg.src = lowResSrc;
};

// Bundle size monitoring and alerts
export const monitorBundleSize = (): void => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('.js')) {
          const size = (entry as any).transferSize;
          
          if (size > PERFORMANCE_BUDGETS.ROUTE_CHUNK_SIZE * 1024) {
            console.warn(`Large chunk detected: ${entry.name} (${Math.round(size / 1024)}KB)`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = (): void => {
  if (typeof window !== 'undefined') {
    // Monitor bundle sizes
    monitorBundleSize();
    
    // Monitor Core Web Vitals with runtime conditional loading
    // Using eval to avoid Vite static analysis
    const webVitalsPath = 'web-vitals';
    try {
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      dynamicImport(webVitalsPath).then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      }).catch(() => {
        console.info('Web Vitals library not available, using basic performance monitoring');
      });
    } catch (error) {
      console.info('Web Vitals monitoring disabled - package not installed');
    }
    
    // Preload critical resources
    preloadCriticalCSS();
    preloadFonts();
  }
};

// Export performance budgets for external use
export { PERFORMANCE_BUDGETS };