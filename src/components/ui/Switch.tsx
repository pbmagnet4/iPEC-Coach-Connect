/**
 * Switch Component
 * Toggle switch component for boolean settings
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'red';
  className?: string;
  'aria-label'?: string;
  id?: string;
}

const SIZE_CLASSES = {
  sm: {
    track: 'h-4 w-7',
    thumb: 'h-3 w-3',
    translate: 'translate-x-3'
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5'
  },
  lg: {
    track: 'h-8 w-14',
    thumb: 'h-7 w-7',
    translate: 'translate-x-6'
  }
};

const COLOR_CLASSES = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600'
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  color = 'blue',
  className,
  'aria-label': ariaLabel,
  id
}: SwitchProps) {
  const sizeConfig = SIZE_CLASSES[size];
  const activeColor = COLOR_CLASSES[color];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeConfig.track,
        checked ? activeColor : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        color === 'blue' && 'focus:ring-blue-500',
        color === 'green' && 'focus:ring-green-500',
        color === 'purple' && 'focus:ring-purple-500',
        color === 'red' && 'focus:ring-red-500',
        className
      )}
    >
      <motion.span
        layout
        className={cn(
          'inline-block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
          sizeConfig.thumb,
          checked ? sizeConfig.translate : 'translate-x-0.5'
        )}
        animate={{
          x: checked ? 
            (size === 'sm' ? 12 : size === 'md' ? 20 : 24) : 
            2
        }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
      />
    </button>
  );
}