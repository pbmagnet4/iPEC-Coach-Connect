import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Shield,
  Star,
  User
} from 'lucide-react';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BookingCalendar } from './BookingCalendar';
import { type AvailableSlot, type BookingRequest, bookingService } from '../../services/booking.service';
import { type BookingConflict, realTimeBookingService } from '../../services/real-time-booking.service';
import { coachManagementService, type CoachProfile } from '../../services/coach.service';
import { authService } from '../../services/auth.service';
import { format } from 'date-fns';

interface BookingStep {
  id: number;
  title: string;
  description: string;
}

interface SessionType {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  features?: string[];
  popular?: boolean;
}

interface BookingFormData {
  sessionTypeId: string;
  coachId: string;
  selectedDate: Date | null;
  selectedTime: string;
  selectedSlot: AvailableSlot | null;
  sessionNotes: string;
  isFirstTime: boolean;
  background: string;
  goals: string;
  specialRequests: string;
  paymentMethodId: string;
  promoCode: string;
  agreeToTerms: boolean;
}

const BOOKING_STEPS: BookingStep[] = [
  { id: 1, title: 'Session Type', description: 'Choose your coaching session' },
  { id: 2, title: 'Schedule', description: 'Select date and time' },
  { id: 3, title: 'Details', description: 'Provide session information' },
  { id: 4, title: 'Payment', description: 'Complete your booking' },
  { id: 5, title: 'Confirmation', description: 'Your session is booked!' }
];

const SESSION_TYPES: SessionType[] = [
  {
    id: 'discovery',
    name: 'Discovery Session',
    description: 'A complimentary consultation to explore your goals and see if we\'re a good fit.',
    duration: 30,
    price: 0,
    features: ['Goal exploration', 'Coaching fit assessment', 'Next steps planning']
  },
  {
    id: 'single',
    name: 'Single Coaching Session',
    description: 'One-time focused coaching session for specific goals or challenges.',
    duration: 60,
    price: 200,
    features: ['Personalized coaching', 'Action plan', 'Follow-up resources']
  },
  {
    id: 'package',
    name: '4-Session Package',
    description: 'Monthly coaching package for sustained growth and accountability.',
    duration: 60,
    price: 720,
    features: ['4 x 60-minute sessions', 'Email support', 'Progress tracking', 'Resource library'],
    popular: true
  }
];

