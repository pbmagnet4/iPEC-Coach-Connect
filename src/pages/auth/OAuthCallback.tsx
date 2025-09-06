/**
 * OAuth Callback Handler for iPEC Coach Connect
 * 
 * Handles OAuth callback from external providers with CSRF protection
 * and proper error handling.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { clearCSRFTokens, validateOAuthState } from '../../lib/csrf-protection';
import { logAuth, logSecurity } from '../../lib/secure-logger';
import { recordAuthAttempt } from '../../lib/rate-limiter';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Shield,
  XCircle
} from 'lucide-react';

interface CallbackState {
  status: 'loading' | 'success' | 'error' | 'security_error';
  message: string;
  redirectTo?: string;
  countdown?: number;
}

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing authentication...'
  });

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get URL parameters
      const code = searchParams.get('code');
      const stateParam = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors from provider
      if (error) {
        logSecurity('OAuth provider error', 'medium', {
          error,
          errorDescription,
          provider: 'google' // Assuming Google for now
        });

        setState({
          status: 'error',
          message: `Authentication failed: ${errorDescription || error}`
        });
        return;
      }

      // Validate CSRF state parameter
      if (!stateParam) {
        logSecurity('OAuth callback missing state parameter', 'high', {
          url: window.location.href,
          hasCode: !!code
        });

        setState({
          status: 'security_error',
          message: 'Security validation failed: Missing state parameter'
        });
        return;
      }

      const stateValidation = validateOAuthState(stateParam);
      if (!stateValidation.valid) {
        logSecurity('OAuth state validation failed', 'high', {
          reason: stateValidation.reason,
          stateParam: `${stateParam.substring(0, 20)  }...`
        });

        setState({
          status: 'security_error',
          message: `Security validation failed: ${stateValidation.reason}`
        });
        return;
      }

      // Exchange code for session
      if (code) {
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionError) {
          logSecurity('OAuth session exchange failed', 'high', {
            error: sessionError.message,
            code: sessionError.code
          });

          recordAuthAttempt('auth.oauth', false);
          
          setState({
            status: 'error',
            message: 'Failed to complete authentication. Please try again.'
          });
          return;
        }

        if (data.user) {
          logAuth('oauth_success', true, {
            provider: 'google',
            userId: data.user.id
          });

          recordAuthAttempt('auth.oauth', true);

          setState({
            status: 'success',
            message: 'Authentication successful! Redirecting...',
            redirectTo: stateValidation.redirectTo || '/dashboard',
            countdown: 3
          });

          // Start countdown and redirect
          startRedirectCountdown(stateValidation.redirectTo || '/dashboard');
        } else {
          setState({
            status: 'error',
            message: 'Authentication completed but user data is not available.'
          });
        }
      } else {
        setState({
          status: 'error',
          message: 'Authentication failed: No authorization code received.'
        });
      }
    } catch (error) {
      logSecurity('OAuth callback processing error', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: window.location.href
      });

      setState({
        status: 'error',
        message: 'An unexpected error occurred during authentication.'
      });
    }
  };

  const startRedirectCountdown = (redirectTo: string) => {
    let countdown = 3;
    const interval = setInterval(() => {
      countdown--;
      setState(prev => ({ ...prev, countdown }));
      
      if (countdown <= 0) {
        clearInterval(interval);
        navigate(redirectTo, { replace: true });
      }
    }, 1000);
  };

  const handleManualRedirect = () => {
    if (state.redirectTo) {
      navigate(state.redirectTo, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleRetryAuth = () => {
    // Clear any existing CSRF tokens and redirect to login
    clearCSRFTokens();
    navigate('/auth/login', { replace: true });
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'security_error':
        return <Shield className="h-8 w-8 text-red-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'security_error':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 py-12 flex items-center justify-center">
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <Card.Body className="p-8 text-center">
              <div className="mb-6">
                {getStatusIcon()}
              </div>

              <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
                {state.status === 'loading' && 'Authenticating...'}
                {state.status === 'success' && 'Success!'}
                {state.status === 'security_error' && 'Security Error'}
                {state.status === 'error' && 'Authentication Failed'}
              </h1>

              <p className="text-gray-600 mb-6">
                {state.message}
              </p>

              {state.status === 'success' && state.countdown !== undefined && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    Redirecting in {state.countdown} second{state.countdown !== 1 ? 's' : ''}...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - state.countdown) / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {state.status === 'success' && (
                <button
                  onClick={handleManualRedirect}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue to Dashboard
                </button>
              )}

              {(state.status === 'error' || state.status === 'security_error') && (
                <div className="space-y-3">
                  <button
                    onClick={handleRetryAuth}
                    className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Try Again
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    <p>If the problem persists, please contact support.</p>
                  </div>
                </div>
              )}

              {state.status === 'security_error' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Security Notice</p>
                      <p>
                        This authentication attempt failed security validation. 
                        This could indicate a potential security issue or an expired authentication session.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="/contact" className="text-brand-600 hover:text-brand-700">Contact Support</a>
          </p>
        </div>
      </Container>
    </div>
  );
}