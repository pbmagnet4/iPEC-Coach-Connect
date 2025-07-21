// Accessibility-focused loading components
export {
  AccessibleLoading,
  LoadingAnnouncer,
  LoadingSkipLink,
  AccessibleProgress,
  HighContrastLoading,
  ReducedMotionLoading,
  type AccessibleLoadingProps,
  type LoadingAnnouncerProps,
  type LoadingSkipLinkProps,
  type AccessibleProgressProps,
  type HighContrastLoadingProps,
  type ReducedMotionLoadingProps
} from './AccessibleLoading';

// Re-export all skeleton components
export * from '../skeleton';

// Re-export all progressive loading components
export * from '../progressive';

// Re-export the original loading spinner for backward compatibility
export {
  LoadingSpinner,
  PageLoadingSpinner,
  InlineLoadingSpinner
} from '../LoadingSpinner';

// Re-export all hooks
export {
  useLoadingState,
  useSkeletonLoading,
  useProgressiveLoading
} from '../../../hooks/useLoadingState';

export {
  useImageLoading,
  useLazyImage,
  useImageGallery,
  generateBlurDataURL,
  createResponsiveSources
} from '../../../hooks/useImageLoading';

// Re-export all types
export type * from '../../../types/loading';