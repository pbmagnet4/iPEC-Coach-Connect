import React, { useState } from 'react';
import { AlertCircle, Check, CheckCheck, Clock, Copy, Heart, MoreVertical, Reply, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import type { EmojiReaction, MessageContextMenu, MessageWithDetails } from '../../types/database';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  reactions?: EmojiReaction[];
  onReply?: (message: MessageWithDetails) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = true,
  isGrouped = false,
  reactions = [],
  onReply,
  onReact,
  onEdit,
  onDelete,
  onRetry,
  className = '',
}: MessageBubbleProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
  void yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = () => {
    if (message.isPending) {
      return <Clock className="h-3 w-3 text-gray-400" />;
    }
    if (message.failedToSend) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    if (message.isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-gray-400" />;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
  void e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleEdit = () => {
    if (editContent.trim() !== message.content && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
    setShowContextMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
  void e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const contextMenuActions: MessageContextMenu['actions'] = [
    ...(onReply ? [{
      id: 'reply',
      label: 'Reply',
      icon: 'reply',
      action: () => onReply(message)
    }] : []),
    ...(onReact ? [{
      id: 'react',
      label: 'Add Reaction',
      icon: 'heart',
      action: () => onReact(message.id, '👍')
    }] : []),
    {
      id: 'copy',
      label: 'Copy Text',
      icon: 'copy',
      action: () => navigator.clipboard.writeText(message.content)
    },
    ...(isOwnMessage && onEdit ? [{
      id: 'edit',
      label: 'Edit',
      icon: 'edit',
      action: () => {
        setIsEditing(true);
        setShowContextMenu(false);
      }
    }] : []),
    ...(isOwnMessage && onDelete ? [{
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      action: () => onDelete(message.id),
      destructive: true
    }] : []),
  ];

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} ${className}`}>
      {/* Avatar */}
      {showAvatar && !isGrouped && (
        <div className="flex-shrink-0">
          <Avatar
            src={message.sender.avatar_url || undefined}
            alt={message.sender.full_name || 'User'}
            size="sm"
            className={isOwnMessage ? 'ml-2' : 'mr-2'}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
        {/* Sender Name (for group chats or when not own message) */}
        {!isOwnMessage && !isGrouped && (
          <div className="text-xs text-gray-600 mb-1 px-3">
            {message.sender.full_name || 'Unknown User'}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`
            relative group rounded-2xl px-4 py-2 max-w-full break-words
            ${isOwnMessage 
              ? 'bg-brand-500 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }
            ${message.failedToSend ? 'border-2 border-red-200 bg-red-50' : ''}
            ${message.isPending ? 'opacity-70' : ''}
          `}
          onContextMenu={handleContextMenu}
        >
          {/* Edited Badge */}
          {message.edited_at && (
            <div className="text-xs opacity-75 mb-1">
              <Badge variant="secondary" className="text-xs">
                edited
              </Badge>
            </div>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="min-w-[200px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm border rounded resize-none bg-white text-gray-900"
                rows={Math.min(editContent.split('\n').length, 4)}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* File/Image Content */}
              {message.message_type !== 'text' && message.file_url && (
                <div className="mb-2">
                  {message.message_type === 'image' ? (
                    <img
                      src={message.file_url}
                      alt={message.file_name || 'Shared image'}
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(message.file_url, '_blank')}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-black bg-opacity-10 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{message.file_name}</p>
                        {message.file_size && (
                          <p className="text-xs opacity-75">
                            {(message.file_size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(message.file_url, '_blank')}
                        className="text-current hover:bg-black hover:bg-opacity-10"
                      >
                        View
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </>
          )}

          {/* Context Menu Button */}
          <button
            onClick={(e) => {
  void e.stopPropagation();
              handleContextMenu(e);
            }}
            className={`
              absolute top-1 right-1 opacity-0 group-hover:opacity-100 
              transition-opacity p-1 rounded hover:bg-black hover:bg-opacity-10
              ${isOwnMessage ? 'text-white' : 'text-gray-600'}
            `}
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-3">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => onReact?.(message.id, reaction.emoji)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-full text-xs
                  transition-colors border
                  ${reaction.hasReacted
                    ? 'bg-brand-100 border-brand-300 text-brand-700'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and Status */}
        {showTimestamp && (
          <div className={`
            flex items-center gap-1 text-xs text-gray-500 mt-1 px-3
            ${isOwnMessage ? 'flex-row-reverse' : ''}
          `}>
            <span>{formatTimestamp(message.created_at)}</span>
            {isOwnMessage && (
              <Tooltip content={message.failedToSend ? 'Failed to send' : message.isRead ? 'Read' : 'Sent'}>
                <span className="flex items-center">
                  {getMessageStatusIcon()}
                </span>
              </Tooltip>
            )}
            {message.failedToSend && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(message.id)}
                className="text-red-500 hover:text-red-600 p-0 h-auto"
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border py-1 min-w-[120px]"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          >
            {contextMenuActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
  void action.action();
                  setShowContextMenu(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-gray-50 
                  flex items-center gap-2
                  ${action.destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}
                `}
              >
                {action.icon === 'reply' && <Reply className="h-4 w-4" />}
                {action.icon === 'heart' && <Heart className="h-4 w-4" />}
                {action.icon === 'copy' && <Copy className="h-4 w-4" />}
                {action.icon === 'trash' && <Trash2 className="h-4 w-4" />}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}