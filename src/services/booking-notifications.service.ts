/**
 * Booking Notifications Service
 * 
 * Handles professional email and in-app notifications for the entire booking lifecycle:
 * - Booking confirmations with calendar attachments
 * - Reminder notifications (24h, 1h, 15min before)
 * - Cancellation and rescheduling notifications
 * - Session completion and feedback requests
 * - Coach and client-specific messaging
 */

import { supabase } from '../lib/supabase';
import { authService } from './auth.service';
import { sessionService } from './api.service';
import { notificationService } from './api.service';
import type { Profile, SessionWithDetails } from '../types/database';

export interface NotificationTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, any>;
}

export interface CalendarAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface NotificationData {
  to: string;
  toName: string;
  template: NotificationTemplate;
  attachments?: CalendarAttachment[];
  metadata?: Record<string, any>;
}

class BookingNotificationsService {
  private readonly FROM_EMAIL = 'noreply@ipec-coach-connect.com';
  private readonly FROM_NAME = 'iPEC Coach Connect';
  private readonly SUPPORT_EMAIL = 'support@ipec-coach-connect.com';

  /**
   * Send booking confirmation to both client and coach
   */
  async sendBookingConfirmation(sessionId: string): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      // Generate calendar attachment
      const calendarAttachment = this.generateCalendarAttachment(session);

      // Send to client
      await this.sendClientBookingConfirmation(session, calendarAttachment);

      // Send to coach
      await this.sendCoachBookingNotification(session, calendarAttachment);

