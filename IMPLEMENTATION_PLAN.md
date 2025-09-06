# iPEC Coach Connect - Implementation Plan

## Executive Summary

Based on the gap analysis, this implementation plan prioritizes critical revenue features, leverages existing foundations, and provides actionable week-by-week deliverables for completing the platform.

## Current State Analysis

### ✅ Strong Foundations (Available)
- **Authentication System**: Complete with Google Sign-In, MFA support
- **Database Schema**: Comprehensive tables for all core features
- **UI Component Library**: Modern React components with TypeScript
- **State Management**: Zustand store with proper patterns
- **Development Infrastructure**: Testing, deployment, monitoring

### 🔧 Partial Implementations (Need Completion)
- **Booking Service**: Service layer exists but lacks Stripe integration
- **Payment Settings**: UI exists but not connected to backend
- **Coach Discovery**: Components exist but need API integration
- **Community Features**: UI components available but incomplete functionality

### ❌ Critical Gaps (Must Build)
- **Stripe Payment Processing**: No actual payment integration
- **Coach Onboarding Flow**: Missing verification process
- **Real-time Messaging**: Backend not implemented
- **Calendar Integration**: Basic booking UI only

## Implementation Strategy

### Phase 1: Revenue-Critical Features (Weeks 1-4)
Focus on features that directly enable revenue generation.

### Phase 2: Core Platform Features (Weeks 5-8)
Complete essential user experience and engagement features.

### Phase 3: Enhancement & Polish (Weeks 9-12)
Advanced features, performance optimization, and comprehensive testing.

---

# Phase 1: Revenue-Critical Features (Weeks 1-4)

## Week 1: Stripe Payment Integration

### 🎯 Primary Goals
- Integrate Stripe Elements with React
- Connect payment forms to actual processing
- Implement secure payment flow

### 📋 Deliverables

#### Day 1-2: Setup Stripe Infrastructure
```typescript
// Install dependencies
npm install @stripe/stripe-js @stripe/react-stripe-js

// Environment configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Day 3-4: Payment Component Integration
Create `src/components/payments/StripePaymentForm.tsx`:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

export const StripePaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // Create payment intent on backend
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    
    const { clientSecret } = await response.json();

    // Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (result.error) {
      onError(result.error.message || 'Payment failed');
    } else {
      onSuccess(result.paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement 
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
            },
          },
        }}
      />
      <button type="submit" disabled={!stripe}>
        Pay ${(amount / 100).toFixed(2)}
      </button>
    </form>
  );
};
```

#### Day 5: Backend Payment Endpoints
Create Supabase Edge Functions for payment processing:
```typescript
// supabase/functions/create-payment-intent/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-08-16',
});

serve(async (req) => {
  const { amount, sessionId } = await req.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { sessionId },
  });

  return new Response(
    JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 🧪 Testing Requirements
- Unit tests for payment components
- Integration tests with Stripe test cards
- Error handling for payment failures

### 📊 Success Criteria
- ✅ Payment forms accept real credit cards
- ✅ Successful payments create database records
- ✅ Payment errors display user-friendly messages
- ✅ Webhook handles payment confirmations

---

## Week 2: Coach Onboarding & Verification

### 🎯 Primary Goals
- Build coach application and verification flow
- Implement iPEC certification validation
- Create coach profile completion system

### 📋 Deliverables

#### Day 1-2: Coach Application Form
Create `src/pages/BecomeCoach.tsx`:
```typescript
interface CoachApplicationData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
  };
  certification: {
    ipecNumber: string;
    certificationLevel: 'Associate' | 'Professional' | 'Master';
    certificationDate: string;
    certificateUpload: File;
  };
  experience: {
    yearsExperience: number;
    specializations: string[];
    previousCoaching: boolean;
    otherCertifications: string[];
  };
  business: {
    hourlyRate: number;
    availability: string;
    languages: string[];
    services: string[];
  };
}

