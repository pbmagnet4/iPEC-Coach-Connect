import React, { Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingProvider as LazyLoadingProvider } from './components/LazyLoadingWrapper';
import { LoadingProvider } from './components/ui/progressive/LoadingProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { preloadRouteResources } from './utils/preload';
import { useSafeAutofocus, useSafeIntersectionObserver, useScrollRestoration } from './hooks/useScrollRestoration';
import { 
  AuthenticatedRoute, 
  CoachRoute, 
  PublicRoute 
} from './components/auth/ProtectedRoute';

// Lazy load all pages for optimal code splitting
// Core pages (high priority)
const _Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const _Login = React.lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const _OptimizedRegistration = React.lazy(() => import('./pages/auth/OptimizedRegistration').then(module => ({ default: module.OptimizedRegistration })));
const _GetStarted = React.lazy(() => import('./pages/onboarding/GetStarted').then(module => ({ default: module.GetStarted })));

// Coach-related pages
const _CoachList = React.lazy(() => import('./pages/CoachList').then(module => ({ default: module.CoachList })));
const _CoachProfile = React.lazy(() => import('./pages/CoachProfile').then(module => ({ default: module.CoachProfile })));
const _CoachDashboard = React.lazy(() => import('./pages/CoachDashboard').then(module => ({ default: module.CoachDashboard })));
const _BecomeCoach = React.lazy(() => import('./pages/BecomeCoach').then(module => ({ default: module.BecomeCoach })));

// User pages
const _Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const _Booking = React.lazy(() => import('./pages/Booking').then(module => ({ default: module.Booking })));
const _Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const _MySessions = React.lazy(() => import('./pages/MySessions').then(module => ({ default: module.MySessions })));

// Community pages - Enhanced versions with authentication awareness
const _EnhancedCommunity = React.lazy(() => import('./pages/community/EnhancedCommunity').then(module => ({ default: module.EnhancedCommunity })));
const _DiscussionList = React.lazy(() => import('./pages/community/DiscussionList').then(module => ({ default: module.DiscussionList })));
const _EnhancedDiscussionDetails = React.lazy(() => import('./pages/community/EnhancedDiscussionDetails').then(module => ({ default: module.EnhancedDiscussionDetails })));
const _GroupList = React.lazy(() => import('./pages/community/GroupList').then(module => ({ default: module.GroupList })));
const _GroupPage = React.lazy(() => import('./pages/community/GroupPage').then(module => ({ default: module.GroupPage })));
const _EventsCalendar = React.lazy(() => import('./pages/community/EventsCalendar').then(module => ({ default: module.EventsCalendar })));
const _EnhancedEventDetails = React.lazy(() => import('./pages/community/EnhancedEventDetails').then(module => ({ default: module.EnhancedEventDetails })));
const _MemberProfile = React.lazy(() => import('./pages/community/MemberProfile').then(module => ({ default: module.MemberProfile })));

// Learning pages (simplified)
const _AboutCoaching = React.lazy(() => import('./pages/learning/AboutCoaching').then(module => ({ default: module.AboutCoaching })));
const _CoachingResources = React.lazy(() => import('./pages/learning/CoachingResources').then(module => ({ default: module.CoachingResources })));
const _CoachingBasics = React.lazy(() => import('./pages/learning/CoachingBasics').then(module => ({ default: module.CoachingBasics })));

// Info pages
const _HowItWorks = React.lazy(() => import('./pages/HowItWorks').then(module => ({ default: module.HowItWorks })));
const _Pricing = React.lazy(() => import('./pages/Pricing').then(module => ({ default: module.Pricing })));
const _FAQ = React.lazy(() => import('./pages/FAQ').then(module => ({ default: module.FAQ })));
const _Support = React.lazy(() => import('./pages/Support').then(module => ({ default: module.Support })));
const _Contact = React.lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));

