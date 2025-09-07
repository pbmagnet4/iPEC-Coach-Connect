/**
 * Coach Integration Service
 * 
 * Handles the complete workflow when a coach application is approved,
 * including auth role transitions, payment setup, booking enablement,
 * and profile activation.
 */

import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import { authService } from './auth.service';
import { coachNotificationService } from './coach-notification.service';
import { coachApplicationService } from './coach-application.service';
import type {
  Coach,
  CoachApplicationWithDetails,
  CoachInsert,
  ProfileUpdate,
  Tables
} from '../types/database';

interface CoachActivationResult {
  success: boolean;
  coach?: Coach;
  error?: string;
}

interface CoachOnboardingData {
  applicationId: string;
  adminId: string;
  adminNotes?: string;
  coachProfile?: {
    bio?: string;
    specializations?: string[];
    hourlyRate?: number;
    availability?: any;
  };
}

/**
 * Coach Integration Service
 * Orchestrates the complete approved coach onboarding workflow
 */
class CoachIntegrationService {
  
  /**
   * Complete coach approval and activation workflow
   * This is the main integration method that handles all aspects of coach approval
   */
  async approveAndActivateCoach(data: CoachOnboardingData): Promise<CoachActivationResult> {
    try {
      // Step 1: Validate and get application details
      const application = await this.getApplicationWithDetails(data.applicationId);
      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      if (application.status === 'approved') {
        return { success: false, error: 'Application already approved' };
      }

      // Step 2: Begin transaction-like process
      const userId = application.user_id;
      
      // Step 3: Update application status to approved
      await this.updateApplicationStatus(data.applicationId, 'approved', data.adminId, data.adminNotes);

      // Step 4: Create/activate coach record
      const coach = await this.createOrActivateCoach(application, data.coachProfile);

      // Step 5: Update user profile with coach information
      await this.updateUserProfile(userId, application, data.coachProfile);

      // Step 6: Set up payment and revenue sharing
      await this.setupCoachPaymentIntegration(userId, coach);

      // Step 7: Enable coach in booking system
      await this.enableCoachBooking(coach);

      // Step 8: Send approval notification
      await coachNotificationService.sendApplicationApprovedNotification(data.applicationId);

      // Step 9: Send admin notification
      await this.notifyAdminOfCoachActivation(coach, data.adminId);

      // Step 10: Refresh auth state for the user if they're currently logged in
      await this.refreshUserAuthState(userId);

      return { success: true, coach };

    } catch (error: any) {
  void console.error('Coach approval and activation failed:', error);
      
      // Attempt to rollback critical changes
      await this.rollbackCoachActivation(data.applicationId);
      
      return { 
        success: false, 
        error: error.message || 'Failed to approve and activate coach' 
      };
    }
  }

