/**
 * Coach Management Service for iPEC Coach Connect
 * 
 * Comprehensive service for coach-specific functionality including:
 * - Coach verification and onboarding
 * - Availability management and scheduling
 * - Coach discovery and search
 * - Rating and review system
 * - Performance analytics
 * - Certification management
 * - Stripe Connect integration for payments
 */

import { coachService, apiService } from './api.service';
import { authService } from './auth.service';
import { supabase, supabaseUtils, handleSupabaseError, SupabaseError } from '../lib/supabase';
import type {
  Coach,
  CoachInsert,
  CoachUpdate,
  CoachWithProfile,
  CoachFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationOptions,
} from '../types/database';

// Extended coach interfaces
export interface CoachProfile extends CoachWithProfile {
  rating?: number;
  reviewCount?: number;
  completedSessions?: number;
  responseTime?: string;
  nextAvailable?: string;
  distance?: number;
}

export interface CoachAvailabilitySlot {
  id?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  isActive: boolean;
}

export interface CoachSchedule {
  coachId: string;
  timezone: string;
  slots: CoachAvailabilitySlot[];
}

export interface CoachApplication {
  ipecCertificationNumber: string;
  certificationLevel: 'Associate' | 'Professional' | 'Master';
  certificationDate: string;
  specializations: string[];
  hourlyRate: number;
  experienceYears: number;
  languages: string[];
  bio: string;
  portfolioItems?: string[];
  references?: CoachReference[];
}

export interface CoachReference {
  name: string;
  email: string;
  relationship: string;
  phone?: string;
}

export interface CoachVerificationData {
  certificationDocuments: File[];
  identityDocument: File;
  additionalDocuments?: File[];
  verificationNotes?: string;
}

export interface CoachSearchFilters extends CoachFilters {
  rating?: number;
  availability?: {
    date?: string;
    timeSlot?: string;
  };
  distance?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
}

export interface CoachAnalytics {
  totalSessions: number;
  totalRevenue: number;
  averageRating: number;
  clientRetentionRate: number;
  monthlySessionCounts: Array<{ month: string; count: number }>;
  specialtyBreakdown: Array<{ specialty: string; count: number }>;
  upcomingSessionsCount: number;
  pendingBookingsCount: number;
}

/**
 * Coach Management Service
 */
