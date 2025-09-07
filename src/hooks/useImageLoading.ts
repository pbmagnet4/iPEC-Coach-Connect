import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImageLoadingConfig, UseImageLoadingReturn } from '../types/loading';

// Hook for advanced image loading with blur-to-sharp transitions
export function useImageLoading(
  src: string,
  config: ImageLoadingConfig = {}
): UseImageLoadingReturn {
  const {
    blurDataURL,
    placeholder = 'blur',
    quality = 75,
    priority = false,
    fadeInDuration = 300
  } = config;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(blurDataURL || '');

  const imageRef = useRef<HTMLImageElement>(null);
  const progressRef = useRef<number>(0);

  // Create image loading function
  const loadImage = useCallback((imageSrc: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Track loading progress (simulated for better UX)
      const progressInterval = setInterval(() => {
        progressRef.current = Math.min(progressRef.current + Math.random() * 20, 90);
        setProgress(progressRef.current);
      }, 100);

      img.onload = () => {
        clearInterval(progressInterval);
        setProgress(100);
        resolve(img);
      };

      img.onerror = () => {
        clearInterval(progressInterval);
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };

      // Start loading
      img.src = imageSrc;
    });
  }, []);

  // Load image with quality optimization
  const optimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc) return originalSrc;
    
    // For external URLs, we can't modify quality, but we can add loading hints
    if (originalSrc.startsWith('http')) {
      const url = new URL(originalSrc);
      
      // Add quality parameter for services that support it (like Unsplash)
      if (url.hostname.includes('unsplash') || url.hostname.includes('images.unsplash')) {
        url.searchParams.set('q', quality.toString());
        url.searchParams.set('auto', 'format');
        url.searchParams.set('fit', 'crop');
      }
      
      return url.toString();
    }
    
    return originalSrc;
  }, [quality]);

  // Main loading effect
  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    setLoaded(false);
    progressRef.current = 0;
    setProgress(0);

    // Start with blur placeholder if available
    if (blurDataURL && placeholder === 'blur') {
      setCurrentSrc(blurDataURL);
    }

    const optimizedImageSrc = optimizedSrc(src);

    loadImage(optimizedImageSrc)
      .then((img) => {
        // Smooth transition from blur to sharp
        if (blurDataURL && placeholder === 'blur') {
          // Create transition effect
          setTimeout(() => {
            setCurrentSrc(optimizedImageSrc);
            setLoaded(true);
            setLoading(false);
          }, 50);
        } else {
          setCurrentSrc(optimizedImageSrc);
          setLoaded(true);
          setLoading(false);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
        setProgress(0);
      });
  }, [src, blurDataURL, placeholder, loadImage, optimizedSrc]);

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc(src);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, optimizedSrc]);

  return {
    src: currentSrc,
    loading,
    error,
    loaded,
    progress,
    imageRef
  };
}

// Hook for lazy loading images with intersection observer
export function useLazyImage(
  src: string,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } & ImageLoadingConfig = {}
) {
  const { threshold = 0.1, rootMargin = '50px', enabled = true, ...imageConfig } = options;
  
  const [shouldLoad, setShouldLoad] = useState(!enabled);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Set up intersection observer
  useEffect(() => {
    if (!enabled || shouldLoad) return;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldLoad(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(currentContainer);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, shouldLoad, threshold, rootMargin]);

  const imageLoading = useImageLoading(shouldLoad ? src : '', imageConfig);

  return {
    ...imageLoading,
    containerRef,
    isVisible,
    shouldLoad
  };
}

// Hook for image gallery with preloading
export function useImageGallery(
  images: string[],
  options: {
    preloadCount?: number;
    currentIndex?: number;
  } = {}
) {
  const { preloadCount = 3, currentIndex = 0 } = options;
  
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Map<number, boolean>>(new Map());

  // Preload images around current index
  useEffect(() => {
    const indicesToPreload: number[] = [];
    
    // Preload current and surrounding images
    for (let i = Math.max(0, currentIndex - preloadCount); 
         i <= Math.min(images.length - 1, currentIndex + preloadCount); 
         i++) {
      if (!preloadedImages.has(i)) {
  void indicesToPreload.push(i);
      }
    }

    indicesToPreload.forEach(async (index) => {
      if (preloadedImages.has(index)) return;

      setLoadingStates(prev => new Map(prev).set(index, true));

      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = images[index];
        });

        setPreloadedImages(prev => new Set(prev).add(index));
      } catch (error) {
  void console.warn(`Failed to preload image at index ${index}:`, error);
      } finally {
        setLoadingStates(prev => {
          const newMap = new Map(prev);
  void newMap.set(index, false);
          return newMap;
        });
      }
    });
  }, [currentIndex, images, preloadCount, preloadedImages]);

  const isImageLoaded = useCallback((index: number) => {
    return preloadedImages.has(index);
  }, [preloadedImages]);

  const isImageLoading = useCallback((index: number) => {
    return loadingStates.get(index) || false;
  }, [loadingStates]);

  return {
    isImageLoaded,
    isImageLoading,
    preloadedCount: preloadedImages.size
  };
}

// Utility function to generate blur data URL from image
export function generateBlurDataURL(
  width = 8,
  height = 8,
  color = '#f3f4f6'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = color;
  void ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// Utility function to create responsive image sources
export function createResponsiveSources(
  baseSrc: string,
  breakpoints: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }
): string {
  const sources = Object.entries(breakpoints)
    .map(([name, width]) => `${baseSrc}?w=${width} ${width}w`)
    .join(', ');
  
  return sources;
}