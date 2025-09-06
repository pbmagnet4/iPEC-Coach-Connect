import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ChevronDown, 
  Clock, 
  Filter, 
  Grid, 
  Heart, 
  List,
  MapPin,
  Search,
  Sliders,
  Star,
  X
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const specialties = [
  'Career Transition',
  'Leadership Development',
  'Executive Coaching',
  'Life Balance',
  'Personal Growth',
  'Business Strategy',
  'Relationship Coaching',
  'Health & Wellness',
];

const mockCoaches = [
  {
    id: 1,
    name: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    title: 'Executive Leadership Coach',
    specialties: ['Career Transition', 'Leadership Development', 'Executive Coaching'],
    rating: 4.9,
    reviewCount: 127,
    description: 'Certified iPEC coach with 10+ years of experience helping professionals navigate career transitions and develop leadership skills.',
    priceRange: { min: 150, max: 250 },
    nextAvailable: '2024-03-20T10:00:00Z',
    location: 'New York, NY',
    distance: '2 miles',
  },
  {
    id: 2,
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
    title: 'Life & Business Coach',
    specialties: ['Business Strategy', 'Personal Growth', 'Life Balance'],
    rating: 4.8,
    reviewCount: 93,
    description: 'Helping entrepreneurs and professionals achieve work-life harmony through strategic coaching and personal development.',
    priceRange: { min: 125, max: 200 },
    nextAvailable: '2024-03-19T14:00:00Z',
    location: 'San Francisco, CA',
    distance: '5 miles',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    image: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80',
    title: 'Transformational Coach',
    specialties: ['Personal Growth', 'Relationship Coaching', 'Health & Wellness'],
    rating: 5.0,
    reviewCount: 74,
    description: 'Specializing in holistic transformation through iPEC\'s Core Energy™ Coaching process.',
    priceRange: { min: 100, max: 175 },
    nextAvailable: '2024-03-18T09:00:00Z',
    location: 'Miami, FL',
    distance: 'Remote',
  },
];

export function CoachList() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [sessionType, setSessionType] = useState<'all' | 'remote' | 'in-person'>('all');
  const [distance, setDistance] = useState(25);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <Container className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search coaches by name, specialty, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-sm">
                  {selectedSpecialties.length}
                </span>
              </Button>
              <div className="hidden sm:flex items-center gap-2 border-l pl-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'text-brand-600 bg-brand-50' : 'text-gray-400'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'text-brand-600 bg-brand-50' : 'text-gray-400'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex gap-8">
          {/* Filter Panel */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:block"
              >
                <Card className="sticky top-32">
                  <Card.Header className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSpecialties([]);
                        setPriceRange({ min: 0, max: 500 });
                        setSessionType('all');
                        setDistance(25);
                      }}
                    >
                      Clear All
                    </Button>
                  </Card.Header>
                  <Card.Body className="space-y-6">
                    {/* Specialties */}
                    <div>
                      <h3 className="font-semibold mb-3">Specialties</h3>
                      <div className="space-y-2">
                        {specialties.map((specialty) => (
                          <button
                            key={specialty}
                            onClick={() => toggleSpecialty(specialty)}
                            className={`w-full p-2 rounded-lg text-left ${
                              selectedSpecialties.includes(specialty)
                                ? 'bg-brand-50 text-brand-600'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedSpecialties.includes(specialty)}
                                onChange={() => {}}
                                className="mr-3"
                              />
                              <span>{specialty}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <h3 className="font-semibold mb-3">Price Range</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-lg"
                          />
                          <span>to</span>
                          <input
                            type="number"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="500"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Session Type */}
                    <div>
                      <h3 className="font-semibold mb-3">Session Type</h3>
                      <div className="space-y-2">
                        {['all', 'remote', 'in-person'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setSessionType(type as any)}
                            className={`w-full p-2 rounded-lg text-left ${
                              sessionType === type
                                ? 'bg-brand-50 text-brand-600'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Distance */}
                    <div>
                      <h3 className="font-semibold mb-3">Distance</h3>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>0 miles</span>
                          <span>{distance} miles</span>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{coaches.length}</span> of <span className="font-semibold">{pagination.totalCount}</span> coaches
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="hourly_rate">Price: Low to High</option>
                  <option value="experience_years">Most Experienced</option>
                  <option value="created_at">Newest Members</option>
                </select>
              </div>
            </div>

            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2' : ''}`}>
              {mockCoaches.map((coach) => (
                <Card
                  key={coach.id}
                  hover
                  className={viewMode === 'list' ? 'flex' : ''}
                >
                  <div className={`relative ${viewMode === 'list' ? 'w-64 flex-shrink-0' : ''}`}>
                    <img
                      src={coach.image}
                      alt={coach.name}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <Card.Body>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">{coach.name}</h3>
                        <p className="text-gray-600">{coach.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{coach.rating}</span>
                        <span className="text-gray-500">({coach.reviewCount})</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {coach.specialties.map((specialty) => (
                          <Badge key={specialty} variant="default">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-gray-600 line-clamp-2">{coach.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{coach.location}</span>
                        {coach.distance && (
                          <span className="text-sm text-gray-500">({coach.distance})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Next available: Tomorrow at 10 AM</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div>
                        <span className="text-brand-600 font-semibold">
                          ${coach.priceRange.min}-${coach.priceRange.max}
                        </span>
                        <span className="text-gray-500">/session</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          href={`/coaches/${coach.id}`}
                          variant="outline"
                        >
                          View Profile
                        </Button>
                        <Button
                          href={`/booking?coach=${coach.id}`}
                          variant="primary"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                {[1, 2, 3, '...', 10].map((page, index) => (
                  <button
                    key={index}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                      page === 1
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}