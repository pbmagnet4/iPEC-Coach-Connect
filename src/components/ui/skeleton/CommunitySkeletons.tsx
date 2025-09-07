import React from 'react';
import { AvatarSkeleton, BaseSkeleton, ButtonSkeleton, ImageSkeleton, TextSkeleton } from './BaseSkeleton';

// Message/Post Skeleton
export interface MessageSkeletonProps {
  loading: boolean;
  count?: number;
  variant?: 'message' | 'post' | 'comment';
  showAvatar?: boolean;
  showActions?: boolean;
  showTimestamp?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  loading,
  count = 1,
  variant = 'message',
  showAvatar = true,
  showActions = true,
  showTimestamp = true,
  className = '',
  'data-testid': testId
}) => {
  const _renderSingleSkeleton = (index: number) => {
    const _isComment = variant === 'comment';
    const _indentClass = isComment ? 'ml-8' : '';
    
    return (
      <div 
        key={`message-skeleton-${index}`}
        className={`flex space-x-3 p-4 ${indentClass} ${className}`}
        data-testid={testId ? `${testId}-${index}` : undefined}
      >
        {/* Avatar */}
        {showAvatar && (
          <AvatarSkeleton loading={loading} size={isComment ? 'sm' : 'md'}>
            <div />
          </AvatarSkeleton>
        )}
        
        <div className="flex-1 space-y-2">
          {/* Header with name and timestamp */}
          <div className="flex items-center space-x-2">
            <TextSkeleton loading={loading} height={16} width={120}>
              <div />
            </TextSkeleton>
            
            {showTimestamp && (
              <TextSkeleton loading={loading} height={14} width={80}>
                <div />
              </TextSkeleton>
            )}
          </div>
          
          {/* Message content */}
          <div className="space-y-2">
            <TextSkeleton loading={loading} height={16} width="90%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={16} width="75%">
              <div />
            </TextSkeleton>
            {variant === 'post' && (
              <TextSkeleton loading={loading} height={16} width="60%">
                <div />
              </TextSkeleton>
            )}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-4 pt-2">
              <ButtonSkeleton loading={loading} width={60} height={24}>
                <div />
              </ButtonSkeleton>
              <ButtonSkeleton loading={loading} width={60} height={24}>
                <div />
              </ButtonSkeleton>
              {variant === 'post' && (
                <ButtonSkeleton loading={loading} width={60} height={24}>
                  <div />
                </ButtonSkeleton>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (count === 1) {
    return renderSingleSkeleton(0);
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      {Array.from({ length: count }, (_, index) => renderSingleSkeleton(index))}
    </div>
  );
};

// Discussion/Forum Thread Skeleton
export interface DiscussionSkeletonProps {
  loading: boolean;
  count?: number;
  showStats?: boolean;
  showTags?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const DiscussionSkeleton: React.FC<DiscussionSkeletonProps> = ({
  loading,
  count = 1,
  showStats = true,
  showTags = true,
  className = '',
  'data-testid': testId
}) => {
  const _renderSingleSkeleton = (index: number) => (
    <div 
      key={`discussion-skeleton-${index}`}
      className={`bg-white border rounded-lg p-4 hover:bg-gray-50 ${className}`}
      data-testid={testId ? `${testId}-${index}` : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <AvatarSkeleton loading={loading} size="sm">
            <div />
          </AvatarSkeleton>
          
          <div className="flex-1 space-y-1">
            <TextSkeleton loading={loading} height={20} width="70%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={14} width="40%">
              <div />
            </TextSkeleton>
          </div>
        </div>
        
        <TextSkeleton loading={loading} height={14} width={60}>
          <div />
        </TextSkeleton>
      </div>
      
      {/* Content */}
      <div className="mb-3 space-y-2">
        <TextSkeleton loading={loading} height={16} width="95%">
          <div />
        </TextSkeleton>
        <TextSkeleton loading={loading} height={16} width="80%">
          <div />
        </TextSkeleton>
      </div>
      
      {/* Tags */}
      {showTags && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: 3 }, (_, tagIndex) => (
            <TextSkeleton 
              key={tagIndex}
              loading={loading} 
              height={20} 
              width={60}
              className="rounded-full"
            >
              <div />
            </TextSkeleton>
          ))}
        </div>
      )}
      
      {/* Stats */}
      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <TextSkeleton loading={loading} height={14} width={80}>
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={14} width={60}>
              <div />
            </TextSkeleton>
          </div>
          
          <TextSkeleton loading={loading} height={14} width={100}>
            <div />
          </TextSkeleton>
        </div>
      )}
    </div>
  );

  if (count === 1) {
    return renderSingleSkeleton(0);
  }

  return (
    <div className="space-y-4" data-testid={testId}>
      {Array.from({ length: count }, (_, index) => renderSingleSkeleton(index))}
    </div>
  );
};

