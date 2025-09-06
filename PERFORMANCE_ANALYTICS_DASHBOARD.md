# Performance Analytics Dashboard

A comprehensive real-time performance monitoring and analytics system for iPEC Coach Connect, providing deep insights into user behavior, system health, and conversion optimization.

## 🎯 Overview

The Performance Analytics Dashboard provides:

- **Real-time Performance Metrics**: Core Web Vitals, response times, and system health monitoring
- **User Behavior Analytics**: Session tracking, engagement metrics, and user journey analysis
- **Conversion Funnel Analysis**: Multi-stage conversion tracking with dropoff identification
- **System Health Monitoring**: Infrastructure metrics, uptime tracking, and error analysis
- **Automated Data Collection**: Batch processing with intelligent caching and optimization
- **Export Capabilities**: CSV and JSON data export for external analysis

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Analytics Dashboard                      │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   Web Vitals    │ │ User Behavior   │ │ Conversion      │ │
│ │   Monitoring    │ │   Tracking      │ │   Funnel        │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ System Health   │ │  Performance    │ │    Export       │ │
│ │   Monitoring    │ │   Analytics     │ │   Capabilities  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                            │
│                                                             │
│ • PerformanceAnalyticsService  • CacheService              │
│ • BatchProcessingService       • DatabaseService           │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│                                                             │
│ • web_vitals              • user_behavior_events           │
│ • conversion_events       • system_metrics                 │
│ • analytics_cache         • performance_summaries          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Installation

The dashboard is integrated into the main iPEC Coach Connect application. No additional installation required.

### 2. Initialize Analytics Service

```typescript
import { performanceAnalyticsService } from './services/performance-analytics.service';

// Initialize the service (usually done in app startup)
await performanceAnalyticsService.initialize();
```

### 3. Access Dashboard

Navigate to `/admin/analytics` or include the dashboard component:

```typescript
import { PerformanceAnalyticsDashboard } from './components/analytics';

function AdminDashboard() {
  return (
    <div className="p-6">
      <PerformanceAnalyticsDashboard 
        timeRange="24h"
        refreshInterval={30000}
      />
    </div>
  );
}
```

## 📊 Dashboard Features

### Overview Metrics

- **Total Users**: Unique users within the time range
- **Active Sessions**: Currently active user sessions
- **Page Views**: Total page views and interactions
- **Conversion Rate**: Overall conversion percentage
- **Average Load Time**: Page loading performance
- **Error Rate**: Application error frequency

### Core Web Vitals Monitoring

Real-time tracking of Google's Core Web Vitals:

- **LCP (Largest Contentful Paint)**: ≤2.5s (Good), ≤4.0s (Needs Improvement), >4.0s (Poor)
- **FID (First Input Delay)**: ≤100ms (Good), ≤300ms (Needs Improvement), >300ms (Poor)
- **CLS (Cumulative Layout Shift)**: ≤0.1 (Good), ≤0.25 (Needs Improvement), >0.25 (Poor)
- **FCP (First Contentful Paint)**: ≤1.8s (Good), ≤3.0s (Needs Improvement), >3.0s (Poor)
- **TTFB (Time to First Byte)**: ≤800ms (Good), ≤1.8s (Needs Improvement), >1.8s (Poor)

### User Behavior Analytics

- **Session Duration**: Average time users spend on the platform
- **Bounce Rate**: Percentage of single-page sessions
- **Pages per Session**: Average page interactions per session
- **Device Distribution**: Desktop, mobile, and tablet usage patterns
- **Top Pages**: Most visited pages with engagement metrics

### Conversion Funnel Analysis

Multi-stage conversion tracking:

1. **Landing**: Initial page visits
2. **Registration Started**: Users who begin sign-up
3. **Profile Created**: Completed registration users
4. **Coach Search**: Users browsing coaches
5. **Session Booked**: Users who schedule sessions
6. **Payment Completed**: Successful transactions

