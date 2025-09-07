/**
 * Enhanced Discussion Details Component for iPEC Coach Connect
 * 
 * Authentication-aware discussion view that provides differentiated experiences
 * based on user authentication state and role. Supports full participation
 * for authenticated users while maintaining accessibility for public viewers.
 * 
 * Features:
 * - Public viewing with authentication prompts for participation
 * - Role-based action availability (reply, moderate, delete)
 * - Real-time updates for replies and reactions
 * - Progressive disclosure of user-generated content
 * - Mobile-optimized comment threading
 * - SEO-friendly content structure
 */

import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Bookmark, 
  Edit,
  Flag,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Send,
  Share,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { AuthPrompt } from '../../components/community/AuthPrompt';
import { 
  ConditionalAction, 
  ProgressiveContent,
  useAuthAwareActions 
} from '../../components/community/AuthAwareWrapper';
import { useUnifiedUserStore } from '../../stores/unified-user-store';

// Mock discussion data with authentication-aware features
const mockDiscussion = {
  id: 1,
  title: 'Transitioning from Corporate to Entrepreneurship',
  content: `After 10 years in corporate marketing, I've decided to take the leap into entrepreneurship. The decision wasn't easy - I had a stable salary, benefits, and a clear career path ahead of me.

But I kept feeling this pull toward something bigger, something that was truly mine. I wanted to build something from the ground up, to have the freedom to make decisions and see their direct impact.

I'd love to hear from others who have made this transition successfully. What were your biggest challenges? How did you overcome them? What advice would you give to someone standing at this crossroads?

Some specific questions I have:
- How did you handle the financial uncertainty?
- What was your timeline for making the transition?
- Did you start your business while still employed?
- How did you build your network and find your first customers?

Any insights would be incredibly valuable as I navigate this exciting but scary journey.`,
  author: {
    id: 'user1',
    name: 'Emily Chen',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    role: 'Marketing Executive',
    isVerified: true,
    joinDate: '2023-01-15',
    postsCount: 47,
    followersCount: 234,
  },
  category: 'Career Development',
  tags: ['entrepreneurship', 'career-transition', 'leadership', 'business-planning'],
  createdAt: '2024-03-19T14:00:00Z',
  updatedAt: '2024-03-19T14:00:00Z',
  views: 1247,
  likes: 156,
  replies: 24,
  saves: 89,
  shares: 12,
  isLiked: false,
  isSaved: false,
  isFollowingAuthor: false,
};

const mockReplies = [
  {
    id: 1,
    content: `I made this transition 3 years ago and it was the best decision of my life! The biggest challenge was definitely the financial uncertainty. Here's what helped me:

1. **Build a safety net**: I saved 8 months of expenses before making the leap
2. **Start small**: I began freelancing while still employed to test the waters
3. **Network like crazy**: I attended every industry event I could find
4. **Stay lean**: I kept my overhead low and reinvested everything back into the business

The first year was tough, but by year two I was making more than my corporate salary. The freedom and fulfillment are incredible - I wouldn't trade it for anything!`,
    author: {
      id: 'user2',
      name: 'Marcus Johnson',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      role: 'Business Coach',
      isVerified: true,
    },
    createdAt: '2024-03-19T15:30:00Z',
    likes: 23,
    replies: 3,
    isLiked: false,
    depth: 0,
  },
  {
    id: 2,
    content: `This resonates so much! I'm currently 6 months into my own transition and it's been a rollercoaster. The financial stress is real, but the sense of ownership over my work is invaluable.

One thing I wish I'd done better was building relationships before I needed them. Start networking NOW, not when you're ready to leave.`,
    author: {
      id: 'user3',
      name: 'Sarah Kim',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      role: 'Startup Founder',
      isVerified: false,
    },
    createdAt: '2024-03-19T16:45:00Z',
    likes: 15,
    replies: 1,
    isLiked: false,
    depth: 0,
  },
  {
    id: 3,
    content: `@Marcus Johnson Great advice! How did you handle the transition period where you were still employed but building your business? Any tips for managing both without burning out?`,
    author: {
      id: 'user4',
      name: 'David Park',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      role: 'Product Manager',
      isVerified: false,
    },
    createdAt: '2024-03-19T17:20:00Z',
    likes: 8,
    replies: 0,
    isLiked: false,
    depth: 1,
    parentId: 1,
  },
];

