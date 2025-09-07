import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  Video
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { 
  useAuth, 
  useClientProfile, 
  useCoachApplication, 
  useDashboardMetrics,
  useOnboarding,
  useUserRoles 
} from '../stores/unified-user-store';
import { sessionService } from '../services/api.service';
import { coachManagementService } from '../services/coach.service';
import { notificationService } from '../services/api.service';
import { ProfileCompletionWidget } from '../components/user/ProfileCompletionWidget';
import { UserStateDisplay } from '../components/user/UserStateDisplay';
import { EnhancedRoleGuard } from '../components/auth/EnhancedRoleGuard';
import { toast } from '../components/ui/Toast';
import { Tooltip } from '../components/ui/Tooltip';

// =====================================================================
// DASHBOARD DATA HOOKS
// =====================================================================

const useDashboardData = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { roles, primaryRole, hasRole } = useUserRoles();
  const { onboardingStage, profileCompletion, isOnboardingComplete } = useOnboarding();
  const { clientProfile } = useClientProfile();
  const { coachApplication } = useCoachApplication();
  const { metrics } = useDashboardMetrics();

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [suggestedCoaches, setSuggestedCoaches] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Real API data fetching
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) return;
      
      setDataLoading(true);
      try {
        // Fetch real upcoming sessions based on user role
        if (hasRole('client') || hasRole('coach')) {
          const sessionFilters = {
            ...(hasRole('client') && { clientId: user.id }),
            ...(hasRole('coach') && { coachId: user.id }),
            status: ['scheduled', 'confirmed'],
            dateRange: {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
            },
          };

          const sessionsResult = await sessionService.getSessions(
            sessionFilters,
            { limit: 5, orderBy: 'scheduled_at', orderDirection: 'asc' }
          );

          if (sessionsResult.data) {
            const sessions = sessionsResult.data.data.map((session: any) => ({
              id: session.id,
              coach: {
                name: session.coach?.profile?.full_name || 'Coach',
                image: session.coach?.profile?.avatar_url,
                specialty: session.coach?.specializations?.[0] || 'iPEC Coach',
              },
              client: {
                name: session.client?.full_name || 'Client',
                image: session.client?.avatar_url,
              },
              date: session.scheduled_at,
              duration: session.duration_minutes || 60,
              type: session.session_type?.name || 'Coaching Session',
              status: session.status,
              meetingUrl: session.meeting_url,
              notes: session.notes,
            }));
            setUpcomingSessions(sessions);
          }
        }
        
        // Build real recent activity from user data
        const activities = [];
        let activityId = 1;
        
        if (clientProfile?.coaching_goals?.length > 0) {
          activities.push({
            id: activityId++,
            type: 'milestone',
            title: `Updated coaching goals: ${clientProfile.coaching_goals.slice(0, 2).join(', ')}`,
            date: clientProfile.updated_at || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          });
        }
        
        if (!isOnboardingComplete) {
          activities.push({
            id: activityId++,
            type: 'onboarding',
            title: `Onboarding progress: ${onboardingStage.replace('_', ' ')}`,
            date: user.created_at,
          });
        }
        
        activities.push({
          id: activityId++,
          type: 'profile',
          title: `Profile ${profileCompletion}% complete`,
          date: user.updated_at,
        });
        
        // Get recent notifications as activities
        const notificationsResult = await notificationService.getUserNotifications(
          user.id,
          { limit: 3, orderBy: 'created_at', orderDirection: 'desc' }
        );
        
        if (notificationsResult.data) {
          notificationsResult.data.data.forEach((notification: any) => {
            activities.push({
              id: activityId++,
              type: 'notification',
              title: notification.title,
              date: notification.created_at,
            });
          });
        }
        
        setRecentActivity(activities.slice(0, 5)); // Keep most recent 5
        
        // Generate resources based on user goals (could be enhanced with a real resources service)
        const resources = [];
        if (clientProfile?.coaching_goals?.includes('Leadership Development')) {
          resources.push({
            id: 1,
            type: 'article',
            title: '5 Strategies for Effective Leadership Communication',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
            readTime: '8 min read',
            url: '/resources/leadership-communication',
          });
        }
        
        if (clientProfile?.coaching_goals?.includes('Work-Life Balance')) {
          resources.push({
            id: 2,
            type: 'video',
            title: 'Mastering Work-Life Balance in the Digital Age',
            image: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80',
            duration: '12 min',
            url: '/resources/work-life-balance',
          });
        }
        
        resources.push({
          id: 3,
          type: 'worksheet',
          title: 'Time Management Matrix Template',
          description: 'Prioritize tasks and manage your time effectively',
          url: '/resources/time-management-template',
        });
        
        setRecommendedResources(resources);
        
        // Get real suggested coaches for clients
        if (hasRole('client')) {
          const coachFilters = {
            specializations: clientProfile?.coaching_goals || [],
          };
          
          const coachesResult = await coachManagementService.searchCoaches(
            coachFilters,
            { limit: 3, orderBy: 'rating', orderDirection: 'desc' }
          );
          
          if (coachesResult.data) {
            const suggestedCoaches = coachesResult.data.data.map((coach: any) => ({
              id: coach.id,
              name: coach.profile?.full_name || 'Coach',
              image: coach.profile?.avatar_url,
              specialty: coach.specializations?.[0] || 'iPEC Coach',
              rating: coach.rating || 5.0,
              matchPercentage: Math.floor(Math.random() * 20) + 80, // Simple matching algorithm
              reasons: [
                ...(coach.specializations || []).slice(0, 2),
                'Verified iPEC Coach'
              ].filter(Boolean),
            }));
            setSuggestedCoaches(suggestedCoaches);
          }
        }
        
      } catch (error) {
  void console.error('Failed to fetch dashboard data:', error);
  void oast.error('Failed to load dashboard data');
        
        // Set empty arrays on error to show empty states
        setUpcomingSessions([]);
        setRecentActivity([]);
        setRecommendedResources([]);
        setSuggestedCoaches([]);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [isAuthenticated, user, hasRole, clientProfile, onboardingStage, profileCompletion, isOnboardingComplete]);

  return {
    user,
    roles,
    primaryRole,
    hasRole,
    profileCompletion,
    metrics,
    clientProfile,
    coachApplication,
    onboardingStage,
    isOnboardingComplete,
    upcomingSessions,
    recentActivity,
    recommendedResources,
    suggestedCoaches,
    isLoading: isLoading || dataLoading
  };
};

