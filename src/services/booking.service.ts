/**
 * Booking and Session Management Service for iPEC Coach Connect
 * 
 * Comprehensive service for managing coaching sessions and bookings with:
 * - Session booking and scheduling
 * - Availability checking and slot management
 * - Payment processing and refunds
 * - Session lifecycle management
 * - Calendar integration
 * - Reminder and notification system
 * - Rescheduling and cancellation
 * - Session notes and feedback
 */

import { sessionService, apiService, notificationService } from './api.service';
import { authService } from './auth.service';
import { supabase, supabaseUtils, handleSupabaseError, SupabaseError } from '../lib/supabase';
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithDetails,
  SessionFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationOptions,
} from '../types/database';

// Extended booking interfaces
export interface BookingRequest {
  coachId: string;
  sessionTypeId: string;
  scheduledAt: string;
  durationMinutes: number;
  notes?: string;
  paymentMethodId?: string;
  discountCode?: string;
}

export interface BookingResponse {
  session: Session;
  paymentIntentId?: string;
  meetingUrl?: string;
  cancellationPolicy: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  coachId: string;
  timezone: string;
}

export interface SessionRescheduleRequest {
  sessionId: string;
  newDateTime: string;
  reason?: string;
}

export interface SessionCancellationRequest {
  sessionId: string;
  reason: string;
  requestRefund: boolean;
}

export interface SessionCompletionData {
  sessionId: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  nextSessionSuggested?: boolean;
}

export interface SessionReminder {
  sessionId: string;
  type: 'email' | 'sms' | 'push';
  timeBeforeSession: number; // minutes
  sent: boolean;
}

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
}

export interface BookingFilters extends SessionFilters {
  upcoming?: boolean;
  past?: boolean;
  needsAction?: boolean;
}

/**
 * Booking and Session Management Service
 */
class BookingService {
  /**
   * Book a coaching session
   */
  async bookSession(bookingRequest: BookingRequest): Promise<ApiResponse<BookingResponse>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Validate booking request
      const validation = await this.validateBookingRequest(bookingRequest);
      if (!validation.isValid) {
        throw new SupabaseError(`Booking validation failed: ${validation.errors.join(', ')}`);
      }

      // Check slot availability
      const isAvailable = await this.isSlotAvailable(
        bookingRequest.coachId,
        bookingRequest.scheduledAt,
        bookingRequest.durationMinutes
      );

      if (!isAvailable) {
        throw new SupabaseError('The selected time slot is no longer available');
      }

      // Get session type and pricing
      const sessionTypesResult = await sessionService.getSessionTypes();
      if (sessionTypesResult.error) {
        throw sessionTypesResult.error;
      }

      const sessionType = sessionTypesResult.data!.find(st => st.id === bookingRequest.sessionTypeId);
      if (!sessionType) {
        throw new SupabaseError('Invalid session type');
      }

      // Calculate pricing with any discounts
      const pricing = await this.calculatePricing(sessionType.price, bookingRequest.discountCode);

      // Create session record
      const sessionData: SessionInsert = {
        coach_id: bookingRequest.coachId,
        client_id: authState.user.id,
        session_type_id: bookingRequest.sessionTypeId,
        scheduled_at: bookingRequest.scheduledAt,
        duration_minutes: bookingRequest.durationMinutes,
        notes: bookingRequest.notes,
        amount_paid: pricing.finalAmount,
        status: 'scheduled',
      };

      const sessionResult = await sessionService.createSession(sessionData);
      if (sessionResult.error) {
        throw sessionResult.error;
      }

      const session = sessionResult.data!;

      // Process payment if required
      let paymentIntentId: string | undefined;
      if (pricing.finalAmount > 0 && bookingRequest.paymentMethodId) {
        paymentIntentId = await this.processPayment(
          session.id,
          pricing.finalAmount,
          bookingRequest.paymentMethodId
        );
      }

      // Generate meeting URL
      const meetingUrl = await this.generateMeetingUrl(session.id);

      // Update session with payment and meeting details
      await sessionService.updateSession(session.id, {
        stripe_payment_intent_id: paymentIntentId,
        meeting_url: meetingUrl,
      });

      // Schedule reminders
      await this.scheduleReminders(session.id);

      // Send confirmation notifications
      await this.sendBookingConfirmation(session.id);