export const BecomeCoach = () => {
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState<CoachApplicationData>();
  
  const handleSubmitApplication = async () => {
    // Submit to backend for review
    const response = await coachService.submitApplication(applicationData);
    // Handle success/error
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ProgressSteps current={step} total={4} />
      {/* Multi-step form implementation */}
    </div>
  );
};
```

#### Day 3-4: Admin Verification Dashboard
Create `src/pages/admin/CoachVerification.tsx`:
```typescript
export const CoachVerificationDashboard = () => {
  const [pendingApplications, setPendingApplications] = useState([]);
  
  const handleApproveCoach = async (coachId: string) => {
    await coachService.approveCoach(coachId);
    // Send approval email
    // Update coach status
  };

  const handleRejectCoach = async (coachId: string, reason: string) => {
    await coachService.rejectCoach(coachId, reason);
    // Send rejection email with feedback
  };

  return (
    <div>
      <h1>Coach Verification</h1>
      {pendingApplications.map(application => (
        <CoachApplicationCard 
          key={application.id}
          application={application}
          onApprove={handleApproveCoach}
          onReject={handleRejectCoach}
        />
      ))}
    </div>
  );
};
```

#### Day 5: Integration & Testing
- Connect forms to Supabase
- Implement file upload for certificates
- Test entire verification workflow

### 📊 Success Criteria
- ✅ Coaches can submit complete applications
- ✅ Admin can review and approve/reject coaches
- ✅ Email notifications sent for status changes
- ✅ Approved coaches can access coach features

---

## Week 3: Core Booking System

### 🎯 Primary Goals
- Complete booking flow with payment
- Implement calendar availability
- Create session management

### 📋 Deliverables

#### Day 1-2: Calendar Integration
Install and configure react-big-calendar:
```typescript
// src/components/booking/CoachCalendar.tsx
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

