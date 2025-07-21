import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  useAccessibilityPreferences, 
  useScreenReader, 
  useTouchTargetValidation, 
  useContrastValidation,
  useKeyboardNavigation,
  useAriaLiveRegion,
  useSkipLinks
} from '../hooks/useAccessibility';

interface AccessibilityContextType {
  // Preferences
  preferences: {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    prefersReducedTransparency: boolean;
    colorScheme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large' | 'x-large';
    updateFontSize: (size: 'small' | 'medium' | 'large' | 'x-large') => void;
  };
  
  // Screen reader
  screenReader: {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    clearAnnouncements: () => void;
    announcements: string[];
  };
  
  // Validation
  validation: {
    touchTargetViolations: Array<{ element: HTMLElement; size: { width: number; height: number } }>;
    contrastViolations: Array<{
      element: HTMLElement;
      contrast: number;
      required: number;
      colors: { foreground: string; background: string };
    }>;
    validateTouchTargets: () => void;
    validateContrast: () => void;
  };
  
  // Keyboard navigation
  keyboard: {
    isKeyboardUser: boolean;
    lastInteractionType: 'mouse' | 'keyboard' | null;
  };
  
  // Live regions
  liveRegions: {
    announcePolite: (message: string) => void;
    announceAssertive: (message: string) => void;
    LiveRegions: () => JSX.Element;
  };
  
  // Skip links
  skipLinks: {
    addSkipLink: (id: string, label: string, href: string) => void;
    removeSkipLink: (id: string) => void;
    SkipLinks: () => JSX.Element;
  };
  
  // Settings
  settings: {
    enableAccessibilityFeatures: boolean;
    enableValidation: boolean;
    enableAnnouncements: boolean;
    toggleAccessibilityFeatures: () => void;
    toggleValidation: () => void;
    toggleAnnouncements: () => void;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
  enableValidation?: boolean;
  enableAnnouncements?: boolean;
}

export function AccessibilityProvider({
  children,
  enableValidation = process.env.NODE_ENV === 'development',
  enableAnnouncements = true,
}: AccessibilityProviderProps) {
  const [enableAccessibilityFeatures, setEnableAccessibilityFeatures] = useState(true);
  const [validationEnabled, setValidationEnabled] = useState(enableValidation);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(enableAnnouncements);
  
  // Initialize hooks
  const preferences = useAccessibilityPreferences();
  const screenReader = useScreenReader();
  const touchTargetValidation = useTouchTargetValidation();
  const contrastValidation = useContrastValidation();
  const keyboard = useKeyboardNavigation();
  const liveRegions = useAriaLiveRegion();
  const skipLinks = useSkipLinks();

  // Apply accessibility preferences to DOM
  useEffect(() => {
    if (!enableAccessibilityFeatures) return;

    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px',
    };
    root.style.fontSize = fontSizeMap[preferences.fontSize];
    
    // Apply reduced motion preference
    if (preferences.prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply high contrast preference
    if (preferences.prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced transparency preference
    if (preferences.prefersReducedTransparency) {
      root.classList.add('reduce-transparency');
    } else {
      root.classList.remove('reduce-transparency');
    }
    
    // Apply color scheme
    root.setAttribute('data-color-scheme', preferences.colorScheme);
    
    // Apply keyboard user indicator
    if (keyboard.isKeyboardUser) {
      root.classList.add('keyboard-user');
    } else {
      root.classList.remove('keyboard-user');
    }
  }, [
    enableAccessibilityFeatures,
    preferences.fontSize,
    preferences.prefersReducedMotion,
    preferences.prefersHighContrast,
    preferences.prefersReducedTransparency,
    preferences.colorScheme,
    keyboard.isKeyboardUser,
  ]);

  // Add default skip links
  useEffect(() => {
    if (enableAccessibilityFeatures) {
      skipLinks.addSkipLink('main-content', 'Skip to main content', '#main-content');
      skipLinks.addSkipLink('navigation', 'Skip to navigation', '#navigation');
      skipLinks.addSkipLink('footer', 'Skip to footer', '#footer');
    }
  }, [enableAccessibilityFeatures, skipLinks]);

  // Context value
  const contextValue: AccessibilityContextType = {
    preferences: {
      ...preferences,
      updateFontSize: preferences.updateFontSize,
    },
    screenReader: {
      announce: announcementsEnabled ? screenReader.announce : () => {},
      clearAnnouncements: screenReader.clearAnnouncements,
      announcements: screenReader.announcements,
    },
    validation: {
      touchTargetViolations: validationEnabled ? touchTargetValidation.violations : [],
      contrastViolations: validationEnabled ? contrastValidation.contrastViolations : [],
      validateTouchTargets: validationEnabled ? touchTargetValidation.validateTouchTargets : () => {},
      validateContrast: validationEnabled ? contrastValidation.validateContrast : () => {},
    },
    keyboard,
    liveRegions: {
      announcePolite: announcementsEnabled ? liveRegions.announcePolite : () => {},
      announceAssertive: announcementsEnabled ? liveRegions.announceAssertive : () => {},
      LiveRegions: liveRegions.LiveRegions,
    },
    skipLinks,
    settings: {
      enableAccessibilityFeatures,
      enableValidation: validationEnabled,
      enableAnnouncements: announcementsEnabled,
      toggleAccessibilityFeatures: () => setEnableAccessibilityFeatures(prev => !prev),
      toggleValidation: () => setValidationEnabled(prev => !prev),
      toggleAnnouncements: () => setAnnouncementsEnabled(prev => !prev),
    },
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip links - always rendered but hidden unless focused */}
      <skipLinks.SkipLinks />
      
      {/* Live regions for screen reader announcements */}
      <liveRegions.LiveRegions />
      
      {/* Main content */}
      {children}
      
      {/* Development accessibility panel */}
      {process.env.NODE_ENV === 'development' && enableAccessibilityFeatures && (
        <AccessibilityDevPanel />
      )}
    </AccessibilityContext.Provider>
  );
}

// Development panel for accessibility testing
function AccessibilityDevPanel() {
  const { validation, settings, preferences } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  if (!settings.enableAccessibilityFeatures) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle accessibility panel"
      >
        ♿
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Accessibility Panel</h3>
          
          {/* Settings */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableValidation}
                onChange={settings.toggleValidation}
                className="rounded"
              />
              <span className="text-sm">Enable Validation</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableAnnouncements}
                onChange={settings.toggleAnnouncements}
                className="rounded"
              />
              <span className="text-sm">Enable Announcements</span>
            </label>
          </div>
          
          {/* Font Size Control */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <select
              value={preferences.fontSize}
              onChange={(e) => preferences.updateFontSize(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="x-large">X-Large</option>
            </select>
          </div>
          
          {/* Violations */}
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">Touch Target Violations</h4>
              <p className="text-xs text-gray-600">
                {validation.touchTargetViolations.length} violations found
              </p>
              <button
                onClick={validation.validateTouchTargets}
                className="text-xs text-blue-600 hover:underline"
              >
                Re-validate
              </button>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">Contrast Violations</h4>
              <p className="text-xs text-gray-600">
                {validation.contrastViolations.length} violations found
              </p>
              <button
                onClick={validation.validateContrast}
                className="text-xs text-blue-600 hover:underline"
              >
                Re-validate
              </button>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">System Preferences</h4>
            <div className="space-y-1 text-xs">
              <div>Reduced Motion: {preferences.prefersReducedMotion ? 'Yes' : 'No'}</div>
              <div>High Contrast: {preferences.prefersHighContrast ? 'Yes' : 'No'}</div>
              <div>Color Scheme: {preferences.colorScheme}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}