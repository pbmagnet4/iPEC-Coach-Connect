import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Lightbulb,
  Play,
  Star,
  Target,
  Users
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const sections = [
  {
    id: 1,
    title: 'What is Coaching?',
    description: 'Understand the fundamentals of professional coaching and its impact on personal and professional development.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    topics: [
      'Definition of coaching',
      'Differences between coaching, mentoring, and consulting',
      'The coaching mindset',
      'Benefits of professional coaching',
    ],
    duration: '15 min',
  },
  {
    id: 2,
    title: 'Core Energy™ Coaching Framework',
    description: "Learn about iPEC's unique approach to coaching and how it facilitates transformative change.",
    image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
    topics: [
      'Introduction to Core Energy',
      'The Energy Leadership™ Index',
      'Seven levels of energy',
      'Practical applications',
    ],
    duration: '20 min',
  },
  {
    id: 3,
    title: 'The Coaching Process',
    description: 'Explore the structure and flow of effective coaching sessions.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    topics: [
      'Session structure',
      'Goal setting',
      'Action planning',
      'Progress tracking',
    ],
    duration: '25 min',
  },
];

const benefits = [
  {
    icon: Target,
    title: 'Clear Direction',
    description: 'Set meaningful goals and create actionable plans for achievement',
  },
  {
    icon: Lightbulb,
    title: 'Enhanced Awareness',
    description: 'Develop deeper self-understanding and emotional intelligence',
  },
  {
    icon: Users,
    title: 'Better Relationships',
    description: 'Improve communication and build stronger connections',
  },
  {
    icon: Award,
    title: 'Professional Growth',
    description: 'Accelerate your career development and leadership abilities',
  },
];

const testimonials = [
  {
    id: 1,
    name: 'Michael Roberts',
    title: 'Marketing Director',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
    quote: 'Working with an iPEC coach transformed my approach to leadership. The Core Energy framework provided invaluable insights.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Emily Chen',
    title: 'Startup Founder',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
    quote: 'The coaching process helped me navigate challenging transitions and unlock my full potential as an entrepreneur.',
    rating: 5,
  },
];

export function CoachingBasics() {
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
            <Badge variant="success" className="mb-6">Free Course</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Introduction to Professional Coaching
            </h1>
            <p className="text-xl text-brand-50 mb-8 leading-relaxed">
              Discover the transformative power of coaching and learn about iPEC's unique approach to personal and professional development.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="gradient"
                size="lg"
                href="/coaches"
                icon={<Users className="h-5 w-5" />}
              >
                Find a Coach
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/coaching-resources"
                className="text-white border-white hover:bg-white/10"
              >
                View Resources
              </Button>
            </div>
            
            <div className="flex items-center gap-8 mt-12 text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>60 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>3 modules</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>1,500+ learners</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <Card.Header>
                <h2 className="text-2xl font-semibold">Course Overview</h2>
              </Card.Header>
              <Card.Body>
                <div className="prose max-w-none">
                  <p>
                    This introductory course provides a comprehensive overview of professional coaching
                    and iPEC's Core Energy™ approach. Whether you're considering becoming a coach or
                    interested in experiencing coaching for yourself, this course will help you
                    understand the fundamentals and benefits of professional coaching.
                  </p>
                  
                  <h3 className="font-semibold mt-6 mb-4">Learning Objectives</h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Understand the core principles of professional coaching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Learn about the Core Energy™ coaching framework</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Explore the structure of coaching sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Discover the benefits of professional coaching</span>
                    </li>
                  </ul>
                </div>
              </Card.Body>
            </Card>

            {/* Course Sections */}
            <div className="space-y-6">
              {sections.map((section) => (
                <Card key={section.id} hover>
                  <div className="grid md:grid-cols-3 gap-6">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full h-48 md:h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-t-none"
                    />
                    <div className="md:col-span-2 p-6">
                      <Badge variant="default" className="mb-2">
                        Module {section.id}
                      </Badge>
                      <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                      <p className="text-gray-600 mb-4">{section.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        {section.topics.map((topic, index) => (
                          <div key={index} className="flex items-center gap-2 text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          {section.duration}
                        </span>
                        <Button
                          variant="outline"
                          href="/coaches"
                          icon={<Users className="h-4 w-4" />}
                        >
                          Find a Coach
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Benefits */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Benefits of Coaching</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{benefit.title}</h3>
                          <p className="text-sm text-gray-600">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* Testimonials */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Success Stories</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{testimonial.name}</h3>
                          <p className="text-sm text-gray-600">{testimonial.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-brand-600 to-blue-600 text-white">
              <Card.Body className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Ready to Start Your Journey?
                </h3>
                <p className="text-brand-50 mb-6">
                  Connect with a certified iPEC coach and start your transformation journey
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  href="/coaches"
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Find Your Perfect Coach
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}