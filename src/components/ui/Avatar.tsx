import React from 'react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className,
}: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-medium',
          sizes[size],
          className
        )}
      >
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'rounded-full object-cover',
        sizes[size],
        className
      )}
    />
  );
}