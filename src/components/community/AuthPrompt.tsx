/**
 * Authentication Prompt Component for iPEC Coach Connect
 * 
 * Reusable component for displaying authentication prompts throughout the community
 * section. Provides seamless transition from viewing to participating.
 * 
 * Features:
 * - Context-aware messaging based on action type
 * - Inline display that doesn't disrupt browsing flow
 * - Multiple prompt styles (subtle, prominent, modal)
 * - Maintains current page context after authentication
 * - Responsive design for mobile and desktop
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Lock, LogIn, MessageSquare, UserPlus, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useUnifiedUserStore } from '../../stores/unified-user-store';

export type AuthPromptAction = 
  | 'participate' 
  | 'reply' 
  | 'create' 
  | 'join' 
  | 'rsvp' 
  | 'like' 
  | 'follow' 
  | 'message'
  | 'vote'
  | 'save';

export type AuthPromptStyle = 'inline' | 'card' | 'banner' | 'overlay';

export interface AuthPromptProps {
  /** The action the user is trying to perform */
  action: AuthPromptAction;
  
  /** Visual style of the prompt */
  style?: AuthPromptStyle;
  
  /** Additional context for the message */
  context?: string;
  
  /** Custom message override */
  message?: string;
  
  /** Show sign up option prominently */
  emphasizeSignUp?: boolean;
  
  /** Compact version for mobile */
  compact?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom call-to-action buttons */
  customActions?: React.ReactNode;
  
  /** Callback when authentication is initiated */
  onAuthStart?: () => void;
}

const actionConfig = {
  participate: {
    icon: MessageSquare,
    title: 'Join the conversation',
    description: 'Sign in to participate in discussions, share insights, and connect with the community',
  },
  reply: {
    icon: MessageSquare,
    title: 'Share your thoughts',
    description: 'Sign in to reply to this discussion and engage with other professionals',
  },
  create: {
    icon: UserPlus,
    title: 'Start a discussion',
    description: 'Sign in to create discussions, ask questions, and share your expertise',
  },
  join: {
    icon: Users,
    title: 'Join this group',
    description: 'Sign in to join groups, connect with like-minded professionals, and access exclusive content',
  },
  rsvp: {
    icon: Calendar,
    title: 'Reserve your spot',
    description: 'Sign in to RSVP for events, add them to your calendar, and see who else is attending',
  },
  like: {
    icon: MessageSquare,
    title: 'Show appreciation',
    description: 'Sign in to like posts, save content, and support community members',
  },
  follow: {
    icon: Users,
    title: 'Stay connected',
    description: 'Sign in to follow members, get updates on their content, and build your network',
  },
  message: {
    icon: MessageSquare,
    title: 'Send a message',
    description: 'Sign in to message other members directly and build professional relationships',
  },
  vote: {
    icon: UserPlus,
    title: 'Make your voice heard',
    description: 'Sign in to vote on community polls and help shape group decisions',
  },
  save: {
    icon: Lock,
    title: 'Save for later',
    description: 'Sign in to bookmark content, create reading lists, and access saved items anywhere',
  },
};

export function AuthPrompt({
  action,
  style = 'inline',
  context,
  message,
  emphasizeSignUp = false,
  compact = false,
  className = '',
  customActions,
  onAuthStart,
}: AuthPromptProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useUnifiedUserStore(state => state.isAuthenticated);

  // Don't render if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  const config = actionConfig[action];
  const Icon = config.icon;

  const handleSignIn = () => {
    onAuthStart?.();
    navigate('/login', { 
      state: { 
        from: location,
        action,
        context 
      } 
    });
  };

  const handleSignUp = () => {
    onAuthStart?.();
    navigate('/register', { 
      state: { 
        from: location,
        action,
        context 
      } 
    });
  };

  const displayMessage = message || config.description;
  const displayContext = context ? ` ${context}` : '';

  // Inline style - subtle prompt that doesn't interrupt flow
  if (style === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-brand-600 flex-shrink-0" />
          <div className={compact ? 'text-sm' : ''}>
            <p className="text-brand-900 font-medium">
              {config.title}{displayContext}
            </p>
            {!compact && (
              <p className="text-brand-700 text-sm mt-1">
                {displayMessage}
              </p>
            )}
          </div>
        </div>
        
        {customActions || (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignIn}
              className="text-brand-700 hover:text-brand-900"
            >
              Sign In
            </Button>
            <Button
              variant={emphasizeSignUp ? "primary" : "outline"}
              size="sm"
              onClick={handleSignUp}
            >
              {emphasizeSignUp ? "Join Free" : "Sign Up"}
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  // Card style - more prominent display
  if (style === 'card') {
    return (
      <Card className={`bg-gradient-to-br from-brand-50 to-blue-50 border-brand-200 ${className}`}>
        <Card.Body>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-full mb-4">
              <Icon className="h-6 w-6 text-brand-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {config.title}{displayContext}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {displayMessage}
            </p>
            
            {customActions || (
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Sign In
                </Button>
                <Button
                  variant={emphasizeSignUp ? "gradient" : "primary"}
                  onClick={handleSignUp}
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  {emphasizeSignUp ? "Join Free" : "Create Account"}
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Banner style - full width notification
  if (style === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className={`bg-gradient-to-r from-brand-600 to-blue-600 text-white p-4 ${className}`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Icon className="h-6 w-6" />
            <div>
              <p className="font-semibold">
                {config.title}{displayContext}
              </p>
              <p className="text-brand-100 text-sm">
                {displayMessage}
              </p>
            </div>
          </div>
          
          {customActions || (
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleSignIn}
                className="text-white border-white hover:bg-white hover:text-brand-600"
              >
                Sign In
              </Button>
              <Button
                variant="secondary"
                onClick={handleSignUp}
              >
                {emphasizeSignUp ? "Join Free" : "Sign Up"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Overlay style - modal-like overlay
  if (style === 'overlay') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-6">
              <Icon className="h-8 w-8 text-brand-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {config.title}{displayContext}
            </h3>
            
            <p className="text-gray-600 mb-8">
              {displayMessage}
            </p>
            
            {customActions || (
              <div className="space-y-3">
                <Button
                  variant={emphasizeSignUp ? "gradient" : "primary"}
                  onClick={handleSignUp}
                  className="w-full"
                  icon={<UserPlus className="h-4 w-4" />}
                >
                  {emphasizeSignUp ? "Join iPEC Coach Connect - Free" : "Create Account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  className="w-full"
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Already have an account? Sign In
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}

/**
 * Quick authentication prompt for common actions
 */
export function QuickAuthPrompt({ 
  action, 
  context, 
  className 
}: Pick<AuthPromptProps, 'action' | 'context' | 'className'>) {
  return (
    <AuthPrompt
      action={action}
      style="inline"
      context={context}
      compact={true}
      className={className}
    />
  );
}

/**
 * Authentication prompt specifically for community participation
 */
export function CommunityAuthPrompt({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <AuthPrompt
      action="participate"
      style="card"
      emphasizeSignUp={true}
      className={className}
    />
  );
}