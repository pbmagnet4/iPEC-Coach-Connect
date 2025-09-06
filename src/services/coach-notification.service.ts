/**
 * Coach Application Notification Service
 * 
 * Handles email notifications and in-app notifications for coach applications,
 * status updates, and communication throughout the onboarding process.
 */

import { supabase, supabaseUtils, handleSupabaseError, SupabaseError } from '../lib/supabase';
import { notificationService } from './notifications.service';
import type {
  Tables,
  CoachApplicationWithDetails,
  NotificationTemplateData,
  CreateApplicationNotificationData
} from '../types/database';

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

interface NotificationContext {
  application: CoachApplicationWithDetails;
  coach_name: string;
  application_id: string;
  submitted_date: string;
  current_status: string;
  review_notes?: string;
  next_steps?: string[];
  admin_contact_email: string;
  platform_name: string;
  support_url: string;
  dashboard_url: string;
}

/**
 * Coach Application Notification Service
 */
class CoachNotificationService {
  private readonly adminContactEmail = 'applications@ipeccoachconnect.com';
  private readonly platformName = 'iPEC Coach Connect';
  private readonly supportUrl = 'https://ipeccoachconnect.com/support';
  
  // =====================================================================
  // MAIN NOTIFICATION METHODS
  // =====================================================================

  /**
   * Send application submitted notification
   */
  async sendApplicationSubmittedNotification(
    applicationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application);
      const template = this.getEmailTemplate('application_submitted');
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        'application_submitted',
        'Application Submitted Successfully',
        'Your coach application has been submitted and is being reviewed by our team.',
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application status update notification
   */
  async sendStatusUpdateNotification(
    applicationId: string,
    newStatus: Tables<'coach_applications'>['status'],
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const notificationType = this.mapStatusToNotificationType(newStatus);
      const context = this.buildNotificationContext(application, { reviewNotes });
      const template = this.getEmailTemplate(notificationType);
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        notificationType,
        this.getNotificationTitle(newStatus),
        this.getNotificationMessage(newStatus, reviewNotes),
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send documents requested notification
   */
  async sendDocumentsRequestedNotification(
    applicationId: string,
    requestedDocuments: string[],
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application, {
        requestedDocuments,
        adminNotes
      });
      
      const template = this.getEmailTemplate('documents_requested');
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        'documents_requested',
        'Additional Documents Required',
        `We need additional documents to continue processing your application: ${requestedDocuments.join(', ')}`,
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send interview scheduled notification
   */
  async sendInterviewScheduledNotification(
    applicationId: string,
    interviewDate: string,
    interviewUrl: string,
    interviewerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application, {
        interviewDate,
        interviewUrl,
        interviewerName
      });
      
      const template = this.getEmailTemplate('interview_scheduled');
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        'interview_scheduled',
        'Interview Scheduled',
        `Your coaching interview has been scheduled for ${new Date(interviewDate).toLocaleDateString()} with ${interviewerName}.`,
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application approved notification
   */
  async sendApplicationApprovedNotification(
    applicationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application);
      const template = this.getEmailTemplate('approved');
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        'approved',
        'Application Approved!',
        'Congratulations! Your coach application has been approved. Welcome to iPEC Coach Connect!',
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application rejected notification
   */
  async sendApplicationRejectedNotification(
    applicationId: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application, { rejectionReason });
      const template = this.getEmailTemplate('rejected');
      
      // Send email notification
      const emailResult = await this.sendEmailNotification(
        application.applicant.email || application.email,
        template,
        context
      );

      // Create in-app notification
      const inAppResult = await this.createInAppNotification(
        applicationId,
        application.user_id,
        'rejected',
        'Application Decision',
        rejectionReason 
          ? `Thank you for your application. ${rejectionReason}` 
          : 'Thank you for your interest. After careful review, we are unable to move forward with your application at this time.',
        template.subject
      );

      return { 
        success: emailResult.success && inAppResult.success,
        error: emailResult.error || inAppResult.error
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =====================================================================
  // REFERENCE VERIFICATION NOTIFICATIONS
  // =====================================================================

  /**
   * Send reference verification request
   */
  async sendReferenceVerificationRequest(
    referenceId: string,
    verificationToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get reference details
      const referenceResult = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_references')
          .select(`
            *,
            application:coach_applications!inner(
              first_name,
              last_name,
              applicant:profiles!coach_applications_user_id_fkey(*)
            )
          `)
          .eq('id', referenceId)
          .single();
      });

      if (!referenceResult) {
        throw new Error('Reference not found');
      }

      const reference = referenceResult;
      const application = reference.application;
      
      // Build verification URL
      const verificationUrl = `${window.location.origin}/reference-verification?token=${verificationToken}&ref=${referenceId}`;
      
      const context = {
        reference_name: reference.name,
        applicant_name: `${application.first_name} ${application.last_name}`,
        verification_url: verificationUrl,
        relationship: reference.relationship,
        organization: reference.organization || 'N/A',
        platform_name: this.platformName,
        admin_contact_email: this.adminContactEmail
      };

      const template = this.getEmailTemplate('reference_request');
      
      // Send email to reference
      const emailResult = await this.sendEmailNotification(
        reference.email,
        template,
        context
      );

      if (emailResult.success) {
        // Update reference status
        await supabaseUtils.db.safeQuery(async () => {
          return await supabase
            .from('application_references')
            .update({
              contact_status: 'contacted',
              contacted_at: new Date().toISOString()
            })
            .eq('id', referenceId);
        });
      }

      return emailResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =====================================================================
  // ADMIN NOTIFICATIONS
  // =====================================================================

  /**
   * Send admin notification for new application
   */
  async sendAdminNewApplicationNotification(
    applicationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const application = await this.getApplicationWithDetails(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const context = this.buildNotificationContext(application);
      const template = this.getEmailTemplate('admin_new_application');
      
      // Send to admin team
      const emailResult = await this.sendEmailNotification(
        this.adminContactEmail,
        template,
        context
      );

      return emailResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =====================================================================
  // HELPER METHODS
  // =====================================================================

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
      console.error('Failed to get application details:', error);
      return null;
    }
  }

  private buildNotificationContext(
    application: CoachApplicationWithDetails, 
    additional: Record<string, any> = {}
  ): NotificationContext {
    return {
      application,
      coach_name: `${application.first_name} ${application.last_name}`,
      application_id: application.id,
      submitted_date: application.submitted_at 
        ? new Date(application.submitted_at).toLocaleDateString()
        : new Date(application.created_at).toLocaleDateString(),
      current_status: application.status,
      admin_contact_email: this.adminContactEmail,
      platform_name: this.platformName,
      support_url: this.supportUrl,
      dashboard_url: `${window.location.origin}/dashboard`,
      ...additional
    };
  }

  private async createInAppNotification(
    applicationId: string,
    userId: string,
    type: Tables<'application_notifications'>['type'],
    title: string,
    message: string,
    emailSubject?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notificationData: CreateApplicationNotificationData = {
        application_id: applicationId,
        recipient_id: userId,
        type,
        title,
        message,
        delivery_method: 'in_app',
        email_subject: emailSubject,
        priority: this.getNotificationPriority(type)
      };

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_notifications')
          .insert(notificationData)
          .select()
          .single();
      });

