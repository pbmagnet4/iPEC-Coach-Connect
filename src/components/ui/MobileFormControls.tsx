import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mobile-optimized Checkbox Component
interface MobileCheckboxProps {
  id?: string;
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  touchOptimized?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MobileCheckbox({
  id,
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  error,
  required = false,
  touchOptimized = true,
  size = 'md',
}: MobileCheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;
  const errorId = `${checkboxId}-error`;
  const descriptionId = `${checkboxId}-description`;

  const sizes = {
    sm: {
      container: "min-h-[44px] p-3",
      checkbox: "h-5 w-5",
      label: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "min-h-[48px] p-4",
      checkbox: "h-6 w-6",
      label: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "min-h-[52px] p-5",
      checkbox: "h-7 w-7",
      label: "text-lg",
      description: "text-base",
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className="space-y-2">
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex items-start gap-3 cursor-pointer rounded-lg border transition-all",
          "hover:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500",
          touchOptimized && "touch-manipulation select-none",
          sizeConfig.container,
          error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="relative flex-shrink-0 pt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            required={required}
            className="sr-only"
            aria-describedby={cn(
              description && descriptionId,
              error && errorId
            )}
            aria-invalid={error ? "true" : "false"}
          />
          <motion.div
            className={cn(
              "rounded border-2 flex items-center justify-center transition-all",
              sizeConfig.checkbox,
              checked
                ? "bg-brand-600 border-brand-600"
                : "bg-white border-gray-300",
              disabled && "opacity-50",
              "focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
            )}
            whileTap={!disabled ? { scale: 0.95 } : {}}
          >
            <motion.div
              initial={false}
              animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-gray-900",
            sizeConfig.label,
            disabled && "text-gray-500"
          )}>
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            )}
          </div>
          {description && (
            <p
              id={descriptionId}
              className={cn(
                "text-gray-600 mt-1",
                sizeConfig.description,
                disabled && "text-gray-400"
              )}
            >
              {description}
            </p>
          )}
        </div>
      </label>

      {error && (
        <p
          id={errorId}
          className={cn(
            "text-red-600 flex items-center gap-1",
            touchOptimized ? "text-base" : "text-sm"
          )}
          role="alert"
          aria-live="polite"
        >
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Mobile-optimized Radio Group Component
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MobileRadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  touchOptimized?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MobileRadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  required = false,
  touchOptimized = true,
  size = 'md',
}: MobileRadioGroupProps) {
  const groupId = React.useId();
  const errorId = `${groupId}-error`;

  const sizes = {
    sm: {
      container: "min-h-[44px] p-3",
      radio: "h-5 w-5",
      label: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "min-h-[48px] p-4",
      radio: "h-6 w-6",
      label: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "min-h-[52px] p-5",
      radio: "h-7 w-7",
      label: "text-lg",
      description: "text-base",
    },
  };

  const sizeConfig = sizes[size];

  return (
    <fieldset className="space-y-2">
      {label && (
        <legend className={cn(
          "text-base font-medium text-gray-900",
          touchOptimized && "text-lg md:text-base"
        )}>
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </legend>
      )}

      <div className="space-y-2" role="radiogroup" aria-invalid={error ? "true" : "false"}>
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const isSelected = value === option.value;
          const isDisabled = option.disabled;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "flex items-start gap-3 cursor-pointer rounded-lg border transition-all",
                "hover:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500",
                touchOptimized && "touch-manipulation select-none",
                sizeConfig.container,
                error ? "border-red-300" : "border-gray-200",
                isSelected && "bg-brand-50 border-brand-300",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative flex-shrink-0 pt-0.5">
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={isDisabled}
                  required={required}
                  className="sr-only"
                  aria-describedby={error ? errorId : undefined}
                />
                <motion.div
                  className={cn(
                    "rounded-full border-2 flex items-center justify-center transition-all",
                    sizeConfig.radio,
                    isSelected
                      ? "bg-brand-600 border-brand-600"
                      : "bg-white border-gray-300",
                    isDisabled && "opacity-50",
                    "focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
                  )}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    initial={false}
                    animate={isSelected ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-gray-900",
                  sizeConfig.label,
                  isDisabled && "text-gray-500"
                )}>
                  {option.label}
                </div>
                {option.description && (
                  <p className={cn(
                    "text-gray-600 mt-1",
                    sizeConfig.description,
                    isDisabled && "text-gray-400"
                  )}>
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={errorId}
          className={cn(
            "text-red-600 flex items-center gap-1",
            touchOptimized ? "text-base" : "text-sm"
          )}
          role="alert"
          aria-live="polite"
        >
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

// Mobile-optimized Select Component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  id?: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  touchOptimized?: boolean;
  size?: 'sm' | 'md' | 'lg';
  searchable?: boolean;
}

export function MobileSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  error,
  hint,
  required = false,
  disabled = false,
  touchOptimized = true,
  size = 'md',
  searchable = false,
}: MobileSelectProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;
  const listboxId = `${selectId}-listbox`;
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listboxRef = React.useRef<HTMLUListElement>(null);

  const sizes = {
    sm: {
      button: "min-h-[44px] px-3 py-2 text-sm",
      option: "px-3 py-2 text-sm",
      search: "px-3 py-2 text-sm",
    },
    md: {
      button: "min-h-[48px] px-4 py-3 text-base",
      option: "px-4 py-3 text-base",
      search: "px-4 py-3 text-base",
    },
    lg: {
      button: "min-h-[52px] px-5 py-4 text-lg",
      option: "px-5 py-4 text-lg",
      search: "px-5 py-4 text-lg",
    },
  };

  const sizeConfig = sizes[size];

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const selectedOption = options.find(option => option.value === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          onChange?.(filteredOptions[focusedIndex].value);
          setIsOpen(false);
        }
  void e.preventDefault();
        break;
      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
  void e.preventDefault();
        break;
      case 'ArrowUp':
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
  void e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        listboxRef.current &&
        !listboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

  void document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const describedBy = [
    error && errorId,
    hint && hintId,
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            "block text-base font-medium text-gray-700",
            touchOptimized && "text-lg md:text-base"
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          className={cn(
            "w-full rounded-lg border bg-white text-left transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "flex items-center justify-between",
            touchOptimized && "touch-manipulation",
            sizeConfig.button,
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-brand-500",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
            isOpen && "ring-2 ring-brand-500 border-brand-500"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? "true" : "false"}
          disabled={disabled}
        >
          <span className={cn(
            "block truncate",
            !selectedOption && "text-gray-500"
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className={cn(
                    "w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                    sizeConfig.search
                  )}
                />
              </div>
            )}
            
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={selectId}
              className="py-1 max-h-48 overflow-y-auto"
            >
              {filteredOptions.length === 0 ? (
                <li className={cn(
                  "text-gray-500 text-center py-4",
                  sizeConfig.option
                )}>
                  No options found
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      "cursor-pointer transition-colors",
                      sizeConfig.option,
                      option.disabled && "opacity-50 cursor-not-allowed",
                      index === focusedIndex && "bg-brand-100",
                      option.value === value && "bg-brand-50 text-brand-600",
                      !option.disabled && "hover:bg-gray-100"
                    )}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
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
            "text-red-600 flex items-center gap-1",
            touchOptimized ? "text-base" : "text-sm"
          )}
          role="alert"
          aria-live="polite"
        >
          <X className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}