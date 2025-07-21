import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingProvider as LazyLoadingProvider } from './components/LazyLoadingWrapper';
import { LoadingProvider } from './components/ui/progressive/LoadingProvider';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { preloadRouteResources } from './utils/preload';

// Lazy load all pages for optimal code splitting
// Core pages (high priority)
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Login = React.lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const OptimizedRegistration = React.lazy(() => import('./pages/auth/OptimizedRegistration').then(module => ({ default: module.OptimizedRegistration })));
const GetStarted = React.lazy(() => import('./pages/onboarding/GetStarted').then(module => ({ default: module.GetStarted })));

// Coach-related pages
const CoachList = React.lazy(() => import('./pages/CoachList').then(module => ({ default: module.CoachList })));
const CoachProfile = React.lazy(() => import('./pages/CoachProfile').then(module => ({ default: module.CoachProfile })));
const CoachDashboard = React.lazy(() => import('./pages/CoachDashboard').then(module => ({ default: module.CoachDashboard })));
const BecomeCoach = React.lazy(() => import('./pages/BecomeCoach').then(module => ({ default: module.BecomeCoach })));

// User pages
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Booking = React.lazy(() => import('./pages/Booking').then(module => ({ default: module.Booking })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MySessions = React.lazy(() => import('./pages/MySessions').then(module => ({ default: module.MySessions })));

// Community pages
const Community = React.lazy(() => import('./pages/community/Community').then(module => ({ default: module.Community })));
const DiscussionList = React.lazy(() => import('./pages/community/DiscussionList').then(module => ({ default: module.DiscussionList })));
const DiscussionDetails = React.lazy(() => import('./pages/community/DiscussionDetails').then(module => ({ default: module.DiscussionDetails })));
const GroupList = React.lazy(() => import('./pages/community/GroupList').then(module => ({ default: module.GroupList })));
const GroupPage = React.lazy(() => import('./pages/community/GroupPage').then(module => ({ default: module.GroupPage })));
const EventsCalendar = React.lazy(() => import('./pages/community/EventsCalendar').then(module => ({ default: module.EventsCalendar })));
const EventDetails = React.lazy(() => import('./pages/community/EventDetails').then(module => ({ default: module.EventDetails })));
const MemberProfile = React.lazy(() => import('./pages/community/MemberProfile').then(module => ({ default: module.MemberProfile })));

// Learning pages
const LearningHome = React.lazy(() => import('./pages/learning/LearningHome').then(module => ({ default: module.LearningHome })));
const CourseList = React.lazy(() => import('./pages/learning/CourseList').then(module => ({ default: module.CourseList })));
const CourseDetails = React.lazy(() => import('./pages/learning/CourseDetails').then(module => ({ default: module.CourseDetails })));
const ResourceLibrary = React.lazy(() => import('./pages/learning/ResourceLibrary').then(module => ({ default: module.ResourceLibrary })));
const CoachingBasics = React.lazy(() => import('./pages/learning/CoachingBasics').then(module => ({ default: module.CoachingBasics })));

// Info pages
const HowItWorks = React.lazy(() => import('./pages/HowItWorks').then(module => ({ default: module.HowItWorks })));
const Pricing = React.lazy(() => import('./pages/Pricing').then(module => ({ default: module.Pricing })));
const FAQ = React.lazy(() => import('./pages/FAQ').then(module => ({ default: module.FAQ })));
const Support = React.lazy(() => import('./pages/Support').then(module => ({ default: module.Support })));
const Contact = React.lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })));

// Settings pages
const AccountSettings = React.lazy(() => import('./pages/settings/AccountSettings').then(module => ({ default: module.AccountSettings })));
const ProfileSettings = React.lazy(() => import('./pages/settings/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const SecuritySettings = React.lazy(() => import('./pages/settings/SecuritySettings').then(module => ({ default: module.SecuritySettings })));
const PaymentSettings = React.lazy(() => import('./pages/settings/PaymentSettings').then(module => ({ default: module.PaymentSettings })));
const SubscriptionSettings = React.lazy(() => import('./pages/settings/SubscriptionSettings').then(module => ({ default: module.SubscriptionSettings })));

// Preload critical routes
const preloadCriticalRoutes = () => {
  // Preload core pages that users are likely to visit
  import('./pages/Home');
  import('./pages/CoachList');
  import('./pages/auth/Login');
  import('./pages/auth/OptimizedRegistration');
  import('./pages/onboarding/GetStarted');
};

// Start preloading after initial render
if (typeof window !== 'undefined') {
  requestIdleCallback(preloadCriticalRoutes);
}

function App() {
  // Preload resources based on route changes
  React.useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;
      preloadRouteResources(currentPath);
    };
    
    // Initial preload
    handleRouteChange();
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <LoadingProvider enableAnalytics={true} maxConcurrentLoaders={8}>
        <LazyLoadingProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navigation />
              <main className="flex-1">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<OptimizedRegistration />} />
                  <Route path="/signup" element={<OptimizedRegistration />} />
                  <Route path="/get-started" element={<GetStarted />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/become-coach" element={<BecomeCoach />} />
                  <Route path="/coaches" element={<CoachList />} />
                  <Route path="/coaches/:id" element={<CoachProfile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/coach/dashboard" element={<CoachDashboard />} />
                  <Route path="/sessions" element={<MySessions />} />
                  
                  {/* Settings Routes */}
                  <Route path="/settings" element={<AccountSettings />} />
                  <Route path="/settings/profile" element={<ProfileSettings />} />
                  <Route path="/settings/security" element={<SecuritySettings />} />
                  <Route path="/settings/payment" element={<PaymentSettings />} />
                  <Route path="/settings/subscription" element={<SubscriptionSettings />} />
                  
                  {/* Community Routes */}
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/discussions" element={<DiscussionList />} />
                  <Route path="/community/discussions/:id" element={<DiscussionDetails />} />
                  <Route path="/community/groups" element={<GroupList />} />
                  <Route path="/community/groups/:id" element={<GroupPage />} />
                  <Route path="/community/events" element={<EventsCalendar />} />
                  <Route path="/community/events/:id" element={<EventDetails />} />
                  <Route path="/community/members/:id" element={<MemberProfile />} />

                  {/* Learning Routes */}
                  <Route path="/learning" element={<LearningHome />} />
                  <Route path="/learning/courses" element={<CourseList />} />
                  <Route path="/learning/courses/:id" element={<CourseDetails />} />
                  <Route path="/learning/resources" element={<ResourceLibrary />} />
                  <Route path="/learning/coaching-basics" element={<CoachingBasics />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            
            {/* Performance monitoring (development only) */}
            <PerformanceMonitor showInDevelopment={true} position="bottom-right" />
          </div>
        </Router>
      </LazyLoadingProvider>
    </LoadingProvider>
  </ErrorBoundary>
  );
}

export default App;