import React from 'react';
import { BaseSkeleton, TextSkeleton, ButtonSkeleton } from './BaseSkeleton';

export interface FormSkeletonProps {
  loading: boolean;
  fieldCount?: number;
  variant?: 'simple' | 'detailed' | 'wizard';
  showSubmitButton?: boolean;
  showLabels?: boolean;
  showDescription?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  loading,
  fieldCount = 5,
  variant = 'simple',
  showSubmitButton = true,
  showLabels = true,
  showDescription = false,
  className = '',
  'data-testid': testId
}) => {
  const renderFormField = (index: number, fieldType?: 'input' | 'textarea' | 'select' | 'checkbox') => {
    const type = fieldType || (index % 4 === 0 ? 'textarea' : index % 6 === 0 ? 'select' : 'input');
    
    return (
      <div key={`form-field-${index}`} className="space-y-2">
        {/* Label */}
        {showLabels && (
          <TextSkeleton loading={loading} height={16} width={`${60 + Math.random() * 40}%`}>
            <div />
          </TextSkeleton>
        )}
        
        {/* Field */}
        {type === 'textarea' ? (
          <BaseSkeleton
            loading={loading}
            type="custom"
            height={80}
            className="w-full rounded-md border"
          >
            <div />
          </BaseSkeleton>
        ) : type === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <BaseSkeleton
              loading={loading}
              type="custom"
              height={16}
              width={16}
              className="rounded"
            >
              <div />
            </BaseSkeleton>
            <TextSkeleton loading={loading} height={16} width="70%">
              <div />
            </TextSkeleton>
          </div>
        ) : (
          <BaseSkeleton
            loading={loading}
            type="custom"
            height={40}
            className="w-full rounded-md border"
          >
            <div />
          </BaseSkeleton>
        )}
        
        {/* Help text */}
        {showDescription && index % 3 === 0 && (
          <TextSkeleton loading={loading} height={14} width="80%" className="text-gray-500">
            <div />
          </TextSkeleton>
        )}
      </div>
    );
  };

  if (variant === 'wizard') {
    return (
      <div className={`space-y-6 ${className}`} data-testid={testId}>
        {/* Steps indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center">
              <BaseSkeleton
                loading={loading}
                type="custom"
                height={32}
                width={32}
                className="rounded-full"
              >
                <div />
              </BaseSkeleton>
              {index < 3 && (
                <BaseSkeleton
                  loading={loading}
                  type="custom"
                  height={2}
                  width={60}
                  className="mx-2"
                >
                  <div />
                </BaseSkeleton>
              )}
            </div>
          ))}
        </div>
        
        {/* Form fields */}
        <div className="space-y-6">
          {Array.from({ length: Math.min(fieldCount, 3) }, (_, index) => renderFormField(index))}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <ButtonSkeleton loading={loading} width={80} height={40}>
            <div />
          </ButtonSkeleton>
          <ButtonSkeleton loading={loading} width={80} height={40}>
            <div />
          </ButtonSkeleton>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`space-y-8 ${className}`} data-testid={testId}>
        {/* Form title */}
        <div className="space-y-2">
          <TextSkeleton loading={loading} height={28} width="40%">
            <div />
          </TextSkeleton>
          <TextSkeleton loading={loading} height={16} width="70%">
            <div />
          </TextSkeleton>
        </div>
        
        {/* Form sections */}
        <div className="space-y-8">
          {Array.from({ length: Math.ceil(fieldCount / 3) }, (_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              {/* Section header */}
              <div className="border-b pb-2">
                <TextSkeleton loading={loading} height={20} width="30%">
                  <div />
                </TextSkeleton>
              </div>
              
              {/* Section fields */}
              <div className="space-y-4">
                {Array.from({ length: 3 }, (_, fieldIndex) => {
                  const globalIndex = sectionIndex * 3 + fieldIndex;
                  return globalIndex < fieldCount ? renderFormField(globalIndex) : null;
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Submit section */}
        {showSubmitButton && (
          <div className="flex justify-between items-center pt-6 border-t">
            <TextSkeleton loading={loading} height={14} width="60%">
              <div />
            </TextSkeleton>
            <ButtonSkeleton loading={loading} width={120} height={40}>
              <div />
            </ButtonSkeleton>
          </div>
        )}
      </div>
    );
  }

  // Simple variant
  return (
    <div className={`space-y-4 ${className}`} data-testid={testId}>
      {Array.from({ length: fieldCount }, (_, index) => renderFormField(index))}
      
      {showSubmitButton && (
        <div className="pt-4">
          <ButtonSkeleton loading={loading} width="100%" height={44}>
            <div />
          </ButtonSkeleton>
        </div>
      )}
    </div>
  );
};

// Specialized form skeletons
export const LoginFormSkeleton: React.FC<Omit<FormSkeletonProps, 'fieldCount' | 'variant'>> = (props) => (
  <FormSkeleton
    {...props}
    fieldCount={3}
    variant="simple"
    showLabels={true}
    showDescription={false}
  />
);

export const RegistrationFormSkeleton: React.FC<Omit<FormSkeletonProps, 'fieldCount' | 'variant'>> = (props) => (
  <FormSkeleton
    {...props}
    fieldCount={6}
    variant="detailed"
    showLabels={true}
    showDescription={true}
  />
);

export const ContactFormSkeleton: React.FC<Omit<FormSkeletonProps, 'fieldCount' | 'variant'>> = (props) => (
  <FormSkeleton
    {...props}
    fieldCount={4}
    variant="simple"
    showLabels={true}
    showDescription={false}
  />
);

export const ProfileSettingsFormSkeleton: React.FC<Omit<FormSkeletonProps, 'fieldCount' | 'variant'>> = (props) => (
  <FormSkeleton
    {...props}
    fieldCount={8}
    variant="detailed"
    showLabels={true}
    showDescription={true}
  />
);

// Navigation Skeleton Component
export interface NavigationSkeletonProps {
  loading: boolean;
  variant?: 'horizontal' | 'vertical' | 'mobile';
  itemCount?: number;
  showLogo?: boolean;
  showProfile?: boolean;
  showSearch?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const NavigationSkeleton: React.FC<NavigationSkeletonProps> = ({
  loading,
  variant = 'horizontal',
  itemCount = 5,
  showLogo = true,
  showProfile = true,
  showSearch = false,
  className = '',
  'data-testid': testId
}) => {
  if (variant === 'mobile') {
    return (
      <div className={`p-4 space-y-4 ${className}`} data-testid={testId}>
        {/* Mobile header */}
        <div className="flex items-center justify-between">
          {showLogo && (
            <TextSkeleton loading={loading} height={24} width={120}>
              <div />
            </TextSkeleton>
          )}
          
          <BaseSkeleton loading={loading} type="custom" height={24} width={24}>
            <div />
          </BaseSkeleton>
        </div>
        
        {/* Mobile menu items */}
        <div className="space-y-3">
          {Array.from({ length: itemCount }, (_, index) => (
            <TextSkeleton key={index} loading={loading} height={20} width={`${60 + Math.random() * 30}%`}>
              <div />
            </TextSkeleton>
          ))}
        </div>
        
        {/* Mobile profile section */}
        {showProfile && (
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3">
              <BaseSkeleton loading={loading} type="custom" height={32} width={32} className="rounded-full">
                <div />
              </BaseSkeleton>
              <TextSkeleton loading={loading} height={16} width={100}>
                <div />
              </TextSkeleton>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`w-64 p-4 space-y-6 ${className}`} data-testid={testId}>
        {/* Logo */}
        {showLogo && (
          <TextSkeleton loading={loading} height={32} width={150}>
            <div />
          </TextSkeleton>
        )}
        
        {/* Navigation items */}
        <div className="space-y-3">
          {Array.from({ length: itemCount }, (_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <BaseSkeleton loading={loading} type="custom" height={16} width={16}>
                <div />
              </BaseSkeleton>
              <TextSkeleton loading={loading} height={16} width={`${80 + Math.random() * 40}%`}>
                <div />
              </TextSkeleton>
            </div>
          ))}
        </div>
        
        {/* Profile section */}
        {showProfile && (
          <div className="pt-6 border-t">
            <div className="flex items-center space-x-3">
              <BaseSkeleton loading={loading} type="custom" height={40} width={40} className="rounded-full">
                <div />
              </BaseSkeleton>
              <div className="flex-1 space-y-1">
                <TextSkeleton loading={loading} height={16} width="80%">
                  <div />
                </TextSkeleton>
                <TextSkeleton loading={loading} height={12} width="60%">
                  <div />
                </TextSkeleton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={`flex items-center justify-between p-4 border-b ${className}`} data-testid={testId}>
      {/* Left section */}
      <div className="flex items-center space-x-8">
        {showLogo && (
          <TextSkeleton loading={loading} height={28} width={140}>
            <div />
          </TextSkeleton>
        )}
        
        {/* Navigation items */}
        <div className="flex items-center space-x-6">
          {Array.from({ length: Math.min(itemCount, 5) }, (_, index) => (
            <TextSkeleton key={index} loading={loading} height={16} width={`${50 + Math.random() * 30}px`}>
              <div />
            </TextSkeleton>
          ))}
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        {showSearch && (
          <BaseSkeleton loading={loading} type="custom" height={36} width={200} className="rounded-md">
            <div />
          </BaseSkeleton>
        )}
        
        {/* Profile */}
        {showProfile && (
          <div className="flex items-center space-x-2">
            <TextSkeleton loading={loading} height={16} width={80}>
              <div />
            </TextSkeleton>
            <BaseSkeleton loading={loading} type="custom" height={32} width={32} className="rounded-full">
              <div />
            </BaseSkeleton>
          </div>
        )}
      </div>
    </div>
  );
};