import React, { useState } from 'react';
import { 
  Search,
  Filter,
  Clock,
  Award,
  BookOpen,
  ChevronDown,
  Star,
  Users,
  Sliders
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const mockCourses = [
  {
    id: 1,
    title: 'Core Energy™ Coaching Fundamentals',
    instructor: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    duration: '6 hours',
    level: 'Beginner',
    enrolled: 1250,
    rating: 4.8,
    reviewCount: 156,
    price: 299,
    topics: ['Core Energy', 'Coaching Basics', 'Client Relations'],
    description: 'Master the fundamentals of Core Energy™ Coaching and learn how to facilitate transformative client sessions.',
  },
  {
    id: 2,
    title: 'Advanced Leadership Coaching Techniques',
    instructor: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    duration: '8 hours',
    level: 'Advanced',
    enrolled: 850,
    rating: 4.9,
    reviewCount: 92,
    price: 399,
    topics: ['Leadership', 'Executive Coaching', 'Team Development'],
    description: 'Take your leadership coaching to the next level with advanced techniques and proven methodologies.',
  },
  {
    id: 3,
    title: 'Building a Successful Coaching Practice',
    instructor: 'Emily Rodriguez',
    image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
    duration: '10 hours',
    level: 'Intermediate',
    enrolled: 725,
    rating: 4.7,
    reviewCount: 84,
    price: 349,
    topics: ['Business Development', 'Marketing', 'Client Acquisition'],
    description: 'Learn how to build and grow a thriving coaching practice with practical business strategies.',
  },
];

const filters = {
  levels: ['Beginner', 'Intermediate', 'Advanced'],
  topics: [
    'Core Energy',
    'Leadership',
    'Business Development',
    'Career Coaching',
    'Life Coaching',
    'Team Coaching',
    'Executive Coaching',
  ],
  duration: ['0-5 hours', '5-10 hours', '10+ hours'],
  price: ['Free', 'Under $200', '$200-$500', '$500+'],
};

export function CourseList() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedFilters, setSelectedFilters] = useState({
    levels: [] as string[],
    topics: [] as string[],
    duration: [] as string[],
    price: [] as string[],
  });

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
            <p className="text-gray-600">
              Discover our comprehensive collection of coaching courses
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              icon={<Filter className="h-5 w-5" />}
            >
              Filters
              {Object.values(selectedFilters).flat().length > 0 && (
                <span className="ml-2 bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full text-sm">
                  {Object.values(selectedFilters).flat().length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {isFilterOpen && (
            <div className="lg:col-span-1">
              <Card>
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Filters</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFilters({
                        levels: [],
                        topics: [],
                        duration: [],
                        price: [],
                      })}
                    >
                      Clear All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="space-y-6">
                  {/* Level Filter */}
                  <div>
                    <h3 className="font-semibold mb-3">Level</h3>
                    <div className="space-y-2">
                      {filters.levels.map((level) => (
                        <label
                          key={level}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.levels.includes(level)}
                            onChange={() => toggleFilter('levels', level)}
                            className="rounded text-brand-600"
                          />
                          <span>{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Topics Filter */}
                  <div>
                    <h3 className="font-semibold mb-3">Topics</h3>
                    <div className="space-y-2">
                      {filters.topics.map((topic) => (
                        <label
                          key={topic}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.topics.includes(topic)}
                            onChange={() => toggleFilter('topics', topic)}
                            className="rounded text-brand-600"
                          />
                          <span>{topic}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Duration Filter */}
                  <div>
                    <h3 className="font-semibold mb-3">Duration</h3>
                    <div className="space-y-2">
                      {filters.duration.map((duration) => (
                        <label
                          key={duration}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.duration.includes(duration)}
                            onChange={() => toggleFilter('duration', duration)}
                            className="rounded text-brand-600"
                          />
                          <span>{duration}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <h3 className="font-semibold mb-3">Price</h3>
                    <div className="space-y-2">
                      {filters.price.map((price) => (
                        <label
                          key={price}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.price.includes(price)}
                            onChange={() => toggleFilter('price', price)}
                            className="rounded text-brand-600"
                          />
                          <span>{price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Course Grid */}
          <div className={`${isFilterOpen ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{mockCourses.length}</span> courses
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCourses.map((course) => (
                <Card key={course.id} hover>
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <Card.Body>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="default">{course.level}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-semibold">{course.rating}</span>
                        <span className="text-gray-500">({course.reviewCount})</span>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">
                      <a
                        href={`/learning/courses/${course.id}`}
                        className="hover:text-brand-600"
                      >
                        {course.title}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      By {course.instructor}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrolled} enrolled
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.topics.slice(0, 2).map((topic) => (
                        <Badge key={topic} variant="default">
                          {topic}
                        </Badge>
                      ))}
                      {course.topics.length > 2 && (
                        <Badge variant="default">+{course.topics.length - 2}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-brand-600">
                        ${course.price}
                      </span>
                      <Button
                        variant="gradient"
                        size="sm"
                        href={`/learning/courses/${course.id}`}
                      >
                        View Course
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}