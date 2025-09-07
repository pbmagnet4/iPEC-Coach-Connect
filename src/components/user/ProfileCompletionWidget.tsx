/**
 * Profile Completion Widget for iPEC Coach Connect
 * 
 * Interactive widget that shows users their profile completion status
 * and guides them to complete missing sections. Features intelligent
 * recommendations and priority-based completion suggestions.
 * 
 * Features:
 * - Real-time profile completion percentage
 * - Actionable completion recommendations
 * - Priority-based task ordering
 * - Role-specific completion requirements
 * - Progress visualization with animations
 * - Quick-action completion buttons
 */

import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Award,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Edit,
  Globe,
  MapPin,
  Phone,
  Plus,
  Star,
  Target,
  Upload,
  User,
  Zap
} from 'lucide-react';
import { 
  useAuth, 
  useClientProfile, 
  useCoachApplication, 
  useOnboarding,
  useUserRoles 
} from '../../stores/unified-user-store';
import type { ExtendedUserRole } from '../../services/enhanced-auth.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface CompletionTask {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  points: number;
  category: 'profile' | 'onboarding' | 'verification' | 'preferences' | 'role_specific';
  action?: () => void;
  actionLabel?: string;
  estimatedTime?: string;
  roleSpecific?: ExtendedUserRole[];
}

interface CompletionCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  tasks: CompletionTask[];
  completed: number;
  total: number;
  percentage: number;
}

interface ProfileCompletionWidgetProps {
  expanded?: boolean;
  showCategories?: boolean;
  className?: string;
  onTaskComplete?: (taskId: string) => void;
}

// =====================================================================
// COMPLETION LOGIC HOOKS
// =====================================================================

