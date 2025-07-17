import React from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Share,
  ExternalLink
} from 'lucide-react';

export function EventDetails() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <Card className="mb-8">
          <img
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80"
            alt="Event banner"
            className="w-full h-64 object-cover"
          />
          <Card.Body>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="success" className="mb-4">In-Person Event</Badge>
                <h1 className="text-3xl font-bold mb-2">
                  Leadership Summit 2024
                </h1>
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>March 25, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>9:00 AM - 5:00 PM EST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>New York City, NY</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  icon={<Share className="h-5 w-5" />}
                >
                  Share
                </Button>
                <Button variant="gradient">Register Now</Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">About This Event</h2>
              </Card.Header>
              <Card.Body>
                <div className="prose max-w-none">
                  <p>
                    Join us for a transformative day of leadership insights, networking,
                    and professional development. The Leadership Summit 2024 brings together
                    industry experts, successful entrepreneurs, and thought leaders to share
                    their experiences and strategies for effective leadership in today's
                    rapidly evolving business landscape.
                  </p>
                  
                  <h3>What to Expect</h3>
                  <ul>
                    <li>Keynote speeches from industry leaders</li>
                    <li>Interactive workshops and breakout sessions</li>
                    <li>Networking opportunities with fellow professionals</li>
                    <li>Practical tools and strategies for leadership development</li>
                  </ul>

                  <h3>Schedule</h3>
                  <ul>
                    <li>9:00 AM - Registration and Networking Breakfast</li>
                    <li>10:00 AM - Opening Keynote</li>
                    <li>11:30 AM - Breakout Sessions</li>
                    <li>1:00 PM - Lunch and Networking</li>
                    <li>2:00 PM - Workshop Sessions</li>
                    <li>4:00 PM - Closing Keynote</li>
                    <li>5:00 PM - Networking Reception</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Event Details</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Organizer</h3>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80"
                        alt="Event Organizer"
                      />
                      <div>
                        <p className="font-medium">Michael Chen</p>
                        <p className="text-sm text-gray-600">Leadership Coach</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Location</h3>
                    <p className="text-gray-600">
                      The Grand Conference Center<br />
                      123 Business Avenue<br />
                      New York, NY 10001
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      icon={<ExternalLink className="h-4 w-4" />}
                    >
                      View Map
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Attendees</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <Avatar
                            key={i}
                            src={`https://images.unsplash.com/photo-${i}?auto=format&fit=crop&q=80`}
                            alt={`Attendee ${i}`}
                            className="border-2 border-white"
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">+47 others attending</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="gradient" className="w-full">
                      Register Now
                    </Button>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Limited spots available
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Similar Events</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <a href="/community/events/2" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <h3 className="font-medium">Executive Networking Mixer</h3>
                    <p className="text-sm text-gray-600 mt-1">March 30, 2024</p>
                  </a>
                  <a href="/community/events/3" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <h3 className="font-medium">Communication Workshop</h3>
                    <p className="text-sm text-gray-600 mt-1">April 5, 2024</p>
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