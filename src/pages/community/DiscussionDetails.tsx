import React from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { 
  MessageSquare, 
  Heart,
  Share,
  Bookmark,
  Flag,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export function DiscussionDetails() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Card className="mb-8">
          <Card.Body>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80"
                  alt="Emily Chen"
                  size="lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">
                        Transitioning from Corporate to Entrepreneurship
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Posted by Emily Chen</span>
                        <span>March 19, 2024</span>
                        <Badge variant="default">Career Development</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Bookmark className="h-4 w-4" />}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Share className="h-4 w-4" />}
                      >
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Flag className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 prose max-w-none">
                    <p>
                      After 10 years in corporate marketing, I've decided to take the leap into entrepreneurship.
                      I'd love to hear from others who have made this transition successfully.
                      What were your biggest challenges? How did you overcome them?
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-6 pt-6 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Heart className="h-4 w-4" />}
                    >
                      156 Likes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MessageSquare className="h-4 w-4" />}
                    >
                      24 Replies
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Replies</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {/* Example Reply */}
                  <div className="flex gap-4">
                    <Avatar
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80"
                      alt="Marcus Johnson"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">Marcus Johnson</h3>
                            <p className="text-sm text-gray-600">2 hours ago</p>
                          </div>
                        </div>
                        <p className="text-gray-800">
                          I made this transition 3 years ago. The biggest challenge was building a reliable client base.
                          My advice would be to start networking early and possibly do some freelance work while still employed.
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ThumbsUp className="h-4 w-4" />}
                          >
                            12
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ThumbsDown className="h-4 w-4" />}
                          >
                            1
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<MessageSquare className="h-4 w-4" />}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Add a Reply</h3>
                  <textarea
                    className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Share your thoughts..."
                  />
                  <div className="flex justify-end mt-4">
                    <Button variant="gradient">Post Reply</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Related Discussions</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <a href="/community/discussions/2" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <h3 className="font-medium">Starting a Business in 2024</h3>
                    <p className="text-sm text-gray-600 mt-1">15 replies • 2 days ago</p>
                  </a>
                  <a href="/community/discussions/3" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <h3 className="font-medium">Finding Your First Clients</h3>
                    <p className="text-sm text-gray-600 mt-1">28 replies • 3 days ago</p>
                  </a>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}