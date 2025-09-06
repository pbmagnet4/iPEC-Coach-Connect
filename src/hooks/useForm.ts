/**
 * Enhanced Form Hook
 * 
 * Provides comprehensive form state management, validation, and utilities
 * with Zod schema integration, accessibility features, and performance optimizations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { z } from 'zod';
import { type FormActions, type FormState, FormValidator, type ValidationResult } from '../lib/form-validation';
import { useDebounce } from './useDebounce';

export interface UseFormOptions<T> {
  schema?: z.ZodSchema<T>;
  initialData?: Partial<T>;
  onSubmit?: (data: T, actions: FormActions<T>) => Promise<void> | void;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  autoSave?: {
    enabled: boolean;
    onAutoSave: (data: Partial<T>) => Promise<void> | void;
    interval?: number;
  };
  resetOnSubmit?: boolean;
  focusOnError?: boolean;
}

export interface FormMethods<T> extends FormActions<T> {
  formState: FormState<T>;
  handleSubmit: (onSubmit?: (data: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
  getFieldProps: (field: keyof T, options?: FieldOptions) => FieldProps;
  getFieldError: (field: keyof T) => string | undefined;
  isFieldTouched: (field: keyof T) => boolean;
  isFieldValid: (field: keyof T) => boolean;
  getFieldValue: (field: keyof T) => any;
  setFieldValue: (field: keyof T, value: any) => void;
  setFormData: (data: Partial<T>) => void;
  resetForm: (newData?: Partial<T>) => void;
  submitForm: () => Promise<void>;
}

interface FieldOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  transform?: (value: any) => any;
  format?: (value: any) => string;
}

interface FieldProps {
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  touched: boolean;
  name: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T> = {}
): FormMethods<T> {
  const {
    schema,
    initialData = {} as Partial<T>,
    onSubmit,
    onValidationChange,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    autoSave,
    resetOnSubmit = false,
    focusOnError = true,
  } = options;

  // Form state
  const [formData, setFormData] = useState<T>(initialData as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Refs for tracking
  const formRef = useRef<HTMLFormElement>(null);
  const fieldsRef = useRef<Record<string, HTMLElement>>({});
  const initialDataRef = useRef(initialData);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced values for validation
  const debouncedFormData = useDebounce(formData, debounceMs);

  // Computed state
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
  }, [formData]);

  const isValid = useMemo(() => {
    if (!schema) return Object.keys(errors).length === 0;
    const result = FormValidator.validate(schema, formData);
    return result.success;
  }, [schema, formData, errors]);

  const formState: FormState<T> = useMemo(() => ({
    data: formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
  }), [formData, errors, touched, isValid, isSubmitting, isDirty]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave?.enabled && isDirty && !isSubmitting) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave.onAutoSave(formData);
      }, autoSave.interval || 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, isDirty, isSubmitting, autoSave]);

  // Validation on debounced data change
  useEffect(() => {
    if (validateOnChange && schema && Object.keys(touched).length > 0) {
      setIsValidating(true);
      const result = FormValidator.validate(schema, debouncedFormData);
      if (!result.success && result.fieldErrors) {
        setErrors(prev => ({
          ...prev,
          ...result.fieldErrors,
        }));
      } else {
        setErrors({});
      }
      setIsValidating(false);
      onValidationChange?.(result.success, result.fieldErrors || {});
    }
  }, [debouncedFormData, schema, touched, validateOnChange, onValidationChange]);

  // Form actions
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const setTouchedField = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field as string]: isTouched }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    if (!schema) return true;
    
    const result = FormValidator.validateField(
      schema, 
      field as string, 
      formData[field], 
      formData
    );
    
    if (!result.isValid && result.error) {
      setError(field, result.error);
      return false;
    } else {
      clearError(field);
      return true;
    }
  }, [schema, formData, setError, clearError]);

  const validateForm = useCallback((): boolean => {
    if (!schema) return Object.keys(errors).length === 0;
    
    const result = FormValidator.validate(schema, formData);
    if (!result.success && result.fieldErrors) {
      setErrors(result.fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [schema, formData, errors]);

  const resetForm = useCallback((newData?: Partial<T>) => {
    const resetData = newData || initialDataRef.current;
    setFormData(resetData as T);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    initialDataRef.current = resetData;
  }, []);

  const setSubmittingState = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Field props generator
  const getFieldProps = useCallback((field: keyof T, fieldOptions: FieldOptions = {}): FieldProps => {
    const {
      validateOnChange: fieldValidateOnChange = validateOnChange,
      validateOnBlur: fieldValidateOnBlur = validateOnBlur,
      transform,
      format,
    } = fieldOptions;

    const value = formData[field];
    const error = errors[field as string];
    const isTouched = touched[field as string] || false;
    const fieldId = `field-${String(field)}`;

    return {
      value: format ? format(value) : (value ?? ''),
      onChange: (e) => {
        let newValue = e.target.value;
        if (transform) {
          newValue = transform(newValue);
        }
        updateField(field, newValue);
        
        if (fieldValidateOnChange && isTouched) {
          setTimeout(() => validateField(field), 0);
        }
      },
      onBlur: (e) => {
        setTouchedField(field, true);
        if (fieldValidateOnBlur) {
          validateField(field);
        }
        
        // Store field ref for focus management
        fieldsRef.current[field as string] = e.target;
      },
      onFocus: (e) => {
        fieldsRef.current[field as string] = e.target;
      },
      error,
      touched: isTouched,
      name: String(field),
      'aria-invalid': !!error,
      'aria-describedby': error ? `${fieldId}-error` : undefined,
    };
  }, [formData, errors, touched, updateField, validateField, setTouchedField, validateOnChange, validateOnBlur]);

  // Form submission
  const handleSubmit = useCallback((submitHandler?: (data: T) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        // Mark all fields as touched
        const allFields = Object.keys(formData);
        const touchedState = allFields.reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setTouched(touchedState);

        // Validate form
        const isFormValid = validateForm();
        if (!isFormValid) {
          // Focus on first error field
          if (focusOnError) {
            const firstErrorField = Object.keys(errors)[0];
            const element = fieldsRef.current[firstErrorField];
            if (element && element.focus) {
              element.focus();
            }
          }
          return;
        }

        // Submit form
        const handler = submitHandler || onSubmit;
        if (handler) {
          await handler(formData, actions);
        }

        if (resetOnSubmit) {
          resetForm();
        }
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [formData, isSubmitting, validateForm, errors, focusOnError, onSubmit, resetOnSubmit, resetForm]);

  const submitForm = useCallback(async () => {
    const handler = handleSubmit();
    await handler();
  }, [handleSubmit]);

  // Utility methods
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return errors[field as string];
  }, [errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touched[field as string] || false;
  }, [touched]);

  const isFieldValid = useCallback((field: keyof T): boolean => {
    return !errors[field as string];
  }, [errors]);

  const getFieldValue = useCallback((field: keyof T) => {
    return formData[field];
  }, [formData]);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const setFormDataState = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Form actions object
  const actions: FormActions<T> = {
    updateField,
    setError,
    clearError,
    setTouched: setTouchedField,
    validateField,
    validateForm,
    reset: resetForm,
    setSubmitting: setSubmittingState,
  };

  // Return form methods
  return {
    formState,
    handleSubmit,
    getFieldProps,
    getFieldError,
    isFieldTouched,
    isFieldValid,
    getFieldValue,
    setFieldValue,
    setFormData: setFormDataState,
    resetForm,
    submitForm,
    ...actions,
  };
}

// Export types
export type { FormState, FormActions, FieldProps, UseFormOptions };

// Helper hooks for common use cases
export function useContactForm() {
  return useForm({
    initialData: {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general',
      priority: 'normal',
    },
    validateOnChange: true,
    debounceMs: 500,
  });
}

export function useProfileForm() {
  return useForm({
    initialData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      location: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'English',
      visibility: 'public',
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    autoSave: {
      enabled: true,
      onAutoSave: async (data) => {
        console.log('Auto-saving profile:', data);
        // Implementation would save to backend
      },
      interval: 2000,
    },
  });
}

export function useSearchForm() {
  return useForm({
    initialData: {
      query: '',
      specializations: [],
      languages: [],
      location: '',
      priceRange: { min: undefined, max: undefined },
      availability: 'any',
      rating: undefined,
      experience: 'any',
    },
    validateOnChange: false,
    validateOnBlur: false,
    debounceMs: 500,
  });
}

export default useForm;