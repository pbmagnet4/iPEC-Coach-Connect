import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { 
  Award,
  Calendar,
  MapPin,
  MessageSquare,
  UserPlus
} from 'lucide-react';

export function MemberProfile() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Card className="mb-8">
          <Card.Body>
            <div className="flex items-start gap-6">
              <Avatar
                size="lg"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80"
                alt="Member Name"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Member Name</h1>
                    <p className="text-gray-600">Member title or role</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      icon={<MessageSquare className="h-5 w-5" />}
                    >
                      Message
                    </Button>
                    <Button
                      variant="gradient"
                      icon={<UserPlus className="h-5 w-5" />}
                    >
                      Follow
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
              <Card.Body>
                <div className="text-center text-gray-600 py-8">
                  Member activity coming soon...
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">About</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Member information would go here */}
                  <p className="text-gray-600">Member details coming soon...</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}