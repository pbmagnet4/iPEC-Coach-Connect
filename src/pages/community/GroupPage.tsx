import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { 
  Users,
  Calendar,
  BookOpen,
  Settings,
  Plus
} from 'lucide-react';

export function GroupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Card className="mb-8">
          <div className="h-48 bg-gray-200">
            {/* Group banner would go here */}
          </div>
          <Card.Body>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">Group Name</h1>
                <p className="text-gray-600">Group description would go here</p>
              </div>
              <Button variant="gradient">Join Group</Button>
            </div>
          </Card.Body>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <Card.Body>
                <div className="text-center text-gray-600 py-8">
                  Group content coming soon...
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
                  {/* Group information would go here */}
                  <p className="text-gray-600">Group details coming soon...</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}