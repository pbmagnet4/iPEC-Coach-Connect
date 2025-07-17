import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Upload,
  Send,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  X,
  ChevronRight
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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

export function Support() {
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    priority: 'normal',
    description: '',
    attachments: [] as File[],
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setTicketForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setTicketForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically submit the form data to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowSuccess(true);
    // Reset form after success
    setTimeout(() => {
      setShowSuccess(false);
      setTicketForm({
        name: '',
        email: '',
        subject: '',
        category: '',
        priority: 'normal',
        description: '',
        attachments: [],
      });
    }, 3000);
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
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input
                      label="Your Name"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      label="Email Address"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <Input
                    label="Subject"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="account">Account Issues</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="technical">Technical Support</option>
                        <option value="feature">Feature Request</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Please describe your issue in detail..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachments
                    </label>
                    <div className="space-y-4">
                      {ticketForm.attachments.length > 0 && (
                        <div className="space-y-2">
                          {ticketForm.attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-center w-full">
                        <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                          <Upload className="h-8 w-8" />
                          <span className="mt-2 text-sm">Attach files</span>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Expected response time: 24 hours</span>
                    </div>
                    <Button
                      type="submit"
                      variant="gradient"
                      icon={<Send className="h-5 w-5" />}
                    >
                      Submit Ticket
                    </Button>
                  </div>

                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Your ticket has been submitted successfully!</span>
                    </motion.div>
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