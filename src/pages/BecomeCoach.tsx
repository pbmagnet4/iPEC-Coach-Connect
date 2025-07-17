import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Send,
  Star,
  Target,
  Upload,
  Users,
  X
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const benefits = [
  {
    icon: Users,
    title: 'Growing Client Base',
    description: 'Connect with clients actively seeking iPEC certified coaches',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Access clients worldwide through our virtual coaching platform',
  },
  {
    icon: Star,
    title: 'Professional Growth',
    description: 'Continuous learning through workshops and peer collaboration',
  },
  {
    icon: Target,
    title: 'Business Support',
    description: 'Tools and resources to help grow your coaching practice',
  },
];

const requirements = [
  {
    title: 'iPEC Certification',
    description: 'Active certification from iPEC coaching program',
    required: true,
  },
  {
    title: 'Professional Experience',
    description: 'Minimum 2 years of coaching experience',
    required: true,
  },
  {
    title: 'Professional Insurance',
    description: 'Valid professional liability insurance',
    required: true,
  },
  {
    title: 'Additional Certifications',
    description: 'Other relevant coaching certifications (optional)',
    required: false,
  },
];

const faqs = [
  {
    question: 'What are the requirements to become a coach?',
    answer: 'To join our platform, you must be an iPEC certified coach with at least 2 years of coaching experience and valid professional liability insurance. Additional certifications are welcome but not required.',
  },
  {
    question: 'How long does the application process take?',
    answer: 'The application review process typically takes 5-7 business days. Once approved, you can set up your profile and start accepting clients within 24 hours.',
  },
  {
    question: 'What are the fees and commission structure?',
    answer: 'We offer flexible pricing plans with competitive commission rates. Our standard plan includes a 15% platform fee, with reduced rates for high-volume coaches.',
  },
  {
    question: 'How do I get matched with clients?',
    answer: 'Our matching algorithm considers your expertise, coaching style, and availability to connect you with compatible clients. You can also receive direct inquiries through your profile.',
  },
  {
    question: 'What support do you provide for coaches?',
    answer: 'We provide comprehensive support including marketing tools, business development resources, technical support, and ongoing professional development opportunities.',
  },
];

export function BecomeCoach() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    certificationNumber: '',
    yearsExperience: '',
    specialties: '',
    website: '',
    linkedin: '',
    resume: null as File | null,
    certifications: [] as File[],
    coverLetter: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'resume' | 'certifications') => {
    const files = e.target.files;
    if (!files) return;

    if (field === 'resume') {
      setFormData(prev => ({ ...prev, resume: files[0] }));
    } else {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, ...Array.from(files)],
      }));
    }
  };

  const removeFile = (field: 'resume' | 'certifications', index?: number) => {
    if (field === 'resume') {
      setFormData(prev => ({ ...prev, resume: null }));
    } else if (index !== undefined) {
      setFormData(prev => ({
        ...prev,
        certifications: prev.certifications.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Here you would typically submit the form data to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setStatus('idle');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          certificationNumber: '',
          yearsExperience: '',
          specialties: '',
          website: '',
          linkedin: '',
          resume: null,
          certifications: [],
          coverLetter: '',
        });
      }, 3000);
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80"
            alt="Coaching background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 to-brand-800/95" />
        </div>
        
        <Container className="relative py-20">
          <div className="max-w-2xl">
            <Badge variant="success" className="mb-6">Now Accepting Applications</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Join Our Network of Elite iPEC Coaches
            </h1>
            <p className="text-xl text-brand-50 mb-8 leading-relaxed">
              Take your coaching practice to the next level by joining our platform of certified iPEC coaches.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="gradient"
                size="lg"
                href="#apply"
                icon={<Send className="h-5 w-5" />}
              >
                Apply Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white hover:bg-white/10"
                href="#requirements"
                icon={<FileText className="h-5 w-5" />}
              >
                View Requirements
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Benefits Section */}
      <Container className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Join iPEC Coach Connect?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join our platform and get access to the tools, resources, and community you need to grow your coaching practice.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <Card.Body className="p-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-white">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </Card.Body>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>

      {/* Requirements Section */}
      <div className="bg-white py-20" id="requirements">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Requirements</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We maintain high standards to ensure quality coaching services for our clients
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {requirements.map((req, index) => (
              <motion.div
                key={req.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover>
                  <Card.Body className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        req.required
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{req.title}</h3>
                          {req.required && (
                            <Badge variant="default">Required</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{req.description}</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </div>

      {/* Application Form */}
      <Container className="py-20" id="apply">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Apply to Join</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete the application form below to start your journey with iPEC Coach Connect
          </p>
        </div>

        <Card>
          <Card.Body className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg"
                >
                  <Star className="h-5 w-5" />
                  <span>Your application has been submitted successfully! We'll review it and get back to you soon.</span>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Something went wrong. Please try again.</span>
                </motion.div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
                <Input
                  type="tel"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  label="iPEC Certification Number"
                  value={formData.certificationNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificationNumber: e.target.value }))}
                  required
                />
                <Input
                  type="number"
                  label="Years of Coaching Experience"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coaching Specialties
                </label>
                <textarea
                  value={formData.specialties}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  placeholder="List your primary coaching specialties and areas of expertise"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  label="Website (optional)"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://"
                />
                <Input
                  label="LinkedIn Profile (optional)"
                  value={formData.linkedin}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume/CV
                </label>
                <div className="space-y-2">
                  {formData.resume && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formData.resume.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('resume')}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                      <Upload className="h-8 w-8" />
                      <span className="mt-2 text-sm">Upload Resume/CV</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'resume')}
                        required={!formData.resume}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certifications & Credentials
                </label>
                <div className="space-y-2">
                  {formData.certifications.map((file, index) => (
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
                        onClick={() => removeFile('certifications', index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-center w-full">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                      <Upload className="h-8 w-8" />
                      <span className="mt-2 text-sm">Upload Certifications</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleFileChange(e, 'certifications')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={6}
                  placeholder="Tell us about your coaching philosophy and why you'd like to join iPEC Coach Connect"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Application review time: 5-7 business days</span>
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  icon={<Send className="h-5 w-5" />}
                  isLoading={status === 'submitting'}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Container>

      {/* FAQ Section */}
      <div className="bg-white py-20">
        <Container size="sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Find answers to common questions about becoming an iPEC Coach Connect partner
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                hover
                className="cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <Card.Body className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <button className="text-gray-500">
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {expandedFaq === index && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-gray-600 mt-4"
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <Button
              variant="outline"
              href="/contact"
              icon={<MessageSquare className="h-5 w-5" />}
            >
              Contact Us
            </Button>
          </div>
        </Container>
      </div>
    </div>
  );
}