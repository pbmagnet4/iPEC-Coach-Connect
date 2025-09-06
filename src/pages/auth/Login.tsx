import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  AlertCircle, 
  ArrowRight, 
  Lock,
  LogIn,
  Mail
} from 'lucide-react';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Here you would typically make an API call to authenticate
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Here you would implement Google Sign-In
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard');
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 py-12">
      <Container size="sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <LogIn className="h-12 w-12 text-brand-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">
            Log in to your iPEC Coach Connect account
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <Card.Body className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mb-6">
                <GoogleSignInButton
                  onError={(error) => setError(error.message)}
                  redirectTo="/dashboard"
                />
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  icon={<Mail className="h-5 w-5" />}
                  required
                />

                <div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    icon={<Lock className="h-5 w-5" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-gray-600 hover:text-brand-600 mt-1"
                  >
                    {showPassword ? 'Hide' : 'Show'} password
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  isLoading={isLoading}
                  icon={<ArrowRight className="h-5 w-5" />}
                >
                  Log In
                </Button>
              </form>

              <p className="text-center mt-8 text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/get-started"
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Get Started
                </Link>
              </p>
            </Card.Body>
          </Card>
        </motion.div>

        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-900">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-gray-900">
              Contact Us
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} iPEC Coach Connect. All rights reserved.
          </p>
        </div>
      </Container>
    </div>
  );
}