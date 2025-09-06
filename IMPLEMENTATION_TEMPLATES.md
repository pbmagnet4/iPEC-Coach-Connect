# Implementation Code Templates

Ready-to-use code templates for immediate implementation of critical features.

## 1. Stripe Payment Integration

### Environment Setup
```bash
# Install Stripe packages
npm install @stripe/stripe-js @stripe/react-stripe-js

# Add to .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Payment Form Component
```typescript
// src/components/payments/StripePaymentForm.tsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  amount: number; // Amount in cents
  sessionId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  amount,
  sessionId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment intent on backend
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          sessionId,
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        throw new Error(backendError);
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        loading={processing}
        className="w-full"
      >
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  );
};

export const StripePaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};
```

### Backend Payment Intent Endpoint
```typescript
// supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-08-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { amount, sessionId } = await req.json();

    // Validate session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        sessionId,
        coachId: session.coach_id,
        clientId: session.client_id,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return new Response(
      JSON.stringify({ error: 'Payment intent creation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Integration into Booking Flow
```typescript
// Update src/pages/Booking.tsx - Step 4 Payment
const renderPaymentStep = () => {
  const selectedSessionType = sessionTypes.find(s => s.id === selectedSession);
  const amount = selectedSessionType?.price || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Payment Details</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StripePaymentForm
            amount={amount * 100} // Convert to cents
            sessionId={pendingSessionId}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
        
        <OrderSummary 
          sessionType={selectedSessionType}
          date={selectedDate}
          time={selectedTime}
        />
      </div>
    </div>
  );
};

const handlePaymentSuccess = async (paymentIntentId: string) => {
  try {
    // Update session with payment info
    await bookingService.confirmPayment(pendingSessionId, paymentIntentId);
    
    // Send confirmation
    await notificationService.sendBookingConfirmation(pendingSessionId);
    
    // Move to success step
    setCurrentStep(5);
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    setError('Payment succeeded but confirmation failed. Please contact support.');
  }
};
```

## 2. Coach Onboarding System

### Coach Application Form
```typescript
// src/pages/BecomeCoach.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { coachService } from '../services/coach.service';

interface CoachApplicationData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  
  // Certification
  ipecCertificationNumber: string;
  certificationLevel: 'Associate' | 'Professional' | 'Master';
  certificationDate: string;
  certificateFile?: File;
  
  // Experience
  yearsExperience: number;
  specializations: string[];
  previousClients: number;
  otherCertifications: string[];
  
  // Business
  hourlyRate: number;
  services: string[];
  languages: string[];
  availability: string;
  bio: string;
  
  // References
  references: Array<{
    name: string;
    email: string;
    relationship: string;
  }>;
}

const steps = [
  { id: 1, title: 'Personal Info', fields: ['fullName', 'email', 'phone', 'location'] },
  { id: 2, title: 'Certification', fields: ['ipecCertificationNumber', 'certificationLevel'] },
  { id: 3, title: 'Experience', fields: ['yearsExperience', 'specializations'] },
  { id: 4, title: 'Business', fields: ['hourlyRate', 'services', 'bio'] },
  { id: 5, title: 'Review', fields: [] },
];

export const BecomeCoach = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CoachApplicationData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ipecCertificationNumber: '',
    certificationLevel: 'Associate',
    certificationDate: '',
    yearsExperience: 0,
    specializations: [],
    previousClients: 0,
    otherCertifications: [],
    hourlyRate: 150,
    services: [],
    languages: ['English'],
    availability: '',
    bio: '',
    references: [
      { name: '', email: '', relationship: '' },
      { name: '', email: '', relationship: '' },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof CoachApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const stepFields = steps.find(s => s.id === step)?.fields || [];

    stepFields.forEach(field => {
      const value = formData[field as keyof CoachApplicationData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = `${field} is required`;
      }
    });

    // Additional validation
    if (step === 2) {
      if (!formData.ipecCertificationNumber.match(/^IPEC-\d{4,6}$/)) {
        newErrors.ipecCertificationNumber = 'Please enter valid iPEC certification number (IPEC-XXXX)';
      }
    }

    if (step === 4) {
      if (formData.hourlyRate < 50 || formData.hourlyRate > 500) {
        newErrors.hourlyRate = 'Hourly rate must be between $50-$500';
      }
      if (formData.bio.length < 100) {
        newErrors.bio = 'Bio must be at least 100 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await coachService.submitApplication(formData);
      // Show success message and redirect
      alert('Application submitted successfully! You will be notified once reviewed.');
    } catch (error) {
      console.error('Application submission failed:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={errors.fullName}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              required
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={errors.phone}
              required
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              error={errors.location}
              placeholder="City, State/Country"
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">iPEC Certification</h3>
            <Input
              label="iPEC Certification Number"
              value={formData.ipecCertificationNumber}
              onChange={(e) => updateField('ipecCertificationNumber', e.target.value)}
              error={errors.ipecCertificationNumber}
              placeholder="IPEC-12345"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certification Level
              </label>
              <select
                value={formData.certificationLevel}
                onChange={(e) => updateField('certificationLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              >
                <option value="Associate">Associate Certified Coach (ACC)</option>
                <option value="Professional">Professional Certified Coach (PCC)</option>
                <option value="Master">Master Certified Coach (MCC)</option>
              </select>
            </div>
            <Input
              label="Certification Date"
              type="date"
              value={formData.certificationDate}
              onChange={(e) => updateField('certificationDate', e.target.value)}
              error={errors.certificationDate}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Upload
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => updateField('certificateFile', e.target.files?.[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload a copy of your iPEC certification (PDF, JPG, or PNG)
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Experience</h3>
            <Input
              label="Years of Coaching Experience"
              type="number"
              min="0"
              value={formData.yearsExperience}
              onChange={(e) => updateField('yearsExperience', parseInt(e.target.value) || 0)}
              error={errors.yearsExperience}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specializations
              </label>
              <SpecializationSelector
                selected={formData.specializations}
                onChange={(specializations) => updateField('specializations', specializations)}
              />
            </div>
            <Input
              label="Number of Previous Clients"
              type="number"
              min="0"
              value={formData.previousClients}
              onChange={(e) => updateField('previousClients', parseInt(e.target.value) || 0)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Business Information</h3>
            <Input
              label="Hourly Rate (USD)"
              type="number"
              min="50"
              max="500"
              value={formData.hourlyRate}
              onChange={(e) => updateField('hourlyRate', parseInt(e.target.value) || 0)}
              error={errors.hourlyRate}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                placeholder="Tell potential clients about yourself, your coaching style, and what makes you unique..."
              />
              {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/100 characters minimum
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Review Your Application</h3>
            <ApplicationReview data={formData} />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Next Steps</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Your application will be reviewed within 3-5 business days</li>
                <li>• We may contact you for additional information</li>
                <li>• Once approved, you'll receive setup instructions</li>
                <li>• You can start accepting clients after profile completion</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card>
          <Card.Body className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8 pt-8 border-t">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <Button onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                >
                  Submit Application
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

const SpecializationSelector: React.FC<{
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ selected, onChange }) => {
  const specializations = [
    'Life Coaching',
    'Executive Coaching',
    'Career Coaching',
    'Relationship Coaching',
    'Health & Wellness',
    'Leadership Development',
    'Team Coaching',
    'Transition Coaching',
    'Spiritual Coaching',
    'Business Coaching',
  ];

  const toggleSpecialization = (spec: string) => {
    if (selected.includes(spec)) {
      onChange(selected.filter(s => s !== spec));
    } else {
      onChange([...selected, spec]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {specializations.map(spec => (
        <label key={spec} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selected.includes(spec)}
            onChange={() => toggleSpecialization(spec)}
            className="rounded"
          />
          <span className="text-sm">{spec}</span>
        </label>
      ))}
    </div>
  );
};
```

### Coach Service Integration
```typescript
// src/services/coach.service.ts - Add application methods
class CoachService {
  async submitApplication(applicationData: CoachApplicationData): Promise<void> {
    const { user } = authService.getState();
    if (!user) throw new Error('User not authenticated');

    // Upload certificate if provided
    let certificateUrl: string | undefined;
    if (applicationData.certificateFile) {
      certificateUrl = await this.uploadCertificate(
        applicationData.certificateFile,
        user.id
      );
    }

    // Submit application
    const { error } = await supabase
      .from('coach_applications')
      .insert({
        user_id: user.id,
        application_data: {
          ...applicationData,
          certificateUrl,
        },
        status: 'pending',
      });

    if (error) throw error;

    // Send notification to admins
    await notificationService.notifyAdmins('new_coach_application', {
      applicantName: applicationData.fullName,
      applicantEmail: applicationData.email,
    });
  }

  private async uploadCertificate(file: File, userId: string): Promise<string> {
    const fileName = `certificates/${userId}-${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('coach-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('coach-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async approveCoach(userId: string, adminId: string): Promise<void> {
    // Update application status
    const { error: updateError } = await supabase
      .from('coach_applications')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Get application data
    const { data: application, error: fetchError } = await supabase
      .from('coach_applications')
      .select('application_data')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Create coach record
    const { error: coachError } = await supabase
      .from('coaches')
      .insert({
        id: userId,
        ipec_certification_number: application.application_data.ipecCertificationNumber,
        certification_level: application.application_data.certificationLevel,
        certification_date: application.application_data.certificationDate,
        specializations: application.application_data.specializations,
        hourly_rate: application.application_data.hourlyRate,
        experience_years: application.application_data.yearsExperience,
        languages: application.application_data.languages,
        verified_at: new Date().toISOString(),
        is_active: true,
      });

    if (coachError) throw coachError;

    // Update profile
    await supabase
      .from('profiles')
      .update({
        bio: application.application_data.bio,
        location: application.application_data.location,
      })
      .eq('id', userId);

    // Send approval notification
    await notificationService.sendCoachApproval(userId);
  }
}
```

## 3. Real-time Chat System

### Message Components
```typescript
// src/components/messaging/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Send, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

interface ChatInterfaceProps {
  threadId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  threadId,
  currentUserId,
  otherUser,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel>();

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [threadId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages:thread_id=eq.${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
          filter: `id=eq.${threadId}`,
        },
        (payload) => {
          // Handle typing indicators or thread updates
          const updatedThread = payload.new;
          if (updatedThread.typing_user_id && 
              updatedThread.typing_user_id !== currentUserId) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [threadId, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: currentUserId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateTypingIndicator = async (isTyping: boolean) => {
    await supabase
      .from('message_threads')
      .update({
        typing_user_id: isTyping ? currentUserId : null,
        typing_updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);
  };

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar 
          src={otherUser.avatar_url} 
          alt={otherUser.full_name}
          size="sm" 
        />
        <div>
          <h3 className="font-medium">{otherUser.full_name}</h3>
          <p className="text-sm text-gray-500">
            {isTyping ? 'Typing...' : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-brand-200' : 'text-gray-500'
                  }`}
                >
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                updateTypingIndicator(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              rows={1}
              disabled={sending}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
            icon={<Send className="h-4 w-4" />}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Message Thread Management
```typescript
// src/components/messaging/MessageThreadList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface MessageThread {
  id: string;
  participant_ids: string[];
  session_id?: string;
  subject?: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  other_participant?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  unread_count: number;
}

interface MessageThreadListProps {
  onSelectThread: (thread: MessageThread) => void;
  selectedThreadId?: string;
}

export const MessageThreadList: React.FC<MessageThreadListProps> = ({
  onSelectThread,
  selectedThreadId,
}) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;

    try {
      // Get threads where user is a participant
      const { data: threadsData, error: threadsError } = await supabase
        .from('message_threads')
        .select(`
          id,
          participant_ids,
          session_id,
          subject,
          created_at
        `)
        .contains('participant_ids', [user.id])
        .order('updated_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Get last message for each thread and other participant info
      const threadsWithDetails = await Promise.all(
        (threadsData || []).map(async (thread) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get other participant
          const otherParticipantId = thread.participant_ids.find(
            id => id !== user.id
          );
          
          let otherParticipant = null;
          if (otherParticipantId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', otherParticipantId)
              .single();
            
            otherParticipant = profile;
          }

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...thread,
            last_message: lastMessage,
            other_participant: otherParticipant,
            unread_count: unreadCount || 0,
          };
        })
      );

      setThreads(threadsWithDetails);
    } catch (error) {
      console.error('Failed to load message threads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onSelectThread(thread)}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedThreadId === thread.id ? 'bg-brand-50 border-r-2 border-brand-500' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            <Avatar
              src={thread.other_participant?.avatar_url}
              alt={thread.other_participant?.full_name || 'Unknown'}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {thread.other_participant?.full_name || 'Unknown User'}
                </h3>
                {thread.last_message && (
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(
                      new Date(thread.last_message.created_at),
                      { addSuffix: true }
                    )}
                  </p>
                )}
              </div>
              
              {thread.subject && (
                <p className="text-sm text-brand-600 mb-1">
                  {thread.subject}
                </p>
              )}
              
              {thread.last_message && (
                <p className="text-sm text-gray-600 truncate">
                  {thread.last_message.sender_id === user?.id ? 'You: ' : ''}
                  {thread.last_message.content}
                </p>
              )}
              
              {thread.unread_count > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <div />
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                    {thread.unread_count} new
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 4. Calendar Integration for Booking

### Calendar Component with Availability
```typescript
// src/components/booking/AvailabilityCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { coachService } from '../../services/coach.service';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

const localizer = momentLocalizer(moment);

interface AvailabilitySlot {
  id: string;
  start: Date;
  end: Date;
  title: string;
  available: boolean;
  resource?: {
    coachId: string;
    sessionTypeId?: string;
  };
}

interface AvailabilityCalendarProps {
  coachId: string;
  sessionDuration: number; // in minutes
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  selectedSlot?: { start: Date; end: Date } | null;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  coachId,
  sessionDuration,
  onSelectSlot,
  selectedSlot,
}) => {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [coachId, currentDate]);

  const loadAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get start and end of month
      const startOfMonth = moment(currentDate).startOf('month').toISOString();
      const endOfMonth = moment(currentDate).endOf('month').toISOString();

      // Load coach availability and existing bookings
      const [availabilityResult, bookingsResult] = await Promise.all([
        coachService.getAvailableSlots(coachId, startOfMonth, endOfMonth, sessionDuration),
        coachService.getBookedSlots(coachId, startOfMonth, endOfMonth),
      ]);

      if (availabilityResult.error) {
        throw new Error(availabilityResult.error.message);
      }

      if (bookingsResult.error) {
        throw new Error(bookingsResult.error.message);
      }

      // Convert to calendar events
      const availableEvents: AvailabilitySlot[] = (availabilityResult.data || []).map(slot => ({
        id: `available-${slot.startTime}`,
        start: new Date(slot.startTime),
        end: new Date(slot.endTime),
        title: 'Available',
        available: true,
        resource: { coachId },
      }));

      const bookedEvents: AvailabilitySlot[] = (bookingsResult.data || []).map(booking => ({
        id: `booked-${booking.id}`,
        start: new Date(booking.scheduled_at),
        end: new Date(
          new Date(booking.scheduled_at).getTime() + booking.duration_minutes * 60000
        ),
        title: 'Booked',
        available: false,
        resource: { coachId },
      }));

      setAvailableSlots(availableEvents);
      setBookedSlots(bookedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Check if the selected slot is available
    const selectedStart = slotInfo.start;
    const selectedEnd = new Date(
      selectedStart.getTime() + sessionDuration * 60000
    );

    // Check for conflicts with booked slots
    const hasConflict = bookedSlots.some(bookedSlot => {
      return (
        (selectedStart >= bookedSlot.start && selectedStart < bookedSlot.end) ||
        (selectedEnd > bookedSlot.start && selectedEnd <= bookedSlot.end) ||
        (selectedStart <= bookedSlot.start && selectedEnd >= bookedSlot.end)
      );
    });

    if (hasConflict) {
      setError('This time slot is not available. Please select another time.');
      return;
    }

    // Check if it falls within available hours
    const isWithinAvailableHours = availableSlots.some(availableSlot => {
      return selectedStart >= availableSlot.start && selectedEnd <= availableSlot.end;
    });

    if (!isWithinAvailableHours) {
      setError('Please select a time within the coach\'s available hours.');
      return;
    }

    // Check if it's in the future
    if (selectedStart <= new Date()) {
      setError('Please select a future time slot.');
      return;
    }

    setError(null);
    onSelectSlot({ start: selectedStart, end: selectedEnd });
  };

  const eventStyleGetter = (event: AvailabilitySlot) => {
    let backgroundColor = '#e5e7eb'; // gray
    let color = '#374151';

    if (event.available) {
      backgroundColor = '#dcfce7'; // green-100
      color = '#166534'; // green-800
    } else {
      backgroundColor = '#fef2f2'; // red-50
      color = '#991b1b'; // red-800
    }

    // Highlight selected slot
    if (selectedSlot && 
        event.start.getTime() === selectedSlot.start.getTime()) {
      backgroundColor = '#3b82f6'; // blue-500
      color = 'white';
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
      },
    };
  };

  const allEvents = [...availableSlots, ...bookedSlots];

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="h-96">
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          onSelectSlot={handleSelectSlot}
          onNavigate={(date) => setCurrentDate(date)}
          selectable
          step={sessionDuration}
          timeslots={1}
          min={new Date(2024, 0, 1, 8, 0)} // 8 AM
          max={new Date(2024, 0, 1, 20, 0)} // 8 PM
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
          style={{ height: '100%' }}
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>Selected</span>
        </div>
      </div>

      {selectedSlot && (
        <Alert variant="info">
          <div className="space-y-2">
            <p className="font-medium">Selected Time Slot:</p>
            <p>
              {moment(selectedSlot.start).format('MMMM Do, YYYY')} at{' '}
              {moment(selectedSlot.start).format('h:mm A')} -{' '}
              {moment(selectedSlot.end).format('h:mm A')}
            </p>
            <p className="text-sm text-gray-600">
              Duration: {sessionDuration} minutes
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
};
```

## 5. Service Layer Updates

### Enhanced Booking Service
```typescript
// src/services/booking.service.ts - Add missing methods
export class BookingService {
  // ... existing methods ...

  async confirmPayment(sessionId: string, paymentIntentId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  async createMessageThread(sessionId: string): Promise<string> {
    // Get session participants
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('coach_id, client_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Create message thread
    const { data: thread, error: threadError } = await supabase
      .from('message_threads')
      .insert({
        participant_ids: [session.coach_id, session.client_id],
        session_id: sessionId,
        subject: `Session Discussion`,
      })
      .select('id')
      .single();

    if (threadError || !thread) {
      throw new Error('Failed to create message thread');
    }

    return thread.id;
  }

  async getBookedSlots(
    coachId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ApiResponse<Session[]>> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate);

      if (error) throw error;

      return { data: data || [] };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }
}
```

## 6. Quick Implementation Steps

### Day 1-2: Payment Setup
1. Install Stripe packages: `npm install @stripe/stripe-js @stripe/react-stripe-js`
2. Add Stripe keys to environment variables
3. Create payment form component
4. Set up Supabase Edge Function for payment intents
5. Test with Stripe test cards

### Day 3-4: Coach Applications  
1. Create application form with validation
2. Add file upload for certificates
3. Create admin approval interface
4. Set up email notifications
5. Test complete application flow

### Day 5-7: Real-time Chat
1. Set up message tables and RLS policies
2. Create chat interface component
3. Implement real-time subscriptions
4. Add typing indicators
5. Test messaging between users

### Day 8-10: Calendar Integration
1. Install react-big-calendar: `npm install react-big-calendar moment`
2. Create availability calendar component
3. Connect to coach availability data
4. Implement slot selection and validation
5. Test booking flow with calendar

## Testing Checklist

### Payment Integration
- [ ] Test card payment with test cards (4242 4242 4242 4242)
- [ ] Test declined cards (4000 0000 0000 0002)
- [ ] Verify payment intent creation
- [ ] Confirm session update after payment
- [ ] Test webhook handling

### Coach Onboarding
- [ ] Submit complete application
- [ ] Verify file upload works
- [ ] Test admin approval flow
- [ ] Confirm email notifications
- [ ] Verify coach profile creation

### Real-time Chat
- [ ] Send message in real-time
- [ ] Receive messages in real-time
- [ ] Test typing indicators
- [ ] Verify message persistence
- [ ] Test with multiple tabs/devices

### Calendar Booking
- [ ] View available time slots
- [ ] Select and confirm time slot
- [ ] Prevent double-booking
- [ ] Validate future dates only
- [ ] Test different session durations

Each template can be implemented independently, allowing for parallel development and rapid iteration.