  void console.log(`Booking confirmation sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending booking confirmation:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send cancellation notifications
   */
  async sendCancellationNotifications(
    sessionId: string, 
    reason: string, 
    refundAmount = 0
  ): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      const authState = authService.getState();
      const cancelledBy = authState.user?.id === session.client_id ? 'client' : 'coach';

      // Send to client
      await this.sendClientCancellationNotification(session, reason, refundAmount, cancelledBy);

      // Send to coach (if cancelled by client)
      if (cancelledBy === 'client') {
        await this.sendCoachCancellationNotification(session, reason);
      }

  void console.log(`Cancellation notifications sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending cancellation notifications:', error);
    }
  }

  /**
   * Send reschedule notifications
   */
  async sendRescheduleNotifications(
    sessionId: string, 
    oldDateTime: string, 
    newDateTime: string, 
    reason?: string
  ): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      const calendarAttachment = this.generateCalendarAttachment(session);

      // Send to both client and coach
      await this.sendRescheduleNotification(session, oldDateTime, newDateTime, reason, calendarAttachment);

  void console.log(`Reschedule notifications sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending reschedule notifications:', error);
    }
  }

  /**
   * Send session reminders
   */
  async sendSessionReminders(sessionId: string, timeframe: string): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      const reminderTemplate = this.getReminderTemplate(timeframe, session);

      // Send to client
      if (session.client) {
        await this.sendNotification({
          to: session.client.email || '',
          toName: session.client.full_name || 'Client',
          template: reminderTemplate.client
        });

        // Create in-app notification
        await notificationService.createNotification({
          user_id: session.client_id!,
          title: reminderTemplate.client.subject,
          message: reminderTemplate.client.textContent,
          type: 'session'
        });
      }

      // Send to coach
      if (session.coach?.profile) {
        await this.sendNotification({
          to: session.coach.profile.email || '',
          toName: session.coach.profile.full_name || 'Coach',
          template: reminderTemplate.coach
        });

        // Create in-app notification
        await notificationService.createNotification({
          user_id: session.coach_id!,
          title: reminderTemplate.coach.subject,
          message: reminderTemplate.coach.textContent,
          type: 'session'
        });
      }

  void console.log(`${timeframe} reminder sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending session reminders:', error);
    }
  }

  /**
   * Send session completion notifications
   */
  async sendSessionCompletionNotifications(sessionId: string): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      // Send feedback request to client
      await this.sendClientFeedbackRequest(session);

      // Send completion summary to coach
      await this.sendCoachSessionSummary(session);

  void console.log(`Session completion notifications sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending completion notifications:', error);
    }
  }

  /**
   * Send follow-up and next session suggestions
   */
  async sendFollowUpSuggestion(sessionId: string): Promise<void> {
    try {
      const session = await this.getSessionWithDetails(sessionId);
      if (!session) return;

      const template = this.getFollowUpTemplate(session);

      // Send to client
      if (session.client) {
        await this.sendNotification({
          to: session.client.email || '',
          toName: session.client.full_name || 'Client',
          template
        });

        // Create in-app notification
        await notificationService.createNotification({
          user_id: session.client_id!,
          title: 'Continue Your Coaching Journey',
          message: 'Book your next session to maintain momentum in your growth.',
          type: 'session'
        });
      }

  void console.log(`Follow-up suggestion sent for session ${sessionId}`);
    } catch (error) {
  void console.error('Error sending follow-up suggestion:', error);
    }
  }

  // Private helper methods

  private async getSessionWithDetails(sessionId: string): Promise<SessionWithDetails | null> {
    try {
      const result = await sessionService.getSession(sessionId);
      return result.data || null;
    } catch (error) {
  void console.error('Error fetching session details:', error);
      return null;
    }
  }

  private async sendClientBookingConfirmation(
    session: SessionWithDetails, 
    calendarAttachment: CalendarAttachment
  ): Promise<void> {
    if (!session.client) return;

    const template: NotificationTemplate = {
      subject: 'Your Coaching Session is Confirmed!',
      htmlContent: this.getClientConfirmationHtml(session),
      textContent: this.getClientConfirmationText(session),
      variables: { session }
    };

    await this.sendNotification({
      to: session.client.email || '',
      toName: session.client.full_name || 'Client',
      template,
      attachments: [calendarAttachment]
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.client_id!,
      title: 'Session Confirmed!',
      message: `Your coaching session is scheduled for ${new Date(session.scheduled_at).toLocaleString()}`,
      type: 'session'
    });
  }

  private async sendCoachBookingNotification(
    session: SessionWithDetails, 
    calendarAttachment: CalendarAttachment
  ): Promise<void> {
    if (!session.coach?.profile) return;

    const template: NotificationTemplate = {
      subject: 'New Session Booked',
      htmlContent: this.getCoachBookingHtml(session),
      textContent: this.getCoachBookingText(session),
      variables: { session }
    };

    await this.sendNotification({
      to: session.coach.profile.email || '',
      toName: session.coach.profile.full_name || 'Coach',
      template,
      attachments: [calendarAttachment]
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.coach_id!,
      title: 'New Session Booked',
      message: `You have a new coaching session scheduled for ${new Date(session.scheduled_at).toLocaleString()}`,
      type: 'session'
    });
  }

  private async sendClientCancellationNotification(
    session: SessionWithDetails, 
    reason: string, 
    refundAmount: number,
    cancelledBy: 'client' | 'coach'
  ): Promise<void> {
    if (!session.client) return;

    const template: NotificationTemplate = {
      subject: 'Session Cancelled',
      htmlContent: this.getClientCancellationHtml(session, reason, refundAmount, cancelledBy),
      textContent: this.getClientCancellationText(session, reason, refundAmount, cancelledBy),
      variables: { session, reason, refundAmount, cancelledBy }
    };

    await this.sendNotification({
      to: session.client.email || '',
      toName: session.client.full_name || 'Client',
      template
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.client_id!,
      title: 'Session Cancelled',
      message: `Your coaching session for ${new Date(session.scheduled_at).toLocaleString()} has been cancelled.`,
      type: 'session'
    });
  }

  private async sendCoachCancellationNotification(
    session: SessionWithDetails, 
    reason: string
  ): Promise<void> {
    if (!session.coach?.profile) return;

    const template: NotificationTemplate = {
      subject: 'Session Cancelled by Client',
      htmlContent: this.getCoachCancellationHtml(session, reason),
      textContent: this.getCoachCancellationText(session, reason),
      variables: { session, reason }
    };

    await this.sendNotification({
      to: session.coach.profile.email || '',
      toName: session.coach.profile.full_name || 'Coach',
      template
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.coach_id!,
      title: 'Session Cancelled',
      message: `Your client cancelled the session scheduled for ${new Date(session.scheduled_at).toLocaleString()}`,
      type: 'session'
    });
  }

  private async sendRescheduleNotification(
    session: SessionWithDetails, 
    oldDateTime: string, 
    newDateTime: string, 
    reason: string | undefined,
    calendarAttachment: CalendarAttachment
  ): Promise<void> {
    const template: NotificationTemplate = {
      subject: 'Session Rescheduled',
      htmlContent: this.getRescheduleHtml(session, oldDateTime, newDateTime, reason),
      textContent: this.getRescheduleText(session, oldDateTime, newDateTime, reason),
      variables: { session, oldDateTime, newDateTime, reason }
    };

    // Send to client
    if (session.client) {
      await this.sendNotification({
        to: session.client.email || '',
        toName: session.client.full_name || 'Client',
        template,
        attachments: [calendarAttachment]
      });

      await notificationService.createNotification({
        user_id: session.client_id!,
        title: 'Session Rescheduled',
        message: `Your session has been moved to ${new Date(newDateTime).toLocaleString()}`,
        type: 'session'
      });
    }

    // Send to coach
    if (session.coach?.profile) {
      await this.sendNotification({
        to: session.coach.profile.email || '',
        toName: session.coach.profile.full_name || 'Coach',
        template,
        attachments: [calendarAttachment]
      });

      await notificationService.createNotification({
        user_id: session.coach_id!,
        title: 'Session Rescheduled',
        message: `Session moved to ${new Date(newDateTime).toLocaleString()}`,
        type: 'session'
      });
    }
  }

  private async sendClientFeedbackRequest(session: SessionWithDetails): Promise<void> {
    if (!session.client) return;

    const template: NotificationTemplate = {
      subject: 'How was your coaching session?',
      htmlContent: this.getClientFeedbackHtml(session),
      textContent: this.getClientFeedbackText(session),
      variables: { session }
    };

    await this.sendNotification({
      to: session.client.email || '',
      toName: session.client.full_name || 'Client',
      template
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.client_id!,
      title: 'Share Your Feedback',
      message: 'How was your coaching session? Your feedback helps us improve.',
      type: 'session'
    });
  }

  private async sendCoachSessionSummary(session: SessionWithDetails): Promise<void> {
    if (!session.coach?.profile) return;

    const template: NotificationTemplate = {
      subject: 'Session Completed',
      htmlContent: this.getCoachSummaryHtml(session),
      textContent: this.getCoachSummaryText(session),
      variables: { session }
    };

    await this.sendNotification({
      to: session.coach.profile.email || '',
      toName: session.coach.profile.full_name || 'Coach',
      template
    });

    // Create in-app notification
    await notificationService.createNotification({
      user_id: session.coach_id!,
      title: 'Session Completed',
      message: 'Session marked as completed. Review your session notes.',
      type: 'session'
    });
  }

  private generateCalendarAttachment(session: SessionWithDetails): CalendarAttachment {
    const sessionStart = new Date(session.scheduled_at);
    const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
    
    const formatDate = (date: Date) => {
      return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]  }Z`;
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//iPEC Coach Connect//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:session-${session.id}@ipec-coach-connect.com`,
      `DTSTART:${formatDate(sessionStart)}`,
      `DTEND:${formatDate(sessionEnd)}`,
      `SUMMARY:iPEC Coaching Session - ${session.session_type?.name || 'Coaching Session'}`,
      `DESCRIPTION:Your coaching session with ${session.coach?.profile?.full_name || 'your coach'}.\\n\\n${session.notes || ''}\\n\\nMeeting URL: ${session.meeting_url || 'Will be provided closer to session time'}`,
      `LOCATION:${session.meeting_url || 'Online'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Session starts in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return {
      filename: 'coaching-session.ics',
      content: Buffer.from(icsContent).toString('base64'),
      contentType: 'text/calendar'
    };
  }

  private getReminderTemplate(timeframe: string, session: SessionWithDetails) {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    
    return {
      client: {
        subject: `Session Reminder - ${timeframe} until your coaching session`,
        htmlContent: `
          <h2>Your coaching session starts ${timeframe}!</h2>
          <p>This is a friendly reminder about your upcoming coaching session:</p>
          <ul>
            <li><strong>Date & Time:</strong> ${sessionDate}</li>
            <li><strong>Coach:</strong> ${session.coach?.profile?.full_name || 'Your Coach'}</li>
            <li><strong>Duration:</strong> ${session.duration_minutes} minutes</li>
          </ul>
          <p><a href="${session.meeting_url || '#'}">Join Session</a></p>
          <p>Make sure you're in a quiet, private space and have tested your audio/video.</p>
        `,
        textContent: `Your coaching session starts ${timeframe}! Session details: ${sessionDate} with ${session.coach?.profile?.full_name || 'your coach'}. Meeting URL: ${session.meeting_url || 'Will be provided'}`,
        variables: { session, timeframe }
      },
      coach: {
        subject: `Session Reminder - ${timeframe} until your coaching session`,
        htmlContent: `
          <h2>Your coaching session starts ${timeframe}!</h2>
          <p>This is a reminder about your upcoming coaching session:</p>
          <ul>
            <li><strong>Date & Time:</strong> ${sessionDate}</li>
            <li><strong>Client:</strong> ${session.client?.full_name || 'Your Client'}</li>
            <li><strong>Duration:</strong> ${session.duration_minutes} minutes</li>
            <li><strong>Session Notes:</strong> ${session.notes || 'No notes provided'}</li>
          </ul>
          <p><a href="${session.meeting_url || '#'}">Join Session</a></p>
        `,
        textContent: `Your coaching session starts ${timeframe}! Session details: ${sessionDate} with ${session.client?.full_name || 'your client'}. Meeting URL: ${session.meeting_url || 'Will be provided'}`,
        variables: { session, timeframe }
      }
    };
  }

  private getFollowUpTemplate(session: SessionWithDetails): NotificationTemplate {
    return {
      subject: 'Continue Your Coaching Journey',
      htmlContent: `
        <h2>Great session! Ready for the next step?</h2>
        <p>Thank you for your coaching session with ${session.coach?.profile?.full_name || 'your coach'}. Consistent coaching creates lasting transformation.</p>
        <p>Consider booking your next session to maintain momentum:</p>
        <p><a href="/booking?coach=${session.coach_id}">Book Your Next Session</a></p>
        <p>Questions? Contact us at ${this.SUPPORT_EMAIL}</p>
      `,
      textContent: `Great session! Continue your coaching journey by booking your next session with ${session.coach?.profile?.full_name || 'your coach'}. Visit our platform to schedule.`,
      variables: { session }
    };
  }

  // Email template methods
  private getClientConfirmationHtml(session: SessionWithDetails): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `
      <h1>Your Coaching Session is Confirmed!</h1>
      <p>Great news! Your coaching session has been successfully booked.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Session Details</h3>
        <p><strong>Date & Time:</strong> ${sessionDate}</p>
        <p><strong>Coach:</strong> ${session.coach?.profile?.full_name || 'Your Coach'}</p>
        <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
        <p><strong>Session Type:</strong> ${session.session_type?.name || 'Coaching Session'}</p>
        ${session.notes ? `<p><strong>Your Goals:</strong> ${session.notes}</p>` : ''}
      </div>

      <h3>What's Next?</h3>
      <ol>
        <li>Add this session to your calendar (see attachment)</li>
        <li>Prepare any questions or topics you'd like to discuss</li>
        <li>Ensure you have a quiet, private space for the call</li>
        <li>Test your video/audio before the session</li>
      </ol>

      ${session.meeting_url ? `<p><a href="${session.meeting_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Session</a></p>` : ''}

      <p>We're excited to support your coaching journey!</p>
      <p>Questions? Contact us at ${this.SUPPORT_EMAIL}</p>
    `;
  }

  private getClientConfirmationText(session: SessionWithDetails): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `Your coaching session is confirmed! 

Session Details:
- Date & Time: ${sessionDate}
- Coach: ${session.coach?.profile?.full_name || 'Your Coach'}
- Duration: ${session.duration_minutes} minutes
${session.notes ? `- Your Goals: ${session.notes}` : ''}

Meeting URL: ${session.meeting_url || 'Will be provided closer to session time'}

What's Next:
1. Add this session to your calendar
2. Prepare questions or topics to discuss
3. Ensure you have a quiet, private space
4. Test your video/audio before the session

Questions? Contact us at ${this.SUPPORT_EMAIL}`;
  }

  private getCoachBookingHtml(session: SessionWithDetails): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `
      <h1>New Session Booked</h1>
      <p>You have a new coaching session scheduled!</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Session Details</h3>
        <p><strong>Date & Time:</strong> ${sessionDate}</p>
        <p><strong>Client:</strong> ${session.client?.full_name || 'Client'}</p>
        <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
        <p><strong>Session Type:</strong> ${session.session_type?.name || 'Coaching Session'}</p>
        ${session.notes ? `<p><strong>Client Goals:</strong> ${session.notes}</p>` : ''}
      </div>

      <p>Review the client's goals and prepare for a great coaching session!</p>
      
      ${session.meeting_url ? `<p><a href="${session.meeting_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Session</a></p>` : ''}
    `;
  }

  private getCoachBookingText(session: SessionWithDetails): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `New session booked!

Session Details:
- Date & Time: ${sessionDate}
- Client: ${session.client?.full_name || 'Client'}
- Duration: ${session.duration_minutes} minutes
${session.notes ? `- Client Goals: ${session.notes}` : ''}

Meeting URL: ${session.meeting_url || 'Will be provided'}

Review the client's goals and prepare for a great coaching session!`;
  }

  private getClientCancellationHtml(
    session: SessionWithDetails, 
    reason: string, 
    refundAmount: number,
    cancelledBy: 'client' | 'coach'
  ): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `
      <h1>Session Cancelled</h1>
      <p>Your coaching session scheduled for ${sessionDate} has been cancelled.</p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reason:</strong> ${reason}</p>
        ${refundAmount > 0 ? `<p><strong>Refund:</strong> $${refundAmount/100} will be processed within 3-5 business days</p>` : ''}
      </div>

      <p>Ready to reschedule? <a href="/booking?coach=${session.coach_id}">Book a new session</a></p>
      <p>Questions? Contact us at ${this.SUPPORT_EMAIL}</p>
    `;
  }

  private getClientCancellationText(
    session: SessionWithDetails, 
    reason: string, 
    refundAmount: number,
    cancelledBy: 'client' | 'coach'
  ): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `Session Cancelled

Your coaching session scheduled for ${sessionDate} has been cancelled.

Reason: ${reason}
${refundAmount > 0 ? `Refund: $${refundAmount/100} will be processed within 3-5 business days` : ''}

Ready to reschedule? Visit our platform to book a new session.
Questions? Contact us at ${this.SUPPORT_EMAIL}`;
  }

  private getCoachCancellationHtml(session: SessionWithDetails, reason: string): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `
      <h1>Session Cancelled by Client</h1>
      <p>The coaching session scheduled for ${sessionDate} with ${session.client?.full_name || 'your client'} has been cancelled.</p>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>

      <p>This time slot is now available for other bookings.</p>
    `;
  }

  private getCoachCancellationText(session: SessionWithDetails, reason: string): string {
    const sessionDate = new Date(session.scheduled_at).toLocaleString();
    return `Session Cancelled by Client

The coaching session scheduled for ${sessionDate} with ${session.client?.full_name || 'your client'} has been cancelled.

Reason: ${reason}

This time slot is now available for other bookings.`;
  }

  private getRescheduleHtml(
    session: SessionWithDetails, 
    oldDateTime: string, 
    newDateTime: string, 
    reason?: string
  ): string {
    return `
      <h1>Session Rescheduled</h1>
      <p>Your coaching session has been moved to a new time.</p>
      
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Previous Time:</strong> ${new Date(oldDateTime).toLocaleString()}</p>
        <p><strong>New Time:</strong> ${new Date(newDateTime).toLocaleString()}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>

      <p>Please update your calendar with the new time. A new calendar invitation is attached.</p>
      ${session.meeting_url ? `<p><a href="${session.meeting_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Session</a></p>` : ''}
    `;
  }

  private getRescheduleText(
    session: SessionWithDetails, 
    oldDateTime: string, 
    newDateTime: string, 
    reason?: string
  ): string {
    return `Session Rescheduled

Your coaching session has been moved:
- Previous Time: ${new Date(oldDateTime).toLocaleString()}
- New Time: ${new Date(newDateTime).toLocaleString()}
${reason ? `- Reason: ${reason}` : ''}

Please update your calendar. Meeting URL: ${session.meeting_url || 'Will be provided'}`;
  }

  private getClientFeedbackHtml(session: SessionWithDetails): string {
    return `
      <h1>How was your coaching session?</h1>
      <p>We hope you had a great coaching session with ${session.coach?.profile?.full_name || 'your coach'}!</p>
      
      <p>Your feedback helps us improve and helps other clients find the right coach.</p>
      
      <p><a href="/feedback/session/${session.id}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Leave Feedback</a></p>

      <p>Ready for your next session? <a href="/booking?coach=${session.coach_id}">Book now</a></p>
    `;
  }

  private getClientFeedbackText(session: SessionWithDetails): string {
    return `How was your coaching session?

We hope you had a great session with ${session.coach?.profile?.full_name || 'your coach'}!

Your feedback helps us improve. Please visit our platform to leave feedback.

Ready for your next session? Book now on our platform.`;
  }

  private getCoachSummaryHtml(session: SessionWithDetails): string {
    return `
      <h1>Session Completed</h1>
      <p>Your coaching session with ${session.client?.full_name || 'your client'} has been marked as completed.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Session Date:</strong> ${new Date(session.scheduled_at).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
        ${session.notes ? `<p><strong>Session Notes:</strong> ${session.notes}</p>` : ''}
      </div>

      <p>Don't forget to update your session notes if needed!</p>
      <p><a href="/dashboard/sessions/${session.id}">View Session Details</a></p>
    `;
  }

  private getCoachSummaryText(session: SessionWithDetails): string {
    return `Session Completed

Your coaching session with ${session.client?.full_name || 'your client'} has been completed.

Session Date: ${new Date(session.scheduled_at).toLocaleString()}
Duration: ${session.duration_minutes} minutes
${session.notes ? `Session Notes: ${session.notes}` : ''}

Don't forget to update your session notes if needed!`;
  }

  /**
   * Generic notification sending method
   * In production, this would integrate with SendGrid, AWS SES, etc.
   */
  private async sendNotification(data: NotificationData): Promise<void> {
    try {
      // For now, just log the notification
      console.log('Email notification:', {
        to: data.to,
        subject: data.template.subject,
        hasAttachments: !!data.attachments?.length
      });

      // In production, you would send actual emails here:
      // await emailService.send({
      //   to: data.to,
      //   from: { email: this.FROM_EMAIL, name: this.FROM_NAME },
      //   subject: data.template.subject,
      //   html: data.template.htmlContent,
      //   text: data.template.textContent,
      //   attachments: data.attachments
      // });

    } catch (error) {
  void console.error('Failed to send email notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bookingNotificationsService = new BookingNotificationsService();
export default bookingNotificationsService;