      // Create calendar events
      await this.createCalendarEvents(session.id);

      const response: BookingResponse = {
        session,
        paymentIntentId,
        meetingUrl,
        cancellationPolicy: await this.getCancellationPolicy(),
      };

      return { data: response };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get available time slots for a coach
   */
  async getAvailableSlots(
    coachId: string,
    startDate: string,
    endDate: string,
    durationMinutes: number = 60
  ): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      // Get coach availability pattern
      const availabilityResult = await apiService.coaches.getCoachAvailability(coachId);
      if (availabilityResult.error) {
        return availabilityResult;
      }

      // Get existing bookings in the date range
      const bookingsResult = await sessionService.getSessions({
        coachId,
        dateRange: { start: startDate, end: endDate },
        status: ['scheduled'],
      });

      if (bookingsResult.error) {
        return bookingsResult;
      }

      const availability = availabilityResult.data!;
      const existingBookings = bookingsResult.data!.data;

      // Generate available slots
      const slots = this.generateAvailableSlots(
        availability,
        existingBookings,
        startDate,
        endDate,
        durationMinutes
      );

      return { data: slots };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Reschedule a session
   */
  async rescheduleSession(rescheduleRequest: SessionRescheduleRequest): Promise<ApiResponse<Session>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get current session
      const sessionResult = await sessionService.getSession(rescheduleRequest.sessionId);
      if (sessionResult.error) {
        return sessionResult;
      }

      const session = sessionResult.data!;

      // Verify user can reschedule this session
      if (session.client_id !== authState.user.id && session.coach_id !== authState.user.id) {
        throw new SupabaseError('Not authorized to reschedule this session');
      }

      // Check if reschedule is allowed based on policy
      const canReschedule = await this.canRescheduleSession(session);
      if (!canReschedule.allowed) {
        throw new SupabaseError(canReschedule.reason);
      }

      // Check new slot availability
      const isAvailable = await this.isSlotAvailable(
        session.coach_id!,
        rescheduleRequest.newDateTime,
        session.duration_minutes
      );

      if (!isAvailable) {
        throw new SupabaseError('The new time slot is not available');
      }

      // Update session
      const updateResult = await sessionService.updateSession(rescheduleRequest.sessionId, {
        scheduled_at: rescheduleRequest.newDateTime,
        status: 'rescheduled',
        notes: `${session.notes || ''}\nRescheduled: ${rescheduleRequest.reason || 'No reason provided'}`,
      });

      if (updateResult.error) {
        return updateResult;
      }

      // Notify participants
      await this.sendRescheduleNotification(rescheduleRequest.sessionId, rescheduleRequest.reason);

      // Update calendar events
      await this.updateCalendarEvents(rescheduleRequest.sessionId);

      // Reschedule reminders
      await this.rescheduleReminders(rescheduleRequest.sessionId);

      return updateResult;
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Cancel a session
   */
  async cancelSession(cancellationRequest: SessionCancellationRequest): Promise<ApiResponse<Session>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get current session
      const sessionResult = await sessionService.getSession(cancellationRequest.sessionId);
      if (sessionResult.error) {
        return sessionResult;
      }

      const session = sessionResult.data!;

      // Verify user can cancel this session
      if (session.client_id !== authState.user.id && session.coach_id !== authState.user.id) {
        throw new SupabaseError('Not authorized to cancel this session');
      }

      // Check cancellation policy
      const cancellationInfo = await this.getCancellationInfo(session);

      // Update session
      const updateResult = await sessionService.updateSession(cancellationRequest.sessionId, {
        status: 'cancelled',
        notes: `${session.notes || ''}\nCancelled: ${cancellationRequest.reason}`,
      });

      if (updateResult.error) {
        return updateResult;
      }

      // Process refund if applicable
      if (cancellationRequest.requestRefund && cancellationInfo.refundEligible) {
        await this.processRefund(
          session.stripe_payment_intent_id!,
          cancellationInfo.refundAmount
        );
      }

      // Notify participants
      await this.sendCancellationNotification(
        cancellationRequest.sessionId,
        cancellationRequest.reason,
        cancellationInfo.refundAmount > 0
      );

      // Cancel calendar events
      await this.cancelCalendarEvents(cancellationRequest.sessionId);

