/**
 * Comprehensive Form Validation Framework
 * 
 * Provides centralized validation schemas, utilities, and form handling
 * for all forms across the iPEC Coach Connect application.
 */

import { z } from 'zod';

// ========================================
// Base Validation Schemas
// ========================================

export const baseValidationSchemas = {
  // Common field validations
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),

  confirmPassword: (passwordField = 'password') => z
    .string()
    .min(1, 'Please confirm your password'),

  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  phone: z
    .string()
    .optional()
    .or(z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')),

  url: z
    .string()
    .optional()
    .or(z.string().url('Please enter a valid URL')),

  requiredString: (fieldName: string, minLength = 1) => z
    .string()
    .min(minLength, `${fieldName} is required`),

  optionalString: z.string().optional(),

  positiveNumber: (fieldName: string) => z
    .number()
    .min(0, `${fieldName} must be a positive number`),

  requiredArray: (fieldName: string, minItems = 1) => z
    .array(z.any())
    .min(minItems, `At least ${minItems} ${fieldName.toLowerCase()} is required`),
};

// ========================================
// Authentication Forms
// ========================================

export const authValidationSchemas = {
  signIn: z.object({
    email: baseValidationSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),

  signUp: z.object({
    email: baseValidationSchemas.email,
    password: baseValidationSchemas.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: baseValidationSchemas.name,
    phone: baseValidationSchemas.phone,
    role: z.enum(['client', 'coach'], { 
      required_error: 'Please select your role' 
    }),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: 'You must agree to the terms of service'
    }),
    marketingConsent: z.boolean().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  resetPassword: z.object({
    email: baseValidationSchemas.email,
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: baseValidationSchemas.password,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  }),
};

// ========================================
// Contact & Support Forms
// ========================================

export const contactValidationSchemas = {
  contact: z.object({
    name: baseValidationSchemas.name,
    email: baseValidationSchemas.email,
    subject: baseValidationSchemas.requiredString('Subject', 3),
    message: baseValidationSchemas.requiredString('Message', 10),
    category: z.enum(['general', 'technical', 'billing', 'coaching', 'other']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  }),

  support: z.object({
    name: baseValidationSchemas.name,
    email: baseValidationSchemas.email,
    subject: baseValidationSchemas.requiredString('Subject', 3),
    category: z.enum(['account', 'billing', 'technical', 'feature', 'other'], {
      required_error: 'Please select a category'
    }),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    description: baseValidationSchemas.requiredString('Description', 20),
    attachments: z.array(z.any()).optional(),
  }),

  feedback: z.object({
    rating: z.number().min(1).max(5),
    category: z.enum(['feature', 'bug', 'improvement', 'general']),
    title: baseValidationSchemas.requiredString('Title', 5),
    description: baseValidationSchemas.requiredString('Description', 10),
    email: baseValidationSchemas.email.optional(),
  }),
};

// ========================================
// Profile & Settings Forms
// ========================================

export const profileValidationSchemas = {
  profile: z.object({
    firstName: baseValidationSchemas.name,
    lastName: baseValidationSchemas.name,
    email: baseValidationSchemas.email,
    phone: baseValidationSchemas.phone,
    bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
    location: z.string().max(100, 'Location is too long').optional(),
    timezone: z.string(),
    language: z.string(),
    visibility: z.enum(['public', 'private', 'coaches']).default('public'),
    profilePicture: z.any().optional(),
  }),

  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
      marketing: z.boolean().default(false),
    }),
    privacy: z.object({
      profileVisible: z.boolean().default(true),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false),
    }),
    coaching: z.object({
      availableForBooking: z.boolean().default(true),
      autoAcceptBookings: z.boolean().default(false),
      bufferTime: z.number().min(0).max(120).default(15),
    }).optional(),
  }),

  accountSettings: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newEmail: baseValidationSchemas.email.optional(),
    deleteAccount: z.boolean().default(false),
    deleteReason: z.string().optional(),
  }),
};

// ========================================
// Community Forms
// ========================================

export const communityValidationSchemas = {
  discussion: z.object({
    title: baseValidationSchemas.requiredString('Title', 5),
    content: baseValidationSchemas.requiredString('Content', 20),
    category: z.enum(['general', 'tips', 'questions', 'success-stories', 'resources']),
    tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
    isAnonymous: z.boolean().default(false),
  }),

  comment: z.object({
    content: baseValidationSchemas.requiredString('Comment', 5),
    isAnonymous: z.boolean().default(false),
  }),

  event: z.object({
    title: baseValidationSchemas.requiredString('Title', 5),
    description: baseValidationSchemas.requiredString('Description', 20),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    location: z.string().optional(),
    isVirtual: z.boolean().default(false),
    maxAttendees: z.number().min(1).optional(),
    registrationDeadline: z.string().optional(),
  }),
};

// ========================================
// Booking & Session Forms
// ========================================

