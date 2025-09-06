import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Filter,
  Plus,
  Search,
  Users
} from 'lucide-react';

const mockGroups = [
  {
    id: 1,
    name: 'Executive Leadership Network',
    members: 1250,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    description: 'A community for executive leaders to share insights and experiences',
    activity: 'High',
  },
  {
    id: 2,
    name: 'Work-Life Balance Champions',
    members: 850,
    image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
    description: 'Discussions and strategies for maintaining work-life harmony',
    activity: 'Medium',
  },
];

export function GroupList() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Groups</h1>
            <p className="text-gray-600">Find and join groups that match your interests</p>
          </div>
          <Button
            variant="gradient"
            icon={<Plus className="h-5 w-5" />}
          >
            Create Group
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-6">
              {mockGroups.map((group) => (
                <Card key={group.id} hover>
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <Card.Body>
                    <h3 className="text-xl font-semibold mb-2">
                      <a href={`/community/groups/${group.id}`} className="hover:text-brand-600">
                        {group.name}
                      </a>
                    </h3>
                    <p className="text-gray-600 mb-4">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        {group.members.toLocaleString()} members
                      </span>
                      <Badge
                        variant={group.activity === 'High' ? 'success' : 'default'}
                      >
                        {group.activity} Activity
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Filters</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Categories</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>Leadership</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>Career Development</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>Work-Life Balance</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Activity Level</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>High Activity</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>Medium Activity</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-brand-600" />
                        <span>Low Activity</span>
                      </label>
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