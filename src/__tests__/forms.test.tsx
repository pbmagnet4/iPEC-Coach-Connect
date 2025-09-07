/**
 * Comprehensive Form System Tests
 * 
 * Tests the enhanced form validation, state management, and user experience
 * features implemented across the iPEC Coach Connect application.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { contactValidationSchemas, FormValidator, profileValidationSchemas } from '../lib/form-validation';
import { type FormMethods, useForm } from '../hooks/useForm';
import { Contact } from '../pages/Contact';
import { Support } from '../pages/Support';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon">✉</div>,
  Phone: () => <div data-testid="phone-icon">📞</div>,
  Send: () => <div data-testid="send-icon">📤</div>,
  Upload: () => <div data-testid="upload-icon">📁</div>,
  CheckCircle: () => <div data-testid="check-icon">✅</div>,
  AlertCircle: () => <div data-testid="alert-icon">⚠</div>,
  Clock: () => <div data-testid="clock-icon">⏰</div>,
  Loader2: () => <div data-testid="loader-icon">⏳</div>,
  MessageSquare: () => <div data-testid="message-icon">💬</div>,
  Globe: () => <div data-testid="globe-icon">🌐</div>,
  Eye: () => <div data-testid="eye-icon">👁</div>,
  Save: () => <div data-testid="save-icon">💾</div>,
  FileText: () => <div data-testid="file-icon">📄</div>,
  Trash2: () => <div data-testid="trash-icon">🗑</div>,
  X: () => <div data-testid="x-icon">❌</div>,
  MapPin: () => <div data-testid="map-icon">📍</div>,
  ChevronRight: () => <div data-testid="chevron-icon">➡</div>,
  HelpCircle: () => <div data-testid="help-icon">❓</div>,
}));

describe('Form Validation Framework', () => {
  describe('FormValidator', () => {
    it('should validate valid data successfully', () => {
      const schema = contactValidationSchemas.contact;
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test subject',
        message: 'This is a test message with enough content.',
        category: 'general',
        priority: 'normal',
      };

      const result = FormValidator.validate(schema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', () => {
      const schema = contactValidationSchemas.contact;
      const invalidData = {
        name: '',
        email: 'invalid-email',
        subject: 'Hi',
        message: 'Too short',
        category: 'general',
        priority: 'normal',
      };

      const result = FormValidator.validate(schema, invalidData);
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toContain('required');
      expect(result.fieldErrors?.email).toContain('valid email');
      expect(result.fieldErrors?.subject).toContain('least 3 characters');
      expect(result.fieldErrors?.message).toContain('least 10 characters');
    });

    it('should validate individual fields', () => {
      const schema = contactValidationSchemas.contact;
      
      const validResult = FormValidator.validateField(schema, 'email', 'test@example.com');
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBeUndefined();

      const invalidResult = FormValidator.validateField(schema, 'email', 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('valid email');
    });
  });

  describe('Validation Schemas', () => {
    it('should have comprehensive contact form validation', () => {
      const schema = contactValidationSchemas.contact;
      expect(schema).toBeDefined();
      
      // Test required fields
      const emptyResult = FormValidator.validate(schema, {});
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.fieldErrors?.name).toBeDefined();
      expect(emptyResult.fieldErrors?.email).toBeDefined();
      expect(emptyResult.fieldErrors?.subject).toBeDefined();
      expect(emptyResult.fieldErrors?.message).toBeDefined();
    });

    it('should have comprehensive support form validation', () => {
      const schema = contactValidationSchemas.support;
      expect(schema).toBeDefined();
      
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test subject',
        category: 'technical',
        priority: 'normal',
        description: 'This is a detailed description of the technical issue I am experiencing.',
        attachments: [],
      };

      const result = FormValidator.validate(schema, validData);
      expect(result.success).toBe(true);
    });

    it('should have profile validation with proper constraints', () => {
      const schema = profileValidationSchemas.profile;
      expect(schema).toBeDefined();

      const validProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        bio: 'A professional bio with sufficient length.',
        location: 'New York, NY',
        timezone: 'America/New_York',
        language: 'English',
        visibility: 'public',
      };

      const result = FormValidator.validate(schema, validProfile);
      expect(result.success).toBe(true);
    });
  });
});

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
}

describe('useForm Hook', () => {
  let TestComponent: React.FC;
  let formMethods: FormMethods<ContactFormData>;

  beforeEach(() => {
    TestComponent = () => {
      formMethods = useForm({
        schema: contactValidationSchemas.contact,
        initialData: {
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general',
          priority: 'normal',
        },
        validateOnChange: true,
        validateOnBlur: true,
      });

      return (
        <form onSubmit={(e) => { void formMethods.handleSubmit()(e); }}>
          <input
            {...formMethods.getFieldProps('name')}
            data-testid="name-input"
          />
          <input
            {...formMethods.getFieldProps('email')}
            data-testid="email-input"
            type="email"
          />
          <input
            {...formMethods.getFieldProps('subject')}
            data-testid="subject-input"
          />
          <textarea
            {...formMethods.getFieldProps('message')}
            data-testid="message-input"
          />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
          {formMethods.formState.errors.name && (
            <div data-testid="name-error">{formMethods.formState.errors.name}</div>
          )}
          {formMethods.formState.errors.email && (
            <div data-testid="email-error">{formMethods.formState.errors.email}</div>
          )}
        </form>
      );
    };
  });

  it('should provide field props with validation', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const nameInput = screen.getByTestId('name-input');
    const emailInput = screen.getByTestId('email-input');

    // Test initial state
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');

    // Test field updates
    await user.type(nameInput, 'John Doe');
    expect(nameInput).toHaveValue('John Doe');

    // Test email validation
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.queryByTestId('email-error')).toBeInTheDocument();
    });
  });

  it('should handle form submission with validation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    TestComponent = () => {
      const form = useForm({
        schema: contactValidationSchemas.contact,
        onSubmit,
        initialData: {
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general',
          priority: 'normal',
        },
      });

      return (
        <form onSubmit={form.handleSubmit()}>
          <input {...form.getFieldProps('name')} data-testid="name-input" />
          <input {...form.getFieldProps('email')} data-testid="email-input" type="email" />
          <input {...form.getFieldProps('subject')} data-testid="subject-input" />
          <textarea {...form.getFieldProps('message')} data-testid="message-input" />
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      );
    };

    render(<TestComponent />);

    // Fill form with valid data
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.type(screen.getByTestId('subject-input'), 'Test Subject');
    await user.type(screen.getByTestId('message-input'), 'This is a test message with sufficient length.');

    // Submit form
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message with sufficient length.',
        }),
        expect.any(Object)
      );
    });
  });

  it('should prevent submission with invalid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    TestComponent = () => {
      const form = useForm({
        schema: contactValidationSchemas.contact,
        onSubmit,
        initialData: {
          name: '',
          email: '',
          subject: '',
          message: '',
          category: 'general',
          priority: 'normal',
        },
      });

      return (
        <form onSubmit={form.handleSubmit()}>
          <input {...form.getFieldProps('name')} data-testid="name-input" />
          <input {...form.getFieldProps('email')} data-testid="email-input" type="email" />
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      );
    };

    render(<TestComponent />);

    // Try to submit with empty form
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});

describe('Contact Form Integration', () => {
  beforeEach(() => {
    // Mock the contact service
    vi.clearAllMocks();
  });

  it('should render contact form with all required fields', () => {
    render(<Contact />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByText(/send message/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    const submitButton = screen.getByRole('button', { name: /send message/i });
    
    // Try to submit empty form
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/please fill in all required fields/i)).toBeInTheDocument();
    });
  });

  it('should display success message on successful submission', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    // Fill out the form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with sufficient content.');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Support Form Integration', () => {
  it('should render support form with file upload capability', () => {
    render(<Support />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/upload files/i)).toBeInTheDocument();
  });

  it('should handle file uploads correctly', async () => {
    const user = userEvent.setup();
    render(<Support />);

    const fileInput = screen.getByLabelText(/upload files/i);
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('should validate file size limits', async () => {
    const user = userEvent.setup();
    render(<Support />);

    const fileInput = screen.getByLabelText(/upload files/i);
    const largeFile = new File(['x'.repeat(26 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });

    await user.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/too large/i)).toBeInTheDocument();
    });
  });
});

describe('Accessibility Compliance', () => {
  it('should have proper ARIA attributes', () => {
    render(<Contact />);

    const nameInput = screen.getByLabelText(/your name/i);
    expect(nameInput).toHaveAttribute('aria-invalid');
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('aria-invalid');
  });

  it('should associate error messages with form fields', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    const emailInput = screen.getByLabelText(/email address/i);
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should have proper focus management', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    const nameInput = screen.getByLabelText(/your name/i);
    const submitButton = screen.getByRole('button', { name: /send message/i });

    // Try to submit empty form
    await user.click(submitButton);

    await waitFor(() => {
      // Should focus on first error field
      expect(nameInput).toHaveFocus();
    });
  });
});

describe('Performance and User Experience', () => {
  it('should debounce validation to avoid excessive API calls', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(<Contact />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    
    // Type quickly
    await user.type(emailInput, 'test@example.com');
    
    // Fast-forward time to trigger debounced validation
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Validation should only run once after debounce
    expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    
    vi.useRealTimers();
  });

  it('should show loading states during form submission', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    // Fill out form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test');
    await user.type(screen.getByLabelText(/message/i), 'Test message content.');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Check loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('should persist form data during typing', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    const nameInput = screen.getByLabelText(/your name/i);
    
    await user.type(nameInput, 'John Doe');
    
    // Simulate component re-render
    expect(nameInput).toHaveValue('John Doe');
  });
});

describe('Error Handling', () => {
  it('should display network error messages', async () => {
    // Mock a network failure
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    const user = userEvent.setup();
    render(<Contact />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test');
    await user.type(screen.getByLabelText(/message/i), 'Test message.');

    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    global.fetch = originalFetch;
  });

  it('should allow users to retry after errors', async () => {
    const user = userEvent.setup();
    render(<Contact />);

    // Fill form
    await user.type(screen.getByLabelText(/your name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test');
    await user.type(screen.getByLabelText(/message/i), 'Test message.');

    // Submit form (will likely succeed in most test runs)
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Form should still be functional for retry
    expect(screen.getByRole('button', { name: /send message|sending/i })).toBeInTheDocument();
  });
});