import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useForm } from '../hooks/useForm';
import { contactValidationSchemas } from '../lib/form-validation';

const contactMethods = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    availability: 'Available 24/7',
    responseTime: '< 5 minutes',
    status: 'online',
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message',
    availability: 'Monitored 24/7',
    responseTime: '< 24 hours',
    email: 'support@ipeccoach.com',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our team',
    availability: 'Mon-Fri, 9AM-6PM EST',
    responseTime: 'Immediate',
    phone: '+1 (888) 555-0123',
  },
];

const commonIssues = [
  {
    title: 'Account Access',
    description: 'Login issues, password reset, account verification',
    path: '/faq#account',
  },
  {
    title: 'Billing & Payments',
    description: 'Payment methods, invoices, subscription issues',
    path: '/faq#billing',
  },
  {
    title: 'Technical Issues',
    description: 'Platform functionality, video calls, app problems',
    path: '/faq#technical',
  },
  {
    title: 'Coaching Sessions',
    description: 'Scheduling, cancellations, session management',
    path: '/faq#sessions',
  },
];

interface SupportTicketData {
  name: string;
  email: string;
  subject: string;
  category: 'account' | 'billing' | 'technical' | 'feature' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  description: string;
  attachments: File[];
}

// Mock support service - replace with actual implementation
const supportService = {
  async submitTicket(data: SupportTicketData) {
    // Simulate API call with file upload
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate success/failure
    if (Math.random() > 0.05) {
      return { 
        success: true, 
        ticketId: `TICK-${Date.now()}`,
        estimatedResponseTime: '24 hours'
      };
    } else {
      throw new Error('Failed to submit support ticket. Please try again or contact us directly.');
    }
  }
};

export function Support() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');

  const form = useForm<SupportTicketData>({
    schema: contactValidationSchemas.support,
    initialData: {
      name: '',
      email: '',
      subject: '',
      category: 'technical',
      priority: 'normal',
      description: '',
      attachments: [],
    },
    onSubmit: async (data) => {
      setSubmitStatus('submitting');
      setSubmitError('');
      
      try {
        const result = await supportService.submitTicket(data);
        setSubmitStatus('success');
        setTicketId(result.ticketId);
  void form.resetForm();

        // Reset success message after 10 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
          setTicketId('');
        }, 10000);
      } catch (error) {
        setSubmitStatus('error');
        setSubmitError(error instanceof Error ? error.message : 'Failed to submit ticket');
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    focusOnError: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentFiles = form.getFieldValue('attachments') || [];
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        setSubmitError(`File "${file.name}" is too large. Maximum size is 25MB.`);
        return false;
      }
      return true;
    });

  void form.setFieldValue('attachments', [...currentFiles, ...validFiles]);
    
    // Clear the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    const currentFiles = form.getFieldValue('attachments') || [];
  void form.setFieldValue('attachments', currentFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <Container className="py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">How Can We Help?</h1>
            <p className="text-xl text-gray-600">
              Get in touch with our support team through your preferred channel
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid sm:grid-cols-3 gap-6">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Card key={method.title} hover>
                    <Card.Body className="p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold mb-2">{method.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {method.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{method.availability}</span>
                          </div>
                          <Badge
                            variant={method.status === 'online' ? 'success' : 'default'}
                            className="mx-auto"
                          >
                            {method.responseTime}
                          </Badge>
                        </div>
                        {'email' in method && (
                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            href={`mailto:${method.email}`}
                          >
                            Send Email
                          </Button>
                        )}
                        {'phone' in method && (
                          <Button
                            variant="outline"
                            className="mt-4 w-full"
                            href={`tel:${method.phone}`}
                          >
                            Call Now
                          </Button>
                        )}
                        {method.status && (
                          <Button
                            variant="gradient"
                            className="mt-4 w-full"
                          >
                            Start Chat
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>

            {/* Submit Ticket Form */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Submit a Support Ticket</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill out this form and we'll get back to you within 24 hours
                </p>
              </Card.Header>
              <Card.Body>
                <form onSubmit={form.handleSubmit()} className="space-y-6">
                  {/* Status Messages */}
                  <AnimatePresence>
                    {submitStatus === 'error' && submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{submitError}</span>
                      </motion.div>
                    )}

                    {submitStatus === 'success' && ticketId && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium">Support ticket submitted successfully!</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Ticket ID:</strong> {ticketId}</p>
                          <p><strong>Expected response:</strong> Within 24 hours</p>
                          <p>We've sent a confirmation email with your ticket details.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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

                  <Input
                    {...form.getFieldProps('subject')}
                    label="Subject *"
                    placeholder="Brief description of your issue"
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <Select
                      {...form.getFieldProps('category')}
                      label="Category *"
                      placeholder="Select a category"
                    >
                      <option value="account">Account Issues</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="technical">Technical Support</option>
                      <option value="feature">Feature Request</option>
                      <option value="other">Other</option>
                    </Select>

                    <Select
                      {...form.getFieldProps('priority')}
                      label="Priority"
                    >
                      <option value="low">Low - General question</option>
                      <option value="normal">Normal - Standard support</option>
                      <option value="high">High - Urgent issue</option>
                      <option value="urgent">Urgent - Critical problem</option>
                    </Select>
                  </div>

                  <TextArea
                    {...form.getFieldProps('description')}
                    label="Description *"
                    placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce the problem, and what you've already tried..."
                    rows={6}
                    helpText={`${form.getFieldValue('description')?.length || 0} characters`}
                  />

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
                      <div className="space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <div>
                          <label className="cursor-pointer">
                            <span className="text-brand-600 hover:text-brand-500 font-medium">
                              Upload files
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                              onChange={handleFileChange}
                            />
                          </label>
                          <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, TXT, or images up to 25MB each
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Files */}
                    {form.getFieldValue('attachments')?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Attached files ({form.getFieldValue('attachments').length}):
                        </p>
                        {form.getFieldValue('attachments').map((file: File, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="ml-2 p-1 hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Expected response time: 24 hours</span>
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
                        className="min-w-[160px]"
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Ticket
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
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Common Issues */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Common Issues</h2>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="divide-y">
                  {commonIssues.map((issue) => (
                    <a
                      key={issue.title}
                      href={issue.path}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium mb-1">{issue.title}</h3>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </a>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Support Hours */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Support Hours</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Live Chat & Email</h3>
                    <p className="text-gray-600">Available 24/7</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Phone Support</h3>
                    <p className="text-gray-600">Monday - Friday</p>
                    <p className="text-gray-600">9:00 AM - 6:00 PM EST</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Response times may vary during holidays and peak periods.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Self-Help Resources */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Self-Help Resources</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/faq"
                    icon={<HelpCircle className="h-5 w-5" />}
                  >
                    FAQ
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/guides"
                    icon={<FileText className="h-5 w-5" />}
                  >
                    User Guides
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/community"
                    icon={<MessageSquare className="h-5 w-5" />}
                  >
                    Community Forum
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}