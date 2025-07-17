import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { 
  Target, 
  Users, 
  Clock, 
  Shield, 
  Award, 
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';

const benefits = {
  clients: [
    {
      icon: Target,
      title: 'Personalized Matching',
      description: 'Find coaches that align perfectly with your goals and preferences',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book sessions that fit your schedule with our easy-to-use platform',
    },
    {
      icon: Shield,
      title: 'Verified Coaches',
      description: 'Connect with certified iPEC coaches you can trust',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Experience consistent, high-quality coaching sessions',
    },
  ],
  coaches: [
    {
      icon: Users,
      title: 'Expanded Reach',
      description: 'Connect with clients seeking your specific expertise',
    },
    {
      icon: TrendingUp,
      title: 'Practice Growth',
      description: 'Build and scale your coaching practice efficiently',
    },
    {
      icon: Calendar,
      title: 'Easy Management',
      description: 'Streamline scheduling and client communications',
    },
    {
      icon: MessageSquare,
      title: 'Community Support',
      description: 'Join a network of fellow iPEC coaches',
    },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function Benefits() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-blue-50/50" />
      
      <Container className="relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose iPEC Coach Connect?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Whether you're seeking coaching or you're a coach looking to grow your practice,
            we provide the tools and support you need to succeed.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* For Clients */}
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <Card className="h-full" variant="glass">
              <Card.Header>
                <h3 className="text-2xl font-semibold text-center">For Clients</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid sm:grid-cols-2 gap-6">
                  {benefits.clients.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <motion.div
                        key={benefit.title}
                        variants={itemVariants}
                        className="flex flex-col items-center text-center p-4"
                      >
                        <div className="bg-brand-100 text-brand-600 p-3 rounded-lg mb-4">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="font-semibold mb-2">{benefit.title}</h4>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          {/* For Coaches */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <Card className="h-full" variant="glass">
              <Card.Header>
                <h3 className="text-2xl font-semibold text-center">For Coaches</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid sm:grid-cols-2 gap-6">
                  {benefits.coaches.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <motion.div
                        key={benefit.title}
                        variants={itemVariants}
                        className="flex flex-col items-center text-center p-4"
                      >
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mb-4">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="font-semibold mb-2">{benefit.title}</h4>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}