// Event Card Skeleton
export interface EventSkeletonProps {
  loading: boolean;
  count?: number;
  variant?: 'card' | 'list';
  showImage?: boolean;
  showHost?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const EventSkeleton: React.FC<EventSkeletonProps> = ({
  loading,
  count = 1,
  variant = 'card',
  showImage = true,
  showHost = true,
  className = '',
  'data-testid': testId
}) => {
  const _renderSingleSkeleton = (index: number) => {
    if (variant === 'list') {
      return (
        <div 
          key={`event-skeleton-${index}`}
          className={`flex items-center space-x-4 p-4 bg-white border rounded-lg ${className}`}
          data-testid={testId ? `${testId}-${index}` : undefined}
        >
          {/* Date column */}
          <div className="text-center">
            <TextSkeleton loading={loading} height={16} width={40}>
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={20} width={32}>
              <div />
            </TextSkeleton>
          </div>
          
          <div className="flex-1 space-y-2">
            <TextSkeleton loading={loading} height={20} width="70%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={16} width="50%">
              <div />
            </TextSkeleton>
            
            {showHost && (
              <div className="flex items-center space-x-2">
                <AvatarSkeleton loading={loading} size="sm">
                  <div />
                </AvatarSkeleton>
                <TextSkeleton loading={loading} height={14} width={80}>
                  <div />
                </TextSkeleton>
              </div>
            )}
          </div>
          
          <ButtonSkeleton loading={loading} width={80} height={32}>
            <div />
          </ButtonSkeleton>
        </div>
      );
    }

    return (
      <div 
        key={`event-skeleton-${index}`}
        className={`bg-white border rounded-lg overflow-hidden ${className}`}
        data-testid={testId ? `${testId}-${index}` : undefined}
      >
        {/* Event Image */}
        {showImage && (
          <ImageSkeleton loading={loading} height={160} className="w-full">
            <div />
          </ImageSkeleton>
        )}
        
        <div className="p-4 space-y-3">
          {/* Date and time */}
          <div className="flex items-center space-x-2">
            <TextSkeleton loading={loading} height={14} width={60}>
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={14} width={80}>
              <div />
            </TextSkeleton>
          </div>
          
          {/* Title */}
          <TextSkeleton loading={loading} height={20} width="85%">
            <div />
          </TextSkeleton>
          
          {/* Description */}
          <div className="space-y-1">
            <TextSkeleton loading={loading} height={14} width="100%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={14} width="75%">
              <div />
            </TextSkeleton>
          </div>
          
          {/* Host info */}
          {showHost && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <AvatarSkeleton loading={loading} size="sm">
                  <div />
                </AvatarSkeleton>
                <TextSkeleton loading={loading} height={14} width={100}>
                  <div />
                </TextSkeleton>
              </div>
              
              <ButtonSkeleton loading={loading} width={80} height={32}>
                <div />
              </ButtonSkeleton>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (count === 1) {
    return renderSingleSkeleton(0);
  }

  const _containerClasses = variant === 'card'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'space-y-4';

  return (
    <div className={containerClasses} data-testid={testId}>
      {Array.from({ length: count }, (_, index) => renderSingleSkeleton(index))}
    </div>
  );
};

// Group Card Skeleton
export const GroupSkeleton: React.FC<EventSkeletonProps> = ({
  loading,
  count = 1,
  variant = 'card',
  showImage = true,
  className = '',
  'data-testid': testId
}) => {
  const _renderSingleSkeleton = (index: number) => (
    <div 
      key={`group-skeleton-${index}`}
      className={`bg-white border rounded-lg overflow-hidden ${className}`}
      data-testid={testId ? `${testId}-${index}` : undefined}
    >
      {/* Group Image */}
      {showImage && (
        <ImageSkeleton loading={loading} height={120} className="w-full">
          <div />
        </ImageSkeleton>
      )}
      
      <div className="p-4 space-y-3">
        {/* Group name */}
        <TextSkeleton loading={loading} height={20} width="80%">
          <div />
        </TextSkeleton>
        
        {/* Description */}
        <div className="space-y-1">
          <TextSkeleton loading={loading} height={14} width="100%">
            <div />
          </TextSkeleton>
          <TextSkeleton loading={loading} height={14} width="60%">
            <div />
          </TextSkeleton>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <TextSkeleton loading={loading} height={14} width={80}>
            <div />
          </TextSkeleton>
          <TextSkeleton loading={loading} height={14} width={60}>
            <div />
          </TextSkeleton>
        </div>
        
        {/* Join button */}
        <ButtonSkeleton loading={loading} width="100%" height={36}>
          <div />
        </ButtonSkeleton>
      </div>
    </div>
  );

  if (count === 1) {
    return renderSingleSkeleton(0);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid={testId}>
      {Array.from({ length: count }, (_, index) => renderSingleSkeleton(index))}
    </div>
  );
};