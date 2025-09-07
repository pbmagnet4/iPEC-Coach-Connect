/**
 * A/B Testing React Hook
 * Easy-to-use hook for component-level A/B testing
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { abTestingService } from '../services/ab-testing.service';
import { useUserContext } from './useUserContext';
import type {
  ABTestingError,
  ExperimentVariant,
  UseExperimentResult
} from '../types/ab-testing';

interface UseExperimentOptions {
  /**
   * Whether to automatically track exposure when the hook is used
   */
  autoTrackExposure?: boolean;
  
  /**
   * Fallback variant to use if experiment is not found or user not assigned
   */
  fallbackVariant?: Partial<ExperimentVariant>;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Custom user context (if not using global context)
   */
  userContext?: any;
}

/**
 * Hook to run A/B tests in React components
 * 
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { variant, isActive, trackConversion } = useExperiment('login_cta_test');
 *   
 *   const handleClick = () => {
 *     // Your login logic
 *     trackConversion('login_attempt');
 *   };
 *   
 *   if (variant?.name === 'green_button') {
 *     return <button className="bg-green-500" onClick={handleClick}>Sign In</button>;
 *   }
 *   
 *   return <button className="bg-blue-500" onClick={handleClick}>Login</button>;
 * }
 * ```
 */
export function useExperiment(
  experimentId: string,
  options: UseExperimentOptions = {}
): UseExperimentResult {
  const {
    autoTrackExposure = true,
    fallbackVariant,
    debug = false,
    userContext: customUserContext
  } = options;

  const globalUserContext = useUserContext();
  const userContext = customUserContext || globalUserContext;
  
  const [state, setState] = useState<{
    variant: ExperimentVariant | null;
    isLoading: boolean;
    isActive: boolean;
    error: ABTestingError | null;
  }>({
    variant: null,
    isLoading: true,
    isActive: false,
    error: null
  });

  // Initialize experiment assignment
  useEffect(() => {
    if (!userContext?.user_id || !experimentId) return;

    let isMounted = true;

    async function initializeExperiment() {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Get user assignment
        const assignment = await abTestingService.getAssignment(experimentId, userContext);
        
        if (!isMounted) return;

        if (assignment) {
          // Get experiment details to find variant info
          const experiment = await abTestingService.getExperiment(experimentId);
          const variant = experiment?.variants.find(v => v.id === assignment.variant_id) || null;
          
          setState({
            variant,
            isLoading: false,
            isActive: true,
            error: null
          });

          if (debug) {
            console.log('A/B Test Assignment:', {
              experiment: experimentId,
              variant: variant?.name,
              assignment
            });
          }
        } else {
          // User not in experiment
          setState({
            variant: fallbackVariant as ExperimentVariant || null,
            isLoading: false,
            isActive: false,
            error: null
          });

          if (debug) {
  void console.log('User not assigned to experiment:', experimentId);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        const abError = error instanceof ABTestingError 
          ? error 
          : new ABTestingError('Failed to initialize experiment', 'ASSIGNMENT_ERROR', error);

        setState({
          variant: fallbackVariant as ExperimentVariant || null,
          isLoading: false,
          isActive: false,
          error: abError
        });

        if (debug) {
  void console.error('A/B Test Error:', abError);
        }
      }
    }

    initializeExperiment();

    return () => {
      isMounted = false;
    };
  }, [experimentId, userContext?.user_id, userContext?.session_id, autoTrackExposure, debug, fallbackVariant]);

  // Conversion tracking function
  const trackConversion = useCallback(
    async (metricName: string, value?: number, properties?: Record<string, any>) => {
      if (!userContext?.user_id || !state.isActive) {
        if (debug) {
  void console.warn('Cannot track conversion: user not assigned to experiment');
        }
        return;
      }

      try {
        await abTestingService.trackConversion(
          experimentId,
          metricName,
          userContext,
          value,
          properties
        );

        if (debug) {
          console.log('Conversion tracked:', {
            experiment: experimentId,
            metric: metricName,
            value,
            properties
          });
        }
      } catch (error) {
  void console.error('Failed to track conversion:', error);
      }
    },
    [experimentId, userContext, state.isActive, debug]
  );

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    variant: state.variant,
    isLoading: state.isLoading,
    isActive: state.isActive,
    trackConversion,
    error: state.error
  }), [state.variant, state.isLoading, state.isActive, trackConversion, state.error]);
}