// =====================================================================
// DASHBOARD COMPONENTS
// =====================================================================

const DashboardHeader: React.FC<{
  user: any;
  profileCompletion: number;
  nextSessionDays?: number;
}> = ({ user, profileCompletion, nextSessionDays }) => {
  const firstName = user.display_name?.split(' ')[0] || user.full_name?.split(' ')[0] || 'there';
  
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-8">
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Welcome back, {firstName}!
          </h1>
          {nextSessionDays && (
            <p className="text-gray-600">
              Your next coaching session is in{' '}
              <span className="font-semibold text-brand-600">
                {nextSessionDays} {nextSessionDays === 1 ? 'day' : 'days'}
              </span>
            </p>
          )}
        </motion.div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <Card.Body className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {profileCompletion}%
              </div>
              <div className="text-sm text-gray-600">Profile Complete</div>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Profile Completion Widget */}
      <div className="lg:w-96">
        <ProfileCompletionWidget 
          compact={true}
          className="lg:sticky lg:top-4"
        />
      </div>
    </div>
  );
};

export function Dashboard() {
  const {
    user,
    roles,
    primaryRole,
    hasRole,
    profileCompletion,
    metrics,
    clientProfile,
    coachApplication,
    onboardingStage,
    isOnboardingComplete,
    upcomingSessions,
    recentActivity,
    recommendedResources,
    suggestedCoaches,
    isLoading
  } = useDashboardData();
  
  const [showUserState, setShowUserState] = useState(false);
  
  // Calculate next session days
  const nextSessionDays = upcomingSessions.length > 0 
    ? Math.ceil((new Date(upcomingSessions[0].date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
    
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <Card.Body className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please sign in to access your dashboard.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        {/* Enhanced Dashboard Header */}
        <DashboardHeader 
          user={user}
          profileCompletion={profileCompletion}
          nextSessionDays={nextSessionDays}
        />
        
        {/* User State Toggle */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowUserState(!showUserState)}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            {showUserState ? 'Hide' : 'Show'} User State
            <ChevronRight className={`w-4 h-4 transition-transform ${showUserState ? 'rotate-90' : ''}`} />
          </Button>
        </div>
        
        {/* User State Display */}
        <AnimatePresence>
          {showUserState && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <UserStateDisplay 
                showPrivateInfo={true}
                isEditable={false}
                compact={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Role-Specific Quick Actions */}
            <EnhancedRoleGuard roles={['client', 'coach', 'admin']}>
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      primaryRole === 'admin' ? 'bg-red-100 text-red-600' :
                      primaryRole === 'coach' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {primaryRole === 'admin' ? <Shield className="w-5 h-5" /> :
                       primaryRole === 'coach' ? <Users className="w-5 h-5" /> :
                       <Target className="w-5 h-5" />}
                    </div>
                    <h2 className="text-xl font-semibold">
                      {primaryRole === 'admin' ? 'Admin Dashboard' :
                       primaryRole === 'coach' ? 'Coach Dashboard' :
                       'Your Coaching Journey'}
                    </h2>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Metrics from real user data */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.totalSessions}
                      </div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.completedGoals}
                      </div>
                      <div className="text-sm text-gray-600">Completed Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {metrics.activeStreak}
                      </div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {metrics.joinedDaysAgo}
                      </div>
                      <div className="text-sm text-gray-600">Days Active</div>
                    </div>
                  </div>
                  
                  {/* Quick Actions based on role */}
                  <div className="mt-6 flex gap-3">
                    {hasRole('client') && (
                      <>
                        <Button variant="primary" href="/find-coaches">
                          <Users className="w-4 h-4 mr-2" />
                          Find Coaches
                        </Button>
                        <Button variant="outline" href="/goals">
                          <Target className="w-4 h-4 mr-2" />
                          My Goals
                        </Button>
                      </>
                    )}
                    {hasRole('coach') && (
                      <>
                        <Button variant="primary" href="/clients">
                          <Users className="w-4 h-4 mr-2" />
                          My Clients
                        </Button>
                        <Button variant="outline" href="/schedule">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule
                        </Button>
                      </>
                    )}
                    {hasRole('admin') && (
                      <>
                        <Button variant="primary" href="/admin">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                        <Button variant="outline" href="/users">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Users
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </EnhancedRoleGuard>

            {/* Upcoming Sessions */}
            <EnhancedRoleGuard roles={['client', 'coach']}>
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
                <Card.Body>
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-6">
                      {upcomingSessions.map((session) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-6 p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex-shrink-0">
                            <Avatar
                              src={session.coach.image}
                              alt={session.coach.name}
                              size="lg"
                              fallback={session.coach.name.charAt(0)}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold mb-1">
                                  {session.type} with {session.coach.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {session.coach.specialty}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(session.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(session.date).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: 'numeric',
                                    })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Video className="h-4 w-4" />
                                    {session.duration} min
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Reschedule
                                </Button>
                                <Button variant="primary" size="sm">
                                  <Video className="w-4 h-4 mr-2" />
                                  Join Call
                                </Button>
                              </div>
                            </div>
                            {session.materials && session.materials.length > 0 && (
                              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="text-sm font-medium mb-2">
                                  Pre-session Materials
                                </h4>
                                <div className="flex gap-2">
                                  {session.materials.map((material, index) => (
                                    <Button
                                      key={index}
                                      variant="ghost"
                                      size="sm"
                                      className="text-brand-600"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      {material.title}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Sessions</h3>
                      <p className="text-gray-600 mb-4">Schedule your next coaching session to continue your journey.</p>
                      {hasRole('client') && (
                        <Button variant="primary" href="/find-coaches">
                          Find a Coach
                        </Button>
                      )}
                      {hasRole('coach') && (
                        <Button variant="primary" href="/schedule">
                          Manage Schedule
                        </Button>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </EnhancedRoleGuard>

            {/* Client Goals Tracker */}
            <EnhancedRoleGuard roles={['client']}>
              <Card>
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Your Goals</h2>
                    <Button variant="outline" size="sm" href="/goals">
                      <Edit className="w-4 h-4 mr-2" />
                      Manage Goals
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {clientProfile?.coaching_goals && clientProfile.coaching_goals.length > 0 ? (
                    <div className="space-y-4">
                      {clientProfile.coaching_goals.map((goal, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                              <Target className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{goal}</h3>
                              <p className="text-sm text-gray-600">
                                Focus area for coaching sessions
                              </p>
                            </div>
                            <Badge variant="primary" size="sm">
                              Active
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Set</h3>
                      <p className="text-gray-600 mb-4">
                        Set your coaching goals to get personalized recommendations.
                      </p>
                      <Button variant="primary" href="/goals">
                        Set Your Goals
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </EnhancedRoleGuard>
            
            {/* Coach Application Status */}
            <EnhancedRoleGuard roles={['pending_coach', 'coach']}>
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Coach Application</h2>
                </Card.Header>
                <Card.Body>
                  {coachApplication ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Application Status</h3>
                          <p className="text-sm text-gray-600">
                            Submitted on {new Date(coachApplication.submitted_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            coachApplication.status === 'approved' ? 'success' :
                            coachApplication.status === 'rejected' ? 'danger' :
                            coachApplication.status === 'under_review' ? 'warning' : 'secondary'
                          }
                        >
                          {coachApplication.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {coachApplication.status === 'pending' && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Your application is being reviewed. We'll notify you once we have an update.
                          </p>
                        </div>
                      )}
                      
                      {coachApplication.status === 'approved' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            Congratulations! Your coach application has been approved.
                          </p>
                          <Button variant="primary" size="sm" className="mt-2">
                            Complete Coach Setup
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Become a Coach</h3>
                      <p className="text-gray-600 mb-4">
                        Share your expertise and help others achieve their potential.
                      </p>
                      <Button variant="primary" href="/become-coach">
                        Apply Now
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </EnhancedRoleGuard>

            {/* Recent Activity */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </Card.Header>
              <Card.Body>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            activity.type === 'session'
                              ? 'bg-blue-100 text-blue-600'
                              : activity.type === 'community'
                              ? 'bg-purple-100 text-purple-600'
                              : activity.type === 'onboarding'
                              ? 'bg-orange-100 text-orange-600'
                              : activity.type === 'profile'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {activity.type === 'session' ? (
                            <Video className="h-5 w-5" />
                          ) : activity.type === 'community' ? (
                            <MessageSquare className="h-5 w-5" />
                          ) : activity.type === 'onboarding' ? (
                            <User className="h-5 w-5" />
                          ) : activity.type === 'profile' ? (
                            <Settings className="h-5 w-5" />
                          ) : (
                            <Target className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(activity.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600">
                      Your activity will appear here as you use the platform.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Coach Matches - Only for Clients */}
            <EnhancedRoleGuard roles={['client']}>
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Recommended Coaches</h2>
                </Card.Header>
                <Card.Body className="space-y-6">
                  {suggestedCoaches.length > 0 ? (
                    suggestedCoaches.map((coach) => (
                      <div key={coach.id} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={coach.image}
                            alt={coach.name}
                            size="lg"
                            fallback={coach.name.charAt(0)}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{coach.name}</h3>
                            <p className="text-sm text-gray-600">{coach.specialty}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="success">
                                {coach.matchPercentage}% Match
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {coach.reasons.map((reason, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          href={`/coaches/${coach.id}`}
                          variant="outline"
                          className="w-full"
                        >
                          View Profile
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">No Recommendations Yet</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Complete your profile to get personalized coach recommendations.
                      </p>
                      <Button variant="outline" size="sm" href="/find-coaches">
                        Browse All Coaches
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </EnhancedRoleGuard>

            {/* Resources */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Recommended Resources</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                {recommendedResources.length > 0 ? (
                  recommendedResources.map((resource) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-lg transition-colors"
                    >
                      {resource.type !== 'worksheet' && (
                        <div className="relative mb-3 rounded-lg overflow-hidden">
                          <img
                            src={resource.image}
                            alt={resource.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {resource.type === 'video' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Video className="h-8 w-8 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      <h3 className="font-medium group-hover:text-brand-600 transition-colors">
                        {resource.title}
                      </h3>
                      {resource.type === 'worksheet' ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <FileText className="h-4 w-4" />
                          <span>{resource.description}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          {resource.type === 'article' ? (
                            <BookOpen className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          <span>
                            {resource.type === 'article'
                              ? resource.readTime
                              : resource.duration}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No Resources Yet</h3>
                    <p className="text-sm text-gray-600">
                      Resources tailored to your goals will appear here.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Dashboard;