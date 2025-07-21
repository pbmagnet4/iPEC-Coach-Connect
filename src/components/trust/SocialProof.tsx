/**
 * Social Proof Component
 * 
 * Displays real-time social proof elements to build trust through
 * community engagement and success indicators.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  Heart,
  Award,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SocialProofProps {
  type: 'activity' | 'stats' | 'testimonial' | 'success' | 'community';
  className?: string;
}

// Mock data for real-time activity
const mockActivities = [
  { name: 'Sarah M.', action: 'booked a session', coach: 'Michael Chen', time: '2 minutes ago' },
  { name: 'David L.', action: 'achieved goal', type: 'Career Growth', time: '5 minutes ago' },
  { name: 'Emma R.', action: 'joined community', time: '8 minutes ago' },
  { name: 'Alex T.', action: 'completed program', coach: 'Lisa Johnson', time: '12 minutes ago' },
  { name: 'Maria G.', action: 'left 5-star review', coach: 'John Smith', time: '15 minutes ago' }
];

const mockStats = {
  totalUsers: 15247,
  activeToday: 1342,
  sessionsThisWeek: 3891,
  successRate: 94,
  avgRating: 4.9,
  coachCount: 287
};

const mockTestimonials = [
  {
    name: 'Jennifer K.',
    role: 'Marketing Director',
    content: 'My coach helped me transition to a leadership role. The platform made finding the right match so easy.',
    rating: 5,
    image: '/api/placeholder/40/40'
  },
  {
    name: 'Robert M.',
    role: 'Entrepreneur',
    content: 'The coaching program transformed my business mindset. I achieved my revenue goals 3 months early.',
    rating: 5,
    image: '/api/placeholder/40/40'
  },
  {
    name: 'Lisa T.',
    role: 'Software Engineer',
    content: 'Finally found work-life balance. My coach understood my industry and gave practical advice.',
    rating: 5,
    image: '/api/placeholder/40/40'
  }
];

/**
 * Real-time Activity Feed Component
 */
export function LiveActivityFeed({ className }: { className?: string }) {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [activities, setActivities] = useState(mockActivities);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  const activity = activities[currentActivity];

  return (
    <div className={cn('p-4 bg-white rounded-lg border shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Live Activity</span>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentActivity}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium text-gray-900">{activity.name}</span>
                <span className="text-gray-600"> {activity.action}</span>
                {activity.coach && (
                  <span className="text-gray-600"> with <span className="font-medium">{activity.coach}</span></span>
                )}
              </p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Platform Statistics Component
 */
export function PlatformStats({ className }: { className?: string }) {
  const [animatedStats, setAnimatedStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    sessionsThisWeek: 0,
    successRate: 0,
    avgRating: 0,
    coachCount: 0
  });

  useEffect(() => {
    const animateStats = () => {
      const duration = 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setAnimatedStats({
          totalUsers: Math.floor(mockStats.totalUsers * progress),
          activeToday: Math.floor(mockStats.activeToday * progress),
          sessionsThisWeek: Math.floor(mockStats.sessionsThisWeek * progress),
          successRate: Math.floor(mockStats.successRate * progress),
          avgRating: Math.floor(mockStats.avgRating * progress * 10) / 10,
          coachCount: Math.floor(mockStats.coachCount * progress)
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    animateStats();
  }, []);

  const stats = [
    { 
      icon: Users, 
      value: animatedStats.totalUsers.toLocaleString() + '+', 
      label: 'Trusted Users',
      color: 'text-blue-600'
    },
    { 
      icon: Calendar, 
      value: animatedStats.sessionsThisWeek.toLocaleString(), 
      label: 'Sessions This Week',
      color: 'text-green-600'
    },
    { 
      icon: TrendingUp, 
      value: animatedStats.successRate + '%', 
      label: 'Success Rate',
      color: 'text-purple-600'
    },
    { 
      icon: Star, 
      value: animatedStats.avgRating.toFixed(1), 
      label: 'Average Rating',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="text-center p-4 bg-white rounded-lg border shadow-sm"
        >
          <div className={cn('inline-flex items-center justify-center w-12 h-12 rounded-full mb-3', 
            stat.color === 'text-blue-600' ? 'bg-blue-100' :
            stat.color === 'text-green-600' ? 'bg-green-100' :
            stat.color === 'text-purple-600' ? 'bg-purple-100' : 'bg-orange-100'
          )}>
            <stat.icon className={cn('h-6 w-6', stat.color)} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Testimonial Carousel Component
 */
export function TestimonialCarousel({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = mockTestimonials[currentIndex];

  return (
    <div className={cn('p-6 bg-white rounded-xl border shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-gray-900">What Our Users Say</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
            ))}
          </div>
          
          <blockquote className="text-gray-700 italic">
            "{testimonial.content}"
          </blockquote>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{testimonial.name}</div>
              <div className="text-sm text-gray-600">{testimonial.role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="flex justify-center gap-2 mt-4">
        {mockTestimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Success Stories Component
 */
export function SuccessStories({ className }: { className?: string }) {
  const successStories = [
    { category: 'Career Growth', count: 3247, icon: TrendingUp },
    { category: 'Life Balance', count: 2891, icon: Heart },
    { category: 'Leadership', count: 1653, icon: Award },
    { category: 'Relationships', count: 2134, icon: Users }
  ];

  return (
    <div className={cn('p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border', className)}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Success Stories</h3>
        <p className="text-sm text-gray-600">Real achievements from our coaching community</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {successStories.map((story, index) => (
          <motion.div
            key={story.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="text-center p-4 bg-white rounded-lg border shadow-sm"
          >
            <story.icon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{story.count.toLocaleString()}</div>
            <div className="text-sm text-gray-600">{story.category}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Community Trust Indicators Component
 */
export function CommunityTrustIndicators({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 bg-white rounded-lg border shadow-sm', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">Community Trust</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Verified</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Active Members</span>
          <span className="font-medium text-gray-900">1,342 online now</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This Week</span>
          <span className="font-medium text-gray-900">3,891 sessions booked</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Success Rate</span>
          <span className="font-medium text-green-600">94% achieve goals</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Social Proof Component
 */
export function SocialProof({ type, className }: SocialProofProps) {
  switch (type) {
    case 'activity':
      return <LiveActivityFeed className={className} />;
    case 'stats':
      return <PlatformStats className={className} />;
    case 'testimonial':
      return <TestimonialCarousel className={className} />;
    case 'success':
      return <SuccessStories className={className} />;
    case 'community':
      return <CommunityTrustIndicators className={className} />;
    default:
      return null;
  }
}