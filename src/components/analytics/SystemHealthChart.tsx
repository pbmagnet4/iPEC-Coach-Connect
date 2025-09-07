/**
 * System Health Chart Component
 * Visualizes system performance metrics, uptime, and infrastructure health
 */

import React, { useState } from 'react';
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Line,
  LineChart, 
  ReferenceLine, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis,
  YAxis 
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  Server,
  Wifi,
  Zap
} from 'lucide-react';

interface SystemHealthData {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  errors: { type: string; count: number; trend: number }[];
}

interface SystemHealthChartProps {
  data: SystemHealthData;
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface SystemMetric {
  time: string;
  uptime: number;
  memory: number;
  cpu: number;
  responseTime: number;
  errorRate: number;
}

interface HealthThresholds {
  excellent: number;
  good: number;
  warning: number;
  critical: number;
}

const HEALTH_THRESHOLDS = {
  uptime: { excellent: 99.9, good: 99.5, warning: 99.0, critical: 98.0 },
  memory: { excellent: 70, good: 80, warning: 90, critical: 95 },
  cpu: { excellent: 60, good: 75, warning: 85, critical: 95 },
  responseTime: { excellent: 200, good: 500, warning: 1000, critical: 2000 },
  errorRate: { excellent: 0.1, good: 0.5, warning: 1.0, critical: 2.0 }
};

export function SystemHealthChart({ data, timeRange }: SystemHealthChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'performance' | 'errors'>('overview');

  // Generate time series data
  const generateSystemData = (): SystemMetric[] => {
    const points: SystemMetric[] = [];
    const intervals = getTimeIntervals(timeRange);
    
    intervals.forEach((time, index) => {
      const variance = 0.1; // 10% variance
      const trend = Math.sin((index / intervals.length) * Math.PI * 2) * 0.05; // Cyclical trend
      
      points.push({
        time,
        uptime: Math.min(100, data.uptime * (1 + (Math.random() - 0.5) * variance * 0.1)),
        memory: Math.max(0, Math.min(100, data.memoryUsage * (1 + trend + (Math.random() - 0.5) * variance))),
        cpu: Math.max(0, Math.min(100, data.cpuUsage * (1 + trend + (Math.random() - 0.5) * variance))),
        responseTime: Math.max(0, data.responseTime * (1 + trend + (Math.random() - 0.5) * variance)),
        errorRate: Math.max(0, (data.errors[0]?.count || 0) * 0.1 * (1 + (Math.random() - 0.5) * variance))
      });
    });

    return points;
  };

  const getTimeIntervals = (range: string): string[] => {
    const intervals: string[] = [];
    const now = new Date();
    let intervalCount: number;
    let intervalSize: number;

    switch (range) {
      case '1h':
        intervalCount = 12;
        intervalSize = 5 * 60 * 1000; // 5 minutes
        break;
      case '24h':
        intervalCount = 24;
        intervalSize = 60 * 60 * 1000; // 1 hour
        break;
      case '7d':
        intervalCount = 7;
        intervalSize = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        intervalCount = 30;
        intervalSize = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        intervalCount = 24;
        intervalSize = 60 * 60 * 1000;
    }

    for (let i = intervalCount - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * intervalSize));
  void intervals.push(formatTimeLabel(time, range));
    }

