import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { 
  MessageSquare, 
  Heart, 
  Filter,
  Search,
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react';

export function DiscussionList() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Discussions</h1>
            <p className="text-gray-600">Join the conversation with fellow professionals</p>
          </div>
          <Button
            variant="gradient"
            icon={<Plus className="h-5 w-5" />}
          >
            Start Discussion
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <Card.Body>
                <div className="space-y-6">
                  {/* Discussion items would go here */}
                  <div className="text-center text-gray-600 py-8">
                    Loading discussions...
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Filters</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Filter options would go here */}
                  <p className="text-gray-600">Filter options coming soon...</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}