Features:
- Dropoff identification between stages
- Industry benchmark comparisons
- Stage-specific optimization recommendations
- Click-to-drill-down for detailed analysis

### System Health Monitoring

- **Uptime Tracking**: System availability percentage
- **Resource Usage**: Memory and CPU utilization
- **Response Time**: API and page response metrics
- **Error Monitoring**: Application and system errors
- **Infrastructure Health**: Overall system performance score

## 🔧 Configuration

### Time Ranges

- **1h**: Last hour (5-minute intervals)
- **24h**: Last 24 hours (1-hour intervals)
- **7d**: Last 7 days (daily intervals)
- **30d**: Last 30 days (daily intervals)

### Refresh Settings

- **Auto-refresh**: Configurable interval (default: 30 seconds)
- **Manual Refresh**: On-demand data updates
- **Live Mode**: Real-time streaming updates

### Cache Configuration

```typescript
// Service configuration
const CACHE_TTL = 60000; // 1 minute
const BATCH_SIZE = 100;   // Events per batch
const BATCH_INTERVAL = 5000; // 5 seconds
```

## 📈 Data Collection

### Automatic Collection

The system automatically collects:

- **Web Vitals**: LCP, FID, CLS, FCP, TTFB measurements
- **User Behavior**: Page views, clicks, form interactions, scroll depth
- **System Metrics**: Response times, error rates, resource usage
- **Conversion Events**: Registration, booking, payment events

### Manual Tracking

Add custom tracking for specific events:

```typescript
// Track custom conversion
await performanceAnalyticsService.trackConversion({
  event_type: 'custom_goal',
  value: 1,
  properties: { source: 'newsletter', campaign: 'summer2024' },
  session_id: userSessionId,
  user_id: userId,
  funnel_stage: 'engagement'
});

// Track user behavior
await performanceAnalyticsService.trackUserBehavior({
  event_type: 'feature_usage',
  url: window.location.href,
  duration: 30000,
  properties: { feature: 'coach_filter', action: 'applied' },
  session_id: userSessionId,
  user_id: userId
});
```

## 📊 Chart Types and Visualizations

### Web Vitals Chart
- Line charts with performance thresholds
- Color-coded status indicators (Good/Needs Improvement/Poor)
- Trend analysis with optimization recommendations
- Benchmark comparisons with industry standards

### User Behavior Chart
- Session overview with area charts
- Engagement metrics with dual-axis line charts
- Top pages bar chart with interaction data
- Device distribution pie chart

### Conversion Funnel Chart
- Horizontal funnel visualization
- Stage-by-stage dropoff analysis
- Industry benchmark overlays
- Click-to-drill-down functionality

### System Health Chart
- Real-time system metrics
- Resource usage area charts
- Error rate tracking
- Health score visualization

## 🔍 Analytics Insights

### Performance Recommendations

The dashboard provides automated recommendations based on data:

**Web Vitals Optimization**:
- Image optimization and WebP conversion
- JavaScript code splitting and lazy loading
- CDN implementation and caching strategies
- Server-side rendering recommendations

**User Experience Enhancement**:
- Page flow optimization
- Content engagement improvements
- Navigation and usability enhancements
- Mobile experience optimization

**Conversion Optimization**:
- Funnel stage improvements
- A/B testing suggestions
- User experience friction reduction
- Call-to-action optimization

**System Performance**:
- Infrastructure scaling recommendations
- Database query optimization
- Caching strategy improvements
- Error handling enhancements

## 📁 Export and Reporting

### Export Formats

- **CSV**: Spreadsheet-compatible format for analysis
- **JSON**: Structured data for API integration
- **Custom Reports**: Filtered data exports

### Export Data

```typescript
// Export current metrics
await performanceAnalyticsService.exportMetrics('24h', 'csv');

// Export with custom filtering
const customData = await performanceAnalyticsService.getMetrics('7d');
// Process and export customData
```

