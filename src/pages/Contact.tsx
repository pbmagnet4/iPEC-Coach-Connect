import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { TextArea } from '../components/ui/TextArea';
import { Select } from '../components/ui/Select';
import { useForm } from '../hooks/useForm';
import { contactValidationSchemas, FormValidator } from '../lib/form-validation';

const contactInfo = {
  email: 'contact@ipeccoach.com',
  phone: '+1 (888) 555-0123',
  address: {
    street: '123 Coaching Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States',
    coordinates: {
      lat: 40.7484,
      lng: -73.9857,
    },
  },
  hours: {
    weekdays: '9:00 AM - 6:00 PM EST',
    weekends: 'Closed',
  },
  socialMedia: {
    linkedin: 'https://linkedin.com/company/ipec-coach',
    twitter: 'https://twitter.com/ipeccoach',
    facebook: 'https://facebook.com/ipeccoach',
  },
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'general' | 'technical' | 'billing' | 'coaching' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Mock contact service - replace with actual implementation
const contactService = {
  async submitMessage(data: ContactFormData) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure
    if (Math.random() > 0.1) {
      return { success: true, id: `msg_${Date.now()}` };
    } else {
      throw new Error('Failed to send message. Please try again.');
    }
  }
};

export function Contact() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');

  const form = useForm<ContactFormData>({
    schema: contactValidationSchemas.contact,
    initialData: {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general',
      priority: 'normal',
    },
    onSubmit: async (data) => {
      setSubmitStatus('submitting');
      setSubmitError('');
      
      try {
        await contactService.submitMessage(data);
        setSubmitStatus('success');
  void form.resetForm();

        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      } catch (error) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    focusOnError: true,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <Container className="py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <Card.Body className="p-8">
              <form onSubmit={form.handleSubmit()} className="space-y-6">
                {/* Error Message */}
                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{submitError || 'Something went wrong. Please try again.'}</span>
                  </motion.div>
                )}

                {/* Success Message */}
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
                  >
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Message sent successfully!</p>
                      <p className="text-sm">We'll get back to you within 24 hours.</p>
                    </div>
                  </motion.div>
                )}

                {/* Form Fields */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    {...form.getFieldProps('name')}
                    label="Your Name *"
                    placeholder="Enter your full name"
                    icon={<MessageSquare className="h-5 w-5" />}
                  />
                  <Input
                    {...form.getFieldProps('email')}
                    type="email"
                    label="Email Address *"
                    placeholder="your.email@example.com"
                    icon={<Mail className="h-5 w-5" />}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <Select
                    {...form.getFieldProps('category')}
                    label="Category"
                    placeholder="Select a category"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="coaching">Coaching Services</option>
                    <option value="other">Other</option>
                  </Select>
                  
                  <Select
                    {...form.getFieldProps('priority')}
                    label="Priority"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>

                <Input
                  {...form.getFieldProps('subject')}
                  label="Subject *"
                  placeholder="Brief description of your inquiry"
                />

                <TextArea
                  {...form.getFieldProps('message')}
                  label="Message *"
                  placeholder="Please provide details about your inquiry..."
                  rows={6}
                  helpText={`${form.getFieldValue('message')?.length || 0} characters`}
                />

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Response time: within 24 hours</span>
                  </div>
                  
                  <div className="flex gap-3">
                    {form.formState.isDirty && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.resetForm()}
                        disabled={form.formState.isSubmitting}
                      >
                        Reset
                      </Button>
                    )}
                    
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={!form.formState.isValid || form.formState.isSubmitting}
                      className="min-w-[140px]"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Form Status */}
                {form.formState.isDirty && !form.formState.isValid && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p>Please fill in all required fields correctly before submitting.</p>
                  </div>
                )}
              </form>
            </Card.Body>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Quick Contact */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Contact Information</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p className="text-gray-600">
                      {contactInfo.address.street}<br />
                      {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zip}<br />
                      {contactInfo.address.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: {contactInfo.hours.weekdays}<br />
                      Weekend: {contactInfo.hours.weekends}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Map */}
            <Card>
              <Card.Body className="p-0">
                <iframe
                  title="Office Location"
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${contactInfo.address.coordinates.lat},${contactInfo.address.coordinates.lng}`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </Card.Body>
            </Card>

            {/* Additional Support Options */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Additional Support</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  href="/support"
                  icon={<MessageSquare className="h-5 w-5" />}
                >
                  Visit Support Center
                  <Badge variant="success">24/7 Available</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  href="/faq"
                >
                  Browse FAQ
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}