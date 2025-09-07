import React from 'react';
import { AvatarSkeleton, BaseSkeleton, ButtonSkeleton, ImageSkeleton, TextSkeleton } from './BaseSkeleton';
import { Card } from '../Card';

export interface CoachCardSkeletonProps {
  loading: boolean;
  count?: number;
  variant?: 'card' | 'list' | 'grid';
  showRating?: boolean;
  showPrice?: boolean;
  showSpecialty?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const CoachCardSkeleton: React.FC<CoachCardSkeletonProps> = ({
  loading,
  count = 1,
  variant = 'card',
  showRating = true,
  showPrice = true,
  showSpecialty = true,
  className = '',
  'data-testid': testId
}) => {
  const _renderSingleSkeleton = (index: number) => {
    if (variant === 'list') {
      return (
        <div 
          key={`coach-skeleton-${index}`}
          className={`flex items-center space-x-4 p-4 bg-white rounded-lg border ${className}`}
          data-testid={testId ? `${testId}-${index}` : undefined}
        >
          {/* Avatar */}
          <AvatarSkeleton loading={loading} size="lg">
            <div />
          </AvatarSkeleton>
          
          <div className="flex-1 space-y-2">
            {/* Name */}
            <TextSkeleton loading={loading} height={20} width="60%">
              <div />
            </TextSkeleton>
            
            {/* Specialty */}
            {showSpecialty && (
              <TextSkeleton loading={loading} height={16} width="80%">
                <div />
              </TextSkeleton>
            )}
            
            {/* Rating */}
            {showRating && (
              <div className="flex items-center space-x-2">
                <TextSkeleton loading={loading} height={16} width={20}>
                  <div />
                </TextSkeleton>
                <TextSkeleton loading={loading} height={16} width={40}>
                  <div />
                </TextSkeleton>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {/* Price */}
            {showPrice && (
              <TextSkeleton loading={loading} height={20} width={80}>
                <div />
              </TextSkeleton>
            )}
            
            {/* Button */}
            <ButtonSkeleton loading={loading} width={100} height={36}>
              <div />
            </ButtonSkeleton>
          </div>
        </div>
      );
    }

    return (
      <Card 
        key={`coach-skeleton-${index}`} 
        className={className}
        data-testid={testId ? `${testId}-${index}` : undefined}
      >
        {/* Coach Image */}
        <ImageSkeleton loading={loading} height={192} className="w-full">
          <div />
        </ImageSkeleton>
        
        <Card.Body>
          {/* Coach Name and Rating Row */}
          <div className="flex items-center justify-between mb-2">
            <TextSkeleton loading={loading} height={24} width="60%">
              <div />
            </TextSkeleton>
            
            {showRating && (
              <div className="flex items-center space-x-1">
                <TextSkeleton loading={loading} height={16} width={16}>
                  <div />
                </TextSkeleton>
                <TextSkeleton loading={loading} height={16} width={24}>
                  <div />
                </TextSkeleton>
              </div>
            )}
          </div>
          
          {/* Specialty */}
          {showSpecialty && (
            <TextSkeleton loading={loading} height={16} width="90%" className="mb-4">
              <div />
            </TextSkeleton>
          )}
          
          {/* Price and Button Row */}
          <div className="flex items-center justify-between">
            {showPrice && (
              <TextSkeleton loading={loading} height={20} width={100}>
                <div />
              </TextSkeleton>
            )}
            
            <ButtonSkeleton loading={loading} width={100} height={36}>
              <div />
            </ButtonSkeleton>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (count === 1) {
    return renderSingleSkeleton(0);
  }

  const _containerClasses = variant === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'space-y-4';

  return (
    <div className={containerClasses} data-testid={testId}>
      {Array.from({ length: count }, (_, index) => renderSingleSkeleton(index))}
    </div>
  );
};

// Specialized variants
export const FeaturedCoachSkeleton: React.FC<Omit<CoachCardSkeletonProps, 'variant'>> = (props) => (
  <CoachCardSkeleton {...props} variant="card" showRating={true} showPrice={true} showSpecialty={true} />
);

export const CoachListItemSkeleton: React.FC<Omit<CoachCardSkeletonProps, 'variant'>> = (props) => (
  <CoachCardSkeleton {...props} variant="list" />
);

export const CoachGridSkeleton: React.FC<Omit<CoachCardSkeletonProps, 'variant'>> = (props) => (
  <CoachCardSkeleton {...props} variant="grid" />
);