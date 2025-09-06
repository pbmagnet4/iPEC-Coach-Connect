import React, { useEffect, useRef, useState } from 'react';
import { useImageLoading, useLazyImage } from '../../../hooks/useImageLoading';
import { ImageLoadingConfig } from '../../../types/loading';
import { BaseSkeleton } from '../skeleton/BaseSkeleton';

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  blurDataURL?: string;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  quality?: number;
  priority?: boolean;
  lazy?: boolean;
  fadeInDuration?: number;
  showProgress?: boolean;
  fallbackSrc?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  containerClassName?: string;
  'data-testid'?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  blurDataURL,
  placeholder = 'skeleton',
  quality = 75,
  priority = false,
  lazy = true,
  fadeInDuration = 300,
  showProgress = false,
  fallbackSrc,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  onProgress,
  className = '',
  containerClassName = '',
  'data-testid': testId,
  style,
  ...imgProps
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use lazy loading if enabled
  const lazyImageResult = useLazyImage(
    currentSrc,
    {
      threshold,
      rootMargin,
      enabled: lazy,
      blurDataURL,
      placeholder,
      quality,
      priority,
      fadeInDuration
    }
  );

  // Use regular image loading if lazy loading is disabled
  const regularImageResult = useImageLoading(
    lazy ? '' : currentSrc,
    {
      blurDataURL,
      placeholder,
      quality,
      priority,
      fadeInDuration
    }
  );

  // Choose the appropriate result based on lazy loading setting
  const imageResult = lazy ? lazyImageResult : regularImageResult;

  // Handle error with fallback
  useEffect(() => {
    if (imageResult.error && fallbackSrc && !hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  }, [imageResult.error, fallbackSrc, hasError]);

  // Handle callbacks
  useEffect(() => {
    if (imageResult.loaded && onLoad) {
      onLoad();
    }
  }, [imageResult.loaded, onLoad]);

  useEffect(() => {
    if (imageResult.error && onError) {
      onError(new Error(`Failed to load image: ${src}`));
    }
  }, [imageResult.error, onError, src]);

  useEffect(() => {
    if (onProgress) {
      onProgress(imageResult.progress);
    }
  }, [imageResult.progress, onProgress]);

  // Generate image styles with transition
  const imageStyles: React.CSSProperties = {
    ...style,
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    opacity: imageResult.loaded ? 1 : (placeholder === 'blur' && blurDataURL ? 0.7 : 0),
    filter: imageResult.loaded ? 'none' : (placeholder === 'blur' ? 'blur(10px)' : 'none'),
    transform: imageResult.loaded ? 'scale(1)' : 'scale(1.02)',
    ...style
  };

  // Handle skeleton placeholder
  if (!lazy || (lazy && imageResult.shouldLoad)) {
    if (placeholder === 'skeleton' && imageResult.loading) {
      return (
        <div 
          ref={lazy ? lazyImageResult.containerRef : containerRef} 
          className={containerClassName}
          data-testid={testId}
        >
          <BaseSkeleton
            loading={true}
            type="image"
            className={`w-full h-full ${className}`}
            height={imgProps.height}
            width={imgProps.width}
          >
            <div />
          </BaseSkeleton>
        </div>
      );
    }

    return (
      <div 
        ref={lazy ? lazyImageResult.containerRef : containerRef}
        className={`relative overflow-hidden ${containerClassName}`}
        data-testid={testId}
      >
        {/* Progress bar */}
        {showProgress && imageResult.loading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 z-10">
            <div 
              className="h-full bg-brand-600 transition-all duration-300 ease-out"
              style={{ width: `${imageResult.progress}%` }}
            />
          </div>
        )}

        {/* Blur placeholder */}
        {placeholder === 'blur' && blurDataURL && !imageResult.loaded && (
          <img
            src={blurDataURL}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${className}`}
            style={{
              filter: 'blur(10px)',
              transform: 'scale(1.1)'
            }}
            aria-hidden="true"
          />
        )}

        {/* Main image */}
        <img
          {...imgProps}
          ref={imageResult.imageRef}
          src={imageResult.src}
          alt={alt}
          className={className}
          style={imageStyles}
          onLoad={() => {
            // Additional onLoad handling if needed
          }}
          onError={() => {
            // Additional onError handling if needed
          }}
        />

        {/* Error state */}
        {imageResult.error && !fallbackSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-sm">Image unavailable</p>
            </div>
          </div>
        )}

        {/* Loading overlay for non-skeleton placeholder */}
        {placeholder === 'empty' && imageResult.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        )}
      </div>
    );
  }

  // Return empty container for lazy images that shouldn't load yet
  return (
    <div 
      ref={lazyImageResult.containerRef}
      className={`${containerClassName} ${className}`}
      data-testid={testId}
      style={{ minHeight: imgProps.height || 'auto' }}
    />
  );
};

// Avatar component with progressive loading
export interface ProgressiveAvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initials?: string;
  fallbackSrc?: string;
  priority?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const ProgressiveAvatar: React.FC<ProgressiveAvatarProps> = ({
  src,
  alt,
  size = 'md',
  initials,
  fallbackSrc,
  priority = false,
  className = '',
  'data-testid': testId
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const [showInitials, setShowInitials] = useState(false);

  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      data-testid={testId}
    >
      {/* Initials fallback */}
      {showInitials && initials && (
        <span className="font-medium text-gray-600 select-none">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}

      {/* Progressive image */}
      <ProgressiveImage
        src={src}
        alt={alt}
        fallbackSrc={fallbackSrc}
        priority={priority}
        placeholder="empty"
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setShowInitials(true)}
        style={{ borderRadius: 'inherit' }}
      />
    </div>
  );
};

// Hero image component with progressive loading
export interface ProgressiveHeroImageProps {
  src: string;
  alt: string;
  blurDataURL?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const ProgressiveHeroImage: React.FC<ProgressiveHeroImageProps> = ({
  src,
  alt,
  blurDataURL,
  overlay = false,
  overlayOpacity = 0.4,
  children,
  className = '',
  'data-testid': testId
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`} data-testid={testId}>
      <ProgressiveImage
        src={src}
        alt={alt}
        blurDataURL={blurDataURL}
        placeholder="blur"
        priority={true}
        lazy={false}
        className="w-full h-full object-cover"
        showProgress={true}
      />
      
      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* Content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};