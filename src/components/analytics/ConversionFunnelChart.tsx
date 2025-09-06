/**
 * Conversion Funnel Chart Component
 * Visualizes user conversion flow through different stages with dropoff analysis
 */

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface FunnelStage {
  stage: string;
  users: number;
  rate: number;
}

interface ConversionFunnelChartProps {
  data: FunnelStage[];
}

interface FunnelMetrics {
  totalDropoff: number;
  biggestDropoff: { stage: string; percentage: number };
  conversionRate: number;
  benchmarkComparison: 'above' | 'below' | 'average';
}

const STAGE_COLORS = {
  'Landing': '#3B82F6',
  'Registration Started': '#10B981',
  'Profile Created': '#F59E0B',
  'Coach Search': '#8B5CF6',
  'Session Booked': '#EF4444',
  'Payment Completed': '#06B6D4'
};

const INDUSTRY_BENCHMARKS = {
  'Landing': 100,
  'Registration Started': 25,
  'Profile Created': 80,
  'Coach Search': 60,
  'Session Booked': 40,
  'Payment Completed': 90
};

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Calculate funnel metrics
  const calculateMetrics = (): FunnelMetrics => {
    if (data.length === 0) {
      return {
        totalDropoff: 0,
        biggestDropoff: { stage: '', percentage: 0 },
        conversionRate: 0,
        benchmarkComparison: 'average'
      };
    }

    const firstStage = data[0];
    const lastStage = data[data.length - 1];
    const totalDropoff = ((firstStage.users - lastStage.users) / firstStage.users) * 100;
    const conversionRate = (lastStage.users / firstStage.users) * 100;

    // Find biggest dropoff between consecutive stages
    let biggestDropoff = { stage: '', percentage: 0 };
    for (let i = 1; i < data.length; i++) {
      const prevStage = data[i - 1];
      const currentStage = data[i];
      const dropoffPercentage = ((prevStage.users - currentStage.users) / prevStage.users) * 100;
      
      if (dropoffPercentage > biggestDropoff.percentage) {
        biggestDropoff = {
          stage: `${prevStage.stage} → ${currentStage.stage}`,
          percentage: dropoffPercentage
        };
      }
    }

    // Compare with industry benchmarks
    const avgBenchmarkConversion = data.reduce((sum, stage, index) => {
      const benchmark = INDUSTRY_BENCHMARKS[stage.stage as keyof typeof INDUSTRY_BENCHMARKS] || 50;
      return sum + (stage.rate - benchmark);
    }, 0) / data.length;

    const benchmarkComparison = avgBenchmarkConversion > 5 ? 'above' : 
                               avgBenchmarkConversion < -5 ? 'below' : 'average';

    return {
      totalDropoff,
      biggestDropoff,
      conversionRate,
      benchmarkComparison
    };
  };

  const metrics = calculateMetrics();

  // Prepare chart data with dropoff calculations
  const chartData = data.map((stage, index) => {
    const previousStage = index > 0 ? data[index - 1] : null;
    const dropoff = previousStage ? 
      ((previousStage.users - stage.users) / previousStage.users) * 100 : 0;
    
    const benchmark = INDUSTRY_BENCHMARKS[stage.stage as keyof typeof INDUSTRY_BENCHMARKS] || 50;
    
    return {
      ...stage,
      dropoff,
      benchmark,
      isSelected: selectedStage === stage.stage,
      color: STAGE_COLORS[stage.stage as keyof typeof STAGE_COLORS] || '#6B7280'
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Users: {data.users.toLocaleString()}
            </p>
            <p className="text-green-600">
              Conversion Rate: {data.rate.toFixed(1)}%
            </p>
            {data.dropoff > 0 && (
              <p className="text-red-600">
                Dropoff: {data.dropoff.toFixed(1)}%
              </p>
            )}
            {showBenchmarks && (
              <p className="text-purple-600">
                Industry Benchmark: {data.benchmark}%
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getStageRecommendations = (stage: string, dropoff: number, rate: number): string[] => {
    const recommendations: Record<string, string[]> = {
      'Landing': [
        'Optimize page load speed and mobile experience',
        'Improve value proposition clarity',
        'Add social proof and trust signals',
        'Implement exit-intent popups'
      ],
      'Registration Started': [
        'Simplify registration form',
        'Add progress indicators',
        'Implement social login options',
        'Reduce required fields'
      ],
      'Profile Created': [
        'Improve onboarding flow',
        'Add profile completion incentives',
        'Provide clear next steps',
        'Send reminder emails'
      ],
      'Coach Search': [
        'Enhance coach discovery features',
        'Improve filtering and search',
        'Add coach recommendations',
        'Display more coach information'
      ],
      'Session Booked': [
        'Streamline booking process',
        'Show availability clearly',
        'Add booking incentives',
        'Implement calendar integration'
      ],
      'Payment Completed': [
        'Optimize checkout flow',
        'Add multiple payment options',
        'Display security badges',
        'Offer payment plans'
      ]
    };

    return recommendations[stage] || [
      'Analyze user behavior at this stage',
      'Conduct user interviews',
      'A/B test different approaches',
      'Review analytics for insights'
    ];
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900">Conversion Funnel</h3>
          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showBenchmarks
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Industry Benchmarks
          </button>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Overall Conversion</div>
          <div className={`text-2xl font-bold ${
            metrics.conversionRate > 5 ? 'text-green-600' : 
            metrics.conversionRate > 2 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {metrics.conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {data[0]?.users.toLocaleString() || 0}
          </div>
          <div className="text-sm text-blue-700">Started the funnel</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Total Dropoff</span>
          </div>
          <div className="text-2xl font-bold text-red-900">
            {metrics.totalDropoff.toFixed(1)}%
          </div>
          <div className="text-sm text-red-700">Users lost overall</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Biggest Dropoff</span>
          </div>
          <div className="text-lg font-bold text-yellow-900">
            {metrics.biggestDropoff.percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-yellow-700">{metrics.biggestDropoff.stage}</div>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="stage" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="#6B7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Main bars */}
            <Bar 
              dataKey="users" 
              radius={[4, 4, 0, 0]}
              onClick={(data) => setSelectedStage(data.stage)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isSelected ? '#1D4ED8' : entry.color}
                  stroke={entry.isSelected ? '#1E40AF' : 'none'}
                  strokeWidth={entry.isSelected ? 2 : 0}
                />
              ))}
            </Bar>

            {/* Benchmark bars (if enabled) */}
            {showBenchmarks && (
              <Bar 
                dataKey="benchmark" 
                fill="rgba(139, 92, 246, 0.3)"
                radius={[2, 2, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">{selectedStage} - Optimization</h4>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {(() => {
            const stageData = chartData.find(d => d.stage === selectedStage);
            if (!stageData) return null;

            const recommendations = getStageRecommendations(
              selectedStage, 
              stageData.dropoff, 
              stageData.rate
            );

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-800 mb-3">Stage Metrics</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Users at this stage:</span>
                      <span className="font-medium">{stageData.users.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion rate:</span>
                      <span className="font-medium">{stageData.rate.toFixed(1)}%</span>
                    </div>
                    {stageData.dropoff > 0 && (
                      <div className="flex justify-between">
                        <span>Dropoff from previous:</span>
                        <span className="font-medium text-red-600">{stageData.dropoff.toFixed(1)}%</span>
                      </div>
                    )}
                    {showBenchmarks && (
                      <div className="flex justify-between">
                        <span>Industry benchmark:</span>
                        <span className="font-medium text-purple-600">{stageData.benchmark}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-800 mb-3">Optimization Suggestions</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Performance Assessment */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Funnel Performance Assessment</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Overall Health</h5>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {metrics.conversionRate > 5 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">
                    Conversion Rate: {metrics.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {metrics.conversionRate > 5 ? 'Excellent performance' : 
                     metrics.conversionRate > 2 ? 'Average performance' : 'Needs improvement'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {metrics.benchmarkComparison === 'above' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <div className="font-medium">Industry Comparison</div>
                  <div className="text-sm text-gray-600">
                    Performance is {metrics.benchmarkComparison} industry average
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-3">Priority Actions</h5>
            <div className="space-y-2 text-sm">
              {metrics.biggestDropoff.percentage > 50 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <span className="font-medium text-red-800">High Priority:</span>
                  <span className="text-red-700 ml-1">
                    Address {metrics.biggestDropoff.stage} dropoff
                  </span>
                </div>
              )}
              
              {metrics.conversionRate < 2 && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="font-medium text-yellow-800">Medium Priority:</span>
                  <span className="text-yellow-700 ml-1">
                    Overall conversion rate optimization needed
                  </span>
                </div>
              )}

              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <span className="font-medium text-blue-800">Ongoing:</span>
                <span className="text-blue-700 ml-1">
                  Implement A/B testing for continuous improvement
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}