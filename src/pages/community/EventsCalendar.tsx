import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users
} from 'lucide-react';

export function EventsCalendar() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Events</h1>
            <p className="text-gray-600">Discover and join upcoming events</p>
          </div>
          <Button
            variant="gradient"
            icon={<Plus className="h-5 w-5" />}
          >
            Create Event
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <Card.Body>
                <div className="text-center text-gray-600 py-8">
                  Calendar view coming soon...
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Upcoming Events</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {/* Event list would go here */}
                  <p className="text-gray-600">Events coming soon...</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}