/**
 * Web Vitals Chart Component
 * Visualizes Core Web Vitals metrics with trend analysis and performance benchmarks
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface WebVitalsData {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

interface WebVitalsChartProps {
  data: WebVitalsData;
  timeRange: '1h' | '24h' | '7d' | '30d';
  showTrends?: boolean;
}

interface ChartDataPoint {
  time: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 }
};

const METRIC_INFO = {
  lcp: {
    name: 'Largest Contentful Paint',
    description: 'Time when the largest content element becomes visible',
    unit: 's',
    color: '#3B82F6'
  },
  fid: {
    name: 'First Input Delay',
    description: 'Time from first user interaction to browser response',
    unit: 'ms',
    color: '#10B981'
  },
  cls: {
    name: 'Cumulative Layout Shift',
    description: 'Visual stability of the page during loading',
    unit: '',
    color: '#F59E0B'
  },
  fcp: {
    name: 'First Contentful Paint',
    description: 'Time when first content element becomes visible',
    unit: 's',
    color: '#8B5CF6'
  },
  ttfb: {
    name: 'Time to First Byte',
    description: 'Time from request start to first byte received',
    unit: 'ms',
    color: '#EF4444'
  }
};

export function WebVitalsChart({ data, timeRange, showTrends = true }: WebVitalsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<keyof WebVitalsData>('lcp');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateChartData();
  }, [data, timeRange]);

  const generateChartData = () => {
    setLoading(true);
    
    // Generate sample time series data based on current values
    const points: ChartDataPoint[] = [];
    const intervals = getTimeIntervals(timeRange);
    
    intervals.forEach((time, index) => {
      // Add some variance to make the chart more realistic
      const variance = 0.1; // 10% variance
      
      points.push({
        time,
        lcp: data.lcp * (1 + (Math.random() - 0.5) * variance),
        fid: data.fid * (1 + (Math.random() - 0.5) * variance),
        cls: data.cls * (1 + (Math.random() - 0.5) * variance),
        fcp: data.fcp * (1 + (Math.random() - 0.5) * variance),
        ttfb: data.ttfb * (1 + (Math.random() - 0.5) * variance)
      });
    });

    setChartData(points);
    setLoading(false);
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

  const getMetricStatus = (metric: keyof WebVitalsData, value: number) => {
    const thresholds = WEB_VITALS_THRESHOLDS[metric];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const formatValue = (metric: keyof WebVitalsData, value: number): string => {
    const info = METRIC_INFO[metric];
    switch (metric) {
      case 'lcp':
      case 'fcp':
        return `${(value / 1000).toFixed(2)}${info.unit}`;
      case 'cls':
        return value.toFixed(3);
      default:
        return `${value.toFixed(0)}${info.unit}`;
    }
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {Object.entries(METRIC_INFO).map(([key, info]) => {
            const value = data[key];
            const status = getMetricStatus(key as keyof WebVitalsData, value);
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span style={{ color: info.color }}>{info.name}:</span>
                <span className={getStatusColor(status)}>
                  {formatValue(key as keyof WebVitalsData, value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedMetricInfo = METRIC_INFO[selectedMetric];
  const selectedValue = data[selectedMetric];
  const selectedStatus = getMetricStatus(selectedMetric, selectedValue);
  const thresholds = WEB_VITALS_THRESHOLDS[selectedMetric];

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(METRIC_INFO).map(([key, info]) => {
          const value = data[key as keyof WebVitalsData];
          const status = getMetricStatus(key as keyof WebVitalsData, value);
          const isSelected = selectedMetric === key;
          
          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as keyof WebVitalsData)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getStatusIcon(status)}
              <span>{info.name}</span>
              <span className={getStatusColor(status)}>
                {formatValue(key as keyof WebVitalsData, value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Metric Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{selectedMetricInfo.name}</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(selectedStatus)}
            <span className={`font-bold ${getStatusColor(selectedStatus)}`}>
              {formatValue(selectedMetric, selectedValue)}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">{selectedMetricInfo.description}</p>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-green-600 font-medium">Good</div>
            <div className="text-gray-600">
              ≤ {formatValue(selectedMetric, thresholds.good)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-yellow-600 font-medium">Needs Improvement</div>
            <div className="text-gray-600">
              {formatValue(selectedMetric, thresholds.good + 1)} - {formatValue(selectedMetric, thresholds.needsImprovement)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-red-600 font-medium">Poor</div>
            <div className="text-gray-600">
              > {formatValue(selectedMetric, thresholds.needsImprovement)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
              tickFormatter={(value) => formatValue(selectedMetric, value)}
            />
            <Tooltip content={customTooltip} />
            
            {/* Reference lines for thresholds */}
            <ReferenceLine 
              y={thresholds.good} 
              stroke="#10B981" 
              strokeDasharray="2 2"
              label={{ value: "Good", position: "topLeft" }}
            />
            <ReferenceLine 
              y={thresholds.needsImprovement} 
              stroke="#F59E0B" 
              strokeDasharray="2 2"
              label={{ value: "Poor", position: "topLeft" }}
            />
            
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={selectedMetricInfo.color}
              strokeWidth={2}
              dot={{ fill: selectedMetricInfo.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: selectedMetricInfo.color, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Recommendations */}
      {selectedStatus !== 'good' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Optimization Recommendations</h4>
          <div className="text-sm text-yellow-700">
            {getOptimizationTips(selectedMetric, selectedStatus)}
          </div>
        </div>
      )}
    </div>
  );
}

function getOptimizationTips(metric: keyof WebVitalsData, status: string): React.ReactNode {
  const tips: Record<keyof WebVitalsData, Record<string, string[]>> = {
    lcp: {
      'needs-improvement': [
        'Optimize images with WebP format and responsive sizing',
        'Remove unused CSS and JavaScript',
        'Use a Content Delivery Network (CDN)'
      ],
      'poor': [
        'Implement server-side rendering (SSR)',
        'Preload critical resources',
        'Optimize database queries and API responses',
        'Consider lazy loading for non-critical content'
      ]
    },
    fid: {
      'needs-improvement': [
        'Break up long JavaScript tasks',
        'Use code splitting and lazy loading',
        'Minimize third-party script impact'
      ],
      'poor': [
        'Implement Web Workers for heavy computations',
        'Defer non-critical JavaScript',
        'Optimize event handlers and interactions',
        'Consider using a lighter framework'
      ]
    },
    cls: {
      'needs-improvement': [
        'Set dimensions for images and videos',
        'Reserve space for dynamic content',
        'Use CSS aspect-ratio property'
      ],
      'poor': [
        'Avoid inserting content above existing content',
        'Use transform animations instead of layout changes',
        'Preload custom fonts with font-display: swap',
        'Set explicit sizes for ad slots'
      ]
    },
    fcp: {
      'needs-improvement': [
        'Minimize render-blocking resources',
        'Optimize critical rendering path',
        'Use resource hints (preload, prefetch)'
      ],
      'poor': [
        'Implement critical CSS inlining',
        'Optimize server response times',
        'Use HTTP/2 server push for critical resources',
        'Minimize DOM size and complexity'
      ]
    },
    ttfb: {
      'needs-improvement': [
        'Optimize server response times',
        'Use a CDN closer to users',
        'Implement proper caching strategies'
      ],
      'poor': [
        'Upgrade server infrastructure',
        'Optimize database queries',
        'Implement edge computing',
        'Review and optimize API endpoints'
      ]
    }
  };

  const metricTips = tips[metric][status] || [];
  
  return (
    <ul className="space-y-1">
      {metricTips.map((tip, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2">•</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  );
}