import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Info,
  Plus,
  X
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

type BookingStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { number: 1, title: 'Session' },
  { number: 2, title: 'Schedule' },
  { number: 3, title: 'Details' },
  { number: 4, title: 'Payment' },
  { number: 5, title: 'Confirmation' },
];

const sessionTypes = [
  {
    id: '1',
    name: 'Discovery Session',
    duration: 30,
    price: 0,
    description: "A complimentary consultation to discuss your goals and see if we're a good fit.",
  },
  {
    id: '2',
    name: 'Single Session',
    duration: 60,
    price: 200,
    description: 'One-time coaching session focused on specific goals or challenges.',
  },
  {
    id: '3',
    name: '4-Session Package',
    duration: 60,
    sessionsCount: 4,
    price: 720,
    savings: 80,
    description: 'Monthly coaching package ideal for sustained growth and accountability.',
  },
];

const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

export function Booking() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [selectedSession, setSelectedSession] = useState<string>(
    searchParams.get('session') || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    concerns: '',
    goals: '',
    specialRequests: '',
    isFirstTime: false,
    background: '',
    expectations: '',
    promoCode: '',
    agreeToTerms: false,
  });

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) as BookingStep);
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as BookingStep);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Choose Your Session Type</h2>
            <div className="grid gap-4">
              {sessionTypes.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedSession === session.id
                      ? 'border-brand-500 bg-brand-50 shadow-md'
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{session.name}</h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{session.duration} minutes</span>
                        {session.sessionsCount && (
                          <>
                            <span>•</span>
                            <span>{session.sessionsCount} sessions</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-brand-600">
                        ${session.price}
                      </div>
                      {session.savings && (
                        <Badge variant="success" className="mt-1">
                          Save ${session.savings}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600">{session.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Select Date & Time</h2>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <Globe className="h-4 w-4" />
              <span>Times shown in your local timezone (EST)</span>
              <Button variant="ghost" size="sm">
                Change
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                  {/* Calendar component would go here */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(new Date(2024, 2, i + 1))}
                        className={`aspect-square flex items-center justify-center rounded-lg ${
                          selectedDate?.getDate() === i + 1
                            ? 'bg-brand-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <h3 className="font-semibold">Available Times</h3>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg text-center ${
                        selectedTime === time
                          ? 'bg-brand-600 text-white'
                          : 'bg-white border hover:border-brand-500'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Session Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">
                  What are your primary concerns or challenges?
                </label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, concerns: e.target.value }))
                  }
                  className="w-full h-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Share what's bringing you to coaching..."
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  What are your goals for this session?
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, goals: e.target.value }))
                  }
                  className="w-full h-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="What would you like to achieve?"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Any special requests or accommodations?
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialRequests: e.target.value,
                    }))
                  }
                  className="w-full h-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Optional: Let us know if you have any specific needs..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isFirstTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isFirstTime: e.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>This is my first time working with a coach</span>
                </label>

                {formData.isFirstTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block font-medium mb-2">
                        Tell us about your background
                      </label>
                      <textarea
                        value={formData.background}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            background: e.target.value,
                          }))
                        }
                        className="w-full h-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="Share a bit about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-2">
                        What are your expectations from coaching?
                      </label>
                      <textarea
                        value={formData.expectations}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expectations: e.target.value,
                          }))
                        }
                        className="w-full h-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="What does success look like to you?"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Payment Details</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  <div className="border rounded-lg p-4">
                    <div className="space-y-4">
                      <Input
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        icon={<CreditCard className="h-5 w-5" />}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Expiry Date"
                          placeholder="MM/YY"
                        />
                        <Input
                          label="CVC"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="h-4 w-4" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Promo Code</h3>
                  <div className="flex gap-2">
                    <Input
                      value={formData.promoCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          promoCode: e.target.value,
                        }))
                      }
                      placeholder="Enter code"
                    />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          agreeToTerms: e.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="/terms" className="text-brand-600 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a
                        href="/privacy"
                        className="text-brand-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Card>
                  <Card.Header>
                    <h3 className="font-semibold">Order Summary</h3>
                  </Card.Header>
                  <Card.Body className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Single Session</h4>
                        <p className="text-sm text-gray-600">60 minutes</p>
                      </div>
                      <span className="font-medium">$200.00</span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Subtotal</span>
                        <span>$200.00</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>$200.00</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>March 20, 2024 at 10:00 AM EST</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>60 minutes</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Your Session is Confirmed!
              </h2>
              <p className="text-gray-600">
                We've sent a confirmation email with all the details.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="h-5 w-5" />
                  <span>March 20, 2024 at 10:00 AM EST</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span>60 minutes</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button variant="gradient" size="lg">
                Add to Calendar
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/profile"
                className="w-full"
              >
                View My Sessions
              </Button>
            </div>

            <div className="mt-8 p-6 bg-brand-50 rounded-lg text-left">
              <h3 className="font-semibold mb-4">Prepare for Your Session</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-600" />
                  Find a quiet, private space for your session
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-600" />
                  Test your video and audio before the call
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-600" />
                  Have a notebook ready for taking notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-brand-600" />
                  Review your goals and discussion points
                </li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container size="lg">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2" />
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    step.number < currentStep
                      ? 'bg-green-500 text-white'
                      : step.number === currentStep
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-sm mt-2 ${
                    step.number <= currentStep
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
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

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8 pt-8 border-t">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <Button
                  variant="gradient"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !selectedSession) ||
                    (currentStep === 2 && (!selectedDate || !selectedTime)) ||
                    (currentStep === 4 && !formData.agreeToTerms)
                  }
                >
                  {currentStep === 4 ? 'Confirm & Pay' : 'Continue'}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}