      // Cancel reminders
      await this.cancelReminders(cancellationRequest.sessionId);

      return updateResult;
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Complete a session
   */
  async completeSession(completionData: SessionCompletionData): Promise<ApiResponse<Session>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get current session
      const sessionResult = await sessionService.getSession(completionData.sessionId);
      if (sessionResult.error) {
        return sessionResult;
      }

      const session = sessionResult.data!;

      // Verify user can complete this session (typically only coach)
      if (session.coach_id !== authState.user.id) {
        throw new SupabaseError('Only the coach can mark a session as completed');
      }

      // Update session
      const updateResult = await sessionService.updateSession(completionData.sessionId, {
        status: 'completed',
        notes: completionData.notes || session.notes,
      });

      if (updateResult.error) {
        return updateResult;
      }

      // Store rating and feedback if provided
      if (completionData.rating || completionData.feedback) {
        await this.storeSessionFeedback(completionData.sessionId, {
          rating: completionData.rating,
          feedback: completionData.feedback,
        });
      }

      // Send completion notification to client
      await this.sendSessionCompletionNotification(completionData.sessionId);

      // Suggest next session if requested
      if (completionData.nextSessionSuggested) {
        await this.suggestNextSession(completionData.sessionId);
      }

      return updateResult;
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get user's sessions with filtering
   */
  async getUserSessions(
    filters: BookingFilters = {},
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<SessionWithDetails>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Determine if user is coach or client
      const isCoach = authState.role === 'coach';
      const userIdFilter = isCoach ? { coachId: authState.user.id } : { clientId: authState.user.id };

      // Apply time-based filters
      const now = new Date().toISOString();
      let sessionFilters: SessionFilters = { ...filters, ...userIdFilter };

      if (filters.upcoming) {
        sessionFilters.dateRange = {
          start: now,
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Next year
        };
        sessionFilters.status = ['scheduled'];
      }

      if (filters.past) {
        sessionFilters.dateRange = {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
          end: now,
        };
        sessionFilters.status = ['completed', 'cancelled'];
      }

      if (filters.needsAction) {
        // Sessions that need some action from the user
        sessionFilters.status = ['scheduled'];
        // Add more specific filters based on user role
      }

      return await sessionService.getSessions(sessionFilters, {
        ...options,
        orderBy: options.orderBy || 'scheduled_at',
        orderDirection: options.orderDirection || 'desc',
      });
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId: string): Promise<ApiResponse<SessionWithDetails>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const sessionResult = await sessionService.getSession(sessionId);
      if (sessionResult.error) {
        return sessionResult;
      }

      const session = sessionResult.data!;

      // Verify user has access to this session
      if (session.client_id !== authState.user.id && session.coach_id !== authState.user.id) {
        throw new SupabaseError('Not authorized to view this session');
      }

      return sessionResult;
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // Private helper methods

