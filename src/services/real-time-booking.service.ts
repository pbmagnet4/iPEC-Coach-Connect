/**
 * Real-time Booking Service
 * 
 * Provides real-time booking updates, conflict prevention, and live availability
 * using Supabase real-time subscriptions and optimistic locking.
 */

import { supabase } from '../lib/supabase';
import { bookingService } from './booking.service';
import { authService } from './auth.service';
import type { AvailableSlot, RealtimePayload, SessionWithDetails } from '../types/database';

export type BookingEventType = 'session_booked' | 'session_cancelled' | 'session_rescheduled' | 'availability_updated';

export interface BookingEvent {
  type: BookingEventType;
  coachId: string;
  sessionId?: string;
  timestamp: string;
  data: any;
}

export interface BookingConflict {
  conflictType: 'time_overlap' | 'double_booking' | 'coach_unavailable';
  message: string;
  sessionId?: string;
  conflictingSlot?: AvailableSlot;
}

class RealTimeBookingService {
  private subscriptions = new Map<string, () => void>();
  private bookingListeners = new Set<(event: BookingEvent) => void>();
  private availabilityCache = new Map<string, AvailableSlot[]>();
  private lastUpdateTime = new Map<string, number>();

  /**
   * Subscribe to real-time booking updates for a specific coach
   */
  subscribeToCoachBookings(coachId: string, callback: (event: BookingEvent) => void): () => void {
    const subscriptionKey = `coach_${coachId}`;
    
    // Add callback to listeners
    this.bookingListeners.add(callback);
    
    // Subscribe to sessions table changes for this coach
    const sessionsSubscription = supabase
      .channel(`sessions_${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `coach_id=eq.${coachId}`,
        },
        (payload: RealtimePayload) => {
          this.handleSessionChange(payload, callback);
        }
      )
      .subscribe();

    // Subscribe to coach availability changes
    const availabilitySubscription = supabase
      .channel(`availability_${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_availability',
          filter: `coach_id=eq.${coachId}`,
        },
        (payload: RealtimePayload) => {
          this.handleAvailabilityChange(coachId, payload, callback);
        }
      )
      .subscribe();

    // Store cleanup function
    const cleanup = () => {
      this.bookingListeners.delete(callback);
      supabase.removeChannel(sessionsSubscription);
      supabase.removeChannel(availabilitySubscription);
      this.subscriptions.delete(subscriptionKey);
    };

    this.subscriptions.set(subscriptionKey, cleanup);
    return cleanup;
  }

  /**
   * Subscribe to availability updates for multiple coaches
   */
  subscribeToAvailabilityUpdates(
    coachIds: string[], 
    callback: (coachId: string, availability: AvailableSlot[]) => void
  ): () => void {
    const subscriptions: (() => void)[] = [];

    for (const coachId of coachIds) {
      const cleanup = this.subscribeToCoachBookings(coachId, (event) => {
        if (event.type === 'availability_updated') {
          // Refresh availability for this coach
          this.refreshCoachAvailability(coachId).then((availability) => {
            callback(coachId, availability);
          });
        }
      });

      subscriptions.push(cleanup);
    }

    // Return combined cleanup function
    return () => {
      subscriptions.forEach(cleanup => cleanup());
    };
  }

  /**
   * Check for booking conflicts before confirming a booking
   */
  async checkBookingConflicts(
    coachId: string,
    startTime: string,
    durationMinutes: number,
    excludeSessionId?: string
  ): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = [];
    const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

