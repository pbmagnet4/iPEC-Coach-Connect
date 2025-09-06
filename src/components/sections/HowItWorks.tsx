import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { BookOpen, Calendar, Search, Users } from 'lucide-react';
import { Button } from '../ui/Button';

const steps = [
  {
    icon: Search,
    title: 'Create Profile',
    description: 'Tell us about your goals and preferences',
  },
  {
    icon: Users,
    title: 'Match with Coaches',
    description: 'Browse and connect with compatible coaches',
  },
  {
    icon: Calendar,
    title: 'Schedule Session',
    description: 'Book your first coaching session',
  },
  {
    icon: BookOpen,
    title: 'Begin Journey',
    description: 'Start your transformation with Core Energy™ Coaching',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function HowItWorks() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.brand.50/0.8),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,theme(colors.blue.50/0.8),transparent_70%)]" />
      
      <Container className="relative">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Get started with iPEC Coach Connect in four simple steps
            </p>
          </motion.div>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-8 h-full shadow-lg shadow-gray-100/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-br from-brand-100 to-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 text-white">
                        <Icon className="h-8 w-8" aria-hidden="true" />
                      </div>
                    </div>
                    <span className="text-4xl font-bold text-brand-600/20">0{index + 1}</span>
                  </div>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center mt-16">
          <Button
            href="/learn-more"
            variant="gradient"
            size="lg"
            className="mx-auto"
            aria-label="Learn more about our coaching process"
          >
            Learn More About Our Process
          </Button>
        </div>
      </Container>
    </section>
  );
}