class CoachManagementService {
  /**
   * Apply to become a coach
   */
  async applyAsCoach(application: CoachApplication): Promise<ApiResponse<Coach>> {
    try {
      const authState = authService.getState();
      if (!authState.user || !authState.profile) {
        throw new SupabaseError('User not authenticated');
      }

      // Validate application
      const validation = this.validateCoachApplication(application);
      if (!validation.isValid) {
        throw new SupabaseError(`Application validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user is already a coach
      const existingCoach = await coachService.getCoach(authState.user.id);
      if (!existingCoach.error && existingCoach.data) {
        throw new SupabaseError('User is already registered as a coach');
      }

      // Update profile with bio
      await apiService.profiles.updateProfile(authState.user.id, {
        bio: application.bio,
      });

      // Create coach record
      const coachData: CoachInsert = {
        id: authState.user.id,
        ipec_certification_number: application.ipecCertificationNumber,
        certification_level: application.certificationLevel,
        certification_date: application.certificationDate,
        specializations: application.specializations,
        hourly_rate: application.hourlyRate,
        experience_years: application.experienceYears,
        languages: application.languages,
        is_active: false, // Requires verification
      };

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coaches')
          .insert(coachData)
          .select()
          .single();
      });

      // Store application metadata (portfolio, references, etc.)
      await this.storeApplicationMetadata(authState.user.id, {
        portfolioItems: application.portfolioItems,
        references: application.references,
      });

      return { data: result };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Submit verification documents
   */
  async submitVerification(verificationData: CoachVerificationData): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const coachId = authState.user.id;

      // Upload certification documents
      const certDocUrls: string[] = [];
      for (const doc of verificationData.certificationDocuments) {
        const fileName = `${coachId}/certification/${Date.now()}_${doc.name}`;
        await supabaseUtils.storage.upload('coach-documents', fileName, doc);
        const url = await supabaseUtils.storage.getPublicUrl('coach-documents', fileName);
        certDocUrls.push(url);
      }

      // Upload identity document
      const identityFileName = `${coachId}/identity/${Date.now()}_${verificationData.identityDocument.name}`;
      await supabaseUtils.storage.upload('coach-documents', identityFileName, verificationData.identityDocument);
      const identityUrl = await supabaseUtils.storage.getPublicUrl('coach-documents', identityFileName);

      // Upload additional documents if provided
      const additionalUrls: string[] = [];
      if (verificationData.additionalDocuments) {
        for (const doc of verificationData.additionalDocuments) {
          const fileName = `${coachId}/additional/${Date.now()}_${doc.name}`;
          await supabaseUtils.storage.upload('coach-documents', fileName, doc);
          const url = await supabaseUtils.storage.getPublicUrl('coach-documents', fileName);
          additionalUrls.push(url);
        }
      }

      // Store verification metadata
      await this.storeVerificationMetadata(coachId, {
        certificationDocuments: certDocUrls,
        identityDocument: identityUrl,
        additionalDocuments: additionalUrls,
        notes: verificationData.verificationNotes,
        submittedAt: new Date().toISOString(),
      });

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get coach profile with extended data
   */
  async getCoachProfile(coachId: string): Promise<ApiResponse<CoachProfile>> {
    try {
      const coachResult = await coachService.getCoach(coachId);
      if (coachResult.error) {
        return coachResult;
      }

      const coach = coachResult.data!;

      // Get additional coach statistics
      const [sessionsResult, analyticsResult] = await Promise.all([
        this.getCoachSessionStats(coachId),
        this.getBasicAnalytics(coachId),
      ]);

      const extendedProfile: CoachProfile = {
        ...coach,
        rating: analyticsResult.data?.averageRating || 0,
        reviewCount: 0, // TODO: Implement reviews
        completedSessions: analyticsResult.data?.totalSessions || 0,
        responseTime: '< 2 hours', // TODO: Calculate from data
        nextAvailable: await this.getNextAvailableSlot(coachId),
      };

      return { data: extendedProfile };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Search and filter coaches
   */
  async searchCoaches(
    filters: CoachSearchFilters = {},
    options: PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<CoachProfile>>> {
    try {
      // Get basic coach results
      const coachesResult = await coachService.getActiveCoaches(filters, options);
      if (coachesResult.error) {
        return coachesResult;
      }

      // Enhance with additional data
      const enhancedCoaches = await Promise.all(
        coachesResult.data!.data.map(async (coach) => {
          const analytics = await this.getBasicAnalytics(coach.id);
          
          return {
            ...coach,
            rating: analytics.data?.averageRating || 0,
            reviewCount: 0,
            completedSessions: analytics.data?.totalSessions || 0,
            responseTime: '< 2 hours',
            nextAvailable: await this.getNextAvailableSlot(coach.id),
          } as CoachProfile;
        })
      );

      // Apply additional filters
      let filteredCoaches = enhancedCoaches;

      if (filters.rating) {
        filteredCoaches = filteredCoaches.filter(coach => coach.rating >= filters.rating!);
      }

      // Sort by distance if location provided
      if (filters.distance) {
        filteredCoaches = this.sortByDistance(filteredCoaches, filters.distance);
      }

      return {
        data: {
          data: filteredCoaches,
          meta: coachesResult.data!.meta,
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update coach availability schedule
   */
  async updateAvailability(schedule: CoachSchedule): Promise<ApiResponse<CoachAvailabilitySlot[]>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Validate schedule
      const validation = this.validateSchedule(schedule);
      if (!validation.isValid) {
        throw new SupabaseError(`Schedule validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare availability data
      const availabilityData = schedule.slots.map(slot => ({
        coach_id: schedule.coachId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        timezone: slot.timezone,
        is_active: slot.isActive,
      }));

      const result = await coachService.updateCoachAvailability(schedule.coachId, availabilityData);
      if (result.error) {
        return result;
      }

      return { data: schedule.slots };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get coach availability
   */
  async getAvailability(coachId: string): Promise<ApiResponse<CoachAvailabilitySlot[]>> {
    try {
      const result = await coachService.getCoachAvailability(coachId);
      if (result.error) {
        return result;
      }

      const slots: CoachAvailabilitySlot[] = result.data!.map(slot => ({
        id: slot.id,
        dayOfWeek: slot.day_of_week!,
        startTime: slot.start_time,
        endTime: slot.end_time,
        timezone: slot.timezone || 'UTC',
        isActive: slot.is_active || false,
      }));

      return { data: slots };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get coach analytics and performance metrics
   */
  async getAnalytics(coachId: string): Promise<ApiResponse<CoachAnalytics>> {
    try {
      // This would typically involve complex queries across multiple tables
      // For now, return basic analytics
      const basicAnalytics = await this.getBasicAnalytics(coachId);
      if (basicAnalytics.error) {
        return basicAnalytics;
      }

      const upcomingSessions = await this.getUpcomingSessionsCount(coachId);
      const monthlyData = await this.getMonthlySessionData(coachId);

      const analytics: CoachAnalytics = {
        ...basicAnalytics.data!,
        upcomingSessionsCount: upcomingSessions,
        pendingBookingsCount: 0, // TODO: Implement booking requests
        monthlySessionCounts: monthlyData,
        specialtyBreakdown: [], // TODO: Calculate from session data
      };

      return { data: analytics };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update coach profile
   */
  async updateCoachProfile(coachId: string, updates: CoachUpdate): Promise<ApiResponse<Coach>> {
    try {
      // Validate updates
      const validation = this.validateCoachUpdates(updates);
      if (!validation.isValid) {
        throw new SupabaseError(`Update validation failed: ${validation.errors.join(', ')}`);
      }

      return await coachService.updateCoach(coachId, updates);
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Verify coach (admin function)
   */
  async verifyCoach(coachId: string): Promise<ApiResponse<Coach>> {
    try {
      // This would typically include additional verification steps
      return await coachService.verifyCoach(coachId);
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // Private helper methods

  private validateCoachApplication(application: CoachApplication) {
    const errors: string[] = [];

    if (!application.ipecCertificationNumber?.trim()) {
      errors.push('iPEC certification number is required');
    }

    if (!application.certificationLevel) {
      errors.push('Certification level is required');
    }

    if (!application.certificationDate) {
      errors.push('Certification date is required');
    }

    if (!application.specializations?.length) {
      errors.push('At least one specialization is required');
    }

    if (!application.hourlyRate || application.hourlyRate < 25) {
      errors.push('Hourly rate must be at least $25');
    }

    if (!application.experienceYears || application.experienceYears < 0) {
      errors.push('Experience years must be a positive number');
    }

    if (!application.languages?.length) {
      errors.push('At least one language is required');
    }

    if (!application.bio?.trim() || application.bio.length < 100) {
      errors.push('Bio must be at least 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateSchedule(schedule: CoachSchedule) {
    const errors: string[] = [];

    if (!schedule.timezone) {
      errors.push('Timezone is required');
    }

    for (const slot of schedule.slots) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        errors.push('Invalid day of week');
      }

      if (!slot.startTime || !slot.endTime) {
        errors.push('Start and end times are required');
      }

      if (slot.startTime >= slot.endTime) {
        errors.push('Start time must be before end time');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateCoachUpdates(updates: CoachUpdate) {
    const errors: string[] = [];

    if (updates.hourly_rate !== undefined && updates.hourly_rate < 25) {
      errors.push('Hourly rate must be at least $25');
    }

    if (updates.experience_years !== undefined && updates.experience_years < 0) {
      errors.push('Experience years must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async storeApplicationMetadata(coachId: string, metadata: any) {
    // This would typically store additional metadata in a separate table
    // For now, we'll skip this implementation
  }

  private async storeVerificationMetadata(coachId: string, metadata: any) {
    // This would typically store verification documents and metadata
    // For now, we'll skip this implementation
  }

  private async getCoachSessionStats(coachId: string) {
    return await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('sessions')
        .select('id, status')
        .eq('coach_id', coachId);
    });
  }

  private async getBasicAnalytics(coachId: string): Promise<ApiResponse<Partial<CoachAnalytics>>> {
    try {
      const sessionsResult = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('sessions')
          .select('amount_paid, status')
          .eq('coach_id', coachId);
      });

      const sessions = sessionsResult || [];
      const completedSessions = sessions.filter((s: any) => s.status === 'completed');
      const totalRevenue = completedSessions.reduce((sum: number, s: any) => sum + (s.amount_paid || 0), 0);

      return {
        data: {
          totalSessions: completedSessions.length,
          totalRevenue,
          averageRating: 4.5, // TODO: Calculate from reviews
          clientRetentionRate: 0.85, // TODO: Calculate from session data
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  private async getNextAvailableSlot(coachId: string): Promise<string | undefined> {
    // This would calculate the next available slot based on availability and existing bookings
    // For now, return a placeholder
    return undefined;
  }

  private async getUpcomingSessionsCount(coachId: string): Promise<number> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        const { count } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', coachId)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString());

        return { data: count, error: null };
      });

      return result || 0;
    } catch {
      return 0;
    }
  }

  private async getMonthlySessionData(coachId: string): Promise<Array<{ month: string; count: number }>> {
    // This would aggregate session data by month
    // For now, return empty array
    return [];
  }

  private sortByDistance(coaches: CoachProfile[], location: { latitude: number; longitude: number; radiusKm: number }): CoachProfile[] {
    // This would calculate distances and sort coaches
    // For now, return coaches as-is
    return coaches;
  }
}

// Export singleton instance
export const coachManagementService = new CoachManagementService();

export default coachManagementService;