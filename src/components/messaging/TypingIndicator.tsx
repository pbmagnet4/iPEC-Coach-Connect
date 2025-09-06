import React from 'react';
import { Avatar } from '../ui/Avatar';
import type { TypingIndicatorWithUser } from '../../types/database';

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorWithUser[];
  showAvatars?: boolean;
  className?: string;
}

export function TypingIndicator({
  typingUsers,
  showAvatars = true,
  className = '',
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].user.full_name || 'Someone'} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].user.full_name || 'Someone'} and ${typingUsers[1].user.full_name || 'someone else'} are typing...`;
    } else {
      return `${typingUsers[0].user.full_name || 'Someone'} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center gap-2 p-3 ${className}`}>
      {/* Avatars */}
      {showAvatars && (
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((typingUser) => (
            <Avatar
              key={typingUser.user_id}
              src={typingUser.user.avatar_url || undefined}
              alt={typingUser.user.full_name || 'User'}
              size="sm"
              className="ring-2 ring-white"
            />
          ))}
        </div>
      )}

      {/* Typing Animation and Text */}
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-600 italic">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
}

interface TypingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TypingDots({
  size = 'md',
  className = '',
}: TypingDotsProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div 
        className={`${dotSizes[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={`${dotSizes[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={`${dotSizes[size]} bg-current rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

interface InlineTypingIndicatorProps {
  isTyping: boolean;
  typingUser?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  className?: string;
}

export function InlineTypingIndicator({
  isTyping,
  typingUser,
  className = '',
}: InlineTypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className={`flex items-center gap-2 text-brand-600 text-sm ${className}`}>
      <TypingDots size="sm" />
      <span className="italic">
        {typingUser?.full_name || 'Someone'} is typing...
      </span>
    </div>
  );
}