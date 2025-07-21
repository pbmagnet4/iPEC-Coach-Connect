import React from 'react';
import { BaseSkeleton, ImageSkeleton, TextSkeleton, ButtonSkeleton, AvatarSkeleton } from './BaseSkeleton';

export interface ProfileSkeletonProps {
  loading: boolean;
  variant?: 'detailed' | 'summary' | 'card';
  showBio?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showCertifications?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({
  loading,
  variant = 'detailed',
  showBio = true,
  showStats = true,
  showActions = true,
  showCertifications = true,
  className = '',
  'data-testid': testId
}) => {
  if (variant === 'summary') {
    return (
      <div 
        className={`flex items-center space-x-4 p-4 ${className}`}
        data-testid={testId}
      >
        <AvatarSkeleton loading={loading} size="md">
          <div />
        </AvatarSkeleton>
        
        <div className="flex-1 space-y-1">
          <TextSkeleton loading={loading} height={20} width="40%">
            <div />
          </TextSkeleton>
          <TextSkeleton loading={loading} height={16} width="60%">
            <div />
          </TextSkeleton>
        </div>
        
        {showActions && (
          <ButtonSkeleton loading={loading} width={80} height={32}>
            <div />
          </ButtonSkeleton>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div 
        className={`bg-white rounded-lg border p-6 ${className}`}
        data-testid={testId}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <AvatarSkeleton loading={loading} size="lg">
              <div />
            </AvatarSkeleton>
            
            <div className="space-y-2">
              <TextSkeleton loading={loading} height={24} width={160}>
                <div />
              </TextSkeleton>
              <TextSkeleton loading={loading} height={16} width={200}>
                <div />
              </TextSkeleton>
            </div>
          </div>
          
          {showActions && (
            <ButtonSkeleton loading={loading} width={100} height={36}>
              <div />
            </ButtonSkeleton>
          )}
        </div>
        
        {/* Bio */}
        {showBio && (
          <div className="mb-4 space-y-2">
            <TextSkeleton loading={loading} height={16} width="100%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={16} width="85%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={16} width="70%">
              <div />
            </TextSkeleton>
          </div>
        )}
        
        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="text-center">
                <TextSkeleton loading={loading} height={24} width={40} className="mx-auto mb-1">
                  <div />
                </TextSkeleton>
                <TextSkeleton loading={loading} height={14} width={60} className="mx-auto">
                  <div />
                </TextSkeleton>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`space-y-6 ${className}`} data-testid={testId}>
      {/* Header Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <AvatarSkeleton loading={loading} size="xl">
              <div />
            </AvatarSkeleton>
            
            <div className="space-y-3">
              <TextSkeleton loading={loading} height={32} width={240}>
                <div />
              </TextSkeleton>
              <TextSkeleton loading={loading} height={18} width={300}>
                <div />
              </TextSkeleton>
              <TextSkeleton loading={loading} height={16} width={200}>
                <div />
              </TextSkeleton>
            </div>
          </div>
          
          {showActions && (
            <div className="flex space-x-3 mt-4 md:mt-0">
              <ButtonSkeleton loading={loading} width={120} height={40}>
                <div />
              </ButtonSkeleton>
              <ButtonSkeleton loading={loading} width={100} height={40}>
                <div />
              </ButtonSkeleton>
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-200">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="text-center">
                <TextSkeleton loading={loading} height={28} width={48} className="mx-auto mb-2">
                  <div />
                </TextSkeleton>
                <TextSkeleton loading={loading} height={16} width={80} className="mx-auto">
                  <div />
                </TextSkeleton>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bio Section */}
      {showBio && (
        <div className="bg-white rounded-lg border p-6">
          <TextSkeleton loading={loading} height={24} width={120} className="mb-4">
            <div />
          </TextSkeleton>
          
          <div className="space-y-3">
            <TextSkeleton loading={loading} height={18} width="100%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={18} width="95%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={18} width="88%">
              <div />
            </TextSkeleton>
            <TextSkeleton loading={loading} height={18} width="75%">
              <div />
            </TextSkeleton>
          </div>
        </div>
      )}
      
      {/* Certifications Section */}
      {showCertifications && (
        <div className="bg-white rounded-lg border p-6">
          <TextSkeleton loading={loading} height={24} width={160} className="mb-4">
            <div />
          </TextSkeleton>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <ImageSkeleton loading={loading} height={40} width={40} className="rounded">
                  <div />
                </ImageSkeleton>
                
                <div className="flex-1 space-y-1">
                  <TextSkeleton loading={loading} height={16} width="70%">
                    <div />
                  </TextSkeleton>
                  <TextSkeleton loading={loading} height={14} width="50%">
                    <div />
                  </TextSkeleton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized variants
export const CoachProfileSkeleton: React.FC<Omit<ProfileSkeletonProps, 'variant'>> = (props) => (
  <ProfileSkeleton 
    {...props} 
    variant="detailed" 
    showBio={true} 
    showStats={true} 
    showActions={true} 
    showCertifications={true} 
  />
);

export const UserProfileSkeleton: React.FC<Omit<ProfileSkeletonProps, 'variant'>> = (props) => (
  <ProfileSkeleton 
    {...props} 
    variant="detailed" 
    showBio={true} 
    showStats={true} 
    showActions={false} 
    showCertifications={false} 
  />
);

export const MemberCardSkeleton: React.FC<Omit<ProfileSkeletonProps, 'variant'>> = (props) => (
  <ProfileSkeleton 
    {...props} 
    variant="card" 
    showBio={false} 
    showStats={true} 
    showActions={true} 
  />
);