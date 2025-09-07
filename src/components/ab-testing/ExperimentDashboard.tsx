/**
 * A/B Testing Experiment Dashboard
 * Comprehensive dashboard for managing and monitoring A/B tests
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, Pause, Play, Plus, Settings, Stop, Target, TrendingUp, Users } from 'lucide-react';
import { abTestingService } from '../../services/ab-testing.service';
import { featureFlagsService } from '../../services/feature-flags.service';
import type {
  Experiment,
  ExperimentListItem,
  ExperimentStatus,
  ExperimentSummary,
  FeatureFlag
} from '../../types/ab-testing';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ExperimentDashboardProps {
  className?: string;
}

export function ExperimentDashboard({ className = '' }: ExperimentDashboardProps) {
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ExperimentStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load experiments
      const experimentsData = selectedStatus === 'all'
        ? await abTestingService.listExperiments()
        : await abTestingService.listExperiments(selectedStatus);

      // Transform to list items
      const experimentsList: ExperimentListItem[] = experimentsData.map(exp => ({
        id: exp.id,
        name: exp.name,
        status: exp.status,
        created_at: exp.created_at,
        runtime_hours: exp.started_at ? Math.floor((Date.now() - new Date(exp.started_at).getTime()) / (1000 * 60 * 60)) : undefined,
        sample_size: 0, // Would be calculated from actual data
        primary_metric_lift: 0, // Would be calculated from results
        is_significant: false, // Would be calculated from statistical analysis
        winner_variant: undefined // Would be determined from analysis
      }));

      setExperiments(experimentsList);

      // Load feature flags
      const flagsData = await featureFlagsService.listFlags(true);
      setFlags(flagsData);
    } catch (error) {
  void console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExperiment = async (experimentId: string) => {
    try {
      await abTestingService.startExperiment(experimentId);
      await loadDashboardData();
    } catch (error) {
  void console.error('Failed to start experiment:', error);
      setError('Failed to start experiment. Please try again.');
    }
  };

  const handleStopExperiment = async (experimentId: string) => {
    try {
      await abTestingService.stopExperiment(experimentId, 'Manual stop from dashboard');
      await loadDashboardData();
    } catch (error) {
  void console.error('Failed to stop experiment:', error);
      setError('Failed to stop experiment. Please try again.');
    }
  };

  const getStatusBadgeVariant = (status: ExperimentStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const calculateOverallStats = () => {
    const totalExperiments = experiments.length;
    const activeExperiments = experiments.filter(exp => exp.status === 'active').length;
    const completedExperiments = experiments.filter(exp => exp.status === 'completed').length;
    const significantResults = experiments.filter(exp => exp.is_significant).length;

    return {
      totalExperiments,
      activeExperiments,
      completedExperiments,
      significantResults,
      successRate: completedExperiments > 0 ? Math.round((significantResults / completedExperiments) * 100) : 0
    };
  };

  const stats = calculateOverallStats();

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your experiments to optimize conversion rates
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Experiment
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Experiments"
          value={stats.totalExperiments}
          icon={<Target className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Active Experiments"
          value={stats.activeExperiments}
          icon={<Play className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Completed"
          value={stats.completedExperiments}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<Users className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'draft', 'active', 'paused', 'completed', 'archived'] as const).map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} 
            {status !== 'all' && (
              <span className="ml-1 text-xs">
                ({experiments.filter(exp => exp.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Experiments List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Experiments</h2>
        {experiments.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No experiments found</h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus === 'all' 
                ? 'Get started by creating your first A/B test'
                : `No experiments with status "${selectedStatus}"`
              }
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Experiment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {experiments.map((experiment) => (
              <ExperimentRow
                key={experiment.id}
                experiment={experiment}
                onStart={() => handleStartExperiment(experiment.id)}
                onStop={() => handleStopExperiment(experiment.id)}
                onView={() => console.log('View experiment:', experiment.id)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Feature Flags Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Active Flags</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {flags.filter(flag => flag.is_active).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">A/B Test Flags</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {flags.filter(flag => flag.use_for_ab_test).length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="font-medium">Total Flags</span>
            </div>
            <p className="text-2xl font-bold text-gray-600 mt-2">{flags.length}</p>
          </div>
        </div>
      </Card>

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <CreateExperimentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

interface ExperimentRowProps {
  experiment: ExperimentListItem;
  onStart: () => void;
  onStop: () => void;
  onView: () => void;
}

function ExperimentRow({ experiment, onStart, onStop, onView }: ExperimentRowProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{experiment.name}</h3>
          <Badge variant={getStatusBadgeVariant(experiment.status)}>
            {experiment.status}
          </Badge>
          {experiment.is_significant && (
            <Badge variant="success">Significant</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>Created {new Date(experiment.created_at).toLocaleDateString()}</span>
          {experiment.runtime_hours && (
            <span>{experiment.runtime_hours}h runtime</span>
          )}
          <span>{experiment.sample_size} participants</span>
          {experiment.primary_metric_lift !== undefined && (
            <span className={`font-medium ${experiment.primary_metric_lift > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {experiment.primary_metric_lift > 0 ? '+' : ''}{experiment.primary_metric_lift}% lift
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
        {experiment.status === 'draft' && (
          <Button variant="primary" size="sm" onClick={onStart}>
            <Play className="w-4 h-4" />
            Start
          </Button>
        )}
        {experiment.status === 'active' && (
          <Button variant="secondary" size="sm" onClick={onStop}>
            <Stop className="w-4 h-4" />
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}

// Simple modal placeholder - would be replaced with proper modal component
function CreateExperimentModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <h2 className="text-xl font-semibold mb-4">Create New Experiment</h2>
        <p className="text-gray-600 mb-4">
          Experiment creation form would go here. This would include fields for:
        </p>
        <ul className="list-disc pl-6 mb-4 text-sm text-gray-600">
          <li>Experiment name and description</li>
          <li>Feature key and variants</li>
          <li>Success metrics and targeting rules</li>
          <li>Traffic allocation and statistical configuration</li>
        </ul>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onSuccess(); onClose(); }}>
            Create Experiment
          </Button>
        </div>
      </div>
    </div>
  );
}