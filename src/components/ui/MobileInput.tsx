import React from 'react';
import { cn } from '../../lib/utils';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  touchOptimized?: boolean;
  mobileKeyboard?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  autoComplete?: 
    | 'name' | 'given-name' | 'family-name' | 'email' | 'username' 
    | 'new-password' | 'current-password' | 'tel' | 'street-address' 
    | 'postal-code' | 'cc-number' | 'cc-exp' | 'cc-csc' | 'off';
  showCharacterCount?: boolean;
  maxLength?: number;
  'aria-describedby'?: string;
}

// Mobile keyboard optimization mapping
const mobileKeyboardMap = {
  text: { inputMode: 'text' as const, pattern: undefined },
  email: { inputMode: 'email' as const, pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$' },
  tel: { inputMode: 'tel' as const, pattern: '[0-9\\s\\(\\)\\-\\+\\.]' },
  url: { inputMode: 'url' as const, pattern: 'https?://.*' },
  numeric: { inputMode: 'numeric' as const, pattern: '[0-9]*' },
  decimal: { inputMode: 'decimal' as const, pattern: '[0-9]*\\.?[0-9]*' },
  search: { inputMode: 'search' as const, pattern: undefined },
};

export function MobileInput({
  className,
  type = 'text',
  label,
  error,
  hint,
  icon,
  touchOptimized = true,
  mobileKeyboard = 'text',
  autoComplete,
  showCharacterCount = false,
  maxLength,
  'aria-describedby': ariaDescribedBy,
  ...props
}: MobileInputProps) {
  const id = React.useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const [value, setValue] = React.useState(props.value || '');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Track character count
  const characterCount = typeof value === 'string' ? value.length : 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  // Get mobile keyboard settings
  const keyboardSettings = mobileKeyboardMap[mobileKeyboard];

  // Build aria-describedby
  const describedBy = [
    error && errorId,
    hint && hintId,
    showCharacterCount && countId,
    ariaDescribedBy,
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-base font-medium transition-colors",
            error ? "text-red-600" : "text-gray-700",
            touchOptimized && "text-lg md:text-base", // Larger text on mobile
            "select-none" // Prevent text selection on label
          )}
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
            touchOptimized && "left-4", // More spacing on mobile
            isFocused && "text-brand-500"
          )}>
            {React.cloneElement(icon as React.ReactElement, {
              className: cn(
                "h-5 w-5",
                touchOptimized && "h-6 w-6" // Larger icons on mobile
              )
            })}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          inputMode={keyboardSettings.inputMode}
          pattern={keyboardSettings.pattern}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border bg-white text-gray-900 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "placeholder:text-gray-500",
            // Mobile-optimized sizing
            touchOptimized ? "px-4 py-4 text-lg min-h-[52px]" : "px-4 py-3 text-base min-h-[44px]",
            // Icon spacing
            icon && (touchOptimized ? "pl-12" : "pl-10"),
            // Error states
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-brand-500",
            // High contrast mode
            "@media (prefers-contrast: high) { border-width: 2px }",
            // Disabled state
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
            // Touch optimization
            touchOptimized && "touch-manipulation",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {/* Character count indicator */}
        {showCharacterCount && maxLength && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-sm",
            touchOptimized && "right-4",
            isOverLimit ? "text-red-500" : "text-gray-400"
          )}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Help text */}
      {hint && !error && (
        <p
          id={hintId}
          className={cn(
            "text-sm text-gray-600",
            touchOptimized && "text-base" // Larger on mobile
          )}
        >
          {hint}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          className={cn(
            "text-sm text-red-600 flex items-center gap-1",
            touchOptimized && "text-base" // Larger on mobile
          )}
          role="alert"
          aria-live="polite"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}

      {/* Character count (separate for screen readers) */}
      {showCharacterCount && maxLength && (
        <p
          id={countId}
          className="sr-only"
          aria-live="polite"
        >
          Character count: {characterCount} of {maxLength}
          {isOverLimit && '. You have exceeded the maximum length.'}
        </p>
      )}
    </div>
  );
}

// Mobile textarea component
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  touchOptimized?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

export function MobileTextarea({
  className,
  label,
  error,
  hint,
  touchOptimized = true,
  showCharacterCount = false,
  maxLength,
  autoResize = false,
  ...props
}: MobileTextareaProps) {
  const id = React.useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const [value, setValue] = React.useState(props.value || '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Track character count
  const characterCount = typeof value === 'string' ? value.length : 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  // Build aria-describedby
  const describedBy = [
    error && errorId,
    hint && hintId,
    showCharacterCount && countId,
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);

    // Auto-resize functionality
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight  }px`;
    }
  };

  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight  }px`;
    }
  }, [autoResize, value]);

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-base font-medium transition-colors",
            error ? "text-red-600" : "text-gray-700",
            touchOptimized && "text-lg md:text-base",
            "select-none"
          )}
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border bg-white text-gray-900 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "placeholder:text-gray-500 resize-none",
            // Mobile-optimized sizing
            touchOptimized ? "px-4 py-4 text-lg min-h-[100px]" : "px-4 py-3 text-base min-h-[80px]",
            // Error states
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-brand-500",
            // High contrast mode
            "@media (prefers-contrast: high) { border-width: 2px }",
            // Disabled state
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
            // Touch optimization
            touchOptimized && "touch-manipulation",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {/* Character count indicator */}
        {showCharacterCount && maxLength && (
          <div className={cn(
            "absolute right-3 bottom-3 text-sm",
            touchOptimized && "right-4 bottom-4",
            isOverLimit ? "text-red-500" : "text-gray-400"
          )}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Help text */}
      {hint && !error && (
        <p
          id={hintId}
          className={cn(
            "text-sm text-gray-600",
            touchOptimized && "text-base"
          )}
        >
          {hint}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          className={cn(
            "text-sm text-red-600 flex items-center gap-1",
            touchOptimized && "text-base"
          )}
          role="alert"
          aria-live="polite"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}

      {/* Character count (separate for screen readers) */}
      {showCharacterCount && maxLength && (
        <p
          id={countId}
          className="sr-only"
          aria-live="polite"
        >
          Character count: {characterCount} of {maxLength}
          {isOverLimit && '. You have exceeded the maximum length.'}
        </p>
      )}
    </div>
  );
}