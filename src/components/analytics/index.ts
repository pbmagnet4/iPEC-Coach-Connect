/**
 * Analytics Components Export Index
 * Centralized exports for all performance analytics components
 */

export { PerformanceAnalyticsDashboard as default } from './PerformanceAnalyticsDashboard';
export { PerformanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard';
export { WebVitalsChart } from './WebVitalsChart';
export { UserBehaviorChart } from './UserBehaviorChart';
export { ConversionFunnelChart } from './ConversionFunnelChart';
export { SystemHealthChart } from './SystemHealthChart';

// Service exports
export { performanceAnalyticsService } from '../../services/performance-analytics.service';

// Type exports
export type {
  PerformanceMetrics,
  WebVitalMeasurement,
  UserBehaviorEvent,
  ConversionEvent,
  SystemMetric
} from '../../services/performance-analytics.service';