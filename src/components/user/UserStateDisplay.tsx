/**
 * User State Display Component for iPEC Coach Connect
 * 
 * Comprehensive component for displaying current user state, permissions,
 * and profile information. Provides real-time status updates and
 * interactive elements for user state management.
 * 
 * Features:
 * - Real-time user state visualization
 * - Permission and role display
 * - Profile completion tracking
 * - Onboarding progress indicator
 * - Interactive state management
 * - Security and privacy controls
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Settings,
  Crown,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Edit,
  RefreshCw,
  Star,
  Trophy,
  Target,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  Palette,
  Bell,
  Lock,
  Unlock,
  UserCheck,
  Users,
  Award
} from 'lucide-react';
import { 
  useAuth, 
  useUserRoles, 
  useOnboarding, 
  useClientProfile,
  useCoachApplication,
  useUserPreferences,
  useDashboardMetrics 
} from '../../stores/unified-user-store';
import { ExtendedUserRole, OnboardingStage } from '../../services/enhanced-auth.service';
import { ROLE_DEFINITIONS } from '../../lib/enhanced-roles';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { Toggle } from '../ui/Toggle';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface UserStateDisplayProps {
  userId?: string;
  showPrivateInfo?: boolean;
  isEditable?: boolean;
  compact?: boolean;
  className?: string;
}

interface StateSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  visible: boolean;
  content: React.ReactNode;
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

const getOnboardingStageInfo = (stage: OnboardingStage) => {
  const stages = {
    not_started: { label: 'Not Started', color: 'gray', progress: 0 },
    profile_setup: { label: 'Profile Setup', color: 'blue', progress: 20 },
    role_selection: { label: 'Role Selection', color: 'blue', progress: 40 },
    goal_setting: { label: 'Goal Setting', color: 'blue', progress: 60 },
    verification: { label: 'Verification', color: 'blue', progress: 80 },
    coach_application: { label: 'Coach Application', color: 'blue', progress: 90 },
    completed: { label: 'Completed', color: 'green', progress: 100 }
  };
  return stages[stage] || stages.not_started;
};

const getRoleDisplayInfo = (role: ExtendedUserRole) => {
  const roleDef = ROLE_DEFINITIONS.find(r => r.role === role);
  return {
    displayName: roleDef?.displayName || role,
    description: roleDef?.description || '',
    hierarchy: roleDef?.hierarchy || 0,
    color: role === 'admin' ? 'red' : 
           role === 'moderator' ? 'orange' :
           role === 'coach' ? 'blue' :
           role === 'client' ? 'green' : 'gray'
  };
};

// =====================================================================
// SUB COMPONENTS
// =====================================================================

const ProfileInfoCard: React.FC<{ showPrivate: boolean; isEditable: boolean }> = ({ 
  showPrivate, 
  isEditable 
}) => {
  const { user } = useAuth();
  const { profileCompletion } = useOnboarding();

  if (!user) return null;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Profile Information</h3>
          </div>
          {isEditable && (
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4">
          <Avatar
            src={user.avatar_url}
            alt={user.display_name || user.full_name}
            size="lg"
            fallback={user.full_name?.charAt(0) || user.email?.charAt(0)}
          />
          
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                {user.display_name || user.full_name}
              </h4>
              {showPrivate && (
                <p className="text-sm text-gray-600">{user.email}</p>
              )}
            </div>
            
            {user.bio && (
              <p className="text-sm text-gray-700">{user.bio}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile Completion</span>
            <span>{profileCompletion}%</span>
          </div>
          <ProgressBar 
            progress={profileCompletion} 
            className="h-2"
            color={profileCompletion === 100 ? 'green' : 'blue'}
          />
        </div>
        
        {/* Contact Information (Private) */}
        {showPrivate && (
          <div className="border-t pt-4 space-y-2">
            <h5 className="font-medium text-gray-900">Contact Information</h5>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span>{user.timezone}</span>
                <span className="text-gray-500">• {user.preferred_language.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const RolesAndPermissionsCard: React.FC<{ showPrivate: boolean }> = ({ showPrivate }) => {
  const { roles, primaryRole, permissions, checkPermission } = useUserRoles();
  const [showAllPermissions, setShowAllPermissions] = useState(false);

  const activeRoles = roles.filter(role => role.is_active);
  const displayedPermissions = showAllPermissions ? permissions : permissions.slice(0, 10);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Roles & Permissions</h3>
          </div>
          {primaryRole && (
            <Badge variant="primary" size="lg">
              <Crown className="w-4 h-4 mr-1" />
              Primary: {getRoleDisplayInfo(primaryRole).displayName}
            </Badge>
          )}
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        {/* Active Roles */}
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Active Roles</h5>
          <div className="flex flex-wrap gap-2">
            {activeRoles.map((roleAssignment) => {
              const roleInfo = getRoleDisplayInfo(roleAssignment.role);
              return (
                <Tooltip
                  key={roleAssignment.id}
                  content={`${roleInfo.description} (Level ${roleInfo.hierarchy})`}
                >
                  <Badge
                    variant={roleInfo.color as any}
                    className="flex items-center gap-1"
                  >
                    {roleAssignment.role === primaryRole && (
                      <Crown className="w-3 h-3" />
                    )}
                    {roleInfo.displayName}
                  </Badge>
                </Tooltip>
              );
            })}
            {activeRoles.length === 0 && (
              <span className="text-sm text-gray-500">No active roles</span>
            )}
          </div>
        </div>
        
        {/* Permissions (if showing private info) */}
        {showPrivate && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">Permissions</h5>
              <span className="text-sm text-gray-600">
                {permissions.length} total
              </span>
            </div>
            
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {displayedPermissions.map((permission, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <code className="text-xs">{permission}</code>
                </div>
              ))}
            </div>
            
            {permissions.length > 10 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAllPermissions(!showAllPermissions)}
                className="mt-2"
              >
                {showAllPermissions ? 'Show Less' : `Show All (${permissions.length})`}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const OnboardingStatusCard: React.FC = () => {
  const { onboardingStage, isOnboardingComplete, profileCompletion } = useOnboarding();
  const stageInfo = getOnboardingStageInfo(onboardingStage);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Onboarding Status</h3>
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Current Stage</p>
            <p className="text-sm text-gray-600">{stageInfo.label}</p>
          </div>
          
          <div className="text-right">
            {isOnboardingComplete ? (
              <Badge variant="success" size="lg">
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="w-4 h-4 mr-1" />
                In Progress
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{stageInfo.progress}%</span>
          </div>
          <ProgressBar 
            progress={stageInfo.progress} 
            className="h-2"
            color={isOnboardingComplete ? 'green' : 'blue'}
          />
        </div>
        
        {!isOnboardingComplete && (
          <Button size="sm" className="w-full">
            Continue Onboarding
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

const MetricsCard: React.FC = () => {
  const { metrics } = useDashboardMetrics();
  const { clientProfile } = useClientProfile();

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Activity Metrics</h3>
        </div>
      </Card.Header>
      
      <Card.Body>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.totalSessions}
            </div>
            <div className="text-sm text-gray-600">Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.completedGoals}
            </div>
            <div className="text-sm text-gray-600">Goals</div>
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
      </Card.Body>
    </Card>
  );
};

const PreferencesCard: React.FC = () => {
  const { preferences, setTheme, toggleNotification } = useUserPreferences();

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Preferences</h3>
        </div>
      </Card.Header>
      
      <Card.Body className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Theme</span>
            </div>
            <Badge variant="secondary">{preferences.theme}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Language</span>
            </div>
            <Badge variant="secondary">{preferences.language.toUpperCase()}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Email Notifications</span>
            </div>
            <Toggle
              checked={preferences.notifications.email}
              onChange={() => toggleNotification('email')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Push Notifications</span>
            </div>
            <Toggle
              checked={preferences.notifications.push}
              onChange={() => toggleNotification('push')}
            />
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const UserStateDisplay: React.FC<UserStateDisplayProps> = ({
  userId,
  showPrivateInfo = true,
  isEditable = false,
  compact = false,
  className
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { roles } = useUserRoles();
  const [visibleSections, setVisibleSections] = useState({
    profile: true,
    roles: true,
    onboarding: true,
    metrics: true,
    preferences: showPrivateInfo
  });

  // Create sections configuration
  const sections: StateSection[] = useMemo(() => [
    {
      id: 'profile',
      title: 'Profile Information',
      icon: User,
      visible: visibleSections.profile,
      content: <ProfileInfoCard showPrivate={showPrivateInfo} isEditable={isEditable} />
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      icon: Shield,
      visible: visibleSections.roles,
      content: <RolesAndPermissionsCard showPrivate={showPrivateInfo} />
    },
    {
      id: 'onboarding',
      title: 'Onboarding Status',
      icon: UserCheck,
      visible: visibleSections.onboarding,
      content: <OnboardingStatusCard />
    },
    {
      id: 'metrics',
      title: 'Activity Metrics',
      icon: Trophy,
      visible: visibleSections.metrics,
      content: <MetricsCard />
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: Settings,
      visible: visibleSections.preferences && showPrivateInfo,
      content: <PreferencesCard />
    }
  ], [visibleSections, showPrivateInfo, isEditable]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading user state...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Card className={className}>
        <Card.Body className="text-center p-8">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please sign in to view user state information.</p>
        </Card.Body>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <Card.Body className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatar_url}
              alt={user.display_name || user.full_name}
              fallback={user.full_name?.charAt(0) || user.email?.charAt(0)}
            />
            
            <div className="flex-1">
              <h4 className="font-medium">{user.display_name || user.full_name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {roles.filter(r => r.is_active).map((role, index) => (
                  <Badge key={role.id} variant="secondary" size="sm">
                    {getRoleDisplayInfo(role.role).displayName}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {showPrivateInfo && (
                <Tooltip content="Private view enabled">
                  <Eye className="w-4 h-4 text-blue-500" />
                </Tooltip>
              )}
              {isEditable && (
                <Tooltip content="Edit mode enabled">
                  <Edit className="w-4 h-4 text-green-500" />
                </Tooltip>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with visibility controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User State</h2>
          <p className="text-gray-600">
            {showPrivateInfo ? 'Complete user information' : 'Public user information'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {showPrivateInfo ? (
              <>
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Private View</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-gray-500" />
                <span>Public View</span>
              </>
            )}
          </div>
          
          {isEditable && (
            <Badge variant="success" size="sm">
              <Edit className="w-3 h-3 mr-1" />
              Edit Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Section toggles */}
      <Card>
        <Card.Body className="p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                size="sm"
                variant={visibleSections[section.id as keyof typeof visibleSections] ? "primary" : "outline"}
                onClick={() => setVisibleSections(prev => ({
                  ...prev,
                  [section.id]: !prev[section.id as keyof typeof prev]
                }))}
                className="flex items-center gap-1"
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {sections.filter(section => section.visible).map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {section.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserStateDisplay;