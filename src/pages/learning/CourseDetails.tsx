import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock,
  Users,
  Star,
  Play,
  BookOpen,
  Award,
  CheckCircle,
  Lock,
  FileText,
  Download,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const mockCourse = {
  id: 1,
  title: 'Core Energy™ Coaching Fundamentals',
  instructor: {
    name: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    title: 'Master Certified Coach',
    bio: '15+ years of coaching experience, specializing in leadership and personal development.',
    rating: 4.9,
    students: 5000,
    courses: 12,
  },
  coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
  duration: '6 hours',
  level: 'Beginner',
  enrolled: 1250,
  rating: 4.8,
  reviewCount: 156,
  price: 299,
  description: `Master the fundamentals of Core Energy™ Coaching and learn how to facilitate transformative client sessions. This comprehensive course will equip you with the essential skills and knowledge needed to become an effective coach.

Through practical exercises, real-world examples, and expert guidance, you'll develop a deep understanding of the Core Energy™ framework and how to apply it in your coaching practice.`,
  learningObjectives: [
    'Understand the principles of Core Energy™ Coaching',
    'Develop essential coaching skills and techniques',
    'Learn how to structure effective coaching sessions',
    'Master the art of powerful questioning',
    'Build strong client relationships',
    'Practice ethical coaching standards',
  ],
  modules: [
    {
      id: 1,
      title: 'Introduction to Core Energy™ Coaching',
      duration: '45 minutes',
      lessons: [
        { title: 'What is Core Energy™ Coaching?', duration: '15 min', type: 'video' },
        { title: 'The Energy Leadership™ Framework', duration: '20 min', type: 'video' },
        { title: 'Core Energy™ Assessment', duration: '10 min', type: 'quiz' },
      ],
      completed: true,
    },
    {
      id: 2,
      title: 'Fundamental Coaching Skills',
      duration: '1 hour',
      lessons: [
        { title: 'Active Listening Skills', duration: '20 min', type: 'video' },
        { title: 'Powerful Questioning Techniques', duration: '25 min', type: 'video' },
        { title: 'Practice Exercises', duration: '15 min', type: 'worksheet' },
      ],
      completed: true,
    },
    {
      id: 3,
      title: 'Structuring Coaching Sessions',
      duration: '1.5 hours',
      lessons: [
        { title: 'Session Framework Overview', duration: '30 min', type: 'video' },
        { title: 'Opening the Session', duration: '20 min', type: 'video' },
        { title: 'Goal Setting and Action Planning', duration: '25 min', type: 'video' },
        { title: 'Session Practice Guide', duration: '15 min', type: 'worksheet' },
      ],
      completed: false,
    },
  ],
  materials: [
    { title: 'Coaching Session Template', type: 'pdf' },
    { title: 'Core Energy™ Assessment Guide', type: 'pdf' },
    { title: 'Practice Worksheets', type: 'pdf' },
  ],
  reviews: [
    {
      id: 1,
      user: {
        name: 'Michael Roberts',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
      },
      rating: 5,
      date: '2024-03-15',
      comment: 'Excellent course! The content is well-structured and Sarah is an amazing instructor. I particularly enjoyed the practical exercises and real-world examples.',
      helpful: 24,
    },
    {
      id: 2,
      user: {
        name: 'Emily Chen',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
      },
      rating: 5,
      date: '2024-03-10',
      comment: "This course provided a solid foundation in Core Energy coaching. The materials are comprehensive and the instructor's explanations are clear and engaging.",
      helpful: 18,
    },
  ],
};

export function CourseDetails() {
  const { id } = useParams();
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white border-b">
        <Container className="py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge variant="default" className="mb-4">{mockCourse.level}</Badge>
              <h1 className="text-3xl font-bold mb-4">{mockCourse.title}</h1>
              <p className="text-gray-600 mb-6">{mockCourse.description.split('\n')[0]}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span>{mockCourse.rating}</span>
                  <span>({mockCourse.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{mockCourse.enrolled} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{mockCourse.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <Avatar
                  src={mockCourse.instructor.image}
                  alt={mockCourse.instructor.name}
                  size="md"
                />
                <div>
                  <p className="font-medium">{mockCourse.instructor.name}</p>
                  <p className="text-sm text-gray-600">{mockCourse.instructor.title}</p>
                </div>
              </div>
            </div>

            <div>
              <Card className="sticky top-24">
                <img
                  src={mockCourse.coverImage}
                  alt={mockCourse.title}
                  className="w-full aspect-video object-cover rounded-t-xl"
                />
                <Card.Body>
                  <div className="text-3xl font-bold mb-6">${mockCourse.price}</div>
                  <Button variant="gradient" size="lg" className="w-full mb-4">
                    Enroll Now
                  </Button>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{mockCourse.duration} of content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span>{mockCourse.modules.length} modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>{mockCourse.materials.length} downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Course Description */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">About This Course</h2>
              </Card.Header>
              <Card.Body>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{mockCourse.description}</p>
                  
                  <h3 className="font-semibold mt-6 mb-4">What You'll Learn</h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {mockCourse.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card.Body>
            </Card>

            {/* Course Content */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Content</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockCourse.modules.map((module) => (
                    <div key={module.id} className="border rounded-lg">
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-3">
                          {module.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Lock className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="text-left">
                            <h3 className="font-medium">{module.title}</h3>
                            <p className="text-sm text-gray-600">
                              {module.lessons.length} lessons • {module.duration}
                            </p>
                          </div>
                        </div>
                        {expandedModules.includes(module.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      
                      {expandedModules.includes(module.id) && (
                        <div className="border-t">
                          {module.lessons.map((lesson, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 hover:bg-gray-50"
                            >
                              {lesson.type === 'video' && (
                                <Play className="h-4 w-4 text-gray-400" />
                              )}
                              {lesson.type === 'quiz' && (
                                <FileText className="h-4 w-4 text-gray-400" />
                              )}
                              {lesson.type === 'worksheet' && (
                                <Download className="h-4 w-4 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-sm text-gray-600">{lesson.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Reviews */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Student Reviews</h2>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">{mockCourse.rating}</span>
                    <span className="text-gray-500">({mockCourse.reviewCount})</span>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {mockCourse.reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={review.user.image}
                          alt={review.user.name}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{review.user.name}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(review.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{review.rating}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-600">{review.comment}</p>
                          <button className="flex items-center gap-1 mt-3 text-gray-500 hover:text-gray-700">
                            <MessageSquare className="h-4 w-4" />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Instructor Profile */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Your Instructor</h2>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-6">
                  <Avatar
                    src={mockCourse.instructor.image}
                    alt={mockCourse.instructor.name}
                    size="lg"
                    className="mx-auto mb-4"
                  />
                  <h3 className="font-semibold">{mockCourse.instructor.name}</h3>
                  <p className="text-gray-600">{mockCourse.instructor.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold">{mockCourse.instructor.rating}</div>
                    <div className="text-sm text-gray-600">Instructor Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold">{mockCourse.instructor.students}</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{mockCourse.instructor.bio}</p>

                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Card.Body>
            </Card>

            {/* Course Materials */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Materials</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {mockCourse.materials.map((material, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      icon={<Download className="h-4 w-4" />}
                    >
                      {material.title}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}