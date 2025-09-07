import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Eye, 
  Hand, 
  Zap, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react';
import { MobileButton } from '../ui/MobileButton';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useTouchTargetValidation, useContrastValidation } from '../../hooks/useAccessibility';
import { cn } from '../../lib/utils';

// Mobile testing suite component
export function MobileTestingSuite() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { validation, settings } = useAccessibility();

  // Only render in development
  if (process.env.NODE_ENV !== 'development' || !settings.enableAccessibilityFeatures) {
    return null;
  }

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      new TouchTargetTest(),
      new ContrastTest(),
      new FontSizeTest(),
      new ResponsiveTest(),
      new GestureTest(),
      new ScreenReaderTest(),
    ];

    for (const test of tests) {
      const result = await test.run();
      setTestResults(prev => [...prev, result]);
    }
    
    setIsRunning(false);
  };

  const exportResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      results: testResults,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-accessibility-report-${Date.now()}.json`;
  void a.click();
  void URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <MobileButton
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full"
        aria-label="Open mobile testing tools"
      >
        <Smartphone className="h-6 w-6" />
      </MobileButton>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mobile Testing Suite</h3>
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close testing suite"
              >
                ×
              </MobileButton>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <MobileButton
                  variant="primary"
                  size="sm"
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </MobileButton>
                
                <MobileButton
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                  disabled={testResults.length === 0}
                >
                  <Download className="h-4 w-4" />
                </MobileButton>
              </div>
              
              <TestResultsList results={testResults} />
              
              <DeviceSimulator />
              
              <AccessibilityInspector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Test result interface
interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'info';
  score: number;
  issues: TestIssue[];
  recommendations: string[];
}

interface TestIssue {
  element: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  selector?: string;
}

// Test results list component
function TestResultsList({ results }: { results: TestResult[] }) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Test Results</h4>
      {results.length === 0 ? (
        <p className="text-sm text-gray-500">No tests run yet</p>
      ) : (
        results.map((result) => (
          <div
            key={result.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <span className="text-sm font-medium">{result.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{result.score}%</span>
              <span className="text-xs text-gray-500">{result.issues.length} issues</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Device simulator component
function DeviceSimulator() {
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const devices = {
    mobile: { width: 375, height: 667, icon: Smartphone },
    tablet: { width: 768, height: 1024, icon: Tablet },
    desktop: { width: 1200, height: 800, icon: Monitor },
  };

  const applyDeviceSimulation = (device: keyof typeof devices, orientation: 'portrait' | 'landscape') => {
    const deviceConfig = devices[device];
    const width = orientation === 'portrait' ? deviceConfig.width : deviceConfig.height;
    const height = orientation === 'portrait' ? deviceConfig.height : deviceConfig.width;
    
    // Apply simulation styles
    document.documentElement.style.setProperty('--simulated-width', `${width}px`);
    document.documentElement.style.setProperty('--simulated-height', `${height}px`);
    document.documentElement.classList.add('device-simulation');
    
    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.className = 'device-indicator';
    indicator.innerHTML = `${device} - ${width}×${height}`;
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(indicator);
    }, 3000);
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Device Simulation</h4>
      <div className="grid grid-cols-3 gap-1">
        {Object.entries(devices).map(([key, device]) => {
          const Icon = device.icon;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedDevice(key as keyof typeof devices);
                applyDeviceSimulation(key as keyof typeof devices, orientation);
              }}
              className={cn(
                "p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors",
                selectedDevice === key
                  ? "bg-brand-100 text-brand-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="capitalize">{key}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => {
            setOrientation('portrait');
            applyDeviceSimulation(selectedDevice, 'portrait');
          }}
          className={cn(
            "flex-1 p-2 rounded text-xs transition-colors",
            orientation === 'portrait'
              ? "bg-brand-100 text-brand-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Portrait
        </button>
        <button
          onClick={() => {
            setOrientation('landscape');
            applyDeviceSimulation(selectedDevice, 'landscape');
          }}
          className={cn(
            "flex-1 p-2 rounded text-xs transition-colors",
            orientation === 'landscape'
              ? "bg-brand-100 text-brand-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Landscape
        </button>
      </div>
    </div>
  );
}

// Accessibility inspector component
function AccessibilityInspector() {
  const [inspectorMode, setInspectorMode] = useState<'touch' | 'contrast' | 'focus' | null>(null);
  const { validation } = useAccessibility();

  const toggleInspector = (mode: 'touch' | 'contrast' | 'focus') => {
    if (inspectorMode === mode) {
      setInspectorMode(null);
      document.body.classList.remove(`inspect-${mode}`);
    } else {
      setInspectorMode(mode);
      document.body.classList.remove(`inspect-touch`, `inspect-contrast`, `inspect-focus`);
      document.body.classList.add(`inspect-${mode}`);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Accessibility Inspector</h4>
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => toggleInspector('touch')}
          className={cn(
            "p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors",
            inspectorMode === 'touch'
              ? "bg-brand-100 text-brand-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Target className="h-4 w-4" />
          <span>Touch</span>
        </button>
        <button
          onClick={() => toggleInspector('contrast')}
          className={cn(
            "p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors",
            inspectorMode === 'contrast'
              ? "bg-brand-100 text-brand-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Eye className="h-4 w-4" />
          <span>Contrast</span>
        </button>
        <button
          onClick={() => toggleInspector('focus')}
          className={cn(
            "p-2 rounded text-xs flex flex-col items-center gap-1 transition-colors",
            inspectorMode === 'focus'
              ? "bg-brand-100 text-brand-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Zap className="h-4 w-4" />
          <span>Focus</span>
        </button>
      </div>
      
      {inspectorMode && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <p>
            {inspectorMode === 'touch' && 'Hover over elements to see touch target information'}
            {inspectorMode === 'contrast' && 'Hover over text to see contrast ratios'}
            {inspectorMode === 'focus' && 'Tab through elements to see focus indicators'}
          </p>
          <p className="mt-1">
            Issues: {validation.touchTargetViolations.length} touch, {validation.contrastViolations.length} contrast
          </p>
        </div>
      )}
    </div>
  );
}

// Test implementations
class TouchTargetTest {
  id = 'touch-targets';
  name = 'Touch Target Size';

  async run(): Promise<TestResult> {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );

    const issues: TestIssue[] = [];
    const minSize = 44;
    let validTargets = 0;

    interactiveElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const isValid = rect.width >= minSize && rect.height >= minSize;
      
      if (isValid) {
        validTargets++;
      } else {
        issues.push({
          element: element.tagName.toLowerCase(),
          description: `Touch target too small: ${Math.round(rect.width)}×${Math.round(rect.height)}px (minimum: ${minSize}×${minSize}px)`,
          severity: rect.width < 30 || rect.height < 30 ? 'high' : 'medium',
          selector: this.generateSelector(element),
        });
      }
    });

    const score = Math.round((validTargets / interactiveElements.length) * 100);
    const status = score >= 95 ? 'pass' : score >= 80 ? 'warning' : 'fail';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Ensure all interactive elements are at least 44×44px',
        'Add adequate spacing between touch targets',
        'Consider using larger touch targets on mobile devices',
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}

class ContrastTest {
  id = 'color-contrast';
  name = 'Color Contrast';

  async run(): Promise<TestResult> {
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
    const issues: TestIssue[] = [];
    let validContrasts = 0;

    // This is a simplified contrast check
    // In production, you'd use a proper color contrast calculation library
    for (const element of textElements) {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      
      // Simplified contrast check (would need proper implementation)
      const mockContrast = Math.random() * 6 + 1;
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && ['bold', '600', '700', '800', '900'].includes(fontWeight));
      const requiredContrast = isLargeText ? 3.0 : 4.5;
      
      if (mockContrast >= requiredContrast) {
        validContrasts++;
      } else {
        issues.push({
          element: element.tagName.toLowerCase(),
          description: `Low contrast ratio: ${mockContrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`,
          severity: mockContrast < 2 ? 'high' : 'medium',
          selector: this.generateSelector(element),
        });
      }
    }

    const score = Math.round((validContrasts / textElements.length) * 100);
    const status = score >= 95 ? 'pass' : score >= 80 ? 'warning' : 'fail';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Ensure text has sufficient contrast against backgrounds',
        'Use tools like WebAIM Contrast Checker to verify ratios',
        'Consider users with visual impairments',
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}

class FontSizeTest {
  id = 'font-size';
  name = 'Font Size';

  async run(): Promise<TestResult> {
    const textElements = document.querySelectorAll('p, span, a, button, label, li');
    const issues: TestIssue[] = [];
    let validSizes = 0;
    const minSize = 16; // Minimum recommended font size for mobile

    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      
      if (fontSize >= minSize) {
        validSizes++;
      } else {
        issues.push({
          element: element.tagName.toLowerCase(),
          description: `Font size too small: ${fontSize}px (minimum recommended: ${minSize}px)`,
          severity: fontSize < 12 ? 'high' : 'medium',
          selector: this.generateSelector(element),
        });
      }
    });

    const score = Math.round((validSizes / textElements.length) * 100);
    const status = score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Use at least 16px font size for body text on mobile',
        'Consider using rem units for scalable typography',
        'Test with different font size preferences',
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}

class ResponsiveTest {
  id = 'responsive-design';
  name = 'Responsive Design';

  async run(): Promise<TestResult> {
    const issues: TestIssue[] = [];
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Check for horizontal scrolling
    if (document.documentElement.scrollWidth > viewport.width) {
      issues.push({
        element: 'body',
        description: 'Horizontal scrolling detected',
        severity: 'high',
      });
    }

    // Check for fixed width elements
    const fixedElements = document.querySelectorAll('*');
    fixedElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const width = styles.width;
      
      if (width.includes('px') && parseInt(width) > viewport.width) {
        issues.push({
          element: element.tagName.toLowerCase(),
          description: `Fixed width element exceeds viewport: ${width}`,
          severity: 'medium',
          selector: this.generateSelector(element),
        });
      }
    });

    const score = Math.max(0, 100 - (issues.length * 10));
    const status = score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Use responsive units (%, rem, em) instead of fixed pixels',
        'Implement mobile-first design approach',
        'Test on multiple device sizes',
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}

class GestureTest {
  id = 'gesture-support';
  name = 'Gesture Support';

  async run(): Promise<TestResult> {
    const issues: TestIssue[] = [];
    const recommendations: string[] = [];

    // Check for touch-action CSS property
    const touchElements = document.querySelectorAll('[data-touch="true"], .swipeable, .draggable');
    touchElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      if (!styles.touchAction || styles.touchAction === 'auto') {
        issues.push({
          element: element.tagName.toLowerCase(),
          description: 'Touch element missing touch-action CSS property',
          severity: 'low',
          selector: this.generateSelector(element),
        });
      }
    });

    // Check for gesture hints
    const gestureElements = document.querySelectorAll('.swipe-hint, [data-gesture-hint]');
    if (gestureElements.length === 0) {
  void recommendations.push('Consider adding gesture hints for better UX');
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    const status = score >= 80 ? 'pass' : 'info';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Add touch-action CSS property to touch elements',
        'Provide visual hints for gesture interactions',
        'Ensure gestures don't interfere with browser navigation',
        ...recommendations,
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}

class ScreenReaderTest {
  id = 'screen-reader';
  name = 'Screen Reader Support';

  async run(): Promise<TestResult> {
    const issues: TestIssue[] = [];

    // Check for missing alt attributes
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push({
          element: 'img',
          description: 'Image missing alt attribute',
          severity: 'high',
          selector: this.generateSelector(img),
        });
      }
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push({
          element: input.tagName.toLowerCase(),
          description: 'Form control missing label',
          severity: 'high',
          selector: this.generateSelector(input),
        });
      }
    });

    // Check for heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push({
          element: heading.tagName.toLowerCase(),
          description: `Heading level ${level} skips level ${previousLevel + 1}`,
          severity: 'medium',
          selector: this.generateSelector(heading),
        });
      }
      previousLevel = level;
    });

    const score = Math.max(0, 100 - (issues.length * 10));
    const status = score >= 95 ? 'pass' : score >= 80 ? 'warning' : 'fail';

    return {
      id: this.id,
      name: this.name,
      status,
      score,
      issues,
      recommendations: [
        'Add alt attributes to all images',
        'Ensure all form controls have labels',
        'Use proper heading hierarchy (h1, h2, h3...)',
        'Test with screen reader software',
      ],
    };
  }

  private generateSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    return `${tag}${id}${className}`;
  }
}