const useProfileCompletion = () => {
  const { user } = useAuth();
  const { onboardingStage, profileCompletion } = useOnboarding();
  const { clientProfile } = useClientProfile();
  const { coachApplication } = useCoachApplication();
  const { roles, primaryRole } = useUserRoles();

  const completionTasks = useMemo((): CompletionTask[] => {
    if (!user) return [];

    const tasks: CompletionTask[] = [
      // Profile Tasks
      {
        id: 'profile_avatar',
        title: 'Add Profile Photo',
        description: 'Upload a professional profile photo',
        icon: Camera,
        completed: !!user.avatar_url,
        priority: 'high',
        points: 15,
        category: 'profile',
        actionLabel: 'Upload Photo',
        estimatedTime: '2 min'
      },
      {
        id: 'profile_bio',
        title: 'Write Your Bio',
        description: 'Tell others about yourself and your interests',
        icon: User,
        completed: !!user.bio && user.bio.length > 20,
        priority: 'high',
        points: 20,
        category: 'profile',
        actionLabel: 'Write Bio',
        estimatedTime: '5 min'
      },
      {
        id: 'profile_location',
        title: 'Add Location',
        description: 'Help others find coaches in your area',
        icon: MapPin,
        completed: !!user.location,
        priority: 'medium',
        points: 10,
        category: 'profile',
        actionLabel: 'Add Location',
        estimatedTime: '1 min'
      },
      {
        id: 'profile_phone',
        title: 'Add Phone Number',
        description: 'Enable phone notifications and contact',
        icon: Phone,
        completed: !!user.phone,
        priority: 'medium',
        points: 10,
        category: 'profile',
        actionLabel: 'Add Phone',
        estimatedTime: '2 min'
      },
      {
        id: 'profile_display_name',
        title: 'Set Display Name',
        description: 'Choose how your name appears to others',
        icon: User,
        completed: !!user.display_name && user.display_name !== user.full_name,
        priority: 'low',
        points: 5,
        category: 'profile',
        actionLabel: 'Set Name',
        estimatedTime: '1 min'
      },

      // Onboarding Tasks
      {
        id: 'onboarding_complete',
        title: 'Complete Onboarding',
        description: 'Finish the setup process to unlock all features',
        icon: Target,
        completed: onboardingStage === 'completed',
        priority: 'high',
        points: 25,
        category: 'onboarding',
        actionLabel: 'Continue Setup',
        estimatedTime: '10 min'
      },

      // Verification Tasks
      {
        id: 'email_verified',
        title: 'Verify Email',
        description: 'Confirm your email address for security',
        icon: CheckCircle,
        completed: !!user.email, // In real implementation, check email_confirmed_at
        priority: 'high',
        points: 15,
        category: 'verification',
        actionLabel: 'Verify Email',
        estimatedTime: '1 min'
      },

      // Client-specific tasks
      ...(roles.some(r => r.role === 'client' && r.is_active) ? [
        {
          id: 'client_goals',
          title: 'Set Coaching Goals',
          description: 'Define what you want to achieve through coaching',
          icon: Target,
          completed: !!(clientProfile?.coaching_goals && clientProfile.coaching_goals.length > 0),
          priority: 'high',
          points: 20,
          category: 'role_specific' as const,
          roleSpecific: ['client'] as ExtendedUserRole[],
          actionLabel: 'Set Goals',
          estimatedTime: '5 min'
        },
        {
          id: 'client_preferences',
          title: 'Coaching Preferences',
          description: 'Tell us about your coaching style preferences',
          icon: Star,
          completed: !!(clientProfile?.preferred_communication_style),
          priority: 'medium',
          points: 15,
          category: 'role_specific' as const,
          roleSpecific: ['client'] as ExtendedUserRole[],
          actionLabel: 'Set Preferences',
          estimatedTime: '3 min'
        }
      ] : []),

      // Coach-specific tasks
      ...(roles.some(r => ['coach', 'pending_coach'].includes(r.role) && r.is_active) ? [
        {
          id: 'coach_application',
          title: 'Coach Application',
          description: 'Complete your coaching application',
          icon: Award,
          completed: !!(coachApplication && coachApplication.status === 'approved'),
          priority: 'high',
          points: 30,
          category: 'role_specific' as const,
          roleSpecific: ['coach', 'pending_coach'] as ExtendedUserRole[],
          actionLabel: 'Complete Application',
          estimatedTime: '15 min'
        },
        {
          id: 'coach_certifications',
          title: 'Add Certifications',
          description: 'Upload your coaching certifications',
          icon: Award,
          completed: !!(coachApplication?.certifications && coachApplication.certifications.length > 0),
          priority: 'high',
          points: 25,
          category: 'role_specific' as const,
          roleSpecific: ['coach', 'pending_coach'] as ExtendedUserRole[],
          actionLabel: 'Add Certificates',
          estimatedTime: '10 min'
        }
      ] : [])
    ];

    return tasks;
  }, [user, onboardingStage, clientProfile, coachApplication, roles]);

  const categories = useMemo((): CompletionCategory[] => {
    const categoryMap: Record<string, CompletionCategory> = {
      profile: {
        id: 'profile',
        title: 'Profile Information',
        icon: User,
        tasks: [],
        completed: 0,
        total: 0,
        percentage: 0
      },
      onboarding: {
        id: 'onboarding',
        title: 'Account Setup',
        icon: Target,
        tasks: [],
        completed: 0,
        total: 0,
        percentage: 0
      },
      verification: {
        id: 'verification',
        title: 'Account Verification',
        icon: CheckCircle,
        tasks: [],
        completed: 0,
        total: 0,
        percentage: 0
      },
      role_specific: {
        id: 'role_specific',
        title: 'Role Specific',
        icon: Award,
        tasks: [],
        completed: 0,
        total: 0,
        percentage: 0
      }
    };

    completionTasks.forEach(task => {
      const category = categoryMap[task.category];
      if (category) {
        category.tasks.push(task);
        category.total += 1;
        if (task.completed) {
          category.completed += 1;
        }
        category.percentage = category.total > 0 ? (category.completed / category.total) * 100 : 0;
      }
    });

    return Object.values(categoryMap).filter(category => category.total > 0);
  }, [completionTasks]);

  const overallStats = useMemo(() => {
    const completedTasks = completionTasks.filter(task => task.completed);
    const totalPoints = completionTasks.reduce((sum, task) => sum + task.points, 0);
    const earnedPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      completedTasks: completedTasks.length,
      totalTasks: completionTasks.length,
      earnedPoints,
      totalPoints,
      percentage: Math.round(percentage)
    };
  }, [completionTasks]);

  const nextTask = useMemo(() => {
    const incompleteTasks = completionTasks.filter(task => !task.completed);
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return incompleteTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.points - a.points;
    })[0];
  }, [completionTasks]);

  return {
    completionTasks,
    categories,
    overallStats,
    nextTask,
    profileCompletion
  };
};

// =====================================================================
// SUB COMPONENTS
// =====================================================================

