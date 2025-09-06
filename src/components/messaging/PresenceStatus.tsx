import React from 'react';
import { Tooltip } from '../ui/Tooltip';
import type { UserPresenceWithProfile } from '../../types/database';

interface PresenceStatusProps {
  isOnline: boolean;
  lastSeen?: string | null;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PresenceStatus({
  isOnline,
  lastSeen,
  showText = false,
  size = 'md',
  className = '',
}: PresenceStatusProps) {
  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (lastSeen) {
      const diffInMinutes = Math.floor((new Date().getTime() - new Date(lastSeen).getTime()) / (1000 * 60));
      if (diffInMinutes < 60) return 'bg-yellow-500';
    }
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (lastSeen) return `Last seen ${formatLastSeen(lastSeen)}`;
    return 'Offline';
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusDot = (
    <div
      className={`
        ${sizeClasses[size]} rounded-full border-2 border-white flex-shrink-0
        ${getStatusColor()}
        ${isOnline ? 'animate-pulse' : ''}
        ${className}
      `}
    />
  );

  if (!showText) {
    return (
      <Tooltip content={getStatusText()}>
        {statusDot}
      </Tooltip>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {statusDot}
      <span className="text-sm text-gray-600">
        {getStatusText()}
      </span>
    </div>
  );
}

interface UserPresenceIndicatorProps {
  presence: UserPresenceWithProfile;
  showText?: boolean;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserPresenceIndicator({
  presence,
  showText = false,
  showAvatar = false,
  size = 'md',
  className = '',
}: UserPresenceIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAvatar && (
        <div className="relative">
          <img
            src={presence.profile.avatar_url || '/default-avatar.png'}
            alt={presence.profile.full_name || 'User'}
            className="w-8 h-8 rounded-full"
          />
          <PresenceStatus
            isOnline={presence.is_online}
            lastSeen={presence.last_seen}
            size="sm"
            className="absolute -bottom-0.5 -right-0.5"
          />
        </div>
      )}
      
      {!showAvatar && (
        <PresenceStatus
          isOnline={presence.is_online}
          lastSeen={presence.last_seen}
          showText={showText}
          size={size}
        />
      )}
      
      {showText && showAvatar && (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {presence.profile.full_name || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-500">
            {presence.is_online ? 'Online' : `Last seen ${formatLastSeen(presence.last_seen)}`}
          </span>
        </div>
      )}
    </div>
  );
}

function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

interface ConversationPresenceProps {
  participants: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string | null;
  }>;
  currentUserId: string;
  className?: string;
}

export function ConversationPresence({
  participants,
  currentUserId,
  className = '',
}: ConversationPresenceProps) {
  const otherParticipants = participants.filter(p => p.id !== currentUserId);
  const onlineCount = otherParticipants.filter(p => p.is_online).length;
  const totalOthers = otherParticipants.length;

  if (totalOthers === 0) return null;

  if (totalOthers === 1) {
    const participant = otherParticipants[0];
    return (
      <PresenceStatus
        isOnline={participant.is_online}
        lastSeen={participant.last_seen}
        showText={true}
        className={className}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-1">
        {otherParticipants.slice(0, 3).map((participant) => (
          <PresenceStatus
            key={participant.id}
            isOnline={participant.is_online}
            lastSeen={participant.last_seen}
            size="sm"
            className="ring-2 ring-white"
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {onlineCount > 0 ? `${onlineCount} online` : 'All offline'}
        {totalOthers > 3 && ` of ${totalOthers}`}
      </span>
    </div>
  );
}