export function EnhancedBookingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    sessionTypeId: searchParams.get('session') || '',
    coachId: searchParams.get('coach') || '',
    selectedDate: null,
    selectedTime: '',
    selectedSlot: null,
    sessionNotes: '',
    isFirstTime: false,
    background: '',
    goals: '',
    specialRequests: '',
    paymentMethodId: '',
    promoCode: '',
    agreeToTerms: false
  });

  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [reservationId, setReservationId] = useState<string>('');
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Real-time subscription cleanup
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    if (formData.coachId) {
      // Subscribe to real-time booking updates
      cleanup = realTimeBookingService.subscribeToCoachBookings(
        formData.coachId,
        (event) => {
          if (event.type === 'session_booked' && formData.selectedSlot) {
            // Check if the booked session conflicts with our selected slot
            checkForConflicts();
          }
        }
      );
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [formData.coachId, formData.selectedSlot]);

  // Load coach information
  useEffect(() => {
    if (formData.coachId) {
      loadCoachInfo();
    }
  }, [formData.coachId]);

  const loadCoachInfo = async () => {
    try {
      const result = await coachManagementService.getCoachProfile(formData.coachId);
      if (result.data) {
        setCoach(result.data);
      }
    } catch (err) {
      console.error('Error loading coach info:', err);
    }
  };

  const checkForConflicts = useCallback(async () => {
    if (!formData.selectedSlot || !formData.coachId) return;

    setLoading(true);
    try {
      const conflictResult = await realTimeBookingService.checkBookingConflicts(
        formData.coachId,
        formData.selectedSlot.startTime,
        formData.selectedSlot.duration
      );
      setConflicts(conflictResult);
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setLoading(false);
    }
  }, [formData.coachId, formData.selectedSlot]);

  const handleStepChange = (step: number) => {
    if (step <= currentStep + 1 && step >= 1) {
      setCurrentStep(step);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2 && formData.selectedSlot) {
      // Reserve the time slot when moving to details step
      await reserveTimeSlot();
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reserveTimeSlot = async () => {
    if (!formData.selectedSlot) return;

    setLoading(true);
    try {
      const result = await realTimeBookingService.reserveTimeSlot(
        formData.coachId,
        formData.selectedSlot.startTime,
        formData.selectedSlot.duration,
        10 // 10-minute reservation
      );

      if (result.success) {
        setReservationId(result.reservationId || '');
      } else if (result.conflicts) {
        setConflicts(result.conflicts);
        setError('This time slot is no longer available. Please select a different time.');
        setCurrentStep(2); // Go back to scheduling
      }
    } catch (err) {
      console.error('Error reserving time slot:', err);
      setError('Unable to reserve time slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!formData.selectedSlot) return;

    setLoading(true);
    setError('');

    try {
      const selectedSessionType = SESSION_TYPES.find(st => st.id === formData.sessionTypeId);
      if (!selectedSessionType) {
        throw new Error('Invalid session type selected');
      }

      const bookingRequest: BookingRequest = {
        coachId: formData.coachId,
        sessionTypeId: formData.sessionTypeId,
        scheduledAt: formData.selectedSlot.startTime,
        durationMinutes: formData.selectedSlot.duration,
        notes: [
          formData.sessionNotes,
          formData.isFirstTime ? `First-time client. Background: ${formData.background}` : '',
          formData.goals ? `Goals: ${formData.goals}` : '',
          formData.specialRequests ? `Special requests: ${formData.specialRequests}` : ''
        ].filter(Boolean).join('\n\n'),
        paymentMethodId: selectedSessionType.price > 0 ? formData.paymentMethodId : undefined,
        discountCode: formData.promoCode || undefined
      };

      const result = await bookingService.bookSession(bookingRequest);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setBookingResult(result.data);
      setCurrentStep(5); // Move to confirmation step

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const getSelectedSessionType = () => {
    return SESSION_TYPES.find(st => st.id === formData.sessionTypeId);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.sessionTypeId;
      case 2:
        return !!formData.selectedDate && !!formData.selectedTime && !!formData.selectedSlot;
      case 3:
        return formData.sessionNotes.length > 0;
      case 4:
        const sessionType = getSelectedSessionType();
        return formData.agreeToTerms && (sessionType?.price === 0 || !!formData.paymentMethodId);
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Choose Your Session Type</h2>
              <p className="text-gray-600">Select the coaching session that best fits your needs</p>
            </div>

            <div className="grid gap-6">
              {SESSION_TYPES.map((sessionType) => (
                <motion.div
                  key={sessionType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    relative border rounded-xl p-6 cursor-pointer transition-all
                    ${formData.sessionTypeId === sessionType.id
                      ? 'border-brand-500 bg-brand-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                  onClick={() => updateFormData({ sessionTypeId: sessionType.id })}
                >
                  {sessionType.popular && (
                    <Badge 
                      variant="success" 
                      className="absolute -top-2 right-4"
                    >
                      Most Popular
                    </Badge>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{sessionType.name}</h3>
                      <div className="flex items-center gap-3 text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{sessionType.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${sessionType.price}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{sessionType.description}</p>
                    </div>
                  </div>

                  {sessionType.features && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-800">What's included:</h4>
                      <ul className="space-y-1">
                        {sessionType.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Select Date & Time</h2>
              <p className="text-gray-600">Choose when you'd like to have your session</p>
            </div>

            {conflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Booking Conflict</h3>
                    {conflicts.map((conflict, index) => (
                      <p key={index} className="text-red-600 text-sm">{conflict.message}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <BookingCalendar
              coachId={formData.coachId}
              sessionDurationMinutes={getSelectedSessionType()?.duration || 60}
              selectedDate={formData.selectedDate}
              selectedTime={formData.selectedTime}
              onDateSelect={(date) => updateFormData({ selectedDate: date })}
              onTimeSelect={(time, slot) => updateFormData({ 
                selectedTime: time, 
                selectedSlot: slot 
              })}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Session Details</h2>
              <p className="text-gray-600">Help your coach prepare for your session</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-3">
                  What would you like to focus on in this session?
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={formData.sessionNotes}
                  onChange={(e) => updateFormData({ sessionNotes: e.target.value })}
                  className="w-full h-32 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="Share what's bringing you to coaching, your current challenges, or what you'd like to achieve..."
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-3">What are your goals for this session?</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => updateFormData({ goals: e.target.value })}
                  className="w-full h-24 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="What outcomes would make this session successful for you?"
                />
              </div>

              <div>
                <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.isFirstTime}
                    onChange={(e) => updateFormData({ isFirstTime: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">This is my first time working with a coach</span>
                    <p className="text-sm text-gray-600 mt-1">
                      We'll take extra time to explain the coaching process
                    </p>
                  </div>
                </label>

                <AnimatePresence>
                  {formData.isFirstTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <div>
                        <label className="block font-medium mb-2">
                          Tell us about your background
                        </label>
                        <textarea
                          value={formData.background}
                          onChange={(e) => updateFormData({ background: e.target.value })}
                          className="w-full h-24 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                          placeholder="Share a bit about yourself, your career, or current situation..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Any special requests or accommodations?
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => updateFormData({ specialRequests: e.target.value })}
                  className="w-full h-20 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="Let us know if you have any specific needs or preferences..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const sessionType = getSelectedSessionType();
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Complete Your Booking</h2>
              <p className="text-gray-600">Review your session details and payment</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Payment Section */}
              <div className="space-y-6">
                {sessionType && sessionType.price > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Method
                    </h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-center text-gray-600">
                        Payment integration would go here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">No payment required</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      This is a complimentary discovery session
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => updateFormData({ agreeToTerms: e.target.checked })}
                        className="mt-1"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" className="text-brand-600 hover:underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-brand-600 hover:underline">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Booking Summary */}
              <div>
                <Card>
                  <Card.Header>
                    <h3 className="font-semibold">Booking Summary</h3>
                  </Card.Header>
                  <Card.Body className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session Type</span>
                        <span className="font-medium">{sessionType?.name}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span>{sessionType?.duration} minutes</span>
                      </div>

                      {coach && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coach</span>
                          <span>{coach.profile.full_name}</span>
                        </div>
                      )}

                      {formData.selectedDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date</span>
                          <span>{format(formData.selectedDate, 'MMM d, yyyy')}</span>
                        </div>
                      )}

                      {formData.selectedTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time</span>
                          <span>{formData.selectedTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${sessionType?.price || 0}</span>
                      </div>
                    </div>

                    {reservationId && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-blue-800 text-sm">
                          Time slot reserved for 10 minutes
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>

              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                  Your Session is Confirmed!
                </h2>
                <p className="text-gray-600 text-lg">
                  We've sent confirmation details to your email
                </p>
              </div>

              {formData.selectedDate && formData.selectedSlot && (
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <CalendarIcon className="h-5 w-5" />
                      <span>{format(formData.selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Clock className="h-5 w-5" />
                      <span>{formData.selectedTime} ({getSelectedSessionType()?.duration} min)</span>
                    </div>
                    {coach && (
                      <div className="flex items-center justify-center gap-2 text-gray-700">
                        <User className="h-5 w-5" />
                        <span>{coach.profile.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="min-w-48"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/sessions')}
                  className="min-w-48"
                >
                  View My Sessions
                </Button>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="lg">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-brand-500 to-brand-600 -translate-y-1/2 transition-all duration-500 -z-10"
              style={{ width: `${((currentStep - 1) / (BOOKING_STEPS.length - 1)) * 100}%` }}
            />
            
            {BOOKING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="relative flex flex-col items-center cursor-pointer"
                onClick={() => handleStepChange(step.id)}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                    ${step.id <= currentStep
                      ? step.id === currentStep 
                        ? 'bg-brand-600 text-white shadow-lg scale-110'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-3 text-center">
                  <div
                    className={`
                      text-sm font-medium
                      ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'}
                    `}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 max-w-20">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card>
          <Card.Body className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  variant="gradient"
                  onClick={currentStep === 4 ? handleBookingSubmit : handleNext}
                  disabled={!canProceed() || loading}
                  className="flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {currentStep === 4 ? 'Confirm Booking' : 'Continue'}
                  {currentStep < 4 && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default EnhancedBookingFlow;