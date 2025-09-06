import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helpText?: string;
  variant?: 'default' | 'outline' | 'filled';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    className, 
    error, 
    label, 
    helpText,
    variant = 'default',
    resize = 'vertical',
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'border border-gray-300 bg-white',
      outline: 'border-2 border-gray-300 bg-transparent',
      filled: 'border-0 bg-gray-100'
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full rounded-md shadow-sm px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            variantClasses[variant],
            resizeClasses[resize],
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;