export function EnhancedDiscussionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newReply, setNewReply] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    isAuthenticated, 
    profile, 
    primaryRole,
    canPerformAction 
  } = useAuthAwareActions();

  const handleLike = async (replyId?: number) => {
    if (!isAuthenticated) return;
  void console.log(`Like ${replyId ? `reply ${replyId}` : 'discussion'}`);
  };

  const handleSave = async () => {
    if (!isAuthenticated) return;
  void console.log('Save discussion');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: mockDiscussion.title,
        text: `${mockDiscussion.content.substring(0, 100)  }...`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      // Show toast notification
    }
  };

  const handleReply = async () => {
    if (!isAuthenticated || !newReply.trim()) return;
    
    console.log('Post reply:', {
      content: newReply,
      parentId: replyingTo,
    });
    
    setNewReply('');
    setReplyingTo(null);
  };

  const handleReplyTo = (replyId: number) => {
    setReplyingTo(replyId);
    replyInputRef.current?.focus();
  };

  const canModerate = canPerformAction(['admin', 'moderator'], ['community:moderate']);
  const canEdit = isAuthenticated && (profile?.id === mockDiscussion.author.id || canModerate);
  const canDelete = canEdit;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Discussion */}
          <Card className="mb-8">
            <Card.Body>
              <div className="space-y-6">
                {/* Discussion Header */}
                <div className="flex items-start gap-4">
                  <Avatar
                    src={mockDiscussion.author.image}
                    alt={mockDiscussion.author.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold mb-3 text-gray-900">
                          {mockDiscussion.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <span>by</span>
                            <span className="font-medium text-gray-900">
                              {mockDiscussion.author.name}
                            </span>
                            {mockDiscussion.author.isVerified && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <span className="text-gray-400">•</span>
                          <span>{mockDiscussion.author.role}</span>
                          <span className="text-gray-400">•</span>
                          <span>{new Date(mockDiscussion.createdAt).toLocaleDateString()}</span>
                          <Badge variant="default">{mockDiscussion.category}</Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mockDiscussion.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Stats - visible to all users */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {mockDiscussion.views.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {mockDiscussion.likes} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {mockDiscussion.replies} replies
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <ConditionalAction
                          authAction="save"
                          promptStyle="inline"
                          promptContext="this discussion"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            icon={<Bookmark className={`h-4 w-4 ${mockDiscussion.isSaved ? 'fill-current text-brand-600' : ''}`} />}
                          >
                            {mockDiscussion.isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </ConditionalAction>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          icon={<Share className="h-4 w-4" />}
                        >
                          Share
                        </Button>
                        
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Flag className="h-4 w-4" />}
                        >
                          Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Discussion Content */}
                <div className="prose max-w-none">
                  {mockDiscussion.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-800 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Interaction Bar */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center gap-4">
                    <ConditionalAction
                      authAction="like"
                      promptStyle="inline"
                      promptContext="this discussion"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike()}
                        className={`transition-colors ${
                          mockDiscussion.isLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-600 hover:text-red-500'
                        }`}
                        icon={<Heart className={`h-4 w-4 ${mockDiscussion.isLiked ? 'fill-current' : ''}`} />}
                      >
                        {mockDiscussion.likes} Likes
                      </Button>
                    </ConditionalAction>

                    <ConditionalAction
                      authAction="reply"
                      promptStyle="inline"
                      promptContext="to this discussion"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => replyInputRef.current?.focus()}
                        icon={<MessageSquare className="h-4 w-4" />}
                      >
                        Reply
                      </Button>
                    </ConditionalAction>
                  </div>

                  {/* Progressive content - follow author */}
                  <ProgressiveContent
                    authenticatedContent={
                      <ConditionalAction
                        authAction="follow"
                        promptStyle="inline"
                        promptContext={mockDiscussion.author.name}
                      >
                        <Button
                          variant={mockDiscussion.isFollowingAuthor ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => console.log('Toggle follow author')}
                        >
                          {mockDiscussion.isFollowingAuthor ? 'Following' : 'Follow'}
                        </Button>
                      </ConditionalAction>
                    }
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Reply Form - Authentication Required */}
          <ProgressiveContent
            publicContent={
              <div className="mb-8">
                <AuthPrompt
                  action="reply"
                  style="card"
                  context="to join this discussion"
                  emphasizeSignUp={true}
                />
              </div>
            }
            authenticatedContent={
              <Card className="mb-8">
                <Card.Body>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Avatar src={profile?.avatar_url} alt={profile?.full_name} size="sm" />
                    Add your reply
                    {replyingTo && (
                      <Badge variant="secondary" className="text-xs">
                        Replying to comment #{replyingTo}
                      </Badge>
                    )}
                  </h3>
                  
                  <div className="space-y-4">
                    <textarea
                      ref={replyInputRef}
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                      placeholder="Share your thoughts, experiences, or advice..."
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{newReply.length}/2000 characters</span>
                        {replyingTo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Cancel Reply
                          </Button>
                        )}
                      </div>
                      
                      <Button 
                        variant="gradient" 
                        onClick={handleReply}
                        disabled={!newReply.trim()}
                        icon={<Send className="h-4 w-4" />}
                      >
                        Post Reply
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            }
          />

          {/* Replies */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">
                Replies ({mockDiscussion.replies})
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-6">
                <AnimatePresence>
                  {mockReplies.map((reply) => (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${reply.depth > 0 ? 'ml-12 pt-4 border-l-2 border-gray-200 pl-4' : ''}`}
                    >
                      <Avatar
                        src={reply.author.image}
                        alt={reply.author.name}
                        size="md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          {/* Reply Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {reply.author.name}
                              </span>
                              {reply.author.isVerified && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                              <span className="text-sm text-gray-600">
                                {reply.author.role}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {canModerate && (
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Reply Content */}
                          <div className="text-gray-800 mb-4 whitespace-pre-wrap">
                            {reply.content}
                          </div>
                        </div>
                        
                        {/* Reply Actions */}
                        <div className="flex items-center gap-4 mt-2">
                          <ConditionalAction
                            authAction="like"
                            promptStyle="inline"
                            promptContext="this reply"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(reply.id)}
                              className={`transition-colors ${
                                reply.isLiked 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-600 hover:text-red-500'
                              }`}
                              icon={<ThumbsUp className={`h-4 w-4 ${reply.isLiked ? 'fill-current' : ''}`} />}
                            >
                              {reply.likes}
                            </Button>
                          </ConditionalAction>

                          <ConditionalAction
                            authAction="reply"
                            promptStyle="inline"
                            promptContext="to this comment"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReplyTo(reply.id)}
                              icon={<Reply className="h-4 w-4" />}
                            >
                              Reply
                            </Button>
                          </ConditionalAction>

                          {/* Progressive content - edit/delete for own replies */}
                          <ProgressiveContent
                            authenticatedContent={
                              (profile?.id === reply.author.id || canModerate) ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Edit className="h-4 w-4" />}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    icon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              ) : null
                            }
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}