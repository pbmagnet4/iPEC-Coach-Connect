import React, { useEffect, useState } from 'react';
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
import { CoachApplicationWizard } from '../components/coach/CoachApplicationWizard';
import { useUserContext } from '../hooks/useUserContext';
import { coachApplicationService } from '../services/coach-application.service';
import type { CoachApplicationWithDetails, Tables } from '../types/database';

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
  const { user, isAuthenticated } = useUserContext();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showApplication, setShowApplication] = useState(false);
  const [existingApplication, setExistingApplication] = useState<CoachApplicationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadExistingApplication();
    }
  }, [isAuthenticated, user]);

  const loadExistingApplication = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await coachApplicationService.getUserApplication(user.id);
      if (result.data) {
        setExistingApplication(result.data);
      }
    } catch (error) {
  void console.error('Failed to load existing application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationSubmitted = (application: Tables<'coach_applications'>) => {
    // Refresh the page or redirect to dashboard
    window.location.href = '/dashboard?message=application-submitted';
  };

  const handleApplicationSaved = (application: Tables<'coach_applications'>) => {
    // Update the existing application state
    loadExistingApplication();
  };

  // Show application wizard if user is authenticated and wants to apply
  if (showApplication || (isAuthenticated && existingApplication && !existingApplication.submitted_at)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Container>
          <CoachApplicationWizard
            existingApplication={existingApplication}
            onApplicationSubmitted={handleApplicationSubmitted}
            onApplicationSaved={handleApplicationSaved}
          />
        </Container>
      </div>
    );
  }

  // Show existing application status if user has already applied
  if (isAuthenticated && existingApplication?.submitted_at) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Container>
          <div className="max-w-2xl mx-auto">
            <Card>
              <Card.Body className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Application Under Review
                </h2>
                
                <div className="mb-6">
                  <Badge className={getStatusColor(existingApplication.status)}>
                    {existingApplication.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Your coach application was submitted on{' '}
                  {new Date(existingApplication.submitted_at).toLocaleDateString()}
                  {' '}and is currently being reviewed by our team.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="text-left">
                    <h3 className="font-medium text-blue-900 mb-2">Application Progress</h3>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${existingApplication.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-700">{existingApplication.progress}% Complete</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  href="/dashboard"
                  className="mr-4"
                >
                  Go to Dashboard
                </Button>
                
                {existingApplication.status === 'documents_requested' && (
                  <Button
                    variant="gradient"
                    onClick={() => setShowApplication(true)}
                  >
                    Update Application
                  </Button>
                )}
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents_requested':
        return 'bg-orange-100 text-orange-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              {isAuthenticated ? (
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => setShowApplication(true)}
                  icon={<Send className="h-5 w-5" />}
                  isLoading={isLoading}
                >
                  {existingApplication ? 'Continue Application' : 'Apply Now'}
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="lg"
                  href="/auth/login?redirect=/become-coach"
                  icon={<Send className="h-5 w-5" />}
                >
                  Sign In to Apply
                </Button>
              )}
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

      {/* Application CTA */}
      <Container className="py-20" id="apply">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Start your journey with iPEC Coach Connect today and take your coaching practice to the next level.
          </p>
          
          {isAuthenticated ? (
            <Button
              variant="gradient"
              size="lg"
              onClick={() => setShowApplication(true)}
              icon={<Send className="h-5 w-5" />}
              isLoading={isLoading}
            >
              {existingApplication ? 'Continue Application' : 'Start Application'}
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="lg"
              href="/auth/login?redirect=/become-coach"
              icon={<Send className="h-5 w-5" />}
            >
              Sign In to Apply
            </Button>
          )}
        </div>
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