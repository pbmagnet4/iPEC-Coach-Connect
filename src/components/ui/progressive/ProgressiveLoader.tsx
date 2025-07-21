import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useProgressiveLoading } from '../../../hooks/useLoadingState';
import { BaseSkeleton } from '../skeleton/BaseSkeleton';

export interface ProgressiveLoaderProps<T = any> {
  loadFunction: (page: number, limit: number) => Promise<T[]>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: (count: number) => React.ReactNode;
  itemsPerPage?: number;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  className?: string;
  containerClassName?: string;
  loadingClassName?: string;
  emptyStateComponent?: React.ReactNode;
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
  loadMoreComponent?: (loadMore: () => void, loading: boolean) => React.ReactNode;
  onItemsLoaded?: (items: T[], totalCount: number) => void;
  onError?: (error: Error) => void;
  'data-testid'?: string;
}

export function ProgressiveLoader<T = any>({
  loadFunction,
  renderItem,
  renderSkeleton,
  itemsPerPage = 20,
  threshold = 0.1,
  rootMargin = '50px',
  enabled = true,
  className = '',
  containerClassName = '',
  loadingClassName = '',
  emptyStateComponent,
  errorComponent,
  loadMoreComponent,
  onItemsLoaded,
  onError,
  'data-testid': testId
}: ProgressiveLoaderProps<T>) {
  const {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    containerRef,
    createSentinel
  } = useProgressiveLoading(loadFunction, {
    itemsPerPage,
    threshold,
    rootMargin,
    enabled
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Handle items loaded callback
  useEffect(() => {
    if (items.length > 0 && onItemsLoaded) {
      onItemsLoaded(items, items.length);
    }
  }, [items, onItemsLoaded]);

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle initial load completion
  useEffect(() => {
    if (initialLoad && !loading) {
      setInitialLoad(false);
    }
  }, [loading, initialLoad]);

  // Set up intersection observer for load more
  useEffect(() => {
    if (!enabled || !hasMore || loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
        root: containerRef.current
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, loading, loadMore, threshold, rootMargin]);

  // Default skeleton renderer
  const defaultSkeletonRenderer = useCallback((count: number) => (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <BaseSkeleton
          key={`skeleton-${index}`}
          loading={true}
          type="custom"
          height={80}
          className="w-full rounded-lg"
        >
          <div />
        </BaseSkeleton>
      ))}
    </div>
  ), []);

  // Default error component
  const defaultErrorComponent = useCallback((error: Error, retry: () => void) => (
    <div className="text-center py-8">
      <div className="text-red-600 mb-4">
        <p className="font-medium">Error loading content</p>
        <p className="text-sm text-gray-600">{error.message}</p>
      </div>
      <button
        onClick={retry}
        className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  ), []);

  // Default empty state
  const defaultEmptyState = (
    <div className="text-center py-12">
      <div className="text-gray-500">
        <p className="text-lg font-medium">No items found</p>
        <p className="text-sm">Check back later for new content.</p>
      </div>
    </div>
  );

  // Default load more component
  const defaultLoadMoreComponent = useCallback((loadMoreFn: () => void, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
            <span className="text-gray-600">Loading more...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <button
          onClick={loadMoreFn}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Load More
        </button>
      </div>
    );
  }, []);

  return (
    <div className={containerClassName} ref={containerRef} data-testid={testId}>
      {/* Main content */}
      <div className={className}>
        {/* Items */}
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}

        {/* Initial loading state */}
        {initialLoad && loading && (
          <div className={loadingClassName}>
            {renderSkeleton ? renderSkeleton(itemsPerPage) : defaultSkeletonRenderer(itemsPerPage)}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          errorComponent ? errorComponent(error, reset) : defaultErrorComponent(error, reset)
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          emptyStateComponent || defaultEmptyState
        )}

        {/* Load more trigger */}
        {!initialLoad && hasMore && (
          <>
            {loadMoreComponent ? loadMoreComponent(loadMore, loading) : defaultLoadMoreComponent(loadMore, loading)}
            {/* Invisible sentinel for automatic loading */}
            <div
              ref={sentinelRef}
              className="h-1 w-full"
              style={{ visibility: 'hidden' }}
              aria-hidden="true"
            />
          </>
        )}

        {/* End of list indicator */}
        {!loading && !hasMore && items.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">You've reached the end of the list</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized progressive loaders for common use cases
export interface CoachListLoaderProps {
  loadCoaches: (page: number, limit: number) => Promise<any[]>;
  renderCoach: (coach: any, index: number) => React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const ProgressiveCoachLoader: React.FC<CoachListLoaderProps> = ({
  loadCoaches,
  renderCoach,
  className = 'space-y-6',
  'data-testid': testId
}) => (
  <ProgressiveLoader
    loadFunction={loadCoaches}
    renderItem={renderCoach}
    className={className}
    data-testid={testId}
    renderSkeleton={(count) => (
      <div className="space-y-6">
        {Array.from({ length: count }, (_, index) => (
          <BaseSkeleton
            key={`coach-skeleton-${index}`}
            loading={true}
            type="custom"
            height={200}
            className="w-full rounded-lg"
          >
            <div />
          </BaseSkeleton>
        ))}
      </div>
    )}
  />
);

export interface PostListLoaderProps {
  loadPosts: (page: number, limit: number) => Promise<any[]>;
  renderPost: (post: any, index: number) => React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const ProgressivePostLoader: React.FC<PostListLoaderProps> = ({
  loadPosts,
  renderPost,
  className = 'space-y-4',
  'data-testid': testId
}) => (
  <ProgressiveLoader
    loadFunction={loadPosts}
    renderItem={renderPost}
    className={className}
    data-testid={testId}
    renderSkeleton={(count) => (
      <div className="space-y-4">
        {Array.from({ length: count }, (_, index) => (
          <div key={`post-skeleton-${index}`} className="bg-white border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <BaseSkeleton loading={true} type="custom" height={40} width={40} className="rounded-full">
                <div />
              </BaseSkeleton>
              <div className="flex-1 space-y-1">
                <BaseSkeleton loading={true} type="custom" height={16} width="30%">
                  <div />
                </BaseSkeleton>
                <BaseSkeleton loading={true} type="custom" height={14} width="20%">
                  <div />
                </BaseSkeleton>
              </div>
            </div>
            <div className="space-y-2">
              <BaseSkeleton loading={true} type="custom" height={16} width="90%">
                <div />
              </BaseSkeleton>
              <BaseSkeleton loading={true} type="custom" height={16} width="75%">
                <div />
              </BaseSkeleton>
            </div>
          </div>
        ))}
      </div>
    )}
  />
);