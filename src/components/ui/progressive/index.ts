// Progressive loading components
export {
  ProgressiveLoader,
  ProgressiveCoachLoader,
  ProgressivePostLoader,
  type ProgressiveLoaderProps,
  type CoachListLoaderProps,
  type PostListLoaderProps
} from './ProgressiveLoader';

// Progressive image components
export {
  ProgressiveImage,
  ProgressiveAvatar,
  ProgressiveHeroImage,
  type ProgressiveImageProps,
  type ProgressiveAvatarProps,
  type ProgressiveHeroImageProps
} from './ProgressiveImage';

// Loading provider and context
export {
  LoadingProvider,
  useLoadingContext,
  useNetworkAwareLoading
} from './LoadingProvider';

// Progress and overlay components
export {
  ProgressBar,
  LoadingOverlay,
  PageLoadingOverlay,
  SectionLoadingOverlay,
  InlineLoadingOverlay,
  LoadingStates,
  type ProgressBarProps,
  type LoadingOverlayProps,
  type LoadingStatesProps
} from './ProgressBar';

// Re-export hooks for convenience
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

// Re-export types
export type {
  LoadingState,
  LoadingPriority,
  LoadingStrategy,
  NetworkQuality,
  LoadingOptions,
  LoadingContext,
  ProgressiveLoadingConfig,
  ImageLoadingConfig,
  LoadingAnalytics,
  GlobalLoadingState,
  UseLoadingReturn,
  UseSkeletonReturn,
  UseProgressiveLoadingReturn,
  UseImageLoadingReturn
} from '../../../types/loading';