## 🔒 Security and Privacy

### Data Protection

- **User Privacy**: Personal data anonymization
- **GDPR Compliance**: Right to erasure and data portability
- **Secure Storage**: Encrypted data at rest and in transit
- **Access Control**: Role-based dashboard access

### Performance Optimization

- **Intelligent Caching**: Multi-level caching with TTL management
- **Batch Processing**: Efficient event processing and storage
- **Database Indexing**: Optimized queries for large datasets
- **Resource Management**: Minimal performance impact on main application

## 🔧 Troubleshooting

### Common Issues

**Dashboard not loading data**:
```typescript
// Check service initialization
const isInitialized = await performanceAnalyticsService.initialize();
console.log('Analytics service initialized:', isInitialized);
```

**Slow dashboard performance**:
- Reduce time range for large datasets
- Enable caching for frequently accessed data
- Check database query performance

**Missing metrics**:
- Verify data collection is active
- Check browser compatibility for Web Vitals
- Ensure proper event tracking implementation

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// Enable debug mode
const { variant } = useExperiment('analytics_debug', {
  debug: true // Logs all tracking events
});
```

## 🎯 Best Practices

### Dashboard Usage

1. **Regular Monitoring**: Check dashboard daily for performance trends
2. **Time Range Selection**: Use appropriate time ranges for analysis
3. **Benchmark Comparison**: Monitor performance against industry standards
4. **Action-Oriented**: Use insights to drive specific improvements

### Performance Optimization

1. **Proactive Monitoring**: Set up alerts for performance degradation
2. **Continuous Improvement**: Regular optimization based on insights
3. **User-Centric Approach**: Focus on real user impact metrics
4. **Data-Driven Decisions**: Use analytics to guide development priorities

### Data Management

1. **Regular Exports**: Backup important analytics data
2. **Data Retention**: Implement appropriate data retention policies
3. **Privacy Compliance**: Ensure user consent and data protection
4. **Performance Impact**: Monitor analytics system resource usage

## 🚦 Performance Thresholds

### Web Vitals Targets
- **LCP**: <2.5s (Excellent), <4.0s (Good), <6.0s (Acceptable)
- **FID**: <100ms (Excellent), <300ms (Good), <500ms (Acceptable)
- **CLS**: <0.1 (Excellent), <0.25 (Good), <0.5 (Acceptable)

### User Engagement Targets
- **Session Duration**: >2 minutes (Good), >5 minutes (Excellent)
- **Bounce Rate**: <40% (Excellent), <60% (Good), <80% (Acceptable)
- **Pages per Session**: >2 (Good), >3 (Excellent)

### System Health Targets
- **Uptime**: >99.9% (Excellent), >99.5% (Good), >99% (Acceptable)
- **Response Time**: <200ms (Excellent), <500ms (Good), <1000ms (Acceptable)
- **Error Rate**: <0.1% (Excellent), <0.5% (Good), <1% (Acceptable)

## 📚 API Reference

### Core Methods

```typescript
// Initialize service
await performanceAnalyticsService.initialize();

// Get comprehensive metrics
const metrics = await performanceAnalyticsService.getMetrics('24h');

// Track specific events
await performanceAnalyticsService.trackWebVital(measurement);
await performanceAnalyticsService.trackUserBehavior(event);
await performanceAnalyticsService.trackConversion(conversion);
await performanceAnalyticsService.trackSystemMetric(metric);

// Export data
await performanceAnalyticsService.exportMetrics('7d', 'csv');
```

### Component Props

```typescript
interface PerformanceAnalyticsDashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  refreshInterval?: number;
}

interface WebVitalsChartProps {
  data: WebVitalsData;
  timeRange: '1h' | '24h' | '7d' | '30d';
  showTrends?: boolean;
}
```

---

Built with ❤️ for iPEC Coach Connect - Transforming coaching through data-driven insights.