/**
 * Feature Flag React Hook
 * Easy-to-use hook for component-level feature flagging
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { featureFlagsService } from '../services/feature-flags.service';
import { useUserContext } from './useUserContext';
import type {
  ABTestingError,
  UseFeatureFlagResult
} from '../types/ab-testing';

interface UseFeatureFlagOptions<T = any> {
  /**
   * Default value to use if flag is not found or disabled
   */
  defaultValue?: T;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Custom user context (if not using global context)
   */
  userContext?: any;
  
  /**
   * Whether to automatically refresh the flag value periodically
   */
  autoRefresh?: boolean;
  
  /**
   * Refresh interval in milliseconds (default: 30 seconds)
   */
  refreshInterval?: number;
}

/**
 * Hook to use feature flags in React components
 * 
 * @example
 * ```tsx
 * function NewFeature() {
 *   const { isEnabled } = useFeatureFlag('new_dashboard', { defaultValue: false });
 *   
 *   if (!isEnabled) {
 *     return <LegacyDashboard />;
 *   }
 *   
 *   return <NewDashboard />;
 * }
 * ```
 */
export function useFeatureFlag<T = boolean>(
  flagKey: string,
  options: UseFeatureFlagOptions<T> = {}
): UseFeatureFlagResult & { value: T } {
  const {
    defaultValue = false as T,
    debug = false,
    userContext: customUserContext,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const globalUserContext = useUserContext();
  const userContext = customUserContext || globalUserContext;
  
  const [state, setState] = useState<{
    value: T;
    isEnabled: boolean;
    isLoading: boolean;
    variant: string | null;
    error: ABTestingError | null;
  }>({
    value: defaultValue,
    isEnabled: false,
    isLoading: true,
    variant: null,
    error: null
  });

  // Evaluate flag function
  const evaluateFlag = useCallback(async () => {
    if (!userContext?.user_id || !flagKey) {
      setState({
        value: defaultValue,
        isEnabled: false,
        isLoading: false,
        variant: null,
        error: null
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await featureFlagsService.evaluateFlag(flagKey, userContext, defaultValue);
      
      setState({
        value: result.value,
        isEnabled: result.isEnabled,
        isLoading: false,
        variant: result.variant,
        error: null
      });

      if (debug) {
        console.log('Feature Flag Evaluation:', {
          flag: flagKey,
          value: result.value,
          isEnabled: result.isEnabled,
          variant: result.variant
        });
      }
    } catch (error) {
      const flagError = error instanceof ABTestingError 
        ? error 
        : new ABTestingError('Failed to evaluate feature flag', 'INVALID_CONFIG', error);

      setState({
        value: defaultValue,
        isEnabled: false,
        isLoading: false,
        variant: null,
        error: flagError
      });

      if (debug) {
        console.error('Feature Flag Error:', flagError);
      }
    }
  }, [flagKey, userContext?.user_id, userContext?.session_id, defaultValue, debug]);

  // Initial evaluation
  useEffect(() => {
    evaluateFlag();
  }, [evaluateFlag]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(evaluateFlag, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, evaluateFlag]);

  // Manual refresh function
  const refresh = useCallback(() => {
    evaluateFlag();
  }, [evaluateFlag]);

  // Memoize the return value
  return useMemo(() => ({
    value: state.value,
    isEnabled: state.isEnabled,
    isLoading: state.isLoading,
    variant: state.variant,
    error: state.error,
    refresh
  }), [state.value, state.isEnabled, state.isLoading, state.variant, state.error, refresh]);
}

/**
 * Hook for boolean feature flags with cleaner API
 * 
 * @example
 * ```tsx
 * function NavigationMenu() {
 *   const showNewMenu = useBooleanFlag('new_navigation_menu');
 *   
 *   return showNewMenu ? <NewNavigationMenu /> : <LegacyNavigationMenu />;
 * }
 * ```
 */
export function useBooleanFlag(
  flagKey: string,
  defaultValue = false,
  options?: Omit<UseFeatureFlagOptions<boolean>, 'defaultValue'>
): boolean {
  const { value } = useFeatureFlag(flagKey, { ...options, defaultValue });
  return Boolean(value);
}

/**
 * Hook for string/enum feature flags with type safety
 * 
 * @example
 * ```tsx
 * type Theme = 'light' | 'dark' | 'auto';
 * 
 * function ThemedComponent() {
 *   const theme = useStringFlag<Theme>('ui_theme', 'light');
 *   
 *   return <div className={`theme-${theme}`}>Content</div>;
 * }
 * ```
 */
export function useStringFlag<T extends string>(
  flagKey: string,
  defaultValue: T,
  options?: Omit<UseFeatureFlagOptions<T>, 'defaultValue'>
): T {
  const { value } = useFeatureFlag(flagKey, { ...options, defaultValue });
  return value as T;
}

/**
 * Hook for numeric feature flags
 * 
 * @example
 * ```tsx
 * function PaginationComponent() {
 *   const pageSize = useNumberFlag('pagination_size', 10);
 *   
 *   return <Pagination itemsPerPage={pageSize} />;
 * }
 * ```
 */
export function useNumberFlag(
  flagKey: string,
  defaultValue = 0,
  options?: Omit<UseFeatureFlagOptions<number>, 'defaultValue'>
): number {
  const { value } = useFeatureFlag(flagKey, { ...options, defaultValue });
  return Number(value) || defaultValue;
}

/**
 * Hook for object/JSON feature flags
 * 
 * @example
 * ```tsx
 * interface UIConfig {
 *   showHeader: boolean;
 *   buttonColor: string;
 *   maxItems: number;
 * }
 * 
 * function ConfigurableComponent() {
 *   const config = useObjectFlag<UIConfig>('ui_config', {
 *     showHeader: true,
 *     buttonColor: 'blue',
 *     maxItems: 5
 *   });
 *   
 *   return (
 *     <div>
 *       {config.showHeader && <Header />}
 *       <Button color={config.buttonColor}>
 *         Action ({config.maxItems} items)
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useObjectFlag<T extends Record<string, any>>(
  flagKey: string,
  defaultValue: T,
  options?: Omit<UseFeatureFlagOptions<T>, 'defaultValue'>
): T {
  const { value } = useFeatureFlag(flagKey, { ...options, defaultValue });
  
  // Ensure we return a valid object
  if (typeof value === 'object' && value !== null) {
    return { ...defaultValue, ...value };
  }
  
  return defaultValue;
}

/**
 * Hook to evaluate multiple feature flags at once
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const flags = useMultipleFlags({
 *     newDashboard: { key: 'new_dashboard', defaultValue: false },
 *     darkMode: { key: 'dark_mode', defaultValue: false },
 *     maxWidgets: { key: 'max_widgets', defaultValue: 6 }
 *   });
 *   
 *   return (
 *     <div className={flags.darkMode ? 'dark' : 'light'}>
 *       {flags.newDashboard ? (
 *         <NewDashboard maxWidgets={flags.maxWidgets} />
 *       ) : (
 *         <LegacyDashboard />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultipleFlags<T extends Record<string, { key: string; defaultValue: any }>>(
  flagConfigs: T
): { [K in keyof T]: T[K]['defaultValue'] } {
  const globalUserContext = useUserContext();
  const [flags, setFlags] = useState<{ [K in keyof T]: T[K]['defaultValue'] }>(() => {
    const initial = {} as { [K in keyof T]: T[K]['defaultValue'] };
    Object.entries(flagConfigs).forEach(([name, config]) => {
      initial[name as keyof T] = config.defaultValue;
    });
    return initial;
  });

  useEffect(() => {
    if (!globalUserContext?.user_id) return;

    async function evaluateFlags() {
      try {
        const flagKeys = Object.values(flagConfigs).map(config => config.key);
        const results = await featureFlagsService.evaluateFlags(flagKeys, globalUserContext);
        
        const newFlags = {} as { [K in keyof T]: T[K]['defaultValue'] };
        Object.entries(flagConfigs).forEach(([name, config]) => {
          newFlags[name as keyof T] = results[config.key] !== undefined 
            ? results[config.key] 
            : config.defaultValue;
        });
        
        setFlags(newFlags);
      } catch (error) {
        console.error('Failed to evaluate multiple flags:', error);
      }
    }

    evaluateFlags();
  }, [globalUserContext?.user_id, flagConfigs]);

  return flags;
}

/**
 * Hook for feature flags with gradual rollout
 * Provides rollout percentage information for analytics
 * 
 * @example
 * ```tsx
 * function BetaFeature() {
 *   const { isEnabled, rolloutPercentage } = useRolloutFlag('beta_feature');
 *   
 *   return (
 *     <div>
 *       {isEnabled ? (
 *         <BetaComponent />
 *       ) : (
 *         <StandardComponent />
 *       )}
 *       {rolloutPercentage < 100 && (
 *         <div className="text-xs text-gray-500">
 *           Beta (rolled out to {rolloutPercentage}% of users)
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRolloutFlag(
  flagKey: string,
  options?: UseFeatureFlagOptions<boolean>
): UseFeatureFlagResult & { 
  rolloutPercentage: number;
  isInRollout: boolean;
} {
  const result = useFeatureFlag(flagKey, options);
  const [rolloutInfo, setRolloutInfo] = useState({
    rolloutPercentage: 100,
    isInRollout: false
  });

  useEffect(() => {
    // This would typically fetch rollout information from the flag configuration
    // For now, we'll use mock data based on the flag state
    setRolloutInfo({
      rolloutPercentage: result.isEnabled ? 100 : 0, // Simplified
      isInRollout: result.isEnabled
    });
  }, [result.isEnabled]);

  return {
    ...result,
    rolloutPercentage: rolloutInfo.rolloutPercentage,
    isInRollout: rolloutInfo.isInRollout
  };
}