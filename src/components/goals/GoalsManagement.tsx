/**
 * Goals Management Component for iPEC Coach Connect
 * 
 * Comprehensive goal tracking and management system for clients and coaches.
 * Provides goal setting, progress tracking, milestone management, and
 * achievement celebration with real-time updates and analytics.
 * 
 * Features:
 * - SMART goal creation and validation
 * - Progress tracking with visual indicators
 * - Milestone and sub-goal management
 * - Achievement badges and celebrations
 * - Coach collaboration and feedback
 * - Goal analytics and insights
 * - Habit tracking integration
 * - Deadline management and reminders
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Edit,
  Eye,
  Filter,
  Flag,
  Heart,
  Home,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { 
  useAuth, 
  useClientProfile, 
  useDashboardMetrics,
  useUserRoles 
} from '../../stores/unified-user-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Tabs } from '../ui/Tabs';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { toast } from '../ui/Toast';
import { EnhancedRoleGuard } from '../auth/EnhancedRoleGuard';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'health' | 'relationships' | 'financial' | 'spiritual' | 'creative' | 'learning';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  progress_percentage: number;
  target_value?: number;
  current_value?: number;
  measurement_unit?: string;
  start_date: string;
  target_date?: string;
  completed_date?: string;
  milestones: Milestone[];
  habits: Habit[];
  notes: GoalNote[];
  tags: string[];
  is_smart_goal: boolean;
  smart_criteria: {
    specific: boolean;
    measurable: boolean;
    achievable: boolean;
    relevant: boolean;
    time_bound: boolean;
  };
  coach_assigned?: string;
  visibility: 'private' | 'coach' | 'public';
  reminder_frequency?: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  target_date?: string;
  completed_date?: string;
  is_completed: boolean;
  progress_percentage: number;
  reward?: string;
  created_at: string;
}

interface Habit {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  best_streak: number;
  is_active: boolean;
  last_completed?: string;
  created_at: string;
}

interface GoalNote {
  id: string;
  goal_id: string;
  content: string;
  note_type: 'progress_update' | 'challenge' | 'insight' | 'celebration' | 'coach_feedback';
  author_id: string;
  author_name: string;
  author_role: 'client' | 'coach';
  is_private: boolean;
  created_at: string;
}

interface GoalFilters {
  status?: Goal['status'][];
  category?: Goal['category'];
  priority?: Goal['priority'];
  search?: string;
  coach_assigned?: boolean;
  date_range?: {
    start: Date;
    end: Date;
  };
}

interface CreateGoalRequest {
  title: string;
  description: string;
  category: Goal['category'];
  priority: Goal['priority'];
  targetDate?: string;
  targetValue?: number;
  measurementUnit?: string;
  milestones?: Omit<Milestone, 'id' | 'goal_id' | 'created_at' | 'is_completed' | 'progress_percentage'>[];
  habits?: Omit<Habit, 'id' | 'goal_id' | 'created_at' | 'current_streak' | 'best_streak' | 'is_active'>[];
  tags?: string[];
  visibility: Goal['visibility'];
}

// =====================================================================
// GOALS DATA HOOKS
// =====================================================================

const useGoalsManagement = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async (filters?: GoalFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from Supabase
      // For now, using mock data structure
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Improve Public Speaking Skills',
          description: 'Become more confident and effective when presenting to large audiences, with the goal of delivering a keynote presentation at the annual conference.',
          category: 'professional',
          priority: 'high',
          status: 'active',
          progress_percentage: 65,
          target_value: 10,
          current_value: 6,
          measurement_unit: 'presentations',
          start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            {
              id: '1',
              goal_id: '1',
              title: 'Complete public speaking course',
              target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              completed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              is_completed: true,
              progress_percentage: 100,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              goal_id: '1',
              title: 'Give presentation to team (50+ people)',
              target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              is_completed: false,
              progress_percentage: 30,
              created_at: new Date().toISOString()
            }
          ],
          habits: [
            {
              id: '1',
              goal_id: '1',
              title: 'Practice speaking exercises',
              frequency: 'daily',
              target_count: 1,
              current_streak: 12,
              best_streak: 15,
              is_active: true,
              last_completed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            }
          ],
          notes: [
            {
              id: '1',
              goal_id: '1',
              content: 'Great progress on vocal exercises! I noticed improvement in your projection during our last session.',
              note_type: 'coach_feedback',
              author_id: 'coach1',
              author_name: 'Sarah Johnson',
              author_role: 'coach',
              is_private: false,
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          tags: ['public speaking', 'confidence', 'career growth'],
          is_smart_goal: true,
          smart_criteria: {
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            time_bound: true
          },
          coach_assigned: 'coach1',
          visibility: 'coach',
          reminder_frequency: 'weekly',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id || 'user1'
        },
        {
          id: '2',
          title: 'Establish Work-Life Balance',
          description: 'Create clear boundaries between work and personal time to reduce stress and improve overall well-being.',
          category: 'personal',
          priority: 'medium',
          status: 'active',
          progress_percentage: 40,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          milestones: [
            {
              id: '3',
              goal_id: '2',
              title: 'Set up home office boundaries',
              is_completed: true,
              completed_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              progress_percentage: 100,
              created_at: new Date().toISOString()
            }
          ],
          habits: [
            {
              id: '2',
              goal_id: '2',
              title: 'End work by 6 PM',
              frequency: 'daily',
              target_count: 1,
              current_streak: 5,
              best_streak: 8,
              is_active: true,
              created_at: new Date().toISOString()
            }
          ],
          notes: [],
          tags: ['work-life balance', 'wellness', 'boundaries'],
          is_smart_goal: false,
          smart_criteria: {
            specific: true,
            measurable: false,
            achievable: true,
            relevant: true,
            time_bound: true
          },
          visibility: 'private',
          reminder_frequency: 'daily',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id || 'user1'
        }
      ];

      // Apply filters
      let filteredGoals = mockGoals;
      
      if (filters?.status && filters.status.length > 0) {
        filteredGoals = filteredGoals.filter(goal => 
          filters.status!.includes(goal.status)
        );
      }
      
      if (filters?.category) {
        filteredGoals = filteredGoals.filter(goal => 
          goal.category === filters.category
        );
      }
      
      if (filters?.priority) {
        filteredGoals = filteredGoals.filter(goal => 
          goal.priority === filters.priority
        );
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredGoals = filteredGoals.filter(goal =>
          goal.title.toLowerCase().includes(searchLower) ||
          goal.description.toLowerCase().includes(searchLower) ||
          goal.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      setGoals(filteredGoals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async (request: CreateGoalRequest): Promise<Goal> => {
    try {
      const newGoal: Goal = {
        id: Date.now().toString(),
        ...request,
        status: 'draft',
        progress_percentage: 0,
        current_value: 0,
        milestones: request.milestones?.map(m => ({
          ...m,
          id: Date.now().toString() + Math.random(),
          goal_id: Date.now().toString(),
          is_completed: false,
          progress_percentage: 0,
          created_at: new Date().toISOString()
        })) || [],
        habits: request.habits?.map(h => ({
          ...h,
          id: Date.now().toString() + Math.random(),
          goal_id: Date.now().toString(),
          current_streak: 0,
          best_streak: 0,
          is_active: true,
          created_at: new Date().toISOString()
        })) || [],
        notes: [],
        tags: request.tags || [],
        is_smart_goal: false, // Would be calculated based on criteria
        smart_criteria: {
          specific: Boolean(request.title && request.description),
          measurable: Boolean(request.targetValue && request.measurementUnit),
          achievable: true, // Would need assessment
          relevant: true, // Would need assessment
          time_bound: Boolean(request.targetDate)
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id || 'user1'
      };

      setGoals(prev => [newGoal, ...prev]);
      toast.success('Goal created successfully!');
      return newGoal;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create goal';
      toast.error(error);
      throw new Error(error);
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      setGoals(prev => prev.map(goal =>
        goal.id === goalId
          ? { ...goal, ...updates, updated_at: new Date().toISOString() }
          : goal
      ));
      toast.success('Goal updated successfully!');
    } catch (err) {
      toast.error('Failed to update goal');
      throw err;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('Goal deleted successfully');
    } catch (err) {
      toast.error('Failed to delete goal');
      throw err;
    }
  };

  const addGoalNote = async (goalId: string, content: string, noteType: GoalNote['note_type'], isPrivate = false) => {
    try {
      const newNote: GoalNote = {
        id: Date.now().toString(),
        goal_id: goalId,
        content,
        note_type: noteType,
        author_id: user?.id || 'user1',
        author_name: user?.display_name || user?.full_name || 'User',
        author_role: hasRole('coach') ? 'coach' : 'client',
        is_private: isPrivate,
        created_at: new Date().toISOString()
      };

      setGoals(prev => prev.map(goal =>
        goal.id === goalId
          ? { ...goal, notes: [...goal.notes, newNote], updated_at: new Date().toISOString() }
          : goal
      ));
      
      toast.success('Note added successfully!');
    } catch (err) {
      toast.error('Failed to add note');
      throw err;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return {
    goals,
    isLoading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalNote
  };
};

// =====================================================================
// GOAL CREATION MODAL
// =====================================================================

const GoalCreationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (request: CreateGoalRequest) => Promise<void>;
}> = ({ isOpen, onClose, onCreateGoal }) => {
  const [formData, setFormData] = useState<Partial<CreateGoalRequest>>({
    category: 'personal',
    priority: 'medium',
    visibility: 'private'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { value: 'personal', label: 'Personal Development', icon: Heart },
    { value: 'professional', label: 'Professional Growth', icon: Briefcase },
    { value: 'health', label: 'Health & Wellness', icon: Activity },
    { value: 'relationships', label: 'Relationships', icon: Users },
    { value: 'financial', label: 'Financial', icon: TrendingUp },
    { value: 'spiritual', label: 'Spiritual', icon: Star },
    { value: 'creative', label: 'Creative', icon: Zap },
    { value: 'learning', label: 'Learning', icon: Brain }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) newErrors.title = 'Goal title is required';
    if (!formData.description?.trim()) newErrors.description = 'Goal description is required';
    if (formData.targetValue && !formData.measurementUnit) {
      newErrors.measurementUnit = 'Measurement unit is required when setting a target value';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onCreateGoal(formData as CreateGoalRequest);
      onClose();
      // Reset form
      setFormData({
        category: 'personal',
        priority: 'medium',
        visibility: 'private'
      });
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categoryOptions.find(c => c.value === formData.category);
  const CategoryIcon = selectedCategory?.icon || Heart;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Goal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Title *
          </label>
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="What do you want to achieve?"
            error={errors.title}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <TextArea
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your goal in detail. What success looks like?"
            rows={3}
            error={errors.description}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                category: value as Goal['category'] 
              }))}
              required
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <Select
              value={formData.priority}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                priority: value as Goal['priority'] 
              }))}
              required
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Value
            </label>
            <Input
              type="number"
              value={formData.targetValue?.toString() || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                targetValue: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="e.g., 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measurement
            </label>
            <Input
              value={formData.measurementUnit || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, measurementUnit: e.target.value }))}
              placeholder="e.g., books read, lbs lost"
              error={errors.measurementUnit}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <Select
            value={formData.visibility}
            onChange={(value) => setFormData(prev => ({ 
              ...prev, 
              visibility: value as Goal['visibility'] 
            }))}
            required
          >
            <option value="private">Private (Only you can see)</option>
            <option value="coach">Coach Visible (You and your coach)</option>
            <option value="public">Public (Visible to community)</option>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Create Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// =====================================================================
// GOAL CARD COMPONENT
// =====================================================================

const GoalCard: React.FC<{
  goal: Goal;
  onUpdate: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  onAddNote: (goalId: string, content: string, noteType: GoalNote['note_type'], isPrivate?: boolean) => Promise<void>;
}> = ({ goal, onUpdate, onDelete, onAddNote }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<GoalNote['note_type']>('progress_update');

  const getCategoryIcon = (category: Goal['category']) => {
    const icons = {
      personal: Heart,
      professional: Briefcase,
      health: Activity,
      relationships: Users,
      financial: TrendingUp,
      spiritual: Star,
      creative: Zap,
      learning: Brain
    };
    return icons[category] || Target;
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      low: 'gray',
      medium: 'blue',
      high: 'red'
    };
    return colors[priority];
  };

  const getStatusColor = (status: Goal['status']) => {
    const colors = {
      draft: 'gray',
      active: 'blue',
      completed: 'green',
      paused: 'yellow',
      cancelled: 'red'
    };
    return colors[status];
  };

  const CategoryIcon = getCategoryIcon(goal.category);
  const completedMilestones = goal.milestones.filter(m => m.is_completed).length;
  const activeMilestones = goal.milestones.length;

  const handleProgressUpdate = async (newProgress: number) => {
    await onUpdate(goal.id, { progress_percentage: newProgress });
  };

  const handleAddNote = async () => {
    if (noteContent.trim()) {
      await onAddNote(goal.id, noteContent, noteType);
      setNoteContent('');
      setShowNoteModal(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const daysUntilTarget = useMemo(() => {
    if (!goal.target_date) return null;
    const target = new Date(goal.target_date);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [goal.target_date]);

  return (
    <>
      <Card className="hover:shadow-md transition-all duration-200">
        <Card.Body className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${getPriorityColor(goal.priority)}-100 text-${getPriorityColor(goal.priority)}-600`}>
                <CategoryIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusColor(goal.status) as any} size="sm">
                    {goal.status}
                  </Badge>
                  <Badge variant={getPriorityColor(goal.priority) as any} size="sm">
                    {goal.priority} priority
                  </Badge>
                  {goal.is_smart_goal && (
                    <Badge variant="success" size="sm">
                      <Star className="w-3 h-3 mr-1" />
                      SMART
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <div className="font-semibold text-2xl text-blue-600">
                  {goal.progress_percentage}%
                </div>
                {goal.target_value && (
                  <div className="text-gray-600">
                    {goal.current_value}/{goal.target_value} {goal.measurement_unit}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ProgressBar
              progress={goal.progress_percentage}
              className="h-2"
              color={goal.status === 'completed' ? 'green' : 'blue'}
            />

            <p className="text-sm text-gray-700 line-clamp-2">
              {goal.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {goal.target_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {formatDate(goal.target_date)}</span>
                  {daysUntilTarget !== null && (
                    <span className={`ml-1 ${daysUntilTarget < 0 ? 'text-red-600' : daysUntilTarget < 7 ? 'text-yellow-600' : ''}`}>
                      ({daysUntilTarget < 0 ? `${Math.abs(daysUntilTarget)} days overdue` : 
                        `${daysUntilTarget} days left`})
                    </span>
                  )}
                </div>
              )}
              
              {activeMilestones > 0 && (
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4" />
                  <span>{completedMilestones}/{activeMilestones} milestones</span>
                </div>
              )}
              
              {goal.habits.length > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{goal.habits.length} habits</span>
                </div>
              )}
            </div>

            {goal.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {goal.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNoteModal(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isExpanded ? 'Hide' : 'Show'} Details
                {isExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            <div className="flex gap-1">
              <Tooltip content="Edit Goal">
                <Button size="sm" variant="ghost">
                  <Edit className="w-4 h-4" />
                </Button>
              </Tooltip>
              
              <Tooltip content="Delete Goal">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onDelete(goal.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="space-y-4">
                  {/* Milestones */}
                  {goal.milestones.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-3">
                            <div className="shrink-0">
                              {milestone.is_completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm ${milestone.is_completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                {milestone.title}
                              </span>
                              {milestone.target_date && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatDate(milestone.target_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Notes */}
                  {goal.notes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Notes</h4>
                      <div className="space-y-2">
                        {goal.notes.slice(-3).map((note) => (
                          <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">
                                {note.author_name} ({note.author_role})
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(note.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card.Body>
      </Card>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Note to Goal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Type
            </label>
            <Select
              value={noteType}
              onChange={(value) => setNoteType(value as GoalNote['note_type'])}
            >
              <option value="progress_update">Progress Update</option>
              <option value="challenge">Challenge</option>
              <option value="insight">Insight</option>
              <option value="celebration">Celebration</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </label>
            <TextArea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Share your thoughts, progress, or challenges..."
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNoteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!noteContent.trim()}
              className="flex-1"
            >
              Add Note
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const GoalsManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const {
    goals,
    isLoading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalNote
  } = useGoalsManagement();

  const [filters, setFilters] = useState<GoalFilters>({
    status: ['active'],
    search: ''
  });
  
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'all'>('active');

  // Filter goals based on current tab
  const filteredGoals = useMemo(() => {
    let filtered = goals;

    switch (selectedTab) {
      case 'active':
        filtered = goals.filter(goal => ['draft', 'active', 'paused'].includes(goal.status));
        break;
      case 'completed':
        filtered = goals.filter(goal => goal.status === 'completed');
        break;
      case 'all':
      default:
        filtered = goals;
        break;
    }

    // Apply additional filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(goal => 
        filters.status!.includes(goal.status)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(goal => goal.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(goal => goal.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(goal =>
        goal.title.toLowerCase().includes(searchLower) ||
        goal.description.toLowerCase().includes(searchLower) ||
        goal.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [goals, selectedTab, filters]);

  // Calculate goal statistics
  const goalStats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress_percentage, 0);
    const averageProgress = goals.length > 0 ? Math.round(totalProgress / goals.length) : 0;
    const overdue = goals.filter(g => 
      g.target_date && 
      new Date(g.target_date) < new Date() && 
      g.status !== 'completed'
    ).length;

    return { activeGoals, completedGoals, averageProgress, overdue };
  }, [goals]);

  const handleCreateGoal = async (request: CreateGoalRequest) => {
    await createGoal(request);
  };

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Goals</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchGoals()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goals Management</h2>
          <p className="text-gray-600">Track your progress and achieve your aspirations</p>
        </div>
        
        <Button onClick={() => setIsCreationModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {goalStats.activeGoals}
            </div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {goalStats.completedGoals}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {goalStats.averageProgress}%
            </div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {goalStats.overdue}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card.Body>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <Card.Body className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as typeof selectedTab)}
              className="w-full lg:w-auto"
            >
              <Tabs.List>
                <Tabs.Trigger value="active">Active Goals</Tabs.Trigger>
                <Tabs.Trigger value="completed">Completed</Tabs.Trigger>
                <Tabs.Trigger value="all">All Goals</Tabs.Trigger>
              </Tabs.List>
            </Tabs>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Input
                placeholder="Search goals..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
              
              <Select
                value={filters.category || ''}
                onChange={(value) => setFilters(prev => ({
                  ...prev,
                  category: value as Goal['category'] || undefined
                }))}
                placeholder="All categories"
              >
                <option value="">All Categories</option>
                <option value="personal">Personal</option>
                <option value="professional">Professional</option>
                <option value="health">Health</option>
                <option value="relationships">Relationships</option>
                <option value="financial">Financial</option>
                <option value="spiritual">Spiritual</option>
                <option value="creative">Creative</option>
                <option value="learning">Learning</option>
              </Select>
              
              <Select
                value={filters.priority || ''}
                onChange={(value) => setFilters(prev => ({
                  ...prev,
                  priority: value as Goal['priority'] || undefined
                }))}
                placeholder="All priorities"
              >
                <option value="">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Goals List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading goals...</span>
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="grid gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
              onAddNote={addGoalNote}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="text-center p-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {selectedTab === 'active' ? 'No active goals' :
               selectedTab === 'completed' ? 'No completed goals' :
               'No goals found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedTab === 'active' 
                ? "Start your journey by creating your first goal!"
                : selectedTab === 'completed'
                ? "Complete some goals to see your achievements here."
                : filters.search 
                  ? "Try adjusting your search or filters."
                  : "Create your first goal to start tracking your progress."
              }
            </p>
            
            <Button onClick={() => setIsCreationModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Goal Creation Modal */}
      <GoalCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onCreateGoal={handleCreateGoal}
      />
    </div>
  );
};

export default GoalsManagement;