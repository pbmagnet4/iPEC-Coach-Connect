import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Mail, 
  Phone, 
  Calendar, 
  Edit,
  Award,
  Target,
  Upload,
  Star,
  MessageSquare,
  Bell,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Video
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth';
import { useRole, isCoach } from '../lib/roles';

export function Profile() {
  const { user } = useAuth();
  const { role } = useRole();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    specialties: [] as string[],
    yearsExperience: '',
    coachingInterests: [] as string[],
    goals: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the profile
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Profile Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-gray-600">
              Manage your account details and coaching experiences
            </p>
          </div>
          <Button
            variant="gradient"
            onClick={() => setIsEditing(!isEditing)}
            icon={<Edit className="h-5 w-5" />}
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Profile Information</h2>
              </Card.Header>
              <Card.Body className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar
                      src={user?.profileImage}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      size="lg"
                    />
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg border border-gray-200">
                        <Upload className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleInputChange}
                        />
                        <Input
                          label="Last Name"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-semibold">
                          {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-gray-600">
                          {isCoach(role) ? 'iPEC Certified Coach' : 'Client'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    icon={<Mail className="h-5 w-5" />}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    icon={<Phone className="h-5 w-5" />}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <Button
                      variant="gradient"
                      onClick={handleSave}
                      icon={<CheckCircle className="h-5 w-5" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Coaching Information (For Coaches) */}
            {isCoach(role) && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Coaching Details</h2>
                </Card.Header>
                <Card.Body className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coaching Specialties
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Leadership Development', 'Career Transition', 'Life Balance'].map((specialty) => (
                        <Badge key={specialty} variant="default">
                          {specialty}
                        </Badge>
                      ))}
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Plus className="h-4 w-4" />}
                        >
                          Add Specialty
                        </Button>
                      )}
                    </div>
                  </div>

                  <Input
                    label="Years of Experience"
                    name="yearsExperience"
                    value={profileData.yearsExperience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    type="number"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coaching Philosophy
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Describe your coaching approach..."
                    />
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Client Information (For Clients) */}
            {!isCoach(role) && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Coaching Preferences</h2>
                </Card.Header>
                <Card.Body className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Areas of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Career Development', 'Leadership', 'Work-Life Balance'].map((interest) => (
                        <Badge key={interest} variant="default">
                          {interest}
                        </Badge>
                      ))}
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Plus className="h-4 w-4" />}
                        >
                          Add Interest
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Goals
                    </label>
                    <textarea
                      name="goals"
                      value={profileData.goals}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="What do you hope to achieve through coaching?"
                    />
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Sessions */}
            <Card>
              <Card.Header>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/sessions"
                    className="text-brand-600"
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="space-y-4">
                {[1, 2].map((session) => (
                  <div
                    key={session}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Tomorrow at 10:00 AM</span>
                      </div>
                      <p className="font-medium">Leadership Development Session</p>
                      <p className="text-sm text-gray-600">with Sarah Johnson</p>
                    </div>
                    <Button
                      variant="gradient"
                      size="sm"
                      icon={<Video className="h-4 w-4" />}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Recent Activity */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {[
                    {
                      icon: Calendar,
                      text: 'Completed coaching session',
                      time: '2 hours ago',
                    },
                    {
                      icon: Star,
                      text: 'Received feedback',
                      time: '1 day ago',
                    },
                    {
                      icon: MessageSquare,
                      text: 'New message from coach',
                      time: '2 days ago',
                    },
                  ].map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <div className="p-2 bg-brand-50 rounded-lg">
                          <Icon className="h-4 w-4 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.text}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            {/* Account Management */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Account Management</h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    href="/settings/security"
                    icon={<Lock className="h-5 w-5" />}
                  >
                    Change Password
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-red-600 border-red-200 hover:bg-red-50"
                    icon={<Trash2 className="h-5 w-5" />}
                  >
                    Delete Account
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}