    try {
      // Check for overlapping sessions
      const { data: existingSessions, error } = await supabase
        .from('sessions')
        .select('id, scheduled_at, duration_minutes, status')
        .eq('coach_id', coachId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .lte('scheduled_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()); // Next 30 days

      if (error) {
        console.error('Error checking session conflicts:', error);
        return conflicts;
      }

      // Check each existing session for conflicts
      for (const session of existingSessions || []) {
        if (excludeSessionId && session.id === excludeSessionId) continue;

        const sessionStart = new Date(session.scheduled_at);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
        const requestStart = new Date(startTime);
        const requestEnd = new Date(endTime);

        const hasOverlap = (
          (requestStart >= sessionStart && requestStart < sessionEnd) ||
          (requestEnd > sessionStart && requestEnd <= sessionEnd) ||
          (requestStart <= sessionStart && requestEnd >= sessionEnd)
        );

        if (hasOverlap) {
          conflicts.push({
            conflictType: 'time_overlap',
            message: `This time slot conflicts with an existing session at ${sessionStart.toLocaleString()}`,
            sessionId: session.id
          });
        }
      }

      // Check coach availability
      const isSlotAvailable = await bookingService.isSlotAvailable(coachId, startTime, durationMinutes);
      if (!isSlotAvailable) {
        conflicts.push({
          conflictType: 'coach_unavailable',
          message: 'Coach is not available during this time slot'
        });
      }

    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      conflicts.push({
        conflictType: 'double_booking',
        message: 'Unable to verify availability. Please try again.'
      });
    }

    return conflicts;
  }

  /**
   * Attempt to reserve a time slot temporarily (optimistic locking)
   */
  async reserveTimeSlot(
    coachId: string,
    startTime: string,
    durationMinutes: number,
    reservationTimeMinutes = 10
  ): Promise<{ success: boolean; reservationId?: string; conflicts?: BookingConflict[] }> {
    try {
      // Check for conflicts first
      const conflicts = await this.checkBookingConflicts(coachId, startTime, durationMinutes);
      if (conflicts.length > 0) {
        return { success: false, conflicts };
      }

      // Create a temporary reservation record
      const reservationId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + reservationTimeMinutes * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('session_reservations') // This would need to be added to the schema
        .insert({
          id: reservationId,
          coach_id: coachId,
          reserved_at: startTime,
          duration_minutes: durationMinutes,
          expires_at: expiresAt,
          created_by: authService.getState().user?.id
        });

      if (error) {
        console.error('Error creating reservation:', error);
        return { success: false };
      }

      // Set up automatic cleanup
      setTimeout(() => {
        this.cleanupReservation(reservationId);
      }, reservationTimeMinutes * 60 * 1000);

      return { success: true, reservationId };
    } catch (error) {
      console.error('Error reserving time slot:', error);
      return { success: false };
    }
  }

  /**
   * Refresh cached availability for a coach
   */
  private async refreshCoachAvailability(coachId: string): Promise<AvailableSlot[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days

      const result = await bookingService.getAvailableSlots(
        coachId,
        startDate.toISOString(),
        endDate.toISOString(),
        60 // Default 60-minute sessions
      );

      if (result.data) {
        this.availabilityCache.set(coachId, result.data);
        this.lastUpdateTime.set(coachId, Date.now());
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error refreshing coach availability:', error);
      return [];
    }
  }

  /**
   * Handle session changes from real-time subscription
   */
  private handleSessionChange(payload: RealtimePayload, callback: (event: BookingEvent) => void) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    let bookingEvent: BookingEvent | null = null;

    switch (eventType) {
      case 'INSERT':
        if (newRecord && newRecord.status === 'scheduled') {
          bookingEvent = {
            type: 'session_booked',
            coachId: newRecord.coach_id,
            sessionId: newRecord.id,
            timestamp: new Date().toISOString(),
            data: newRecord
          };
        }
        break;

      case 'UPDATE':
        if (oldRecord && newRecord) {
          if (oldRecord.status === 'scheduled' && newRecord.status === 'cancelled') {
            bookingEvent = {
              type: 'session_cancelled',
              coachId: newRecord.coach_id,
              sessionId: newRecord.id,
              timestamp: new Date().toISOString(),
              data: newRecord
            };
          } else if (oldRecord.scheduled_at !== newRecord.scheduled_at) {
            bookingEvent = {
              type: 'session_rescheduled',
              coachId: newRecord.coach_id,
              sessionId: newRecord.id,
              timestamp: new Date().toISOString(),
              data: { old: oldRecord, new: newRecord }
            };
          }
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          bookingEvent = {
            type: 'session_cancelled',
            coachId: oldRecord.coach_id,
            sessionId: oldRecord.id,
            timestamp: new Date().toISOString(),
            data: oldRecord
          };
        }
        break;
    }

    if (bookingEvent) {
      callback(bookingEvent);
      
      // Invalidate availability cache for this coach
      this.availabilityCache.delete(bookingEvent.coachId);
    }
  }

  /**
   * Handle availability changes from real-time subscription
   */
  private handleAvailabilityChange(
    coachId: string, 
    payload: RealtimePayload, 
    callback: (event: BookingEvent) => void
  ) {
    const bookingEvent: BookingEvent = {
      type: 'availability_updated',
      coachId,
      timestamp: new Date().toISOString(),
      data: payload
    };

    callback(bookingEvent);
    
    // Invalidate availability cache
    this.availabilityCache.delete(coachId);
  }

  /**
   * Clean up expired reservations
   */
  private async cleanupReservation(reservationId: string) {
    try {
      await supabase
        .from('session_reservations')
        .delete()
        .eq('id', reservationId);
    } catch (error) {
      console.error('Error cleaning up reservation:', error);
    }
  }

  /**
   * Get cached availability or fetch fresh data
   */
  getCachedAvailability(coachId: string): AvailableSlot[] | null {
    const cached = this.availabilityCache.get(coachId);
    const lastUpdate = this.lastUpdateTime.get(coachId);
    
    // Return cached data if it's less than 5 minutes old
    if (cached && lastUpdate && Date.now() - lastUpdate < 5 * 60 * 1000) {
      return cached;
    }
    
    return null;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(cleanup => cleanup());
    this.subscriptions.clear();
    this.bookingListeners.clear();
    this.availabilityCache.clear();
    this.lastUpdateTime.clear();
  }
}

// Export singleton instance
export const realTimeBookingService = new RealTimeBookingService();
export default realTimeBookingService;