import React, { useState } from 'react';
import {
  // Basic skeleton components
  CoachCardSkeleton,
  MessageSkeleton,
  FormSkeleton,
  NavigationSkeleton,
  
  // Progressive loading components
  ProgressiveLoader,
  ProgressiveImage,
  ProgressBar,
  LoadingStates,
  
  // Accessibility components
  AccessibleLoading,
  LoadingAnnouncer,
  AccessibleProgress,
  
  // Hooks
  useLoadingState,
  useNetworkAwareLoading,
  useImageLoading
} from '../ui/loading';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

/**
 * LoadingSystemExample - Comprehensive demonstration of the new loading system
 * 
 * This component showcases all the loading features available in the iPEC Coach Connect platform:
 * 
 * 1. **Skeleton Loading States**
 *    - Content-aware skeletons that match actual content structure
 *    - Realistic placeholders for coach cards, profiles, posts, forms
 *    - Mobile-optimized skeleton layouts
 * 
 * 2. **Progressive Loading**
 *    - Intersection observer-based loading
 *    - Network-aware batch sizing
 *    - Infinite scroll with loading indicators
 * 
 * 3. **Image Loading**
 *    - Blur-to-sharp transitions
 *    - Progressive enhancement
 *    - Lazy loading with intersection observer
 *    - Error handling with fallbacks
 * 
 * 4. **Accessibility Features**
 *    - Screen reader announcements
 *    - Keyboard navigation support
 *    - High contrast modes
 *    - Progress announcements
 * 
 * 5. **Network Awareness**
 *    - Adaptive loading based on connection quality
 *    - Optimized timeouts and batch sizes
 *    - Performance analytics
 */

interface ExampleData {
  id: number;
  title: string;
  description: string;
  image: string;
}

// Mock data loading function
const loadExampleData = async (page: number, limit: number): Promise<ExampleData[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Generate mock data
  const startId = page * limit;
  return Array.from({ length: limit }, (_, index) => ({
    id: startId + index,
    title: `Example Item ${startId + index + 1}`,
    description: `This is a description for example item ${startId + index + 1}`,
    image: `https://images.unsplash.com/photo-${1500000000000 + startId + index}?auto=format&fit=crop&q=80&w=400`
  }));
};

// Mock async operation
const simulateAsyncOperation = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (Math.random() < 0.3) {
    throw new Error('Simulated network error');
  }
  return 'Operation completed successfully!';
};

