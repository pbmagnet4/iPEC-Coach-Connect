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

import { apiService, notificationService, sessionService } from './api.service';
import { authService } from './auth.service';
import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationOptions,
  Session,
  SessionFilters,
  SessionInsert,
  SessionUpdate,
  SessionWithDetails,
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
          bookingRequest.paymentMethodId,
          {
            coachId: bookingRequest.coachId,
            sessionTypeId: bookingRequest.sessionTypeId,
            scheduledAt: bookingRequest.scheduledAt,
            durationMinutes: bookingRequest.durationMinutes
          }
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
    durationMinutes = 60
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
      const oldDateTime = session.scheduled_at;
      await this.sendRescheduleNotification(rescheduleRequest.sessionId, oldDateTime, rescheduleRequest.newDateTime, rescheduleRequest.reason);

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
        cancellationInfo.refundAmount
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

      // Send completion notifications
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
      const sessionFilters: SessionFilters = { ...filters, ...userIdFilter };

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

  private async processPayment(
    sessionId: string, 
    amount: number, 
    paymentMethodId: string,
    sessionData?: {
      coachId: string;
      sessionTypeId: string;
      scheduledAt: string;
      durationMinutes: number;
    }
  ): Promise<string> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated for payment processing');
      }

      if (!sessionData) {
        throw new SupabaseError('Session data required for payment processing');
      }

      // Use the existing payment service to process the session payment
      const { sessionBookingService } = await import('./payment.service');
      const paymentResult = await sessionBookingService.bookSessionWithPayment({
        coach_id: sessionData.coachId,
        session_type_id: sessionData.sessionTypeId,
        scheduled_at: sessionData.scheduledAt,
        duration_minutes: sessionData.durationMinutes,
        payment_method_id: paymentMethodId
      });

      if (!paymentResult.success) {
        throw new SupabaseError(paymentResult.error || 'Payment processing failed');
      }

      return paymentResult.payment_intent?.stripe_payment_intent_id || `pi_${sessionId}`;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  private async generateMeetingUrl(sessionId: string): Promise<string> {
    // Generate a unique meeting URL for the session
    // In production, this would integrate with Zoom, Google Meet, etc.
    const meetingId = `${sessionId.substring(0, 8)}-${Date.now().toString(36)}`;
    return `https://meet.ipec-coach-connect.com/session/${meetingId}`;
  }

  private async scheduleReminders(sessionId: string) {
    try {
      // Get session details to create proper reminders
      const sessionResult = await sessionService.getSession(sessionId);
      if (sessionResult.error || !sessionResult.data) {
        console.error('Failed to get session for reminder scheduling:', sessionResult.error);
        return;
      }

      const session = sessionResult.data;
      const scheduledTime = new Date(session.scheduled_at);
      const now = new Date();

      // Schedule 24-hour reminder
      const reminder24h = new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        await this.createSessionReminder(session, reminder24h, '24 hours');
      }

      // Schedule 1-hour reminder
      const reminder1h = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
      if (reminder1h > now) {
        await this.createSessionReminder(session, reminder1h, '1 hour');
      }

      // Schedule 15-minute reminder
      const reminder15m = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
      if (reminder15m > now) {
        await this.createSessionReminder(session, reminder15m, '15 minutes');
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      // Don't throw error - reminders are not critical to booking flow
    }
  }

  private async createSessionReminder(session: any, reminderTime: Date, timeframe: string) {
    const reminderTitle = `Session Reminder - ${timeframe} until your session`;
    const reminderMessage = `Your coaching session is scheduled for ${new Date(session.scheduled_at).toLocaleString()}`;

    // Create notifications for both client and coach
    const notifications = [
      {
        user_id: session.client_id,
        title: reminderTitle,
        message: reminderMessage,
        type: 'session' as const,
      },
      {
        user_id: session.coach_id,
        title: reminderTitle,
        message: reminderMessage,
        type: 'session' as const,
      }
    ];

    for (const notification of notifications) {
      if (notification.user_id) {
        await notificationService.createNotification(notification);
      }
    }
  }

  private async sendBookingConfirmation(sessionId: string) {
    try {
      // Use the professional booking notifications service
      const { bookingNotificationsService } = await import('./booking-notifications.service');
      await bookingNotificationsService.sendBookingConfirmation(sessionId);
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      // Don't throw - booking should succeed even if notifications fail
    }
  }

  private async createCalendarEvents(sessionId: string) {
    try {
      const sessionResult = await sessionService.getSession(sessionId);
      if (sessionResult.error || !sessionResult.data) {
        console.error('Failed to get session for calendar events:', sessionResult.error);
        return;
      }

      const session = sessionResult.data;
      const startTime = new Date(session.scheduled_at);
      const endTime = new Date(startTime.getTime() + session.duration_minutes * 60000);

      const calendarEvent: CalendarEvent = {
        title: 'iPEC Coaching Session',
        description: `Coaching session with iPEC Coach Connect.\n\nSession Notes: ${session.notes || 'No notes provided'}\n\nMeeting URL: ${session.meeting_url}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: session.meeting_url || 'Online',
        attendees: [] // Would include coach and client emails
      };

      // TODO: Generate .ics file and include in confirmation emails
      // This would create proper calendar invitations that users can add to their calendars
      console.log('Calendar event created:', calendarEvent);

    } catch (error) {
      console.error('Error creating calendar events:', error);
      // Don't throw - calendar events are nice-to-have
    }
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
    const slots: AvailableSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Iterate through each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      // Find availability for this day of week
      const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek && slot.is_active);
      
      for (const availSlot of dayAvailability) {
        // Parse time slots for this day
        const [startHour, startMin] = availSlot.start_time.split(':').map(Number);
        const [endHour, endMin] = availSlot.end_time.split(':').map(Number);
        
        const slotStart = new Date(date);
        slotStart.setHours(startHour, startMin, 0, 0);
        
        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, endMin, 0, 0);
        
        // Generate 30-minute slots within this availability window
        while (slotStart.getTime() + durationMinutes * 60000 <= slotEnd.getTime()) {
          const currentSlotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
          
          // Skip past time slots
          if (slotStart <= now) {
            slotStart.setTime(slotStart.getTime() + 30 * 60000); // Move by 30 minutes
            continue;
          }
          
          // Check for conflicts with existing bookings
          const hasConflict = bookings.some(booking => {
            const bookingStart = new Date(booking.scheduled_at);
            const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000);
            
            return (
              (slotStart >= bookingStart && slotStart < bookingEnd) ||
              (currentSlotEnd > bookingStart && currentSlotEnd <= bookingEnd) ||
              (slotStart <= bookingStart && currentSlotEnd >= bookingEnd)
            );
          });
          
          if (!hasConflict) {
            slots.push({
              startTime: slotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              duration: durationMinutes,
              available: true,
              coachId: availSlot.coach_id,
              timezone: availSlot.timezone || 'UTC'
            });
          }
          
          // Move to next 30-minute slot
          slotStart.setTime(slotStart.getTime() + 30 * 60000);
        }
      }
    }
    
    // Sort slots by start time
    slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return slots;
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

  private async sendRescheduleNotification(sessionId: string, oldDateTime: string, newDateTime: string, reason?: string) {
    try {
      const { bookingNotificationsService } = await import('./booking-notifications.service');
      await bookingNotificationsService.sendRescheduleNotifications(sessionId, oldDateTime, newDateTime, reason);
    } catch (error) {
      console.error('Error sending reschedule notifications:', error);
    }
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

  private async sendCancellationNotification(sessionId: string, reason: string, refundAmount: number) {
    try {
      const { bookingNotificationsService } = await import('./booking-notifications.service');
      await bookingNotificationsService.sendCancellationNotifications(sessionId, reason, refundAmount);
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
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
    try {
      const { bookingNotificationsService } = await import('./booking-notifications.service');
      await bookingNotificationsService.sendSessionCompletionNotifications(sessionId);
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }

  private async suggestNextSession(sessionId: string) {
    try {
      const { bookingNotificationsService } = await import('./booking-notifications.service');
      await bookingNotificationsService.sendFollowUpSuggestion(sessionId);
    } catch (error) {
      console.error('Error sending follow-up suggestion:', error);
    }
  }
}

// Export singleton instance
export const bookingService = new BookingService();

export default bookingService;