export const bookingValidationSchemas = {
  booking: z.object({
    coachId: z.string().min(1, 'Coach selection is required'),
    sessionType: z.enum(['initial', 'follow-up', 'group', 'workshop']),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
    duration: z.number().min(15).max(180),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    goals: z.string().max(1000, 'Goals must be less than 1000 characters').optional(),
    timezone: z.string(),
  }),

  sessionFeedback: z.object({
    rating: z.number().min(1).max(5),
    feedback: baseValidationSchemas.requiredString('Feedback', 10),
    goals_achieved: z.boolean(),
    recommend_coach: z.boolean(),
    areas_for_improvement: z.string().optional(),
    session_notes: z.string().optional(),
  }),
};

// ========================================
// Search & Filter Forms
// ========================================

export const searchValidationSchemas = {
  coachSearch: z.object({
    query: z.string().optional(),
    specializations: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    location: z.string().optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
    availability: z.enum(['any', 'today', 'this-week', 'this-month']).optional(),
    rating: z.number().min(1).max(5).optional(),
    experience: z.enum(['any', '1-3', '3-5', '5-10', '10+']).optional(),
  }),

  contentSearch: z.object({
    query: z.string().min(1, 'Search query is required'),
    category: z.enum(['all', 'discussions', 'events', 'resources', 'coaches']).optional(),
    dateRange: z.enum(['all', 'today', 'week', 'month', 'year']).optional(),
    sortBy: z.enum(['relevance', 'date', 'popularity']).optional(),
  }),
};

// ========================================
// Validation Utilities
// ========================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  fieldErrors?: Record<string, string>;
}

export class FormValidator {
  static validate<T>(
    schema: z.ZodSchema<T>, 
    data: unknown
  ): ValidationResult<T> {
    try {
      const validData = schema.parse(data);
      return {
        success: true,
        data: validData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        const fieldErrors: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
          // Store the first error for each field for simple display
          if (!fieldErrors[path]) {
            fieldErrors[path] = err.message;
          }
        });

        return {
          success: false,
          errors,
          fieldErrors,
        };
      }
      
      return {
        success: false,
        errors: { form: ['Validation failed'] },
        fieldErrors: { form: 'Validation failed' },
      };
    }
  }

  static validateField<T>(
    schema: z.ZodSchema<T>,
    fieldName: string,
    value: unknown,
    data?: Partial<T>
  ): { isValid: boolean; error?: string } {
    try {
      // For field validation, we create a partial object and validate just that field
      const testData = { ...data, [fieldName]: value };
      const result = schema.safeParse(testData);
      
      if (result.success) {
        return { isValid: true };
      }
      
      // Find error specific to this field
      const fieldError = result.error.errors.find(
        err => err.path.includes(fieldName)
      );
      
      return {
        isValid: false,
        error: fieldError?.message || 'Invalid value'
      };
    } catch {
      return {
        isValid: false,
        error: 'Validation error'
      };
    }
  }
}

// ========================================
// Form State Management Utilities
// ========================================

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface FormActions<T> {
  updateField: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  reset: (newData?: Partial<T>) => void;
  setSubmitting: (submitting: boolean) => void;
}

// ========================================
// File Upload Validation
// ========================================

export const fileValidationSchemas = {
  profileImage: z.object({
    file: z.any().refine(
      (file) => file instanceof File && file.size <= 5 * 1024 * 1024,
      'File must be less than 5MB'
    ).refine(
      (file) => file instanceof File && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be JPEG, PNG, or WebP'
    ),
  }),

  document: z.object({
    file: z.any().refine(
      (file) => file instanceof File && file.size <= 10 * 1024 * 1024,
      'File must be less than 10MB'
    ).refine(
      (file) => file instanceof File && [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ].includes(file.type),
      'File must be PDF, DOC, DOCX, JPEG, or PNG'
    ),
  }),

  attachment: z.object({
    file: z.any().refine(
      (file) => file instanceof File && file.size <= 25 * 1024 * 1024,
      'File must be less than 25MB'
    ),
  }),
};

// ========================================
// Common Validation Helpers
// ========================================

export const validationHelpers = {
  isValidEmail: (email: string): boolean => {
    return baseValidationSchemas.email.safeParse(email).success;
  },

  isStrongPassword: (password: string): boolean => {
    return baseValidationSchemas.password.safeParse(password).success;
  },

  getPasswordStrength: (password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } => {
    const checks = [
      { test: (p: string) => p.length >= 8, message: 'At least 8 characters' },
      { test: (p: string) => /[A-Z]/.test(p), message: 'Contains uppercase letter' },
      { test: (p: string) => /[a-z]/.test(p), message: 'Contains lowercase letter' },
      { test: (p: string) => /\d/.test(p), message: 'Contains number' },
      { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'Contains special character' },
    ];

    const passed = checks.filter(check => check.test(password));
    const failed = checks.filter(check => !check.test(password));

    return {
      score: (passed.length / checks.length) * 100,
      feedback: failed.map(check => check.message),
      isValid: passed.length === checks.length,
    };
  },

  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  },
};

// ========================================
// Export All Schemas
// ========================================

export const allValidationSchemas = {
  base: baseValidationSchemas,
  auth: authValidationSchemas,
  contact: contactValidationSchemas,
  profile: profileValidationSchemas,
  community: communityValidationSchemas,
  booking: bookingValidationSchemas,
  search: searchValidationSchemas,
  file: fileValidationSchemas,
};

export default allValidationSchemas;