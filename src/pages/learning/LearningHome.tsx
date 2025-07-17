import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen,
  Play,
  FileText,
  Search,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const mockData = {
  featuredCourses: [
    {
      id: 1,
      title: 'Core Energy™ Coaching Fundamentals',
      instructor: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
      duration: '6 hours',
      level: 'Beginner',
      enrolled: 1250,
      rating: 4.8,
      progress: 0,
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
      progress: 35,
    },
  ],
  recommendedResources: [
    {
      id: 1,
      title: 'Building Trust in Coaching Relationships',
      type: 'article',
      readTime: '10 min',
      author: 'Emily Rodriguez',
    },
    {
      id: 2,
      title: 'Effective Goal Setting Framework',
      type: 'worksheet',
      format: 'PDF',
      downloads: 2500,
    },
    {
      id: 3,
      title: 'Understanding Energy Leadership™',
      type: 'video',
      duration: '15 min',
      views: 1800,
    },
  ],
  inProgress: [
    {
      id: 1,
      title: 'Advanced Leadership Coaching Techniques',
      progress: 35,
      nextModule: 'Module 4: Coaching Through Change',
      timeLeft: '5 hours',
    },
  ],
  popularTopics: [
    'Leadership Development',
    'Career Coaching',
    'Energy Leadership',
    'Work-Life Balance',
    'Team Coaching',
    'Executive Presence',
  ],
};

export function LearningHome() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learning Center</h1>
            <p className="text-gray-600">
              Enhance your coaching skills with our comprehensive resources
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses and resources..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              variant="outline"
              icon={<Filter className="h-5 w-5" />}
            >
              Filters
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {mockData.inProgress.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Continue Learning</h2>
                </Card.Header>
                <Card.Body>
                  {mockData.inProgress.map((course) => (
                    <div key={course.id} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge variant="success">{course.progress}% Complete</Badge>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Next: {course.nextModule}
                        </span>
                        <span className="text-sm text-gray-600">
                          {course.timeLeft} remaining
                        </span>
                      </div>
                      <Button
                        variant="gradient"
                        className="w-full"
                        href={`/learning/courses/${course.id}`}
                      >
                        Continue Course
                      </Button>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* Featured Courses */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Featured Courses</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/learning/courses"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="grid sm:grid-cols-2 gap-6">
                  {mockData.featuredCourses.map((course) => (
                    <Card key={course.id} hover>
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                      <Card.Body>
                        <Badge variant="default" className="mb-2">
                          {course.level}
                        </Badge>
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
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {course.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.enrolled} enrolled
                          </span>
                        </div>
                        {course.progress > 0 && (
                          <div className="mt-4">
                            <div className="h-1 bg-gray-100 rounded-full">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 to-blue-500 rounded-full"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {course.progress}% complete
                            </p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Recommended Resources */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Recommended Resources</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/learning/resources"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockData.recommendedResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          resource.type === 'article'
                            ? 'bg-blue-100 text-blue-600'
                            : resource.type === 'video'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {resource.type === 'article' ? (
                          <BookOpen className="h-5 w-5" />
                        ) : resource.type === 'video' ? (
                          <Play className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold hover:text-brand-600">
                          <a href={`/learning/resources/${resource.id}`}>
                            {resource.title}
                          </a>
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {'readTime' in resource && (
                            <span>{resource.readTime} read</span>
                          )}
                          {'duration' in resource && (
                            <span>{resource.duration}</span>
                          )}
                          {'format' in resource && (
                            <span>{resource.format}</span>
                          )}
                          {'author' in resource && (
                            <span>By {resource.author}</span>
                          )}
                          {'downloads' in resource && (
                            <span>{resource.downloads} downloads</span>
                          )}
                          {'views' in resource && (
                            <span>{resource.views} views</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Popular Topics */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Popular Topics</h2>
              </Card.Header>
              <Card.Body>
                <div className="flex flex-wrap gap-2">
                  {mockData.popularTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      href={`/learning/courses?topic=${encodeURIComponent(topic)}`}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Learning Stats */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Your Learning</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-100 text-brand-600 rounded-lg">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">12 Hours</div>
                      <div className="text-sm text-gray-600">
                        Learning time this month
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">3 Certificates</div>
                      <div className="text-sm text-gray-600">
                        Earned this year
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">5 Courses</div>
                      <div className="text-sm text-gray-600">In progress</div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}