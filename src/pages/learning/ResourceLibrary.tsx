import React, { useState } from 'react';
import { 
  Search,
  Filter,
  BookOpen,
  Play,
  FileText,
  Download,
  ChevronRight,
  Clock,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const mockResources = [
  {
    id: 1,
    title: 'Building Trust in Coaching Relationships',
    type: 'article',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    author: 'Sarah Johnson',
    readTime: '10 min',
    views: 1250,
    likes: 156,
    description: 'Learn effective strategies for building and maintaining trust with your coaching clients.',
    topics: ['Client Relations', 'Communication', 'Trust Building'],
  },
  {
    id: 2,
    title: 'Core Energy™ Assessment Guide',
    type: 'worksheet',
    author: 'Michael Chen',
    downloads: 850,
    rating: 4.9,
    reviewCount: 92,
    description: 'A comprehensive guide to conducting and interpreting Core Energy™ assessments.',
    topics: ['Assessment', 'Core Energy', 'Client Tools'],
    fileType: 'PDF',
  },
  {
    id: 3,
    title: 'Mastering Powerful Questions',
    type: 'video',
    image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
    author: 'Emily Rodriguez',
    duration: '15 min',
    views: 725,
    likes: 98,
    description: 'Learn the art of asking powerful questions that drive meaningful coaching conversations.',
    topics: ['Questioning Techniques', 'Communication', 'Coaching Skills'],
  },
];

const filters = {
  types: ['Articles', 'Videos', 'Worksheets', 'Templates'],
  topics: [
    'Core Energy',
    'Leadership',
    'Communication',
    'Assessment',
    'Client Relations',
    'Business Development',
  ],
  sortBy: [
    'Most Recent',
    'Most Popular',
    'Highest Rated',
  ],
};

export function ResourceLibrary() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    types: [] as string[],
    topics: [] as string[],
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
            <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
            <p className="text-gray-600">
              Access our collection of coaching resources and materials
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search resources..."
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
                        types: [],
                        topics: [],
                      })}
                    >
                      Clear All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="space-y-6">
                  {/* Resource Type Filter */}
                  <div>
                    <h3 className="font-semibold mb-3">Resource Type</h3>
                    <div className="space-y-2">
                      {filters.types.map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.types.includes(type)}
                            onChange={() => toggleFilter('types', type)}
                            className="rounded text-brand-600"
                          />
                          <span>{type}</span>
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
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Resource Grid */}
          <div className={`${isFilterOpen ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockResources.map((resource) => (
                <Card key={resource.id} hover>
                  {resource.type !== 'worksheet' && resource.image && (
                    <div className="relative">
                      <img
                        src={resource.image}
                        alt={resource.title}
                        className="w-full h-48 object-cover rounded-t-xl"
                      />
                      {resource.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <Card.Body>
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={
                          resource.type === 'article'
                            ? 'default'
                            : resource.type === 'video'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </Badge>
                      {'fileType' in resource && (
                        <Badge variant="default">{resource.fileType}</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">
                      <a
                        href={`/learning/resources/${resource.id}`}
                        className="hover:text-brand-600"
                      >
                        {resource.title}
                      </a>
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      By {resource.author}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {'readTime' in resource && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {resource.readTime}
                        </span>
                      )}
                      {'duration' in resource && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {resource.duration}
                        </span>
                      )}
                      {'views' in resource && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {resource.views}
                        </span>
                      )}
                      {'downloads' in resource && (
                        <span className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {resource.downloads}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.topics.slice(0, 2).map((topic) => (
                        <Badge key={topic} variant="default">
                          {topic}
                        </Badge>
                      ))}
                      {resource.topics.length > 2 && (
                        <Badge variant="default">+{resource.topics.length - 2}</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      icon={
                        resource.type === 'worksheet' ? (
                          <Download className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      }
                    >
                      {resource.type === 'worksheet' ? 'Download' : 'View Resource'}
                    </Button>
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