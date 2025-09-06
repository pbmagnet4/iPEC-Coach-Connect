import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  placeholder?: string;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    error, 
    label, 
    placeholder, 
    variant = 'default',
    size = 'md',
    children,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 text-sm px-2',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4'
    };

    const variantClasses = {
      default: 'border border-gray-300 bg-white',
      outline: 'border-2 border-gray-300 bg-transparent',
      filled: 'border-0 bg-gray-100'
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'w-full appearance-none rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              sizeClasses[size],
              variantClasses[variant],
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;