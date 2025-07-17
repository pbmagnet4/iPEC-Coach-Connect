import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Calendar,
  CreditCard,
  Shield,
  Settings,
  HelpCircle,
  Users,
  BookOpen
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// FAQ Categories with their respective icons
const categories = [
  { id: 'general', name: 'General', icon: HelpCircle },
  { id: 'account', name: 'Account & Profile', icon: Users },
  { id: 'sessions', name: 'Coaching Sessions', icon: Calendar },
  { id: 'billing', name: 'Billing & Payments', icon: CreditCard },
  { id: 'security', name: 'Security & Privacy', icon: Shield },
  { id: 'platform', name: 'Platform Features', icon: Settings },
  { id: 'community', name: 'Community', icon: MessageSquare },
  { id: 'resources', name: 'Learning Resources', icon: BookOpen },
];

// FAQ items with categories
const faqItems = [
  {
    id: 1,
    category: 'general',
    question: 'What is iPEC Coach Connect?',
    answer: 'iPEC Coach Connect is a platform that connects certified iPEC coaches with individuals and organizations seeking professional coaching services. We provide tools for session management, resource sharing, and community engagement to facilitate successful coaching relationships.',
  },
  {
    id: 2,
    category: 'general',
    question: 'How do I get started?',
    answer: 'Getting started is easy! Simply click the "Get Started" button, choose whether you\'re a coach or seeking coaching, and follow our guided onboarding process. We\'ll help you set up your profile and connect you with the right coaches or clients.',
  },
  {
    id: 3,
    category: 'account',
    question: 'How do I create an account?',
    answer: 'To create an account, click "Sign Up" and choose your account type (coach or client). Fill in your basic information, verify your email, and complete your profile. For coaches, additional verification steps may be required.',
  },
  {
    id: 4,
    category: 'sessions',
    question: 'How do coaching sessions work?',
    answer: 'Coaching sessions can be conducted virtually or in-person, depending on your preference. Once matched with a coach, you can schedule sessions through our platform, attend them via our integrated video conferencing tool, and track your progress over time.',
  },
  {
    id: 5,
    category: 'billing',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers. Payments are processed securely through our platform, and you can manage your payment methods in your account settings.',
  },
  {
    id: 6,
    category: 'security',
    question: 'How is my data protected?',
    answer: 'We take security seriously. All data is encrypted in transit and at rest, and we follow industry best practices for data protection. We never share your personal information without your consent.',
  },
  {
    id: 7,
    category: 'platform',
    question: 'What features are available?',
    answer: 'Our platform includes session scheduling, video conferencing, messaging, resource sharing, progress tracking, and community features. Coaches also have access to practice management tools and analytics.',
  },
  {
    id: 8,
    category: 'community',
    question: 'How can I engage with the community?',
    answer: 'Our community features include discussion forums, group coaching sessions, events, and networking opportunities. You can join interest-based groups, participate in discussions, and connect with other members.',
  },
];

export function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  // Filter FAQ items based on search query and selected category
  const filteredFAQs = useMemo(() => {
    return faqItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about iPEC Coach Connect
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers..."
              icon={<Search className="h-5 w-5" />}
              className="text-lg"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <Card.Body className="p-4">
                <h2 className="font-semibold mb-4">Categories</h2>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                      !selectedCategory ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full px-4 py-2 rounded-lg text-left transition-colors flex items-center gap-3 ${
                          selectedCategory === category.id
                            ? 'bg-brand-50 text-brand-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* FAQ List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <Card>
                  <Card.Body className="p-8 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search or browse all categories
                    </p>
                  </Card.Body>
                </Card>
              ) : (
                filteredFAQs.map((item) => (
                  <Card
                    key={item.id}
                    hover
                    className="cursor-pointer"
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  >
                    <Card.Body className="p-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold pr-8">{item.question}</h3>
                        {expandedItem === item.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <AnimatePresence>
                        {expandedItem === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="mt-4 text-gray-600">{item.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>

            {/* Still Need Help */}
            <Card className="mt-8">
              <Card.Body className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Still Need Help?</h3>
                <p className="text-gray-600 mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    icon={<MessageSquare className="h-5 w-5" />}
                  >
                    Contact Support
                  </Button>
                  <Button
                    variant="gradient"
                    icon={<Calendar className="h-5 w-5" />}
                  >
                    Schedule a Call
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