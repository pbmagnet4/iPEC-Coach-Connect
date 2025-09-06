import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  MapPin,
  Plus,
  Search,
  Star,
  Tag,
  Users,
  Video
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const mockEvents = [
  {
    id: 1,
    title: 'Leadership Summit 2024',
    type: 'conference',
    format: 'in-person',
    date: '2024-03-25T09:00:00Z',
    endDate: '2024-03-25T17:00:00Z',
    location: 'New York City, NY',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
    description: 'Join us for a transformative day of leadership insights and networking opportunities.',
    price: 299,
    capacity: 200,
    registered: 156,
    speakers: [
      {
        name: 'Sarah Johnson',
        title: 'Executive Coach',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
      },
      {
        name: 'Michael Chen',
        title: 'Leadership Expert',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      },
    ],
    tags: ['Leadership', 'Professional Development', 'Networking'],
  },
  {
    id: 2,
    title: 'Core Energy™ Coaching Workshop',
    type: 'workshop',
    format: 'virtual',
    date: '2024-03-28T14:00:00Z',
    endDate: '2024-03-28T16:00:00Z',
    location: 'Virtual Event',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&q=80',
    description: 'Learn advanced Core Energy™ coaching techniques in this interactive workshop.',
    price: 149,
    capacity: 50,
    registered: 32,
    speakers: [
      {
        name: 'Emily Rodriguez',
        title: 'Master Coach Trainer',
        image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
      },
    ],
    tags: ['Core Energy', 'Coaching Skills', 'Professional Development'],
  },
  {
    id: 3,
    title: 'Coaching Business Masterclass',
    type: 'seminar',
    format: 'hybrid',
    date: '2024-04-05T10:00:00Z',
    endDate: '2024-04-05T15:00:00Z',
    location: 'Chicago, IL + Virtual',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    description: 'Build and scale your coaching practice with proven business strategies.',
    price: 199,
    capacity: 100,
    registered: 67,
    speakers: [
      {
        name: 'David Thompson',
        title: 'Business Coach',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
      },
    ],
    tags: ['Business Growth', 'Marketing', 'Practice Management'],
  },
];

const eventTypes = [
  { value: 'all', label: 'All Events' },
  { value: 'conference', label: 'Conferences' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'seminar', label: 'Seminars' },
  { value: 'webinar', label: 'Webinars' },
];

const eventFormats = [
  { value: 'all', label: 'All Formats' },
  { value: 'in-person', label: 'In-Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function Events() {
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter events based on search query and filters
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesFormat = selectedFormat === 'all' || event.format === selectedFormat;
    
    return matchesSearch && matchesType && matchesFormat;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <Container className="py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
              <p className="text-gray-600">
                Discover and join our community events and professional development opportunities
              </p>
            </div>
            <Button
              variant="gradient"
              icon={<Plus className="h-5 w-5" />}
            >
              Create Event
            </Button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="h-5 w-5" />}
              >
                Filters
                {(selectedType !== 'all' || selectedFormat !== 'all') && (
                  <span className="ml-2 bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-sm">
                    {(selectedType !== 'all' ? 1 : 0) + (selectedFormat !== 'all' ? 1 : 0)}
                  </span>
                )}
              </Button>
              <div className="border-l pl-2 flex gap-2">
                <Button
                  variant={view === 'calendar' ? 'primary' : 'outline'}
                  onClick={() => setView('calendar')}
                  icon={<CalendarIcon className="h-5 w-5" />}
                />
                <Button
                  variant={view === 'list' ? 'primary' : 'outline'}
                  onClick={() => setView('list')}
                  icon={<Filter className="h-5 w-5" />}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {eventFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <Input
                    type="date"
                    value={selectedDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedType('all');
                      setSelectedFormat('all');
                      setSelectedDate(null);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </Container>
      </div>

      <Container className="py-8">
        {view === 'list' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card hover>
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <Card.Body className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge
                        variant={
                          event.format === 'virtual'
                            ? 'success'
                            : event.format === 'hybrid'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {event.format === 'virtual' ? (
                          <Video className="h-4 w-4 mr-1" />
                        ) : event.format === 'hybrid' ? (
                          <Globe className="h-4 w-4 mr-1" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-1" />
                        )}
                        {event.format.charAt(0).toUpperCase() + event.format.slice(1)}
                      </Badge>
                      <Badge variant="default">{event.type}</Badge>
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(event.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                          {' - '}
                          {new Date(event.endDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {event.speakers.map((speaker) => (
                            <img
                              key={speaker.name}
                              src={speaker.image}
                              alt={speaker.name}
                              className="w-8 h-8 rounded-full border-2 border-white"
                              title={`${speaker.name} - ${speaker.title}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {event.registered}/{event.capacity} registered
                        </span>
                      </div>
                      <Button
                        variant="gradient"
                        href={`/events/${event.id}`}
                        icon={<ArrowRight className="h-5 w-5" />}
                      >
                        Register
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <Card.Body>
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Calendar view coming soon...
                </p>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </div>
  );
}