export const CoachCalendar: React.FC<{
  coachId: string;
  onSelectSlot: (slotInfo: any) => void;
}> = ({ coachId, onSelectSlot }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const localizer = momentLocalizer(moment);

  useEffect(() => {
    loadCoachAvailability();
  }, [coachId]);

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      onSelectSlot={onSelectSlot}
      selectable
      style={{ height: 500 }}
    />
  );
};
```

#### Day 3-4: Complete Booking Flow
Update `src/pages/Booking.tsx` to integrate with payment:
```typescript
const completeBooking = async () => {
  try {
    // Create session record
    const session = await bookingService.createSession({
      coachId: selectedCoach,
      sessionTypeId: selectedSessionType,
      scheduledAt: selectedDateTime,
      clientNotes: formData.concerns,
    });

    // Process payment
    const paymentResult = await processPayment(session.id, totalAmount);
    
    if (paymentResult.success) {
      // Update session with payment info
      await bookingService.confirmPayment(session.id, paymentResult.paymentIntentId);
      
      // Send confirmations
      await notificationService.sendBookingConfirmation(session.id);
      
      // Redirect to success page
      navigate('/booking/success', { state: { sessionId: session.id } });
    }
  } catch (error) {
    setError('Booking failed. Please try again.');
  }
};
```

#### Day 5: Session Management
Create `src/components/sessions/SessionManager.tsx`:
```typescript
export const SessionManager = () => {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState([]);

  const handleReschedule = async (sessionId: string, newDateTime: Date) => {
    await bookingService.rescheduleSession(sessionId, newDateTime);
    // Refresh sessions list
  };

  const handleCancel = async (sessionId: string, reason: string) => {
    await bookingService.cancelSession(sessionId, reason);
    // Handle refund logic
  };

  return (
    <div className="space-y-4">
      {sessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          userRole={role}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
};
```

### 📊 Success Criteria
- ✅ End-to-end booking with payment works
- ✅ Calendar shows available time slots
- ✅ Sessions can be rescheduled/cancelled
- ✅ Confirmation emails are sent

---

## Week 4: Basic Messaging System

### 🎯 Primary Goals
- Implement real-time chat between coaches and clients
- Create message thread management
- Add basic notification system

### 📋 Deliverables

#### Day 1-2: Supabase Realtime Setup
Configure Supabase for real-time messaging:
```sql
-- Add messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES message_threads(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER publication supabase_realtime ADD TABLE messages;
```

#### Day 3-4: Chat Components
Create `src/components/messaging/ChatInterface.tsx`:
```typescript
export const ChatInterface: React.FC<{
  threadId: string;
  currentUserId: string;
}> = ({ threadId, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:thread_id=eq.${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [threadId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await messagingService.sendMessage({
      threadId,
      senderId: currentUserId,
      content: newMessage,
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-96">
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput 
        value={newMessage}
        onChange={setNewMessage}
        onSend={sendMessage}
      />
    </div>
  );
};
```

#### Day 5: Integration & Polish
- Connect messaging to session records
- Add message thread creation
- Implement basic push notifications

### 📊 Success Criteria
- ✅ Real-time messaging works between users
- ✅ Message history is persisted
- ✅ Notifications for new messages
- ✅ Messages are tied to coaching sessions

---

# Phase 2: Core Platform Features (Weeks 5-8)

## Week 5: Enhanced Coach Discovery

### 🎯 Primary Goals
- Connect coach search to real data
- Implement filtering and sorting
- Add coach profile pages

### 📋 Deliverables

#### Day 1-2: Search Backend Integration
Update `src/services/coach.service.ts`:
```typescript
interface CoachSearchFilters {
  specializations?: string[];
  priceRange?: { min: number; max: number };
  availability?: { day: string; time: string };
  location?: string;
  rating?: number;
}

class CoachService {
  async searchCoaches(filters: CoachSearchFilters = {}): Promise<CoachWithProfile[]> {
    let query = supabase
      .from('coaches')
      .select(`
        *,
        profile:profiles(*),
        availability:coach_availability(*),
        sessions!sessions_coach_id_fkey(rating)
      `)
      .eq('is_active', true);

    // Apply filters
    if (filters.specializations?.length) {
      query = query.overlaps('specializations', filters.specializations);
    }

    if (filters.priceRange) {
      query = query
        .gte('hourly_rate', filters.priceRange.min)
        .lte('hourly_rate', filters.priceRange.max);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate ratings and apply additional filters
    return this.processCoachResults(data, filters);
  }

  private processCoachResults(coaches: any[], filters: CoachSearchFilters) {
    return coaches.map(coach => ({
      ...coach,
      averageRating: this.calculateAverageRating(coach.sessions),
      nextAvailable: this.getNextAvailableSlot(coach.availability),
    })).filter(coach => {
      if (filters.rating && coach.averageRating < filters.rating) {
        return false;
      }
      return true;
    });
  }
}
```

#### Day 3-4: Enhanced Search UI
Update `src/pages/CoachList.tsx`:
```typescript
export const CoachList = () => {
  const [coaches, setCoaches] = useState<CoachWithProfile[]>([]);
  const [filters, setFilters] = useState<CoachSearchFilters>({});
  const [loading, setLoading] = useState(false);

  const searchCoaches = async () => {
    setLoading(true);
    try {
      const results = await coachService.searchCoaches(filters);
      setCoaches(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <div className="w-1/4">
        <CoachFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={searchCoaches}
        />
      </div>
      <div className="w-3/4">
        {loading ? (
          <CoachListSkeleton />
        ) : (
          <CoachGrid coaches={coaches} />
        )}
      </div>
    </div>
  );
};
```

### Quick Win Tasks (1-2 hours each)
1. **Connect existing forms to Supabase**: Update registration forms to save data
2. **Replace mock data in coach cards**: Use real coach profiles
3. **Add loading states**: Implement skeleton screens
4. **Basic search functionality**: Text search across coach profiles

### 📊 Success Criteria
- ✅ Search returns real coach data
- ✅ Filters work correctly
- ✅ Coach profiles display accurate information
- ✅ Performance is acceptable (<2s search)

## Week 6: Community Features Backend

### 🎯 Primary Goals
- Implement discussion/forum functionality
- Add group management
- Enable content moderation

### 📋 Deliverables

#### Day 1-2: Discussion API Integration
Create `src/services/community.service.ts`:
```typescript
class CommunityService {
  async createDiscussion(data: CreateDiscussionData): Promise<Discussion> {
    const { data: discussion, error } = await supabase
      .from('discussions')
      .insert({
        title: data.title,
        content: data.content,
        author_id: data.authorId,
        group_id: data.groupId,
      })
      .select('*, author:profiles(*), group:groups(*)')
      .single();

    if (error) throw error;
    return discussion;
  }

  async getDiscussions(groupId?: string): Promise<DiscussionWithDetails[]> {
    let query = supabase
      .from('discussions')
      .select(`
        *,
        author:profiles(*),
        group:groups(*),
        replies:discussion_replies(
          *,
          author:profiles(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
```

#### Day 3-4: Real-time Updates
Add real-time subscriptions for community features:
```typescript
export const useDiscussionSubscription = (groupId?: string) => {
  const [discussions, setDiscussions] = useState<DiscussionWithDetails[]>([]);

  useEffect(() => {
    let channel = supabase.channel('discussions');
    
    if (groupId) {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'discussions',
        filter: `group_id=eq.${groupId}`,
      }, handleDiscussionChange);
    }

    channel.subscribe();

    return () => supabase.removeChannel(channel);
  }, [groupId]);

  const handleDiscussionChange = (payload: any) => {
    // Update discussions state based on change type
  };

  return { discussions, setDiscussions };
};
```

#### Day 5: Content Moderation
Implement basic moderation tools:
```typescript
export const ModerationDashboard = () => {
  const [flaggedContent, setFlaggedContent] = useState([]);

  const handleContentAction = async (contentId: string, action: 'approve' | 'remove') => {
    await communityService.moderateContent(contentId, action);
    // Update UI
  };

  return (
    <div>
      <h2>Content Moderation</h2>
      {flaggedContent.map(content => (
        <ContentModerationCard 
          key={content.id}
          content={content}
          onAction={handleContentAction}
        />
      ))}
    </div>
  );
};
```

## Week 7: Dashboard & Analytics Integration

### 🎯 Primary Goals
- Connect dashboards to real data
- Implement basic analytics
- Create performance metrics

### 📋 Deliverables

#### Day 1-2: Client Dashboard
Update `src/pages/Dashboard.tsx`:
```typescript
export const Dashboard = () => {
  const { user, role } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>();

  useEffect(() => {
    if (role === 'client') {
      loadClientDashboard();
    } else if (role === 'coach') {
      loadCoachDashboard();
    }
  }, [role]);

  const loadClientDashboard = async () => {
    const [sessions, progress, recommendations] = await Promise.all([
      sessionService.getUserSessions({ limit: 5, upcoming: true }),
      progressService.getProgress(user!.id),
      recommendationService.getRecommendations(user!.id),
    ]);

    setDashboardData({
      upcomingSessions: sessions.data,
      progressMetrics: progress,
      recommendations,
    });
  };

  return (
    <div className="space-y-6">
      <DashboardHeader user={user} role={role} />
      
      {role === 'client' && (
        <>
          <UpcomingSessionsCard sessions={dashboardData?.upcomingSessions} />
          <ProgressCard metrics={dashboardData?.progressMetrics} />
          <RecommendationsCard recommendations={dashboardData?.recommendations} />
        </>
      )}

      {role === 'coach' && <CoachDashboardContent />}
    </div>
  );
};
```

#### Day 3-4: Analytics Implementation
Create `src/services/analytics.service.ts`:
```typescript
interface AnalyticsEvent {
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

class AnalyticsService {
  async trackEvent(event: string, properties: Record<string, any> = {}) {
    const { user } = authService.getState();
    if (!user) return;

    // Track to Supabase
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event,
      properties,
    });

    // Optional: Also track to external service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, properties);
    }
  }

  async getDashboardMetrics(userId: string, role: string) {
    if (role === 'client') {
      return this.getClientMetrics(userId);
    } else if (role === 'coach') {
      return this.getCoachMetrics(userId);
    }
  }

  private async getClientMetrics(userId: string) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', userId);

    return {
      totalSessions: sessions?.length || 0,
      completedSessions: sessions?.filter(s => s.status === 'completed').length || 0,
      upcomingSessions: sessions?.filter(s => 
        s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
      ).length || 0,
    };
  }
}
```

## Week 8: Performance & Polish

### 🎯 Primary Goals
- Optimize application performance
- Improve user experience
- Fix bugs and edge cases

### 📋 Deliverables

#### Day 1-2: Performance Optimization
```typescript
// Implement React Query for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Add to main App.tsx
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>

// Use in components
const useCoaches = (filters: CoachSearchFilters) => {
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: () => coachService.searchCoaches(filters),
    enabled: !!filters,
  });
};
```

#### Day 3-4: Error Handling & Loading States
```typescript
// Global error boundary
export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App error:', error, errorInfo);
        analyticsService.trackEvent('app_error', {
          error: error.message,
          stack: error.stack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Loading state hook
export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (asyncFunction: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute };
};
```

#### Day 5: Testing & Bug Fixes
```typescript
// Integration tests
describe('Booking Flow', () => {
  test('complete booking with payment', async () => {
    render(<BookingPage />);
    
    // Select session type
    fireEvent.click(screen.getByText('Single Session'));
    fireEvent.click(screen.getByText('Continue'));
    
    // Select date/time
    fireEvent.click(screen.getByText('20')); // March 20
    fireEvent.click(screen.getByText('10:00 AM'));
    fireEvent.click(screen.getByText('Continue'));
    
    // Fill details
    fireEvent.change(screen.getByPlaceholderText('Share what\'s bringing you to coaching...'), {
      target: { value: 'Test concerns' }
    });
    fireEvent.click(screen.getByText('Continue'));
    
    // Payment (mock)
    fireEvent.click(screen.getByText('Confirm & Pay'));
    
    await waitFor(() => {
      expect(screen.getByText('Your Session is Confirmed!')).toBeInTheDocument();
    });
  });
});
```

---

# Phase 3: Enhancement & Polish (Weeks 9-12)

## Week 9: Advanced Features

### 🎯 Primary Goals
- Video calling integration
- Advanced analytics
- Mobile app optimization

### 📋 Deliverables

#### Day 1-3: Video Calling Integration
```typescript
// Using Daily.co for video calls
import { DailyProvider, useDaily } from '@daily-co/daily-react';

const VideoSession: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const daily = useDaily();
  const [roomUrl, setRoomUrl] = useState<string>();

  useEffect(() => {
    // Create room for session
    const createRoom = async () => {
      const response = await fetch('/api/video/create-room', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      const { url } = await response.json();
      setRoomUrl(url);
      daily?.join({ url });
    };
    
    createRoom();
  }, [sessionId]);

  return (
    <div className="video-container h-96">
      {/* Video interface */}
    </div>
  );
};
```

#### Day 4-5: Advanced Analytics
```typescript
const CoachAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<CoachMetrics>();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const data = await analyticsService.getCoachMetrics();
    setMetrics(data);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <MetricCard
        title="Revenue This Month"
        value={`$${metrics?.monthlyRevenue || 0}`}
        change={metrics?.revenueChange}
      />
      <MetricCard
        title="Sessions Completed"
        value={metrics?.completedSessions || 0}
        change={metrics?.sessionsChange}
      />
      <MetricCard
        title="Client Satisfaction"
        value={`${metrics?.averageRating || 0}/5`}
        change={metrics?.ratingChange}
      />
    </div>
  );
};
```

## Week 10: Testing & Quality Assurance

### 🎯 Primary Goals
- Comprehensive E2E testing
- Performance testing
- Security audit

### 📋 Deliverables

#### Day 1-2: E2E Test Suite
```typescript
// tests/e2e/complete-booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Booking Flow', () => {
  test('user can book and pay for session', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    await page.goto('/coaches');
    await page.click('[data-testid="coach-card"]').first();
    await page.click('[data-testid="book-session"]');

    // Select session type
    await page.click('[data-testid="session-discovery"]');
    await page.click('[data-testid="continue"]');

    // Select date and time
    await page.click('[data-testid="date-20"]');
    await page.click('[data-testid="time-1000"]');
    await page.click('[data-testid="continue"]');

    // Fill session details
    await page.fill('[data-testid="concerns"]', 'Test booking concerns');
    await page.click('[data-testid="continue"]');

    // Payment (using test card)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.check('[data-testid="agree-terms"]');
    await page.click('[data-testid="confirm-payment"]');

    // Verify success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });
});
```

#### Day 3-4: Performance Testing
```javascript
// k6 performance test
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
  ],
};

export default function () {
  let response = http.get('https://your-app.com/api/coaches');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

#### Day 5: Security Audit
- SQL injection testing
- XSS vulnerability testing
- Authentication bypass testing
- Data validation testing

## Week 11: Deployment & Monitoring

### 🎯 Primary Goals
- Production deployment
- Monitoring setup
- Backup systems

### 📋 Deliverables

#### Day 1-2: Production Setup
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

#### Day 3-4: Monitoring & Analytics
```typescript
// Error tracking with Sentry
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

// Performance monitoring
const performanceMonitor = {
  trackPageView: (page: string) => {
    const startTime = performance.now();
    
    // Track when page fully loads
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      analyticsService.trackEvent('page_load', {
        page,
        loadTime,
      });
    });
  },
};
```

#### Day 5: Documentation
- API documentation
- User guides
- Admin documentation
- Troubleshooting guides

## Week 12: Launch Preparation

### 🎯 Primary Goals
- Final testing
- User training
- Go-live preparation

### 📋 Deliverables

#### Day 1-2: Final QA Testing
- Complete regression testing
- User acceptance testing
- Performance validation
- Security verification

#### Day 3-4: User Training & Documentation
```markdown
# Coach Onboarding Guide

## Getting Started
1. Complete your profile
2. Upload certification documents
3. Set your availability
4. Configure payment settings

## Managing Sessions
- View upcoming sessions
- Reschedule when needed
- Add session notes
- Complete session reviews
```

#### Day 5: Go-Live
- Final deployment
- Monitoring activation
- Support team readiness
- Launch announcement

---

# Technical Specifications

## Database Schema Updates

```sql
-- Payment methods table
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coach applications table
CREATE TABLE coach_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  application_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message threads table
CREATE TABLE message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  session_id UUID REFERENCES sessions(id),
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## API Endpoints

```typescript
// Payment endpoints
POST   /api/payments/create-intent
POST   /api/payments/confirm
POST   /api/payments/refund
GET    /api/payments/methods

// Coach endpoints
POST   /api/coaches/apply
GET    /api/coaches/search
PUT    /api/coaches/:id/verify
GET    /api/coaches/:id/availability

// Booking endpoints
POST   /api/bookings
PUT    /api/bookings/:id/reschedule
PUT    /api/bookings/:id/cancel
GET    /api/bookings/user

// Messaging endpoints
POST   /api/messages/thread
POST   /api/messages/send
GET    /api/messages/threads
```

## Testing Strategy

### Unit Testing (60% coverage minimum)
- Service layer functions
- Component logic
- Utility functions
- Form validation

### Integration Testing (Core flows)
- Authentication flow
- Booking flow with payment
- Coach onboarding
- Messaging system

### E2E Testing (Critical paths)
- Complete user registration
- End-to-end booking process
- Coach verification workflow
- Payment processing

## Success Metrics

### Business Metrics
- **Booking conversion rate**: >15% of visitors book sessions
- **Payment success rate**: >95% of attempted payments succeed
- **Coach activation rate**: >80% of approved coaches complete setup
- **User retention**: >60% of users return within 30 days

### Technical Metrics
- **Page load time**: <3 seconds on 3G
- **API response time**: <500ms average
- **Uptime**: >99.5%
- **Error rate**: <1%

### Quality Metrics
- **Test coverage**: >80% overall
- **Performance budget**: <500KB initial bundle
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Zero critical vulnerabilities

---

# Quick Wins (Can be done in parallel)

## 1-Hour Tasks
1. **Update ENV variables**: Add missing environment variables
2. **Fix console warnings**: Clean up React warnings
3. **Add loading spinners**: Replace static content with loading states
4. **Update footer links**: Connect footer links to actual pages

## 2-Hour Tasks
1. **Connect registration to DB**: Make registration forms save data
2. **Add form validation**: Client-side validation for all forms
3. **Update navigation**: Dynamic navigation based on auth state
4. **Add error messages**: User-friendly error messages throughout

## 4-Hour Tasks
1. **Replace mock data**: Connect components to real APIs
2. **Add search functionality**: Basic text search for coaches
3. **Implement filters**: Working filters for coach discovery
4. **Add notifications**: Basic notification system

## Implementation Priority

### Critical Path (Must Complete First)
1. **Payment Integration** → **Coach Onboarding** → **Booking System**
2. This sequence is critical because:
   - Payment enables revenue
   - Coach onboarding provides inventory
   - Booking connects supply and demand

### Parallel Development Opportunities
- **Frontend components** can be built while **backend APIs** are being developed
- **Testing** can be written alongside feature development
- **Documentation** can be created as features are completed

### Risk Mitigation
- **Payment integration** is highest risk - allocate extra time
- **Real-time features** may need fallbacks for poor connectivity
- **File uploads** for coach verification need robust error handling
- **Performance** issues may emerge at scale - monitor actively

This implementation plan provides a clear roadmap for transforming iPEC Coach Connect from a prototype into a fully functional marketplace platform. Each phase builds on the previous one, ensuring steady progress toward a revenue-generating application.