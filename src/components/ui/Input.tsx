import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  className,
  type = 'text',
  label,
  error,
  icon,
  ...props
}: InputProps) {
  const id = React.useId();

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "placeholder:text-gray-500",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}