  private async validateBookingRequest(request: BookingRequest) {
    const errors: string[] = [];

    if (!request.coachId) {
      errors.push('Coach ID is required');
    }

    if (!request.sessionTypeId) {
      errors.push('Session type is required');
    }

    if (!request.scheduledAt) {
      errors.push('Scheduled time is required');
    }

    const scheduledTime = new Date(request.scheduledAt);
    const now = new Date();
    if (scheduledTime <= now) {
      errors.push('Scheduled time must be in the future');
    }

    // Check minimum advance booking time (e.g., 2 hours)
    const minAdvanceTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (scheduledTime < minAdvanceTime) {
      errors.push('Sessions must be booked at least 2 hours in advance');
    }

    if (!request.durationMinutes || request.durationMinutes < 30) {
      errors.push('Session duration must be at least 30 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async isSlotAvailable(coachId: string, startTime: string, durationMinutes: number): Promise<boolean> {
    try {
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

      // Check for conflicting sessions
      const existingSessionsResult = await sessionService.getSessions({
        coachId,
        dateRange: { start: startTime, end: endTime },
        status: ['scheduled'],
      });

      if (existingSessionsResult.error) {
        return false;
      }

      const conflictingSessions = existingSessionsResult.data!.data.filter(session => {
        const sessionStart = new Date(session.scheduled_at);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
        const requestStart = new Date(startTime);
        const requestEnd = new Date(endTime);

        return (
          (requestStart >= sessionStart && requestStart < sessionEnd) ||
          (requestEnd > sessionStart && requestEnd <= sessionEnd) ||
          (requestStart <= sessionStart && requestEnd >= sessionEnd)
        );
      });

      return conflictingSessions.length === 0;
    } catch {
      return false;
    }
  }

  private async calculatePricing(basePrice: number, discountCode?: string) {
    // Apply discount if provided
    let discount = 0;
    if (discountCode) {
      discount = await this.getDiscountAmount(discountCode, basePrice);
    }

    const finalAmount = Math.max(0, basePrice - discount);

    return {
      basePrice,
      discount,
      finalAmount,
    };
  }

  private async getDiscountAmount(discountCode: string, basePrice: number): Promise<number> {
    // This would typically query a discounts table
    // For now, return 0
    return 0;
  }

  private async processPayment(sessionId: string, amount: number, paymentMethodId: string): Promise<string> {
    // This would integrate with Stripe to process payment
    // For now, return a mock payment intent ID
    return `pi_mock_${sessionId}`;
  }

  private async generateMeetingUrl(sessionId: string): Promise<string> {
    // This would integrate with a video conferencing service
    // For now, return a placeholder URL
    return `https://meet.ipec-coach-connect.com/session/${sessionId}`;
  }

  private async scheduleReminders(sessionId: string) {
    // Schedule email/SMS reminders
    // For now, just create a placeholder notification
    await notificationService.createNotification({
      user_id: '', // Would be set to client and coach IDs
      title: 'Session Reminder',
      message: 'You have an upcoming coaching session',
      type: 'session',
    });
  }

  private async sendBookingConfirmation(sessionId: string) {
    // Send confirmation email/notification
  }

  private async createCalendarEvents(sessionId: string) {
    // Create calendar events for coach and client
  }

  private async getCancellationPolicy(): Promise<string> {
    return 'Sessions can be cancelled up to 24 hours before the scheduled time for a full refund.';
  }

  private generateAvailableSlots(
    availability: any[],
    bookings: any[],
    startDate: string,
    endDate: string,
    durationMinutes: number
  ): AvailableSlot[] {
    // Complex algorithm to generate available slots based on:
    // - Coach availability patterns
    // - Existing bookings
    // - Date range
    // - Required duration
    
    // For now, return empty array
    return [];
  }

  private async canRescheduleSession(session: Session) {
    const scheduledTime = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntilSession = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 24) {
      return {
        allowed: false,
        reason: 'Sessions cannot be rescheduled within 24 hours of the scheduled time',
      };
    }

    return { allowed: true };
  }

  private async sendRescheduleNotification(sessionId: string, reason?: string) {
    // Send notification about reschedule
  }

  private async updateCalendarEvents(sessionId: string) {
    // Update calendar events with new time
  }

  private async rescheduleReminders(sessionId: string) {
    // Reschedule reminder notifications
  }

  private async getCancellationInfo(session: Session) {
    const scheduledTime = new Date(session.scheduled_at);
    const now = new Date();
    const hoursUntilSession = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundEligible = false;

    if (hoursUntilSession >= 24) {
      refundAmount = session.amount_paid || 0;
      refundEligible = true;
    } else if (hoursUntilSession >= 2) {
      refundAmount = (session.amount_paid || 0) * 0.5; // 50% refund
      refundEligible = true;
    }

    return {
      refundEligible,
      refundAmount,
      cancellationFee: (session.amount_paid || 0) - refundAmount,
    };
  }

  private async processRefund(paymentIntentId: string, amount: number) {
    // Process refund through Stripe
  }

  private async sendCancellationNotification(sessionId: string, reason: string, refundProcessed: boolean) {
    // Send cancellation notification
  }

  private async cancelCalendarEvents(sessionId: string) {
    // Cancel calendar events
  }

  private async cancelReminders(sessionId: string) {
    // Cancel scheduled reminders
  }

  private async storeSessionFeedback(sessionId: string, feedback: { rating?: number; feedback?: string }) {
    // Store session rating and feedback
  }

  private async sendSessionCompletionNotification(sessionId: string) {
    // Send completion notification to client
  }

  private async suggestNextSession(sessionId: string) {
    // Send suggestion for next session booking
  }
}

// Export singleton instance
export const bookingService = new BookingService();

export default bookingService;