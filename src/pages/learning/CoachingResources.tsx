import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen,
  Play,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Eye,
  Users,
  Star
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const resources = [
  {
    id: 1,
    title: 'Introduction to Professional Coaching',
    type: 'article',
    author: 'Sarah Johnson',
    readTime: '8 min',
    views: 1250,
    description: 'Learn the fundamentals of professional coaching and what to expect from the coaching process.',
    category: 'Getting Started',
    featured: true,
  },
  {
    id: 2,
    title: 'What is Energy Leadership?',
    type: 'video',
    author: 'Michael Chen',
    duration: '12 min',
    views: 980,
    description: 'An introduction to the Energy Leadership Index and how it can transform your perspective.',
    category: 'Core Concepts',
    featured: true,
  },
  {
    id: 3,
    title: 'Goal Setting Worksheet',
    type: 'worksheet',
    author: 'Emily Rodriguez',
    downloads: 650,
    description: 'A practical worksheet to help you clarify and structure your personal and professional goals.',
    category: 'Tools & Templates',
    fileType: 'PDF',
    featured: false,
  },
  {
    id: 4,
    title: 'Building Confidence and Self-Awareness',
    type: 'article',
    author: 'David Wilson',
    readTime: '10 min',
    views: 875,
    description: 'Strategies for developing greater self-awareness and building unshakeable confidence.',
    category: 'Personal Development',
    featured: false,
  },
  {
    id: 5,
    title: 'Effective Communication in Professional Relationships',
    type: 'video',
    author: 'Lisa Thompson',
    duration: '18 min',
    views: 1100,
    description: 'Learn communication techniques that enhance your professional relationships.',
    category: 'Communication',
    featured: false,
  },
  {
    id: 6,
    title: 'Values Assessment Tool',
    type: 'worksheet',
    author: 'Jennifer Martinez',
    downloads: 420,
    description: 'Discover your core values and learn how to align your goals with what matters most to you.',
    category: 'Tools & Templates',
    fileType: 'PDF',
    featured: false,
  },
];

const categories = [
  { name: 'Getting Started', count: 1, color: 'bg-blue-100 text-blue-800' },
  { name: 'Core Concepts', count: 1, color: 'bg-purple-100 text-purple-800' },
  { name: 'Personal Development', count: 1, color: 'bg-green-100 text-green-800' },
  { name: 'Communication', count: 1, color: 'bg-orange-100 text-orange-800' },
  { name: 'Tools & Templates', count: 2, color: 'bg-yellow-100 text-yellow-800' },
];

export function CoachingResources() {
  const featuredResources = resources.filter(resource => resource.featured);
  const allResources = resources.filter(resource => !resource.featured);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <BookOpen className="h-5 w-5" />;
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'worksheet':
        return <FileText className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getResourceBadgeVariant = (type: string) => {
    switch (type) {
      case 'article':
        return 'default';
      case 'video':
        return 'success';
      case 'worksheet':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4">Coaching Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our collection of free resources to learn more about coaching and personal development.
            These materials will help you understand the coaching process and prepare for your journey.
          </p>
        </motion.div>

        {/* Categories Overview */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Resource Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card hover className="text-center">
                  <Card.Body className="p-4">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${category.color} mb-2`}>
                      {category.count} resource{category.count !== 1 ? 's' : ''}
                    </div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Featured Resources */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Featured Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card hover className="h-full">
                  <Card.Body className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          resource.type === 'article' ? 'bg-blue-100 text-blue-600' :
                          resource.type === 'video' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <Badge variant={getResourceBadgeVariant(resource.type)}>
                            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">Featured</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
                    <p className="text-gray-600 mb-4">{resource.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>By {resource.author}</span>
                      <div className="flex items-center gap-4">
                        {'readTime' in resource && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {resource.readTime}
                          </span>
                        )}
                        {'duration' in resource && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {resource.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {resource.views}
                        </span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="mb-4">
                      {resource.category}
                    </Badge>
                    
                    <Button
                      variant="gradient"
                      className="w-full"
                      icon={<ExternalLink className="h-4 w-4" />}
                    >
                      View Resource
                    </Button>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All Resources */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6">All Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card hover className="h-full">
                  <Card.Body className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        resource.type === 'article' ? 'bg-blue-100 text-blue-600' :
                        resource.type === 'video' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <Badge variant={getResourceBadgeVariant(resource.type)}>
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mb-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      By {resource.author}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      {'readTime' in resource && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.readTime}
                        </span>
                      )}
                      {'duration' in resource && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.duration}
                        </span>
                      )}
                      {'views' in resource && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {resource.views}
                        </span>
                      )}
                      {'downloads' in resource && (
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {resource.downloads}
                        </span>
                      )}
                    </div>
                    
                    <Badge variant="outline" size="sm" className="mb-3">
                      {resource.category}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={
                        resource.type === 'worksheet' ? 
                        <Download className="h-4 w-4" /> : 
                        <ExternalLink className="h-4 w-4" />
                      }
                    >
                      {resource.type === 'worksheet' ? 'Download' : 'View Resource'}
                    </Button>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <Card.Body className="p-8">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Ready to Work with a Coach?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                These resources are just the beginning. Work one-on-one with a certified iPEC coach 
                to create personalized strategies and achieve your specific goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="gradient" 
                  size="lg"
                  href="/coaches"
                >
                  Find Your Coach
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  href="/about-coaching"
                >
                  Learn About Coaching
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}