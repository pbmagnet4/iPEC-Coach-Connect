import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Here you would typically make an API call to submit the form
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (error) {
      setStatus('error');
    }
  };

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
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <span>Something went wrong. Please try again.</span>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Your message has been sent successfully!</span>
                  </motion.div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    label="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Input
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="How can we help you?"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Response time: within 24 hours</span>
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    icon={<Send className="h-5 w-5" />}
                    isLoading={status === 'submitting'}
                  >
                    Send Message
                  </Button>
                </div>
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