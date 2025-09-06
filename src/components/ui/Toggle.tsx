import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0'
  };

  const variantClasses = {
    default: checked ? 'bg-blue-600' : 'bg-gray-200',
    success: checked ? 'bg-green-600' : 'bg-gray-200',
    warning: checked ? 'bg-yellow-600' : 'bg-gray-200',
    danger: checked ? 'bg-red-600' : 'bg-gray-200'
  };

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-0.5">
          {toggle}
        </div>
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={handleToggle}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return toggle;
};

export default Toggle;