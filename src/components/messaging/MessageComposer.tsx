import React, { useCallback, useEffect, useRef, useState } from 'react';
import { File, FileImage, Loader, Paperclip, Send, Smile, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import type { FileUploadProgress, MessageFormData } from '../../types/database';

interface MessageComposerProps {
  conversationId: string;
  placeholder?: string;
  onSendMessage: (data: MessageFormData) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onFileUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  showEmojiPicker?: boolean;
  showFileUpload?: boolean;
  className?: string;
}

const QUICK_REACTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉'];

export function MessageComposer({
  conversationId,
  placeholder = 'Type a message...',
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onFileUpload,
  disabled = false,
  maxFileSize = 10, // 10MB default
  acceptedFileTypes = ['image/*', 'application/pdf', '.doc,.docx,.txt'],
  showEmojiPicker = true,
  showFileUpload = true,
  className = '',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120; // Max 5 lines approximately
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onTypingStop) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 3000);
  }, [isTyping, onTypingStart, onTypingStop]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && onTypingStop) {
      setIsTyping(false);
      onTypingStop();
    }
  }, [isTyping, onTypingStop]);

  // Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const {value} = e.target;
    setMessage(value);
    adjustTextareaHeight();
    
    if (value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
  void e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Restore cursor position
      setTimeout(() => {
  void extarea.setSelectionRange(start + emoji.length, start + emoji.length);
  void extarea.focus();
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
    adjustTextareaHeight();
    setShowEmojis(false);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        return false;
      }
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || disabled || isSending) {
      return;
    }

    setIsSending(true);
    handleTypingStop();

    try {
      await onSendMessage({
        content: message.trim(),
        files: uploadedFiles,
      });

      // Clear form
      setMessage('');
      setUploadedFiles([]);
      setUploadProgress([]);
      adjustTextareaHeight();
      
      // Focus back to textarea
      textareaRef.current?.focus();
    } catch (error) {
  void console.error('Failed to send message:', error);
      // Could show error toast here
    } finally {
      setIsSending(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  // Check if file is image
  const isImage = (file: File) => file.type.startsWith('image/');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const canSend = (message.trim() || uploadedFiles.length > 0) && !disabled && !isSending;

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 pr-8">
                  {isImage(file) ? (
                    <FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="p-2 hover:bg-gray-100 rounded-lg text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end gap-3 p-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {showFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Tooltip content="Attach file">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="p-2 h-auto"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </Tooltip>
            </>
          )}

          {showEmojiPicker && (
            <Tooltip content="Add emoji">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojis(!showEmojis)}
                disabled={disabled}
                className="p-2 h-auto"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </Tooltip>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full max-h-[120px] px-4 py-2 pr-12 border border-gray-200 rounded-full
              resize-none overflow-y-auto
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              placeholder-gray-500 text-sm
              ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            `}
          />
        </div>

        {/* Send Button */}
        <Tooltip content="Send message">
          <Button
            onClick={handleSendMessage}
            disabled={!canSend}
            variant="gradient"
            size="sm"
            className="p-2 h-auto rounded-full flex-shrink-0"
          >
            {isSending ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

interface QuickResponsesProps {
  responses: string[];
  onSelect: (response: string) => void;
  className?: string;
}

export function QuickResponses({
  responses,
  onSelect,
  className = '',
}: QuickResponsesProps) {
  if (responses.length === 0) return null;

  return (
    <div className={`p-4 border-b border-gray-100 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Responses</h4>
      <div className="flex flex-wrap gap-2">
        {responses.map((response, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(response)}
            className="text-sm"
          >
            {response}
          </Button>
        ))}
      </div>
    </div>
  );
}