const CompletionOverview: React.FC<{ 
  stats: ReturnType<typeof useProfileCompletion>['overallStats'];
  nextTask?: CompletionTask;
  onTaskAction?: (task: CompletionTask) => void;
}> = ({ stats, nextTask, onTaskAction }) => {
  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-gray-900">
          {stats.percentage}%
        </div>
        <p className="text-gray-600">Profile Complete</p>
        <ProgressBar 
          progress={stats.percentage} 
          className="h-3"
          color={stats.percentage === 100 ? 'green' : 'blue'}
          showLabel={false}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-blue-600">
            {stats.completedTasks}
          </div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-600">
            {stats.totalTasks - stats.completedTasks}
          </div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">
            {stats.earnedPoints}
          </div>
          <div className="text-xs text-gray-600">Points</div>
        </div>
      </div>

      {/* Next Task */}
      {nextTask && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <nextTask.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-blue-900">{nextTask.title}</h4>
              <p className="text-sm text-blue-700 mt-1">{nextTask.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="primary" size="sm">
                  +{nextTask.points} points
                </Badge>
                {nextTask.estimatedTime && (
                  <Badge variant="secondary" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {nextTask.estimatedTime}
                  </Badge>
                )}
              </div>
            </div>
            {nextTask.actionLabel && onTaskAction && (
              <Button 
                size="sm"
                onClick={() => onTaskAction(nextTask)}
                className="shrink-0"
              >
                {nextTask.actionLabel}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryView: React.FC<{
  categories: CompletionCategory[];
  onTaskAction?: (task: CompletionTask) => void;
}> = ({ categories, onTaskAction }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategory === category.id;
        const Icon = category.icon;
        
        return (
          <div key={category.id} className="border border-gray-200 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg"
              onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{category.title}</h4>
                  <p className="text-sm text-gray-600">
                    {category.completed}/{category.total} completed
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {Math.round(category.percentage)}%
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-1 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
                
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="space-y-2 mt-3">
                      {category.tasks.map((task) => (
                        <div 
                          key={task.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            task.completed ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="shrink-0">
                            {task.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className={`font-medium ${
                              task.completed ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h5>
                            <p className={`text-sm ${
                              task.completed ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {task.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={task.priority === 'high' ? 'danger' : 
                                        task.priority === 'medium' ? 'warning' : 'secondary'}
                                size="sm"
                              >
                                {task.priority} priority
                              </Badge>
                              
                              <Badge variant="secondary" size="sm">
                                +{task.points} pts
                              </Badge>
                              
                              {task.estimatedTime && (
                                <Badge variant="secondary" size="sm">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {task.estimatedTime}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {!task.completed && task.actionLabel && onTaskAction && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => onTaskAction(task)}
                            >
                              {task.actionLabel}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
  expanded = false,
  showCategories = true,
  className,
  onTaskComplete
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [view, setView] = useState<'overview' | 'categories'>('overview');
  
  const { 
    completionTasks, 
    categories, 
    overallStats, 
    nextTask,
    profileCompletion 
  } = useProfileCompletion();

  const handleTaskAction = useCallback((task: CompletionTask) => {
    // Handle task action (navigate to appropriate page, open modal, etc.)
  void console.log('Task action:', task.id);
    if (onTaskComplete) {
      onTaskComplete(task.id);
    }
  }, [onTaskComplete]);

  if (!user) {
    return null;
  }

  const isComplete = overallStats.percentage === 100;

  return (
    <Card className={className}>
      <Card.Header>
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isComplete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Profile Completion</h3>
              <p className="text-sm text-gray-600">
                {isComplete ? 'Your profile is complete!' : `${overallStats.completedTasks}/${overallStats.totalTasks} tasks completed`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isComplete && (
              <Badge variant="success">
                <Trophy className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
            
            <div className="text-right text-sm">
              <div className="font-semibold">{overallStats.percentage}%</div>
              <div className="text-xs text-gray-500">{overallStats.earnedPoints} pts</div>
            </div>
            
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>
      </Card.Header>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <Card.Body className="border-t">
              {showCategories && !isComplete && (
                <div className="flex gap-2 mb-4">
                  <Button
                    size="sm"
                    variant={view === 'overview' ? 'primary' : 'outline'}
                    onClick={() => setView('overview')}
                  >
                    Overview
                  </Button>
                  <Button
                    size="sm"
                    variant={view === 'categories' ? 'primary' : 'outline'}
                    onClick={() => setView('categories')}
                  >
                    Categories
                  </Button>
                </div>
              )}
              
              {view === 'overview' ? (
                <CompletionOverview
                  stats={overallStats}
                  nextTask={nextTask}
                  onTaskAction={handleTaskAction}
                />
              ) : (
                <CategoryView
                  categories={categories}
                  onTaskAction={handleTaskAction}
                />
              )}
              
              {isComplete && (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Congratulations!
                  </h4>
                  <p className="text-green-700">
                    Your profile is 100% complete. You've unlocked all platform features!
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Badge variant="success" size="lg">
                      <Star className="w-4 h-4 mr-1" />
                      {overallStats.totalPoints} Points Earned
                    </Badge>
                  </div>
                </div>
              )}
            </Card.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ProfileCompletionWidget;