  /**
   * Reject coach application with proper cleanup
   */
  async rejectCoachApplication(
    applicationId: string, 
    adminId: string, 
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update application status
      await this.updateApplicationStatus(applicationId, 'rejected', adminId, adminNotes);

      // Send rejection notification
      await coachNotificationService.sendApplicationRejectedNotification(applicationId, rejectionReason);

      // Log rejection for analytics
      await this.logCoachApplicationDecision(applicationId, 'rejected', adminId, { rejectionReason });

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to reject application' };
    }
  }

  /**
   * Request additional documents from applicant
   */
  async requestAdditionalDocuments(
    applicationId: string,
    requestedDocuments: string[],
    adminId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update application status
      await this.updateApplicationStatus(applicationId, 'documents_requested', adminId, adminNotes);

      // Send documents request notification
      await coachNotificationService.sendDocumentsRequestedNotification(
        applicationId, 
        requestedDocuments, 
        adminNotes
      );

      // Log request for tracking
      await this.logCoachApplicationDecision(applicationId, 'documents_requested', adminId, {
        requestedDocuments,
        adminNotes
      });

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to request documents' };
    }
  }

  /**
   * Schedule interview for coach application
   */
  async scheduleCoachInterview(
    applicationId: string,
    interviewDate: string,
    interviewUrl: string,
    interviewerName: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update application status
      await this.updateApplicationStatus(applicationId, 'interview_scheduled', adminId);

      // Create interview record
      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_interviews')
          .insert({
            application_id: applicationId,
            interviewer_id: adminId,
            scheduled_at: interviewDate,
            meeting_url: interviewUrl,
            status: 'scheduled',
            notes: `Interview scheduled with ${interviewerName}`
          });
      });

      // Send interview notification
      await coachNotificationService.sendInterviewScheduledNotification(
        applicationId,
        interviewDate,
        interviewUrl,
        interviewerName
      );

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to schedule interview' };
    }
  }

  /**
   * Get application with complete details
   */
  private async getApplicationWithDetails(applicationId: string): Promise<CoachApplicationWithDetails | null> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .select(`
            *,
            applicant:profiles!coach_applications_user_id_fkey(*)
          `)
          .eq('id', applicationId)
          .single();
      });

      return result as CoachApplicationWithDetails;
    } catch (error) {
  void console.error('Failed to get application details:', error);
      return null;
    }
  }

  /**
   * Update application status with proper logging
   */
  private async updateApplicationStatus(
    applicationId: string, 
    status: Tables<'coach_applications'>['status'],
    adminId: string,
    notes?: string
  ): Promise<void> {
    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('coach_applications')
        .update({
          status,
          progress: this.getProgressForStatus(status),
          updated_at: new Date().toISOString(),
          ...(status === 'approved' && { approved_at: new Date().toISOString() }),
          ...(status === 'rejected' && { rejected_at: new Date().toISOString() })
        })
        .eq('id', applicationId);
    });

    // Log status change
    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('application_status_history')
        .insert({
          application_id: applicationId,
          previous_status: 'submitted', // This should be fetched from current status
          new_status: status,
          changed_by: adminId,
          change_reason: notes || `Status changed to ${status}`,
          changed_at: new Date().toISOString()
        });
    });
  }

  /**
   * Create or activate coach record
   */
  private async createOrActivateCoach(
    application: CoachApplicationWithDetails,
    coachProfile?: CoachOnboardingData['coachProfile']
  ): Promise<Coach> {
    // Check if coach record already exists
    const existingCoach = await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('coaches')
        .select('*')
        .eq('id', application.user_id)
        .single();
    });

    if (existingCoach) {
      // Activate existing coach
      const updatedCoach = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coaches')
          .update({
            is_active: true,
            is_verified: true,
            hourly_rate: coachProfile?.hourlyRate || existingCoach.hourly_rate,
            specializations: coachProfile?.specializations || existingCoach.specializations,
            updated_at: new Date().toISOString()
          })
          .eq('id', application.user_id)
          .select()
          .single();
      });

      return updatedCoach;
    }

    // Create new coach record
    const coachData: CoachInsert = {
      id: application.user_id,
      ipec_certification_number: application.ipec_certification_number,
      certification_level: application.certification_level,
      certification_date: application.certification_date,
      specializations: coachProfile?.specializations || application.specializations || [],
      hourly_rate: coachProfile?.hourlyRate || application.hourly_rate || 150,
      experience_years: application.experience_years,
      languages: application.languages || ['English'],
      is_active: true,
      is_verified: true,
    };

    const newCoach = await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('coaches')
        .insert(coachData)
        .select()
        .single();
    });

    return newCoach;
  }

  /**
   * Update user profile with coach information
   */
  private async updateUserProfile(
    userId: string, 
    application: CoachApplicationWithDetails,
    coachProfile?: CoachOnboardingData['coachProfile']
  ): Promise<void> {
    const profileUpdates: ProfileUpdate = {
      bio: coachProfile?.bio || application.bio || null,
      updated_at: new Date().toISOString()
    };

    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
    });
  }

  /**
   * Set up payment integration for coach
   */
  private async setupCoachPaymentIntegration(userId: string, coach: Coach): Promise<void> {
    try {
      // Create coach in payment system if needed
      // This would integrate with Stripe Connect for coach payouts
      
      // For now, we'll create a placeholder integration
      // In a full implementation, this would set up Stripe Connect account
      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_payment_settings')
          .upsert({
            coach_id: userId,
            payout_enabled: false, // Will be enabled once Stripe Connect is set up
            commission_rate: 15, // Platform takes 15%
            currency: 'usd',
            payout_schedule: 'weekly',
            minimum_payout: 5000, // $50.00 in cents
            updated_at: new Date().toISOString()
          });
      });

  void console.log(`Payment integration set up for coach ${userId}`);
    } catch (error) {
  void console.error('Payment integration setup failed:', error);
      // Don't throw error here as it's not critical for initial coach activation
    }
  }

  /**
   * Enable coach in booking system
   */
  private async enableCoachBooking(coach: Coach): Promise<void> {
    // Create default session types for the coach
    const defaultSessionTypes = [
      {
        coach_id: coach.id,
        name: 'Discovery Session',
        description: 'Initial consultation to understand your goals and coaching needs',
        duration_minutes: 60,
        price: coach.hourly_rate * 0.8, // 20% discount for discovery
        is_active: true,
        session_type: 'discovery'
      },
      {
        coach_id: coach.id,
        name: 'Regular Coaching Session',
        description: 'One-on-one coaching session',
        duration_minutes: 60,
        price: coach.hourly_rate,
        is_active: true,
        session_type: 'regular'
      },
      {
        coach_id: coach.id,
        name: 'Extended Session',
        description: 'Extended coaching session for deep-dive topics',
        duration_minutes: 90,
        price: coach.hourly_rate * 1.4, // 40% more for extended session
        is_active: true,
        session_type: 'extended'
      }
    ];

    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('session_types')
        .insert(defaultSessionTypes);
    });

    // Create default availability (can be customized later)
    const defaultAvailability = {
      coach_id: coach.id,
      timezone: 'UTC',
      weekly_schedule: {
        monday: { available: true, start_time: '09:00', end_time: '17:00' },
        tuesday: { available: true, start_time: '09:00', end_time: '17:00' },
        wednesday: { available: true, start_time: '09:00', end_time: '17:00' },
        thursday: { available: true, start_time: '09:00', end_time: '17:00' },
        friday: { available: true, start_time: '09:00', end_time: '17:00' },
        saturday: { available: false, start_time: null, end_time: null },
        sunday: { available: false, start_time: null, end_time: null }
      },
      buffer_time_minutes: 15,
      advance_booking_days: 30,
      is_active: true
    };

    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('coach_availability')
        .insert(defaultAvailability);
    });
  }

  /**
   * Send admin notification of successful coach activation
   */
  private async notifyAdminOfCoachActivation(coach: Coach, adminId: string): Promise<void> {
    try {
      // This would send a notification to admin systems
      // For now, we'll log it
  void console.log(`Coach ${coach.id} successfully activated by admin ${adminId}`);
      
      // In a full implementation, this would send admin dashboard notifications
      // or email notifications to the admin team
    } catch (error) {
  void console.error('Admin notification failed:', error);
    }
  }

  /**
   * Refresh user auth state if they're currently logged in
   */
  private async refreshUserAuthState(userId: string): Promise<void> {
    try {
      const currentState = authService.getState();
      if (currentState.user?.id === userId) {
        // User is currently logged in, refresh their data
        await authService.refreshUserData();
      }
    } catch (error) {
  void console.error('Auth state refresh failed:', error);
      // Not critical - user can refresh manually
    }
  }

  /**
   * Rollback coach activation in case of failure
   */
  private async rollbackCoachActivation(applicationId: string): Promise<void> {
    try {
      // Revert application status
      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .update({
            status: 'under_review',
            progress: 70,
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);
      });

  void console.log(`Rolled back coach activation for application ${applicationId}`);
    } catch (rollbackError) {
  void console.error('Rollback failed:', rollbackError);
      // In production, this would trigger alerts for manual intervention
    }
  }

  /**
   * Log coach application decisions for analytics and auditing
   */
  private async logCoachApplicationDecision(
    applicationId: string,
    decision: string,
    adminId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('admin_review_queues')
          .insert({
            application_id: applicationId,
            assigned_to: adminId,
            status: 'completed',
            priority: 'medium',
            review_type: 'application_decision',
            notes: `Decision: ${decision}`,
            metadata: metadata || {},
            completed_at: new Date().toISOString()
          });
      });
    } catch (error) {
  void console.error('Decision logging failed:', error);
    }
  }

  /**
   * Get progress percentage for application status
   */
  private getProgressForStatus(status: Tables<'coach_applications'>['status']): number {
    switch (status) {
      case 'draft': return 10;
      case 'submitted': return 30;
      case 'under_review': return 50;
      case 'documents_requested': return 60;
      case 'interview_scheduled': return 80;
      case 'approved': return 100;
      case 'rejected': return 0;
      default: return 50;
    }
  }

  /**
   * Get all pending coach applications for admin review
   */
  async getPendingApplicationsForReview(): Promise<CoachApplicationWithDetails[]> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .select(`
            *,
            applicant:profiles!coach_applications_user_id_fkey(*)
          `)
          .in('status', ['submitted', 'under_review', 'documents_requested', 'interview_scheduled'])
          .order('created_at', { ascending: true });
      });

      return result || [];
    } catch (error) {
  void console.error('Failed to get pending applications:', error);
      return [];
    }
  }

  /**
   * Bulk approve multiple coach applications
   */
  async bulkApproveCoachApplications(
    applications: { applicationId: string; adminNotes?: string }[],
    adminId: string
  ): Promise<{
    successful: string[];
    failed: { applicationId: string; error: string }[];
  }> {
    const successful: string[] = [];
    const failed: { applicationId: string; error: string }[] = [];

    for (const app of applications) {
      try {
        const result = await this.approveAndActivateCoach({
          applicationId: app.applicationId,
          adminId,
          adminNotes: app.adminNotes
        });

        if (result.success) {
  void successful.push(app.applicationId);
        } else {
  void failed.push({ applicationId: app.applicationId, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
  void failed.push({ applicationId: app.applicationId, error: error.message });
      }
    }

    return { successful, failed };
  }
}

// Export singleton instance
export const coachIntegrationService = new CoachIntegrationService();

export default coachIntegrationService;