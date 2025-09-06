/**
 * User Behavior Chart Component
 * Visualizes user interaction patterns, session data, and engagement metrics
 */

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Clock, Users, MousePointer, Eye, TrendingUp, TrendingDown } from 'lucide-react';

interface UserBehaviorData {
  sessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  topPages: Array<{ path: string; views: number; avgTime: number }>;
}

interface UserBehaviorChartProps {
  data: UserBehaviorData;
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface SessionData {
  time: string;
  sessions: number;
  duration: number;
  bounceRate: number;
  pagesPerSession: number;
}

interface DeviceData {
  device: string;
  sessions: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function UserBehaviorChart({ data, timeRange }: UserBehaviorChartProps) {
  const [chartType, setChartType] = useState<'sessions' | 'engagement' | 'pages' | 'devices'>('sessions');

  // Generate sample time series data
  const generateSessionData = (): SessionData[] => {
    const points: SessionData[] = [];
    const intervals = getTimeIntervals(timeRange);
    
    intervals.forEach((time, index) => {
      const variance = 0.15; // 15% variance
      const trend = Math.sin((index / intervals.length) * Math.PI * 2) * 0.1; // Cyclical trend
      
      points.push({
        time,
        sessions: Math.round(100 * (1 + trend + (Math.random() - 0.5) * variance)),
        duration: Math.round(data.sessionDuration * (1 + trend + (Math.random() - 0.5) * variance)),
        bounceRate: Math.round(data.bounceRate * (1 + (Math.random() - 0.5) * variance)),
        pagesPerSession: Number((data.pagesPerSession * (1 + (Math.random() - 0.5) * variance)).toFixed(1))
      });
    });

    return points;
  };

  const generateDeviceData = (): DeviceData[] => {
    return [
      { device: 'Desktop', sessions: 45, percentage: 45, color: '#3B82F6' },
      { device: 'Mobile', sessions: 40, percentage: 40, color: '#10B981' },
      { device: 'Tablet', sessions: 15, percentage: 15, color: '#F59E0B' }
    ];
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
      intervals.push(formatTimeLabel(time, range));
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const sessionData = generateSessionData();
  const deviceData = generateDeviceData();

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'duration' ? formatDuration(entry.value) : entry.value}
              {entry.name === 'bounceRate' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'sessions':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'engagement':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => formatDuration(value)}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={customTooltip} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="duration"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Session Duration"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bounceRate"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                name="Bounce Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pages':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topPages.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="path" 
                tick={{ fontSize: 10 }} 
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <p className="text-sm text-blue-600">
                          Views: {data.views.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">
                          Avg Time: {formatDuration(data.avgTime / 1000)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'devices':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="percentage"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium">{data.device}</p>
                        <p className="text-sm text-gray-600">
                          {data.sessions}% ({data.percentage}% of sessions)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setChartType('sessions')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            chartType === 'sessions'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sessions</span>
        </button>

        <button
          onClick={() => setChartType('engagement')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            chartType === 'engagement'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Engagement</span>
        </button>

        <button
          onClick={() => setChartType('pages')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            chartType === 'pages'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Top Pages</span>
        </button>

        <button
          onClick={() => setChartType('devices')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            chartType === 'devices'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          <span>Devices</span>
        </button>
      </div>

      {/* Chart Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {chartType === 'sessions' && 'User Sessions Over Time'}
            {chartType === 'engagement' && 'Session Duration & Bounce Rate'}
            {chartType === 'pages' && 'Most Visited Pages'}
            {chartType === 'devices' && 'Device Distribution'}
          </h3>
          
          {chartType === 'engagement' && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Duration</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Bounce Rate</span>
              </div>
            </div>
          )}
        </div>

        {renderChart()}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Session Insights</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>Average Session Duration:</span>
              <span className="font-medium">{formatDuration(data.sessionDuration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pages per Session:</span>
              <span className="font-medium">{data.pagesPerSession.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bounce Rate:</span>
              <span className="font-medium">{data.bounceRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Performance Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              {data.sessionDuration > 120 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={data.sessionDuration > 120 ? 'text-green-700' : 'text-red-700'}>
                Session duration is {data.sessionDuration > 120 ? 'good' : 'below average'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {data.bounceRate < 50 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={data.bounceRate < 50 ? 'text-green-700' : 'text-red-700'}>
                Bounce rate is {data.bounceRate < 50 ? 'excellent' : 'needs improvement'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {data.pagesPerSession > 2 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={data.pagesPerSession > 2 ? 'text-green-700' : 'text-red-700'}>
                Page engagement is {data.pagesPerSession > 2 ? 'strong' : 'low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {(data.bounceRate > 60 || data.sessionDuration < 90 || data.pagesPerSession < 1.5) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Optimization Recommendations</h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            {data.bounceRate > 60 && (
              <li>• High bounce rate: Improve page loading speed and content relevance</li>
            )}
            {data.sessionDuration < 90 && (
              <li>• Low session duration: Enhance content engagement and internal linking</li>
            )}
            {data.pagesPerSession < 1.5 && (
              <li>• Low page engagement: Add related content suggestions and clear navigation</li>
            )}
            <li>• Consider A/B testing different page layouts and content strategies</li>
          </ul>
        </div>
      )}
    </div>
  );
}