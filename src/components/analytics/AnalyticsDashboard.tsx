/**
 * Analytics Dashboard Component for iPEC Coach Connect
 * 
 * Comprehensive analytics and reporting system for coaches and administrators.
 * Provides insights into coaching effectiveness, client progress, business
 * metrics, and platform performance with interactive visualizations.
 * 
 * Features:
 * - Real-time performance metrics and KPIs
 * - Interactive charts and visualizations
 * - Client progress tracking and success metrics
 * - Revenue and business analytics
 * - Goal achievement and milestone tracking
 * - Session analytics and feedback insights
 * - Comparative analysis and benchmarking
 * - Exportable reports and data
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  Filter,
  Globe,
  Heart,
  LineChart,
  Mail,
  MapPin,
  MessageSquare,
  Minus,
  Phone,
  PieChart,
  RefreshCw,
  Shield,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  Zap
} from 'lucide-react';
import { 
  useAuth, 
  useDashboardMetrics,
  useUserRoles 
} from '../../stores/unified-user-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { ProgressBar } from '../ui/Progress';
import { Tooltip } from '../ui/Tooltip';
import { EnhancedRoleGuard } from '../auth/EnhancedRoleGuard';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number | string;
  previous_value?: number | string;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'currency' | 'percentage' | 'duration' | 'rating';
  description?: string;
  target?: number;
  category: 'business' | 'client' | 'session' | 'goal' | 'platform';
}

interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  labels?: string[];
  colors?: string[];
  period: 'week' | 'month' | 'quarter' | 'year';
}

interface ClientInsight {
  client_id: string;
  client_name: string;
  avatar_url?: string;
  total_sessions: number;
  active_goals: number;
  completed_goals: number;
  progress_score: number;
  engagement_level: 'high' | 'medium' | 'low';
  last_session: string;
  satisfaction_rating: number;
  retention_risk: 'low' | 'medium' | 'high';
}

interface SessionAnalytics {
  total_sessions: number;
  completed_sessions: number;
  cancelled_sessions: number;
  no_show_sessions: number;
  average_duration: number;
  average_rating: number;
  session_types: Record<string, number>;
  peak_hours: Record<string, number>;
  success_rate: number;
}

interface GoalAnalytics {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  completion_rate: number;
  average_completion_time: number;
  categories: Record<string, number>;
  milestone_completion_rate: number;
  client_success_stories: number;
}

interface RevenueAnalytics {
  total_revenue: number;
  monthly_recurring_revenue: number;
  average_session_price: number;
  client_lifetime_value: number;
  conversion_rate: number;
  churn_rate: number;
  growth_rate: number;
  revenue_by_period: ChartData;
}

// =====================================================================
// ANALYTICS DATA HOOKS
// =====================================================================

const useAnalyticsData = (dateRange: { start: Date; end: Date }) => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  const { metrics } = useDashboardMetrics();
  
  const [analyticsData, setAnalyticsData] = useState({
    metrics: [] as AnalyticsMetric[],
    clientInsights: [] as ClientInsight[],
    sessionAnalytics: {} as SessionAnalytics,
    goalAnalytics: {} as GoalAnalytics,
    revenueAnalytics: {} as RevenueAnalytics,
    chartData: [] as ChartData[]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from Supabase with complex analytics queries
      // For now, using mock data structure
      
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: 'total_clients',
          name: 'Total Clients',
          value: 24,
          previous_value: 20,
          change_percentage: 20,
          trend: 'up',
          format: 'number',
          description: 'Active coaching clients',
          category: 'client'
        },
        {
          id: 'session_completion_rate',
          name: 'Session Completion Rate',
          value: 94,
          previous_value: 91,
          change_percentage: 3.3,
          trend: 'up',
          format: 'percentage',
          description: 'Percentage of sessions completed without cancellation',
          target: 95,
          category: 'session'
        },
        {
          id: 'average_satisfaction',
          name: 'Client Satisfaction',
          value: 4.8,
          previous_value: 4.6,
          change_percentage: 4.3,
          trend: 'up',
          format: 'rating',
          description: 'Average client rating across all sessions',
          target: 4.5,
          category: 'client'
        },
        {
          id: 'monthly_revenue',
          name: 'Monthly Revenue',
          value: 12750,
          previous_value: 11200,
          change_percentage: 13.8,
          trend: 'up',
          format: 'currency',
          description: 'Total revenue for the current month',
          category: 'business'
        },
        {
          id: 'goal_completion_rate',
          name: 'Goal Completion Rate',
          value: 78,
          previous_value: 72,
          change_percentage: 8.3,
          trend: 'up',
          format: 'percentage',
          description: 'Percentage of client goals achieved',
          target: 80,
          category: 'goal'
        },
        {
          id: 'average_session_duration',
          name: 'Avg Session Duration',
          value: 58,
          previous_value: 55,
          change_percentage: 5.5,
          trend: 'up',
          format: 'duration',
          description: 'Average duration of coaching sessions in minutes',
          category: 'session'
        }
      ];

      const mockClientInsights: ClientInsight[] = [
        {
          client_id: 'client1',
          client_name: 'Sarah Martinez',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b743?auto=format&fit=crop&q=80',
          total_sessions: 12,
          active_goals: 2,
          completed_goals: 3,
          progress_score: 85,
          engagement_level: 'high',
          last_session: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          satisfaction_rating: 5.0,
          retention_risk: 'low'
        },
        {
          client_id: 'client2',
          client_name: 'David Thompson',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
          total_sessions: 8,
          active_goals: 3,
          completed_goals: 1,
          progress_score: 72,
          engagement_level: 'medium',
          last_session: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          satisfaction_rating: 4.6,
          retention_risk: 'medium'
        },
        {
          client_id: 'client3',
          client_name: 'Emily Chen',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
          total_sessions: 15,
          active_goals: 1,
          completed_goals: 4,
          progress_score: 92,
          engagement_level: 'high',
          last_session: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          satisfaction_rating: 4.9,
          retention_risk: 'low'
        }
      ];

      const mockSessionAnalytics: SessionAnalytics = {
        total_sessions: 156,
        completed_sessions: 147,
        cancelled_sessions: 6,
        no_show_sessions: 3,
        average_duration: 58,
        average_rating: 4.8,
        session_types: {
          'Initial': 24,
          'Follow-up': 98,
          'Goal Review': 28,
          'Intensive': 6
        },
        peak_hours: {
          '09:00': 12,
          '10:00': 18,
          '11:00': 15,
          '14:00': 22,
          '15:00': 25,
          '16:00': 20,
          '17:00': 16
        },
        success_rate: 94.2
      };

      const mockGoalAnalytics: GoalAnalytics = {
        total_goals: 67,
        active_goals: 42,
        completed_goals: 25,
        completion_rate: 78.1,
        average_completion_time: 89, // days
        categories: {
          'Leadership': 18,
          'Career Development': 15,
          'Work-Life Balance': 12,
          'Communication': 10,
          'Personal Growth': 8,
          'Team Management': 4
        },
        milestone_completion_rate: 83.5,
        client_success_stories: 19
      };

      const mockRevenueAnalytics: RevenueAnalytics = {
        total_revenue: 76500,
        monthly_recurring_revenue: 12750,
        average_session_price: 125,
        client_lifetime_value: 3200,
        conversion_rate: 68.5,
        churn_rate: 8.2,
        growth_rate: 15.3,
        revenue_by_period: {
          id: 'revenue_chart',
          type: 'line',
          title: 'Revenue Trend',
          data: [
            { month: 'Jan', revenue: 8500 },
            { month: 'Feb', revenue: 9200 },
            { month: 'Mar', revenue: 10100 },
            { month: 'Apr', revenue: 11200 },
            { month: 'May', revenue: 12750 }
          ],
          period: 'month'
        }
      };

      const mockChartData: ChartData[] = [
        {
          id: 'session_completion_trend',
          type: 'line',
          title: 'Session Completion Trend',
          data: [
            { date: '2024-01', completed: 92, cancelled: 8 },
            { date: '2024-02', completed: 94, cancelled: 6 },
            { date: '2024-03', completed: 91, cancelled: 9 },
            { date: '2024-04', completed: 96, cancelled: 4 },
            { date: '2024-05', completed: 94, cancelled: 6 }
          ],
          labels: ['Completed', 'Cancelled'],
          colors: ['#10B981', '#EF4444'],
          period: 'month'
        },
        {
          id: 'goal_categories',
          type: 'pie',
          title: 'Goals by Category',
          data: Object.entries(mockGoalAnalytics.categories).map(([category, count]) => ({
            name: category,
            value: count
          })),
          colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
          period: 'month'
        },
        {
          id: 'client_satisfaction',
          type: 'bar',
          title: 'Client Satisfaction Distribution',
          data: [
            { rating: '5 Stars', count: 89 },
            { rating: '4 Stars', count: 45 },
            { rating: '3 Stars', count: 15 },
            { rating: '2 Stars', count: 5 },
            { rating: '1 Star', count: 2 }
          ],
          colors: ['#10B981'],
          period: 'month'
        }
      ];

      setAnalyticsData({
        metrics: mockMetrics,
        clientInsights: mockClientInsights,
        sessionAnalytics: mockSessionAnalytics,
        goalAnalytics: mockGoalAnalytics,
        revenueAnalytics: mockRevenueAnalytics,
        chartData: mockChartData
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  return {
    ...analyticsData,
    isLoading,
    error,
    refreshData: fetchAnalyticsData
  };
};

// =====================================================================
// METRIC CARD COMPONENT
// =====================================================================

const MetricCard: React.FC<{
  metric: AnalyticsMetric;
  className?: string;
}> = ({ metric, className }) => {
  const formatValue = (value: number | string, format: AnalyticsMetric['format']) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'rating':
        return `${value}/5.0`;
      case 'duration':
        return `${value} min`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: AnalyticsMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: AnalyticsMetric['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <Card.Body className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {metric.name}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(metric.value, metric.format)}
              </p>
              {metric.change_percentage && (
                <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm font-medium">
                    {Math.abs(metric.change_percentage)}%
                  </span>
                </div>
              )}
            </div>
            {metric.description && (
              <p className="text-xs text-gray-500 mt-1">
                {metric.description}
              </p>
            )}
          </div>
          
          {metric.target && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-sm font-medium text-gray-700">
                {formatValue(metric.target, metric.format)}
              </p>
            </div>
          )}
        </div>
        
        {metric.target && typeof metric.value === 'number' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress to target</span>
              <span>{Math.round((metric.value / metric.target) * 100)}%</span>
            </div>
            <ProgressBar
              progress={(metric.value / metric.target) * 100}
              className="h-2"
              color={metric.value >= metric.target ? 'green' : 'blue'}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// CHART COMPONENT (Simplified)
// =====================================================================

const SimpleChart: React.FC<{
  data: ChartData;
  className?: string;
}> = ({ data, className }) => {
  // This would integrate with a proper charting library like Chart.js or D3
  // For now, showing a simplified representation
  
  if (data.type === 'pie') {
    return (
      <Card className={className}>
        <Card.Header>
          <h3 className="text-lg font-semibold">{data.title}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {data.data.map((item: any, index: number) => {
              const total = data.data.reduce((sum: number, d: any) => sum + d.value, 0);
              const percentage = Math.round((item.value / total) * 100);
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: data.colors?.[index] || '#3B82F6' }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (data.type === 'bar') {
    return (
      <Card className={className}>
        <Card.Header>
          <h3 className="text-lg font-semibold">{data.title}</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {data.data.map((item: any, index: number) => {
              const maxValue = Math.max(...data.data.map((d: any) => d.count || d.value));
              const percentage = ((item.count || item.value) / maxValue) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.rating || item.name}</span>
                    <span className="font-medium">{item.count || item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Line chart representation
  return (
    <Card className={className}>
      <Card.Header>
        <h3 className="text-lg font-semibold">{data.title}</h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Trend over {data.period}
          </div>
          {/* Simplified line chart visualization */}
          <div className="grid grid-cols-5 gap-2 h-32">
            {data.data.map((item: any, index: number) => {
              const value = item.completed || item.revenue || item.value || 0;
              const maxValue = Math.max(...data.data.map((d: any) => 
                d.completed || d.revenue || d.value || 0
              ));
              const height = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex flex-col justify-end">
                  <div
                    className="bg-blue-600 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {item.month || item.date || index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// CLIENT INSIGHTS TABLE
// =====================================================================

const ClientInsightsTable: React.FC<{
  clients: ClientInsight[];
  className?: string;
}> = ({ clients, className }) => {
  const getEngagementColor = (level: ClientInsight['engagement_level']) => {
    switch (level) {
      case 'high':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'red';
    }
  };

  const getRiskColor = (risk: ClientInsight['retention_risk']) => {
    switch (risk) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
    }
  };

  return (
    <Card className={className}>
      <Card.Header>
        <h3 className="text-lg font-semibold">Client Insights</h3>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Sessions</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Goals</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Progress</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Engagement</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Satisfaction</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Risk</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.client_id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {client.avatar_url ? (
                          <img
                            src={client.avatar_url}
                            alt={client.client_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-blue-600">
                            {client.client_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.client_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last session: {new Date(client.last_session).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{client.total_sessions}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="text-blue-600">{client.active_goals}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-green-600">{client.completed_goals}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${client.progress_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{client.progress_score}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getEngagementColor(client.engagement_level) as any} size="sm">
                      {client.engagement_level}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{client.satisfaction_rating}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getRiskColor(client.retention_risk) as any} size="sm">
                      {client.retention_risk} risk
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// MAIN ANALYTICS DASHBOARD COMPONENT
// =====================================================================

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasRole } = useUserRoles();
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  const [selectedView, setSelectedView] = useState<'overview' | 'clients' | 'sessions' | 'goals' | 'revenue'>('overview');
  
  const {
    metrics,
    clientInsights,
    sessionAnalytics,
    goalAnalytics,
    revenueAnalytics,
    chartData,
    isLoading,
    error,
    refreshData
  } = useAnalyticsData(dateRange);

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Card.Body className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            {hasRole('admin') 
              ? 'Platform performance and user insights'
              : 'Coaching performance and client insights'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value="30"
            onChange={(value) => {
              const days = parseInt(value);
              setDateRange({
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end: new Date()
              });
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </Select>
          
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as typeof selectedView)}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="clients">Clients</Tabs.Trigger>
          <Tabs.Trigger value="sessions">Sessions</Tabs.Trigger>
          <Tabs.Trigger value="goals">Goals</Tabs.Trigger>
          <EnhancedRoleGuard roles={['coach', 'admin']}>
            <Tabs.Trigger value="revenue">Revenue</Tabs.Trigger>
          </EnhancedRoleGuard>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Content value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.slice(0, 4).map((chart) => (
              <SimpleChart key={chart.id} data={chart} />
            ))}
          </div>

          {/* Client Insights */}
          <ClientInsightsTable clients={clientInsights.slice(0, 5)} />
        </Tabs.Content>

        {/* Clients Tab */}
        <Tabs.Content value="clients" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard metric={metrics.find(m => m.id === 'total_clients')!} />
            <MetricCard metric={metrics.find(m => m.id === 'average_satisfaction')!} />
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {clientInsights.filter(c => c.engagement_level === 'high').length}
                </div>
                <div className="text-sm text-gray-600">High Engagement</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {clientInsights.filter(c => c.retention_risk === 'high').length}
                </div>
                <div className="text-sm text-gray-600">At Risk</div>
              </Card.Body>
            </Card>
          </div>
          
          <ClientInsightsTable clients={clientInsights} />
        </Tabs.Content>

        {/* Sessions Tab */}
        <Tabs.Content value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {sessionAnalytics.total_sessions}
                </div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {sessionAnalytics.success_rate}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {sessionAnalytics.average_duration}
                </div>
                <div className="text-sm text-gray-600">Avg Duration (min)</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {sessionAnalytics.average_rating}
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </Card.Body>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Session Types</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {Object.entries(sessionAnalytics.session_types || {}).map(([type, count]) => {
                    const total = Object.values(sessionAnalytics.session_types || {}).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold">Peak Hours</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-2">
                  {Object.entries(sessionAnalytics.peak_hours || {}).map(([hour, count]) => {
                    const maxCount = Math.max(...Object.values(sessionAnalytics.peak_hours || {}));
                    const percentage = (count / maxCount) * 100;
                    
                    return (
                      <div key={hour} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{hour}</span>
                          <span className="font-medium">{count} sessions</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          </div>
        </Tabs.Content>

        {/* Goals Tab */}
        <Tabs.Content value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {goalAnalytics.total_goals}
                </div>
                <div className="text-sm text-gray-600">Total Goals</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {goalAnalytics.completion_rate}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {goalAnalytics.average_completion_time}
                </div>
                <div className="text-sm text-gray-600">Avg Days to Complete</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-1">
                  {goalAnalytics.milestone_completion_rate}%
                </div>
                <div className="text-sm text-gray-600">Milestone Success</div>
              </Card.Body>
            </Card>
          </div>

          {chartData.find(chart => chart.id === 'goal_categories') && (
            <SimpleChart data={chartData.find(chart => chart.id === 'goal_categories')!} />
          )}
        </Tabs.Content>

        {/* Revenue Tab */}
        <EnhancedRoleGuard roles={['coach', 'admin']}>
          <Tabs.Content value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <Card.Body className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${revenueAnalytics.total_revenue?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    ${revenueAnalytics.monthly_recurring_revenue?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Recurring</div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    ${revenueAnalytics.client_lifetime_value?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Client LTV</div>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body className="p-6 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {revenueAnalytics.growth_rate}%
                  </div>
                  <div className="text-sm text-gray-600">Growth Rate</div>
                </Card.Body>
              </Card>
            </div>

            {revenueAnalytics.revenue_by_period && (
              <SimpleChart data={revenueAnalytics.revenue_by_period} />
            )}
          </Tabs.Content>
        </EnhancedRoleGuard>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;