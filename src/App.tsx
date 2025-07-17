import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { CoachList } from './pages/CoachList';
import { CoachProfile } from './pages/CoachProfile';
import { Profile } from './pages/Profile';
import { Booking } from './pages/Booking';
import { GetStarted } from './pages/onboarding/GetStarted';
import { Dashboard } from './pages/Dashboard';
import { CoachDashboard } from './pages/CoachDashboard';
import { Community } from './pages/community/Community';
import { DiscussionList } from './pages/community/DiscussionList';
import { DiscussionDetails } from './pages/community/DiscussionDetails';
import { GroupList } from './pages/community/GroupList';
import { GroupPage } from './pages/community/GroupPage';
import { EventsCalendar } from './pages/community/EventsCalendar';
import { EventDetails } from './pages/community/EventDetails';
import { MemberProfile } from './pages/community/MemberProfile';
import { LearningHome } from './pages/learning/LearningHome';
import { CourseList } from './pages/learning/CourseList';
import { CourseDetails } from './pages/learning/CourseDetails';
import { ResourceLibrary } from './pages/learning/ResourceLibrary';
import { CoachingBasics } from './pages/learning/CoachingBasics';
import { Login } from './pages/auth/Login';
import { HowItWorks } from './pages/HowItWorks';
import { Pricing } from './pages/Pricing';
import { FAQ } from './pages/FAQ';
import { Support } from './pages/Support';
import { Contact } from './pages/Contact';
import { BecomeCoach } from './pages/BecomeCoach';
import { MySessions } from './pages/MySessions';
import { AccountSettings } from './pages/settings/AccountSettings';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { SecuritySettings } from './pages/settings/SecuritySettings';
import { PaymentSettings } from './pages/settings/PaymentSettings';
import { SubscriptionSettings } from './pages/settings/SubscriptionSettings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
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
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;