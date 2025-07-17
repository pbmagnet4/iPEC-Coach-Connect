import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Container } from '../ui/Container';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the newsletter signup
    setIsSubmitted(true);
    setEmail('');
  };

  return (
    <section className="py-20 bg-white">
      <Container size="sm">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated with Coaching Insights
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our newsletter and receive expert coaching tips, industry insights, and exclusive resources delivered straight to your inbox.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 text-green-800 p-6 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
                <p className="font-medium">
                  Thank you for subscribing! Check your email to confirm your subscription.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    icon={<Mail className="h-5 w-5" />}
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  href="/get-started"
                >
                  Get Started
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  By subscribing, you agree to our{' '}
                  <a href="/privacy" className="text-brand-600 hover:text-brand-700 underline">
                    Privacy Policy
                  </a>
                  . You can unsubscribe at any time.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}