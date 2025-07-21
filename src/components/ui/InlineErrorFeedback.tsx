/**
 * Inline Error Feedback Component
 * 
 * Provides real-time validation feedback with helpful suggestions
 * and progressive disclosure for complex validation rules.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Hash,
  Type
} from 'lucide-react';

interface ValidationRule {
  id: string;
  label: string;
  check: (value: string) => boolean;
  hint?: string;
  required?: boolean;
  errorMessage?: string;
}

interface InlineErrorFeedbackProps {
  value: string;
  fieldType: 'email' | 'password' | 'phone' | 'name' | 'card' | 'date' | 'zipcode' | 'text';
  rules?: ValidationRule[];
  isValidating?: boolean;
  showAllRules?: boolean;
  onChange?: (isValid: boolean) => void;
  onSuggestion?: (suggestion: string) => void;
  className?: string;
}

const defaultRules: { [key: string]: ValidationRule[] } = {
  email: [
    { id: 'format', label: 'Valid email format', check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: 'Please enter a valid email address' },
    { id: 'domain', label: 'Valid domain', check: (v) => !v.includes('@') || v.split('@')[1]?.includes('.'), hint: 'e.g., user@example.com' }
  ],
  password: [
    { id: 'length', label: 'At least 8 characters', check: (v) => v.length >= 8, required: true },
    { id: 'uppercase', label: 'One uppercase letter', check: (v) => /[A-Z]/.test(v), required: true },
    { id: 'lowercase', label: 'One lowercase letter', check: (v) => /[a-z]/.test(v), required: true },
    { id: 'number', label: 'One number', check: (v) => /\d/.test(v), required: true },
    { id: 'special', label: 'One special character', check: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), hint: '!@#$%^&*(),.?":{}|<>' }
  ],
  phone: [
    { id: 'format', label: 'Valid phone format', check: (v) => /^\+?[\d\s\-\(\)]+$/.test(v) && v.replace(/\D/g, '').length >= 10, errorMessage: 'Please enter a valid phone number' },
    { id: 'digits', label: '10+ digits', check: (v) => v.replace(/\D/g, '').length >= 10 }
  ],
  name: [
    { id: 'length', label: 'At least 2 characters', check: (v) => v.trim().length >= 2, required: true },
    { id: 'valid', label: 'Only letters and spaces', check: (v) => /^[a-zA-Z\s'-]+$/.test(v), hint: 'No numbers or special characters' }
  ],
  card: [
    { id: 'format', label: 'Valid card number', check: (v) => /^\d{13,19}$/.test(v.replace(/\s/g, '')), errorMessage: 'Please enter a valid card number' },
    { id: 'luhn', label: 'Valid card checksum', check: (v) => luhnCheck(v.replace(/\s/g, '')) }
  ],
  date: [
    { id: 'format', label: 'Valid date format', check: (v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v), hint: 'MM/DD/YYYY' },
    { id: 'valid', label: 'Valid date', check: (v) => isValidDate(v) }
  ],
  zipcode: [
    { id: 'format', label: 'Valid ZIP code', check: (v) => /^\d{5}(-\d{4})?$/.test(v), hint: '12345 or 12345-6789' }
  ],
  text: []
};

// Luhn algorithm for credit card validation
function luhnCheck(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Date validation
function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  
  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check days in month
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    daysInMonth[1] = 29; // Leap year
  }
  
  return day <= daysInMonth[month - 1];
}

// Get field icon
function getFieldIcon(fieldType: string) {
  switch (fieldType) {
    case 'email': return Mail;
    case 'password': return Lock;
    case 'phone': return Phone;
    case 'name': return User;
    case 'card': return CreditCard;
    case 'date': return Calendar;
    case 'zipcode': return MapPin;
    default: return Type;
  }
}

// Get smart suggestions for common mistakes
function getSmartSuggestions(fieldType: string, value: string): string[] {
  const suggestions: string[] = [];
  
  if (fieldType === 'email' && value) {
    const email = value.toLowerCase();
    
    // Common email typos
    const commonTypos: { [key: string]: string } = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'iclould.com': 'icloud.com',
      'icoud.com': 'icloud.com'
    };
    
    for (const [typo, correction] of Object.entries(commonTypos)) {
      if (email.includes(typo)) {
        suggestions.push(`Did you mean @${correction}?`);
        break;
      }
    }
    
    // Missing @ symbol
    if (!email.includes('@') && email.includes('.')) {
      const parts = email.split('.');
      if (parts.length === 2) {
        suggestions.push(`Did you mean ${parts[0]}@${parts[1]}.com?`);
      }
    }
  }
  
  if (fieldType === 'phone' && value) {
    const digits = value.replace(/\D/g, '');
    
    // Suggest formatting
    if (digits.length === 10 && !/[\s\-\(\)]/.test(value)) {
      suggestions.push(`Format as: (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`);
    }
    
    // International format
    if (digits.length === 11 && digits.startsWith('1')) {
      suggestions.push(`US format: +1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`);
    }
  }
  
  return suggestions;
}

export function InlineErrorFeedback({
  value,
  fieldType,
  rules: customRules,
  isValidating = false,
  showAllRules = false,
  onChange,
  onSuggestion,
  className = ''
}: InlineErrorFeedbackProps) {
  const [showRules, setShowRules] = useState(false);
  const [touchedRules, setTouchedRules] = useState<Set<string>>(new Set());
  
  const rules = customRules || defaultRules[fieldType] || [];
  const FieldIcon = getFieldIcon(fieldType);
  
  // Check validation status
  const validationResults = rules.map(rule => ({
    ...rule,
    isValid: rule.check(value)
  }));
  
  const requiredRules = validationResults.filter(r => r.required);
  const optionalRules = validationResults.filter(r => !r.required);
  const allRequiredValid = requiredRules.every(r => r.isValid);
  const someOptionalValid = optionalRules.some(r => r.isValid);
  const isValid = allRequiredValid && (optionalRules.length === 0 || someOptionalValid);
  
  // Get smart suggestions
  const suggestions = getSmartSuggestions(fieldType, value);
  
  // Track which rules have been touched
  useEffect(() => {
    if (value) {
      validationResults.forEach(result => {
        if (!result.isValid) {
          setTouchedRules(prev => new Set(prev).add(result.id));
        }
      });
    }
  }, [value]);
  
  // Notify parent of validation status
  useEffect(() => {
    onChange?.(isValid);
  }, [isValid, onChange]);
  
  // Don't show anything if no value and not showing all rules
  if (!value && !showAllRules) {
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Validation status indicator */}
      {value && (
        <div className="flex items-center gap-2">
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Validating...</span>
            </>
          ) : isValid ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Valid {fieldType}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">
                {validationResults.find(r => !r.isValid && (r.required || touchedRules.has(r.id)))?.errorMessage || `Please check ${fieldType} requirements`}
              </span>
            </>
          )}
          
          {rules.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRules(!showRules)}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700"
            >
              {showRules ? 'Hide' : 'Show'} requirements
            </button>
          )}
        </div>
      )}
      
      {/* Smart suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onSuggestion?.(suggestion)}
              >
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{suggestion}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Validation rules */}
      <AnimatePresence>
        {(showRules || showAllRules) && rules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 p-3 bg-gray-50 rounded-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <FieldIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                {fieldType} Requirements
              </span>
            </div>
            
            {requiredRules.length > 0 && (
              <div className="space-y-1">
                {requiredRules.map(rule => (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-2 text-sm ${
                      rule.isValid ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {rule.isValid ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current" />
                    )}
                    <span>{rule.label}</span>
                    {rule.hint && !rule.isValid && (
                      <span className="text-xs text-gray-400">({rule.hint})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {optionalRules.length > 0 && requiredRules.length > 0 && (
              <div className="my-2 border-t border-gray-200" />
            )}
            
            {optionalRules.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Optional:</span>
                {optionalRules.map(rule => (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-2 text-sm ${
                      rule.isValid ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {rule.isValid ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current border-dashed" />
                    )}
                    <span>{rule.label}</span>
                    {rule.hint && !rule.isValid && (
                      <span className="text-xs text-gray-400">({rule.hint})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook for managing inline validation
 */
export function useInlineValidation(fieldType: InlineErrorFeedbackProps['fieldType'], customRules?: ValidationRule[]) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const validate = async (newValue: string) => {
    setValue(newValue);
    setIsValidating(true);
    
    // Simulate async validation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsValidating(false);
  };
  
  return {
    value,
    setValue: validate,
    isValid,
    setIsValid,
    isValidating
  };
}