// Settings pages
const _AccountSettings = React.lazy(() => import('./pages/settings/AccountSettings').then(module => ({ default: module.AccountSettings })));
const _ProfileSettings = React.lazy(() => import('./pages/settings/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const _SecuritySettings = React.lazy(() => import('./pages/settings/SecuritySettings').then(module => ({ default: module.SecuritySettings })));
const _PaymentSettings = React.lazy(() => import('./pages/settings/PaymentSettings').then(module => ({ default: module.PaymentSettings })));
const _SubscriptionSettings = React.lazy(() => import('./pages/settings/SubscriptionSettings').then(module => ({ default: module.SubscriptionSettings })));

// Preload critical routes
const _preloadCriticalRoutes = () => {
  // Preload core pages that users are likely to visit
  void import('./pages/Home');
  void import('./pages/CoachList');
  void import('./pages/auth/Login');
  void import('./pages/auth/OptimizedRegistration');
  void import('./pages/onboarding/GetStarted');
};

// Start preloading after initial render
if (typeof window !== 'undefined') {
  requestIdleCallback(preloadCriticalRoutes);
}

// Component that uses router hooks - must be inside Router context
function AppWithRouter() {
  // Initialize scroll restoration hooks to fix landing page scroll jump
  useScrollRestoration();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
                  {/* Public Routes - No authentication required */}
                  <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/register" element={<PublicRoute><OptimizedRegistration /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><OptimizedRegistration /></PublicRoute>} />
                  <Route path="/get-started" element={<PublicRoute><GetStarted /></PublicRoute>} />
                  <Route path="/how-it-works" element={<PublicRoute><HowItWorks /></PublicRoute>} />
                  <Route path="/pricing" element={<PublicRoute><Pricing /></PublicRoute>} />
                  <Route path="/faq" element={<PublicRoute><FAQ /></PublicRoute>} />
                  <Route path="/support" element={<PublicRoute><Support /></PublicRoute>} />
                  <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
                  <Route path="/become-coach" element={<PublicRoute><BecomeCoach /></PublicRoute>} />
                  <Route path="/coaches" element={<PublicRoute><CoachList /></PublicRoute>} />
                  <Route path="/coaches/:id" element={<PublicRoute><CoachProfile /></PublicRoute>} />
                  
                  {/* Authenticated Routes - Require login */}
                  <Route path="/profile" element={<AuthenticatedRoute><Profile /></AuthenticatedRoute>} />
                  <Route path="/booking" element={<AuthenticatedRoute><Booking /></AuthenticatedRoute>} />
                  <Route path="/dashboard" element={<AuthenticatedRoute><Dashboard /></AuthenticatedRoute>} />
                  <Route path="/sessions" element={<AuthenticatedRoute><MySessions /></AuthenticatedRoute>} />
                  
                  {/* Coach-Only Routes */}
                  <Route path="/coach/dashboard" element={<CoachRoute><CoachDashboard /></CoachRoute>} />
                  
                  {/* Settings Routes - Require authentication */}
                  <Route path="/settings" element={<AuthenticatedRoute><AccountSettings /></AuthenticatedRoute>} />
                  <Route path="/settings/profile" element={<AuthenticatedRoute><ProfileSettings /></AuthenticatedRoute>} />
                  <Route path="/settings/security" element={<AuthenticatedRoute><SecuritySettings /></AuthenticatedRoute>} />
                  <Route path="/settings/payment" element={<AuthenticatedRoute><PaymentSettings /></AuthenticatedRoute>} />
                  <Route path="/settings/subscription" element={<AuthenticatedRoute><SubscriptionSettings /></AuthenticatedRoute>} />
                  
                  {/* Community Routes - Enhanced with authentication awareness */}
                  <Route path="/community" element={<PublicRoute><EnhancedCommunity /></PublicRoute>} />
                  <Route path="/community/discussions" element={<PublicRoute><DiscussionList /></PublicRoute>} />
                  <Route path="/community/discussions/:id" element={<PublicRoute><EnhancedDiscussionDetails /></PublicRoute>} />
                  <Route path="/community/groups" element={<AuthenticatedRoute><GroupList /></AuthenticatedRoute>} />
                  <Route path="/community/groups/:id" element={<AuthenticatedRoute><GroupPage /></AuthenticatedRoute>} />
                  <Route path="/community/events" element={<PublicRoute><EventsCalendar /></PublicRoute>} />
                  <Route path="/community/events/:id" element={<PublicRoute><EnhancedEventDetails /></PublicRoute>} />
                  <Route path="/community/members/:id" element={<AuthenticatedRoute><MemberProfile /></AuthenticatedRoute>} />

                  {/* Learning Routes - Simplified */}
                  <Route path="/about-coaching" element={<PublicRoute><AboutCoaching /></PublicRoute>} />
                  <Route path="/coaching-resources" element={<PublicRoute><CoachingResources /></PublicRoute>} />
                  <Route path="/coaching-basics" element={<PublicRoute><CoachingBasics /></PublicRoute>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      
      {/* Performance monitoring (development only) */}
      <PerformanceMonitor showInDevelopment={true} position="bottom-right" />
    </div>
  );
}

function App() {
  // Initialize non-router hooks here
  useSafeIntersectionObserver();
  useSafeAutofocus();

  // Preload resources based on route changes
  React.useEffect(() => {
    const _handleRouteChange = () => {
      const _currentPath = window.location.pathname;
      preloadRouteResources(currentPath);
    };
    
    // Initial preload
    handleRouteChange();
    
    // Listen for route changes
  void window.addEventListener('popstate', handleRouteChange);
    
    return () => {
  void window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <LoadingProvider enableAnalytics={true} maxConcurrentLoaders={8}>
        <LazyLoadingProvider>
          <Router>
            <AppWithRouter />
          </Router>
        </LazyLoadingProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}

export default App;