    return intervals;
  };

  const formatTimeLabel = (date: Date, range: string): string => {
    switch (range) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
      case '30d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getHealthStatus = (metric: string, value: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    const thresholds = HEALTH_THRESHOLDS[metric as keyof typeof HEALTH_THRESHOLDS];
    
    if (!thresholds) return 'good';
    
    // For uptime, higher is better
    if (metric === 'uptime') {
      if (value >= thresholds.excellent) return 'excellent';
      if (value >= thresholds.good) return 'good';
      if (value >= thresholds.warning) return 'warning';
      return 'critical';
    }
    
    // For other metrics, lower is better
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const systemData = generateSystemData();

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                (entry.name === 'responseTime' ? `${entry.value.toFixed(0)}ms` :
                 entry.name === 'uptime' ? `${entry.value.toFixed(2)}%` :
                 `${entry.value.toFixed(1)}${entry.name.includes('Rate') ? '%' : entry.name.includes('Usage') ? '%' : ''}`) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (selectedMetric) {
      case 'overview':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis 
                yAxisId="percentage"
                domain={[0, 100]}
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                yAxisId="time"
                orientation="right"
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip content={customTooltip} />
              
              {/* Reference lines */}
              <ReferenceLine yAxisId="percentage" y={90} stroke="#F59E0B" strokeDasharray="2 2" />
              <ReferenceLine yAxisId="time" y={1000} stroke="#EF4444" strokeDasharray="2 2" />
              
              <Line
                yAxisId="percentage"
                type="monotone"
                dataKey="uptime"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Uptime"
              />
              <Line
                yAxisId="time"
                type="monotone"
                dataKey="responseTime"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Response Time"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={systemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={customTooltip} />
              
              {/* Warning thresholds */}
              <ReferenceLine y={85} stroke="#F59E0B" strokeDasharray="2 2" label="Warning" />
              <ReferenceLine y={95} stroke="#EF4444" strokeDasharray="2 2" label="Critical" />
              
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
                name="Memory Usage"
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="2"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.6}
                name="CPU Usage"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'errors':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={customTooltip} />
              
              <ReferenceLine y={1} stroke="#F59E0B" strokeDasharray="2 2" label="Target" />
              
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                name="Error Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Calculate overall health score
  const calculateHealthScore = (): { score: number; status: string } => {
    const uptimeScore = data.uptime >= 99.9 ? 100 : data.uptime >= 99.5 ? 85 : data.uptime >= 99.0 ? 70 : 50;
    const memoryScore = data.memoryUsage <= 70 ? 100 : data.memoryUsage <= 80 ? 85 : data.memoryUsage <= 90 ? 70 : 50;
    const cpuScore = data.cpuUsage <= 60 ? 100 : data.cpuUsage <= 75 ? 85 : data.cpuUsage <= 85 ? 70 : 50;
    const responseScore = data.responseTime <= 200 ? 100 : data.responseTime <= 500 ? 85 : data.responseTime <= 1000 ? 70 : 50;
    
    const averageScore = (uptimeScore + memoryScore + cpuScore + responseScore) / 4;
    
    let status = 'excellent';
    if (averageScore < 90) status = 'good';
    if (averageScore < 75) status = 'warning';
    if (averageScore < 60) status = 'critical';
    
    return { score: averageScore, status };
  };

  const healthScore = calculateHealthScore();

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">System Health Score</h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthScore.status)}
              <span className={`text-2xl font-bold ${getStatusColor(healthScore.status)}`}>
                {healthScore.score.toFixed(0)}/100
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Status</div>
            <div className={`font-medium capitalize ${getStatusColor(healthScore.status)}`}>
              {healthScore.status}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Activity className={`w-5 h-5 ${getStatusColor(getHealthStatus('uptime', data.uptime))}`} />
            {getStatusIcon(getHealthStatus('uptime', data.uptime))}
          </div>
          <div className="text-sm text-gray-600">Uptime</div>
          <div className={`text-xl font-bold ${getStatusColor(getHealthStatus('uptime', data.uptime))}`}>
            {data.uptime.toFixed(2)}%
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className={`w-5 h-5 ${getStatusColor(getHealthStatus('memory', data.memoryUsage))}`} />
            {getStatusIcon(getHealthStatus('memory', data.memoryUsage))}
          </div>
          <div className="text-sm text-gray-600">Memory</div>
          <div className={`text-xl font-bold ${getStatusColor(getHealthStatus('memory', data.memoryUsage))}`}>
            {data.memoryUsage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Cpu className={`w-5 h-5 ${getStatusColor(getHealthStatus('cpu', data.cpuUsage))}`} />
            {getStatusIcon(getHealthStatus('cpu', data.cpuUsage))}
          </div>
          <div className="text-sm text-gray-600">CPU</div>
          <div className={`text-xl font-bold ${getStatusColor(getHealthStatus('cpu', data.cpuUsage))}`}>
            {data.cpuUsage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Zap className={`w-5 h-5 ${getStatusColor(getHealthStatus('responseTime', data.responseTime))}`} />
            {getStatusIcon(getHealthStatus('responseTime', data.responseTime))}
          </div>
          <div className="text-sm text-gray-600">Response</div>
          <div className={`text-xl font-bold ${getStatusColor(getHealthStatus('responseTime', data.responseTime))}`}>
            {data.responseTime.toFixed(0)}ms
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedMetric('overview')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedMetric === 'overview'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setSelectedMetric('performance')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedMetric === 'performance'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Performance</span>
        </button>

        <button
          onClick={() => setSelectedMetric('errors')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedMetric === 'errors'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Errors</span>
        </button>
      </div>

      {/* Chart Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">
          {selectedMetric === 'overview' && 'System Overview'}
          {selectedMetric === 'performance' && 'Resource Usage'}
          {selectedMetric === 'errors' && 'Error Tracking'}
        </h4>
        {renderChart()}
      </div>

      {/* Error Details */}
      {data.errors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Error Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.errors.map((error, index) => (
              <div key={error.type} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{error.type}</span>
                  <div className={`text-sm ${error.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {error.trend > 0 ? '↑' : '↓'} {Math.abs(error.trend).toFixed(1)}%
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{error.count}</div>
                <div className="text-sm text-gray-600">incidents</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {(healthScore.status === 'warning' || healthScore.status === 'critical') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">System Recommendations</h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            {data.memoryUsage > 85 && <li>• Memory usage is high - consider scaling up or optimizing memory allocation</li>}
            {data.cpuUsage > 85 && <li>• CPU usage is high - investigate high-load processes or scale horizontally</li>}
            {data.responseTime > 1000 && <li>• Response times are slow - optimize database queries and API endpoints</li>}
            {data.uptime < 99.5 && <li>• Uptime is below target - review infrastructure stability and monitoring</li>}
            <li>• Consider implementing automated scaling and alerting for proactive monitoring</li>
          </ul>
        </div>
      )}
    </div>
  );
}