export const LoadingSystemExample: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('skeletons');
  const [progress, setProgress] = useState(0);
  const [showProgressDemo, setShowProgressDemo] = useState(false);
  
  // Network-aware loading hook
  const networkInfo = useNetworkAwareLoading();
  
  // Async operation with loading state
  const asyncOperation = useLoadingState(simulateAsyncOperation, {
    strategy: 'ondemand',
    networkAware: true,
    showSkeleton: true
  });

  // Progress simulation
  React.useEffect(() => {
    if (showProgressDemo) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setShowProgressDemo(false);
            return 0;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [showProgressDemo]);

  const renderSkeletonDemo = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Coach Card Skeletons</h3>
        <CoachCardSkeleton 
          loading={true} 
          count={3} 
          variant="grid" 
          showRating={true}
          showPrice={true}
          showSpecialty={true}
        >
          <div>Real content would appear here</div>
        </CoachCardSkeleton>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Message Skeletons</h3>
        <MessageSkeleton 
          loading={true} 
          count={4} 
          variant="post"
          showAvatar={true}
          showActions={true}
        >
          <div>Real messages would appear here</div>
        </MessageSkeleton>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Form Skeletons</h3>
        <FormSkeleton 
          loading={true} 
          fieldCount={5}
          variant="detailed"
          showLabels={true}
          showDescription={true}
        >
          <div>Real form would appear here</div>
        </FormSkeleton>
      </div>
    </div>
  );

  const renderProgressiveDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Progressive Data Loading</h3>
        <ProgressiveLoader
          loadFunction={loadExampleData}
          renderItem={(item: ExampleData, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center space-x-4">
                <ProgressiveImage
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover"
                  placeholder="blur"
                  lazy={true}
                />
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            </Card>
          )}
          itemsPerPage={5}
          className="space-y-4"
          emptyStateComponent={
            <div className="text-center py-8">
              <p className="text-gray-500">No items available</p>
            </div>
          }
        />
      </div>
    </div>
  );

  const renderAccessibilityDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accessible Loading States</h3>
        <AccessibleLoading
          loading={asyncOperation.loading}
          loadingText="Processing your request"
          completedText="Request completed successfully"
          errorText="Request failed"
          error={asyncOperation.error}
          announceChanges={true}
          focusOnComplete={true}
        >
          <div className="space-y-4">
            <Button
              onClick={asyncOperation.refresh}
              disabled={asyncOperation.loading}
              variant="primary"
            >
              {asyncOperation.loading ? 'Processing...' : 'Start Async Operation'}
            </Button>
            
            {asyncOperation.data && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{asyncOperation.data}</p>
              </div>
            )}
            
            {asyncOperation.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{asyncOperation.error.message}</p>
                <Button
                  onClick={asyncOperation.retry}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </AccessibleLoading>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Accessible Progress Indicators</h3>
        <div className="space-y-4">
          <Button
            onClick={() => setShowProgressDemo(true)}
            disabled={showProgressDemo}
            variant="outline"
          >
            {showProgressDemo ? 'Progress Running...' : 'Start Progress Demo'}
          </Button>
          
          {showProgressDemo && (
            <AccessibleProgress
              progress={progress}
              label="Demo Progress"
              description="Demonstrating accessible progress indication"
              showPercentage={true}
              announceProgress={true}
              announceThreshold={25}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderNetworkDemo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Network-Aware Loading</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Current Network Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Quality:</span>
                <span className={`font-medium ${
                  networkInfo.networkQuality === 'fast' ? 'text-green-600' :
                  networkInfo.networkQuality === 'good' ? 'text-blue-600' :
                  networkInfo.networkQuality === 'slow' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {networkInfo.networkQuality}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Online:</span>
                <span className={`font-medium ${networkInfo.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {networkInfo.isOnline ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Priority:</span>
                <span className="font-medium">{networkInfo.priority}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-2">Adaptive Settings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Optimal Batch Size:</span>
                <span className="font-medium">{networkInfo.getOptimalBatchSize(20)}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimal Timeout:</span>
                <span className="font-medium">{networkInfo.getOptimalTimeout(5000)}ms</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Loading System Demo
        </h1>
        <p className="text-gray-600 text-lg">
          Comprehensive demonstration of the iPEC Coach Connect loading system featuring 
          skeleton screens, progressive loading, accessibility, and network awareness.
        </p>
      </div>

      {/* Demo Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'skeletons', label: 'Skeleton Loading' },
            { id: 'progressive', label: 'Progressive Loading' },
            { id: 'accessibility', label: 'Accessibility' },
            { id: 'network', label: 'Network Awareness' }
          ].map((demo) => (
            <Button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              variant={activeDemo === demo.id ? 'primary' : 'outline'}
              size="sm"
            >
              {demo.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="bg-white rounded-lg border p-6">
        <LoadingAnnouncer
          loading={false}
          message={`Showing ${activeDemo} demo`}
          polite={true}
        />

        {activeDemo === 'skeletons' && renderSkeletonDemo()}
        {activeDemo === 'progressive' && renderProgressiveDemo()}
        {activeDemo === 'accessibility' && renderAccessibilityDemo()}
        {activeDemo === 'network' && renderNetworkDemo()}
      </div>

      {/* Usage Guidelines */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Implementation Guidelines
        </h2>
        <div className="space-y-4 text-blue-800">
          <div>
            <h3 className="font-medium">1. Choose the Right Loading Pattern</h3>
            <p className="text-sm">Use skeleton loading for content placeholders, progressive loading for large datasets, and accessible loading for all user interactions.</p>
          </div>
          <div>
            <h3 className="font-medium">2. Optimize for Performance</h3>
            <p className="text-sm">Leverage network-aware loading to adapt batch sizes and timeouts based on connection quality.</p>
          </div>
          <div>
            <h3 className="font-medium">3. Ensure Accessibility</h3>
            <p className="text-sm">Always use accessible loading components with proper ARIA attributes and screen reader announcements.</p>
          </div>
          <div>
            <h3 className="font-medium">4. Provide Clear Feedback</h3>
            <p className="text-sm">Show progress indicators for long operations and provide retry mechanisms for failed requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};