      if (!result) {
        throw new Error('Failed to create in-app notification');
      }

      // Also create a regular notification using the existing service
      await notificationService.createNotification({
        userId,
        title,
        message,
        type: 'system',
        metadata: { application_id: applicationId, notification_type: type }
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendEmailNotification(
    to: string,
    template: EmailTemplate,
    context: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, context);
      const htmlBody = this.replaceTemplateVariables(template.htmlBody, context);
      const textBody = this.replaceTemplateVariables(template.textBody, context);

      // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll log the email content
      console.log('Email Notification:', {
        to,
        subject,
        htmlBody,
        textBody
      });

      // TODO: Implement actual email sending
      // Example with SendGrid:
      /*
      const sgMail = require('@sendgrid/mail');
      const msg = {
        to,
        from: this.adminContactEmail,
        subject,
        text: textBody,
        html: htmlBody,
      };
      await sgMail.send(msg);
      */

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private replaceTemplateVariables(template: string, context: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }

  private mapStatusToNotificationType(
    status: Tables<'coach_applications'>['status']
  ): Tables<'application_notifications'>['type'] {
    switch (status) {
      case 'under_review':
        return 'under_review';
      case 'documents_requested':
        return 'documents_requested';
      case 'interview_scheduled':
        return 'interview_scheduled';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'under_review';
    }
  }

  private getNotificationTitle(status: Tables<'coach_applications'>['status']): string {
    switch (status) {
      case 'under_review':
        return 'Application Under Review';
      case 'documents_requested':
        return 'Additional Documents Required';
      case 'interview_scheduled':
        return 'Interview Scheduled';
      case 'approved':
        return 'Application Approved!';
      case 'rejected':
        return 'Application Decision';
      default:
        return 'Application Update';
    }
  }

  private getNotificationMessage(
    status: Tables<'coach_applications'>['status'], 
    reviewNotes?: string
  ): string {
    switch (status) {
      case 'under_review':
        return 'Your application is currently being reviewed by our team.';
      case 'documents_requested':
        return reviewNotes || 'We need some additional documents to continue processing your application.';
      case 'interview_scheduled':
        return 'Your coaching interview has been scheduled. Check your email for details.';
      case 'approved':
        return 'Congratulations! Your coach application has been approved. Welcome to iPEC Coach Connect!';
      case 'rejected':
        return reviewNotes || 'After careful review, we are unable to move forward with your application at this time.';
      default:
        return 'Your application status has been updated.';
    }
  }

  private getNotificationPriority(type: Tables<'application_notifications'>['type']): number {
    switch (type) {
      case 'approved':
      case 'rejected':
        return 5; // High priority
      case 'interview_scheduled':
        return 4;
      case 'documents_requested':
        return 3;
      case 'under_review':
      case 'application_submitted':
        return 2;
      default:
        return 1;
    }
  }

  private getEmailTemplate(type: string): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      application_submitted: {
        subject: 'Application Submitted - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Application Submitted Successfully</h2>
            <p>Dear {{coach_name}},</p>
            <p>Thank you for submitting your coach application to {{platform_name}}. We've received your application and it's now being reviewed by our team.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What happens next?</h3>
              <ul>
                <li>Initial application review (1-2 business days)</li>
                <li>Document verification (2-3 business days)</li>
                <li>Reference checks (3-4 business days)</li>
                <li>Final decision (5-7 business days)</li>
              </ul>
            </div>
            
            <p>You can check your application status anytime by visiting your <a href="{{dashboard_url}}">dashboard</a>.</p>
            
            <p>If you have any questions, please contact us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a>.</p>
            
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Application Submitted Successfully\n\nDear {{coach_name}},\n\nThank you for submitting your coach application to {{platform_name}}. We've received your application and it's now being reviewed by our team.\n\nWhat happens next?\n- Initial application review (1-2 business days)\n- Document verification (2-3 business days)\n- Reference checks (3-4 business days)\n- Final decision (5-7 business days)\n\nYou can check your application status anytime by visiting your dashboard: {{dashboard_url}}\n\nIf you have any questions, please contact us at {{admin_contact_email}}.\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'dashboard_url', 'admin_contact_email']
      },
      under_review: {
        subject: 'Application Under Review - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Application Under Review</h2>
            <p>Dear {{coach_name}},</p>
            <p>Your coach application is currently being reviewed by our team. We're carefully evaluating your qualifications and experience.</p>
            <p>We'll notify you as soon as we have an update on your application status.</p>
            <p>You can check your application status anytime by visiting your <a href="{{dashboard_url}}">dashboard</a>.</p>
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Application Under Review\n\nDear {{coach_name}},\n\nYour coach application is currently being reviewed by our team. We're carefully evaluating your qualifications and experience.\n\nWe'll notify you as soon as we have an update on your application status.\n\nYou can check your application status anytime by visiting your dashboard: {{dashboard_url}}\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'dashboard_url']
      },
      documents_requested: {
        subject: 'Additional Documents Required - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Additional Documents Required</h2>
            <p>Dear {{coach_name}},</p>
            <p>We need some additional documents to continue processing your coach application.</p>
            {{#if requestedDocuments}}
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4>Required Documents:</h4>
              <ul>
              {{#each requestedDocuments}}
                <li>{{this}}</li>
              {{/each}}
              </ul>
            </div>
            {{/if}}
            {{#if adminNotes}}
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Additional Notes:</h4>
              <p>{{adminNotes}}</p>
            </div>
            {{/if}}
            <p>Please upload the required documents through your <a href="{{dashboard_url}}">dashboard</a>.</p>
            <p>If you have any questions, please contact us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a>.</p>
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Additional Documents Required\n\nDear {{coach_name}},\n\nWe need some additional documents to continue processing your coach application.\n\n{{#if adminNotes}}Additional Notes: {{adminNotes}}\n\n{{/if}}Please upload the required documents through your dashboard: {{dashboard_url}}\n\nIf you have any questions, please contact us at {{admin_contact_email}}.\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'dashboard_url', 'admin_contact_email', 'requestedDocuments', 'adminNotes']
      },
      interview_scheduled: {
        subject: 'Interview Scheduled - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🎉 Interview Scheduled!</h2>
            <p>Dear {{coach_name}},</p>
            <p>Congratulations! We're excited to move forward with your coach application. Your interview has been scheduled.</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h4>Interview Details:</h4>
              <p><strong>Date & Time:</strong> {{interviewDate}}</p>
              <p><strong>Interviewer:</strong> {{interviewerName}}</p>
              <p><strong>Meeting Link:</strong> <a href="{{interviewUrl}}">Join Interview</a></p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Preparation Tips:</h4>
              <ul>
                <li>Review your application and be prepared to discuss your coaching experience</li>
                <li>Prepare examples of your coaching successes</li>
                <li>Have questions ready about our platform and coaching opportunities</li>
                <li>Test your video/audio setup before the interview</li>
              </ul>
            </div>
            
            <p>If you need to reschedule, please contact us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a> as soon as possible.</p>
            
            <p>We look forward to speaking with you!</p>
            
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Interview Scheduled!\n\nDear {{coach_name}},\n\nCongratulations! We're excited to move forward with your coach application. Your interview has been scheduled.\n\nInterview Details:\nDate & Time: {{interviewDate}}\nInterviewer: {{interviewerName}}\nMeeting Link: {{interviewUrl}}\n\nPreparation Tips:\n- Review your application and be prepared to discuss your coaching experience\n- Prepare examples of your coaching successes\n- Have questions ready about our platform and coaching opportunities\n- Test your video/audio setup before the interview\n\nIf you need to reschedule, please contact us at {{admin_contact_email}} as soon as possible.\n\nWe look forward to speaking with you!\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'interviewDate', 'interviewerName', 'interviewUrl', 'admin_contact_email']
      },
      approved: {
        subject: '🎉 Welcome to {{platform_name}}!',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
              <h1 style="color: #28a745;">🎉 Congratulations!</h1>
              <h2>Welcome to {{platform_name}}</h2>
            </div>
            
            <p>Dear {{coach_name}},</p>
            
            <p>We're thrilled to inform you that your coach application has been <strong>approved</strong>! Welcome to our network of elite iPEC coaches.</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h3>Next Steps:</h3>
              <ol>
                <li><a href="{{dashboard_url}}">Complete your coach profile</a></li>
                <li>Set up your availability and rates</li>
                <li>Connect your Stripe account for payments</li>
                <li>Start accepting clients!</li>
              </ol>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What's Included:</h3>
              <ul>
                <li>Access to our client matching system</li>
                <li>Professional coach profile page</li>
                <li>Integrated scheduling and payment processing</li>
                <li>Marketing and business development resources</li>
                <li>Ongoing support and community</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{dashboard_url}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Get Started</a>
            </p>
            
            <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a>.</p>
            
            <p>Once again, congratulations and welcome to the team!</p>
            
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `🎉 Congratulations! Welcome to {{platform_name}}\n\nDear {{coach_name}},\n\nWe're thrilled to inform you that your coach application has been approved! Welcome to our network of elite iPEC coaches.\n\nNext Steps:\n1. Complete your coach profile: {{dashboard_url}}\n2. Set up your availability and rates\n3. Connect your Stripe account for payments\n4. Start accepting clients!\n\nWhat's Included:\n- Access to our client matching system\n- Professional coach profile page\n- Integrated scheduling and payment processing\n- Marketing and business development resources\n- Ongoing support and community\n\nIf you have any questions or need assistance getting started, please don't hesitate to reach out to us at {{admin_contact_email}}.\n\nOnce again, congratulations and welcome to the team!\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'dashboard_url', 'admin_contact_email']
      },
      rejected: {
        subject: 'Application Decision - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Application Decision</h2>
            <p>Dear {{coach_name}},</p>
            <p>Thank you for your interest in joining {{platform_name}} and for taking the time to submit your coach application.</p>
            <p>After careful review of your application, we have decided not to move forward at this time.</p>
            {{#if rejectionReason}}
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Feedback:</h4>
              <p>{{rejectionReason}}</p>
            </div>
            {{/if}}
            <p>We encourage you to continue developing your coaching practice and consider reapplying in the future when you have additional experience or qualifications.</p>
            <p>If you have any questions about this decision, please feel free to contact us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a>.</p>
            <p>We wish you all the best in your coaching journey.</p>
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Application Decision\n\nDear {{coach_name}},\n\nThank you for your interest in joining {{platform_name}} and for taking the time to submit your coach application.\n\nAfter careful review of your application, we have decided not to move forward at this time.\n\n{{#if rejectionReason}}Feedback: {{rejectionReason}}\n\n{{/if}}We encourage you to continue developing your coaching practice and consider reapplying in the future when you have additional experience or qualifications.\n\nIf you have any questions about this decision, please feel free to contact us at {{admin_contact_email}}.\n\nWe wish you all the best in your coaching journey.\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['coach_name', 'platform_name', 'rejectionReason', 'admin_contact_email']
      },
      reference_request: {
        subject: 'Reference Request for {{applicant_name}} - {{platform_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Professional Reference Request</h2>
            <p>Dear {{reference_name}},</p>
            <p><strong>{{applicant_name}}</strong> has applied to become a coach on {{platform_name}} and has listed you as a professional reference.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Applicant Information:</h4>
              <p><strong>Name:</strong> {{applicant_name}}</p>
              <p><strong>Your Relationship:</strong> {{relationship}}</p>
              {{#if organization}}<p><strong>Organization:</strong> {{organization}}</p>{{/if}}
            </div>
            
            <p>We would greatly appreciate if you could take a few minutes to provide feedback about {{applicant_name}}'s coaching abilities and professional qualifications.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{verification_url}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Complete Reference Form</a>
            </p>
            
            <p><strong>This reference request will expire in 7 days.</strong></p>
            
            <p>If you have any questions or concerns, please contact us at <a href="mailto:{{admin_contact_email}}">{{admin_contact_email}}</a>.</p>
            
            <p>Thank you for your time and assistance.</p>
            
            <p>Best regards,<br>The {{platform_name}} Team</p>
          </div>
        `,
        textBody: `Professional Reference Request\n\nDear {{reference_name}},\n\n{{applicant_name}} has applied to become a coach on {{platform_name}} and has listed you as a professional reference.\n\nApplicant Information:\nName: {{applicant_name}}\nYour Relationship: {{relationship}}\n{{#if organization}}Organization: {{organization}}\n{{/if}}\nWe would greatly appreciate if you could take a few minutes to provide feedback about {{applicant_name}}'s coaching abilities and professional qualifications.\n\nPlease complete the reference form here: {{verification_url}}\n\nThis reference request will expire in 7 days.\n\nIf you have any questions or concerns, please contact us at {{admin_contact_email}}.\n\nThank you for your time and assistance.\n\nBest regards,\nThe {{platform_name}} Team`,
        variables: ['reference_name', 'applicant_name', 'platform_name', 'relationship', 'organization', 'verification_url', 'admin_contact_email']
      },
      admin_new_application: {
        subject: 'New Coach Application - {{coach_name}}',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Coach Application Received</h2>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h4>Applicant Details:</h4>
              <p><strong>Name:</strong> {{coach_name}}</p>
              <p><strong>Email:</strong> {{application.email}}</p>
              <p><strong>iPEC Certification:</strong> {{application.certification_level}} ({{application.ipec_certification_number}})</p>
              <p><strong>Experience:</strong> {{application.experience_years}} years</p>
              <p><strong>Submitted:</strong> {{submitted_date}}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Specializations:</h4>
              <p>{{application.specializations}}</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{dashboard_url}}/admin/applications/{{application_id}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Review Application</a>
            </p>
            
            <p>Please review this application within 2 business days to maintain our service level commitments.</p>
          </div>
        `,
        textBody: `New Coach Application Received\n\nApplicant Details:\nName: {{coach_name}}\nEmail: {{application.email}}\niPEC Certification: {{application.certification_level}} ({{application.ipec_certification_number}})\nExperience: {{application.experience_years}} years\nSubmitted: {{submitted_date}}\n\nSpecializations: {{application.specializations}}\n\nReview Application: {{dashboard_url}}/admin/applications/{{application_id}}\n\nPlease review this application within 2 business days to maintain our service level commitments.`,
        variables: ['coach_name', 'application', 'submitted_date', 'application_id', 'dashboard_url']
      }
    };

    return templates[type] || templates.under_review;
  }
}

// Export singleton instance
export const coachNotificationService = new CoachNotificationService();

export default coachNotificationService;