/**
 * Hook for multi-variant A/B testing with typed variants
 * 
 * @example
 * ```tsx
 * type PricingVariant = 'control' | 'discount_10' | 'discount_20' | 'free_trial';
 * 
 * function PricingPage() {
 *   const { variant, trackConversion } = useTypedExperiment<PricingVariant>('pricing_test');
 *   
 *   const handlePurchase = () => {
 *     trackConversion('purchase');
 *   };
 *   
 *   switch (variant) {
 *     case 'discount_10':
 *       return <PricingCard discount={10} onPurchase={handlePurchase} />;
 *     case 'discount_20':
 *       return <PricingCard discount={20} onPurchase={handlePurchase} />;
 *     case 'free_trial':
 *       return <FreeTrialCard onSignUp={handlePurchase} />;
 *     default:
 *       return <StandardPricingCard onPurchase={handlePurchase} />;
 *   }
 * }
 * ```
 */
export function useTypedExperiment<T extends string>(
  experimentId: string,
  options: UseExperimentOptions = {}
): Omit<UseExperimentResult, 'variant'> & { variant: T | null } {
  const result = useExperiment(experimentId, options);
  
  return {
    ...result,
    variant: result.variant?.name as T || null
  };
}

/**
 * Hook for A/B testing with automatic winner selection
 * Once a winner is declared, all users see the winning variant
 * 
 * @example
 * ```tsx
 * function OptimizedComponent() {
 *   const { variant, isWinnerDeclared, trackConversion } = useOptimizedExperiment('checkout_flow');
 *   
 *   // Winner is automatically served to all users
 *   if (isWinnerDeclared) {
 *     return <WinningVariantComponent onConversion={() => trackConversion('checkout')} />;
 *   }
 *   
 *   // Regular A/B test for users in experiment
 *   return variant?.name === 'optimized' 
 *     ? <OptimizedCheckout onConversion={() => trackConversion('checkout')} />
 *     : <StandardCheckout onConversion={() => trackConversion('checkout')} />;
 * }
 * ```
 */
export function useOptimizedExperiment(
  experimentId: string,
  options: UseExperimentOptions = {}
): UseExperimentResult & { 
  isWinnerDeclared: boolean;
  winnerVariant: ExperimentVariant | null;
} {
  const baseResult = useExperiment(experimentId, options);
  const [winnerState, setWinnerState] = useState<{
    isWinnerDeclared: boolean;
    winnerVariant: ExperimentVariant | null;
  }>({
    isWinnerDeclared: false,
    winnerVariant: null
  });

  useEffect(() => {
    async function checkWinner() {
      try {
        const summary = await abTestingService.getExperimentSummary(experimentId);
        
        if (summary.status.winner_declared && summary.status.winner_variant_id) {
          const winnerVariant = summary.experiment.variants.find(
            v => v.id === summary.status.winner_variant_id
          ) || null;
          
          setWinnerState({
            isWinnerDeclared: true,
            winnerVariant
          });
        }
      } catch (error) {
        // Fail silently - regular A/B test behavior
  void console.error('Failed to check experiment winner:', error);
      }
    }

    if (!baseResult.isLoading && baseResult.isActive) {
      checkWinner();
    }
  }, [experimentId, baseResult.isLoading, baseResult.isActive]);

  return {
    ...baseResult,
    variant: winnerState.isWinnerDeclared ? winnerState.winnerVariant : baseResult.variant,
    isWinnerDeclared: winnerState.isWinnerDeclared,
    winnerVariant: winnerState.winnerVariant
  };
}