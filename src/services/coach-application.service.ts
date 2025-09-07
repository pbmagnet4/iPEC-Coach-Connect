/**
 * Coach Application Service for iPEC Coach Connect
 * 
 * Comprehensive service for managing coach applications, verification,
 * document handling, and the complete onboarding workflow.
 */

import { handleSupabaseError, supabase, SupabaseError, supabaseUtils } from '../lib/supabase';
import { authService } from './auth.service';
import { notificationService } from './notifications.service';
import type {
  AdminReviewQueueFilters,
  ApiResponse,
  ApplicationDocumentWithDetails,
  ApplicationProgressData,
  ApplicationReferenceWithDetails,
  ApplicationReviewFormData,
  ApplicationReviewWithDetails,
  CoachApplicationApiResponse,
  CoachApplicationFilters,
  CoachApplicationFormData,
  CoachApplicationMetrics,
  CoachApplicationWithDetails,
  CreateApplicationDocumentData,
  CreateApplicationReferenceData,
  CreateApplicationReviewData,
  CreateCoachApplicationData,
  DocumentUploadData,
  InterviewFeedbackData,
  InterviewSchedulingData,
  NotificationTemplateData,
  PaginatedResponse,
  ReferenceResponse,
  ReferenceVerificationRequest,
  Tables,
  UpdateCoachApplicationData
} from '../types/database';

/**
 * Enhanced Coach Application Management Service
 */
class CoachApplicationService {
  // =====================================================================
  // APPLICATION CREATION AND MANAGEMENT
  // =====================================================================

  /**
   * Create a new coach application (draft)
   */
  async createApplication(formData: Partial<CoachApplicationFormData>): Promise<CoachApplicationApiResponse<Tables<'coach_applications'>>> {
    try {
      const authState = authService.getState();
      if (!authState.user || !authState.profile) {
        throw new SupabaseError('User not authenticated');
      }

      // Check if user already has an application
      const existingApp = await this.getUserApplication(authState.user.id);
      if (existingApp.data && existingApp.data.status !== 'withdrawn') {
        throw new SupabaseError('User already has an active application');
      }

      // Create application data
      const applicationData: CreateCoachApplicationData = {
        user_id: authState.user.id,
        status: 'draft',
        first_name: formData.first_name || authState.profile.full_name?.split(' ')[0] || '',
        last_name: formData.last_name || authState.profile.full_name?.split(' ').slice(1).join(' ') || '',
        email: formData.email || authState.user.email || '',
        phone: formData.phone || authState.profile.phone || '',
        ipec_certification_number: formData.ipec_certification_number || '',
        certification_level: formData.certification_level || 'Associate',
        certification_date: formData.certification_date || '',
        experience_years: formData.experience_years || 0,
        hourly_rate: formData.hourly_rate,
        bio: formData.bio || '',
        specializations: formData.specializations || [],
        languages: formData.languages || [],
        website: formData.website,
        linkedin_url: formData.linkedin_url,
        cover_letter: formData.cover_letter || '',
        motivation: formData.motivation,
        additional_notes: formData.additional_notes,
        referral_source: formData.referral_source,
      };

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .insert(applicationData)
          .select()
          .single();
      });

      if (!result) {
        throw new SupabaseError('Failed to create application');
      }

      // Create references if provided
      if (formData.references && formData.references.length > 0) {
        await this.addReferences(result.id, formData.references);
      }

      return {
        data: result,
        application_id: result.id,
        current_status: result.status,
        next_steps: ['Complete application form', 'Upload required documents', 'Add professional references']
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update an existing application
   */
  async updateApplication(
    applicationId: string, 
    updates: Partial<CoachApplicationFormData>
  ): Promise<CoachApplicationApiResponse<Tables<'coach_applications'>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Verify ownership
      const application = await this.getApplication(applicationId);
      if (application.error || !application.data) {
        return { error: application.error || { message: 'Application not found', code: 'APPLICATION_NOT_FOUND' }};
      }

      if (application.data.user_id !== authState.user.id) {
        throw new SupabaseError('Unauthorized: Cannot update another user\'s application', 'UNAUTHORIZED');
      }

      // Check if application can be updated
      if (!['draft', 'documents_requested'].includes(application.data.status)) {
        throw new SupabaseError('Application cannot be updated in current status', 'INVALID_STATUS');
      }

      // Prepare update data
      const updateData: UpdateCoachApplicationData = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        phone: updates.phone,
        ipec_certification_number: updates.ipec_certification_number,
        certification_level: updates.certification_level,
        certification_date: updates.certification_date,
        experience_years: updates.experience_years,
        hourly_rate: updates.hourly_rate,
        bio: updates.bio,
        specializations: updates.specializations,
        languages: updates.languages,
        website: updates.website,
        linkedin_url: updates.linkedin_url,
        cover_letter: updates.cover_letter,
        motivation: updates.motivation,
        additional_notes: updates.additional_notes,
        referral_source: updates.referral_source,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateCoachApplicationData] === undefined) {
          delete updateData[key as keyof UpdateCoachApplicationData];
        }
      });

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .update(updateData)
          .eq('id', applicationId)
          .select()
          .single();
      });

      if (!result) {
        throw new SupabaseError('Failed to update application');
      }

      return {
        data: result,
        application_id: result.id,
        current_status: result.status,
        next_steps: await this.getNextSteps(result.id)
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Submit application for review
   */
  async submitApplication(applicationId: string): Promise<CoachApplicationApiResponse<Tables<'coach_applications'>>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get application with details
      const applicationResult = await this.getApplicationWithDetails(applicationId);
      if (applicationResult.error || !applicationResult.data) {
        return { error: applicationResult.error || { message: 'Application not found', code: 'APPLICATION_NOT_FOUND' }};
      }

      const application = applicationResult.data;

      // Verify ownership
      if (application.user_id !== authState.user.id) {
        throw new SupabaseError('Unauthorized: Cannot submit another user\'s application', 'UNAUTHORIZED');
      }

      // Validate application before submission
      const validation = await this.validateApplicationForSubmission(application);
      if (!validation.isValid) {
        throw new SupabaseError(`Application validation failed: ${validation.errors.join(', ')}`, 'VALIDATION_ERROR');
      }

      // Update application status
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .update({ 
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', applicationId)
          .select()
          .single();
      });

      if (!result) {
        throw new SupabaseError('Failed to submit application');
      }

      // Create initial review queue item
      await this.createReviewQueueItem(applicationId, 'initial_review', 2);

      // Send notification
      await this.sendApplicationNotification(applicationId, 'application_submitted');

      return {
        data: result,
        application_id: result.id,
        current_status: result.status,
        next_steps: ['Application under review', 'Wait for admin response']
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // =====================================================================
  // DOCUMENT MANAGEMENT
  // =====================================================================

  /**
   * Upload documents for application
   */
  async uploadDocuments(
    applicationId: string, 
    documentsData: DocumentUploadData[]
  ): Promise<ApiResponse<ApplicationDocumentWithDetails[]>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Verify ownership
      const application = await this.getApplication(applicationId);
      if (application.error || !application.data) {
        return { error: application.error || { message: 'Application not found', code: 'APPLICATION_NOT_FOUND' }};
      }

      if (application.data.user_id !== authState.user.id) {
        throw new SupabaseError('Unauthorized', 'UNAUTHORIZED');
      }

      const uploadedDocuments: ApplicationDocumentWithDetails[] = [];

      for (const documentData of documentsData) {
        for (const file of documentData.files) {
          // Generate unique filename
          const timestamp = Date.now();
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${applicationId}/${documentData.document_type}/${timestamp}_${sanitizedFileName}`;

          // Upload to Supabase Storage
          const uploadResult = await supabaseUtils.storage.upload('coach-documents', fileName, file);
          if (!uploadResult) {
            throw new SupabaseError(`Failed to upload file: ${file.name}`);
          }

          // Get public URL
          const fileUrl = await supabaseUtils.storage.getPublicUrl('coach-documents', fileName);

          // Save document record
          const documentRecord: CreateApplicationDocumentData = {
            application_id: applicationId,
            document_type: documentData.document_type,
            document_name: file.name,
            file_path: fileUrl,
            file_size: file.size,
            mime_type: file.type,
            verification_status: 'pending',
            is_required: documentData.is_required || false,
            display_order: uploadedDocuments.length
          };

          const savedDocument = await supabaseUtils.db.safeQuery(async () => {
            return await supabase
              .from('application_documents')
              .insert(documentRecord)
              .select('*, verified_by_profile:verified_by(full_name, avatar_url)')
              .single();
          });

          if (savedDocument) {
  void uploadedDocuments.push(savedDocument as ApplicationDocumentWithDetails);
          }
        }
      }

      // Update application status if needed
      if (application.data.status === 'documents_requested') {
        await this.updateApplicationStatus(applicationId, 'under_review', authState.user.id);
      }

      return { data: uploadedDocuments };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get document with application
      const documentResult = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_documents')
          .select('*, application:coach_applications!inner(user_id)')
          .eq('id', documentId)
          .single();
      });

      if (!documentResult) {
        throw new SupabaseError('Document not found');
      }

      // Verify ownership
      if (documentResult.application.user_id !== authState.user.id) {
        throw new SupabaseError('Unauthorized', 'UNAUTHORIZED');
      }

      // Delete from storage
      const fileName = documentResult.file_path.split('/').pop();
      if (fileName) {
        await supabaseUtils.storage.delete('coach-documents', fileName);
      }

      // Delete record
      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_documents')
          .delete()
          .eq('id', documentId);
      });

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // =====================================================================
  // REFERENCE MANAGEMENT
  // =====================================================================

  /**
   * Add references to application
   */
  async addReferences(
    applicationId: string, 
    references: Tables<'application_references'>[]
  ): Promise<ApiResponse<ApplicationReferenceWithDetails[]>> {
    try {
      const createdReferences: ApplicationReferenceWithDetails[] = [];

      for (const referenceData of references) {
        const referenceRecord: CreateApplicationReferenceData = {
          application_id: applicationId,
          name: referenceData.name,
          email: referenceData.email,
          phone: referenceData.phone,
          relationship: referenceData.relationship,
          organization: referenceData.organization,
          contact_status: 'pending',
          is_verified: false,
          verification_token: this.generateVerificationToken()
        };

        const savedReference = await supabaseUtils.db.safeQuery(async () => {
          return await supabase
            .from('application_references')
            .insert(referenceRecord)
            .select()
            .single();
        });

        if (savedReference) {
  void createdReferences.push(savedReference);
        }
      }

      return { data: createdReferences };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Send reference verification request
   */
  async sendReferenceRequest(referenceId: string): Promise<ApiResponse<void>> {
    try {
      // Get reference details
      const referenceResult = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_references')
          .select('*, application:coach_applications!inner(first_name, last_name)')
          .eq('id', referenceId)
          .single();
      });

      if (!referenceResult) {
        throw new SupabaseError('Reference not found');
      }

      const reference = referenceResult;

      // Generate verification request
      const verificationRequest: ReferenceVerificationRequest = {
        reference_id: referenceId,
        verification_token: reference.verification_token!,
        questions: [
          {
            id: 'coaching_skills',
            question: 'How would you rate their coaching skills?',
            type: 'rating',
            required: true,
            max_rating: 5
          },
          {
            id: 'professionalism',
            question: 'How would you rate their professionalism?',
            type: 'rating',
            required: true,
            max_rating: 5
          },
          {
            id: 'communication',
            question: 'How would you rate their communication skills?',
            type: 'rating',
            required: true,
            max_rating: 5
          },
          {
            id: 'recommend',
            question: 'Would you recommend them as a coach?',
            type: 'boolean',
            required: true
          },
          {
            id: 'comments',
            question: 'Any additional comments about their coaching abilities?',
            type: 'text',
            required: false
          }
        ]
      };

      // Send email (this would integrate with your email service)
      await this.sendReferenceEmail(reference, verificationRequest);

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

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // =====================================================================
  // ADMIN FUNCTIONS
  // =====================================================================

  /**
   * Get applications for admin review (with filters and pagination)
   */
  async getApplicationsForReview(
    filters: CoachApplicationFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<PaginatedResponse<CoachApplicationWithDetails>>> {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('coach_applications')
        .select(`
          *,
          applicant:profiles!coach_applications_user_id_fkey(id, full_name, avatar_url, email),
          documents:application_documents(*),
          references:application_references(*),
          reviews:application_reviews(*, reviewer:profiles!application_reviews_reviewer_id_fkey(full_name)),
          interviews:application_interviews(*, interviewer:profiles!application_interviews_interviewer_id_fkey(full_name)),
          status_history:application_status_history(*, changed_by_profile:profiles(full_name))
        `)
        .order('submitted_at', { ascending: false });

      // Apply filters
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters.certification_level?.length) {
        query = query.in('certification_level', filters.certification_level);
      }

      if (filters.experience_years_min !== undefined) {
        query = query.gte('experience_years', filters.experience_years_min);
      }

      if (filters.experience_years_max !== undefined) {
        query = query.lte('experience_years', filters.experience_years_max);
      }

      if (filters.submitted_date_range) {
        query = query
          .gte('submitted_at', filters.submitted_date_range.start)
          .lte('submitted_at', filters.submitted_date_range.end);
      }

      if (filters.reviewer_id) {
        query = query.eq('reviewer_id', filters.reviewer_id);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await query;
      });

      if (!result) {
        throw new SupabaseError('Failed to fetch applications');
      }

      // Get total count
      const countResult = await supabaseUtils.db.safeQuery(async () => {
        let countQuery = supabase
          .from('coach_applications')
          .select('*', { count: 'exact', head: true });

        // Apply same filters for count
        if (filters.status?.length) {
          countQuery = countQuery.in('status', filters.status);
        }
        // ... apply other filters

        return await countQuery;
      });

      const total = countResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      // Calculate progress for each application
      const applicationsWithProgress = await Promise.all(
        result.map(async (app: any) => {
          const progress = await this.calculateApplicationProgress(app.id);
          return {
            ...app,
            progress
          } as CoachApplicationWithDetails;
        })
      );

      return {
        data: {
          data: applicationsWithProgress,
          meta: {
            count: total,
            page,
            limit,
            totalPages
          }
        }
      };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Submit application review
   */
  async submitReview(
    applicationId: string, 
    reviewData: ApplicationReviewFormData
  ): Promise<ApiResponse<ApplicationReviewWithDetails>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const reviewRecord: CreateApplicationReviewData = {
        application_id: applicationId,
        reviewer_id: authState.user.id,
        review_type: reviewData.review_type,
        decision: reviewData.decision,
        credentials_rating: reviewData.credentials_rating,
        experience_rating: reviewData.experience_rating,
        communication_rating: reviewData.communication_rating,
        professionalism_rating: reviewData.professionalism_rating,
        overall_rating: reviewData.overall_rating,
        strengths: reviewData.strengths,
        concerns: reviewData.concerns,
        recommendations: reviewData.recommendations,
        notes: reviewData.notes
      };

      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_reviews')
          .insert(reviewRecord)
          .select('*, reviewer:profiles!application_reviews_reviewer_id_fkey(full_name, avatar_url)')
          .single();
      });

      if (!result) {
        throw new SupabaseError('Failed to save review');
      }

      // Update application status based on decision
      if (reviewData.decision) {
        await this.processReviewDecision(applicationId, reviewData.decision, authState.user.id);
      }

      return { data: result as ApplicationReviewWithDetails };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // =====================================================================
  // UTILITY FUNCTIONS
  // =====================================================================

  /**
   * Get user's current application
   */
  async getUserApplication(userId: string): Promise<ApiResponse<CoachApplicationWithDetails | null>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .select(`
            *,
            applicant:profiles!coach_applications_user_id_fkey(*),
            documents:application_documents(*),
            references:application_references(*),
            reviews:application_reviews(*, reviewer:profiles!application_reviews_reviewer_id_fkey(full_name)),
            status_history:application_status_history(*, changed_by_profile:profiles(full_name))
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
      });

      if (!result) {
        return { data: null };
      }

      const progress = await this.calculateApplicationProgress(result.id);
      const applicationWithProgress = {
        ...result,
        progress
      } as CoachApplicationWithDetails;

      return { data: applicationWithProgress };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<ApiResponse<Tables<'coach_applications'>>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .select('*')
          .eq('id', applicationId)
          .single();
      });

      if (!result) {
        throw new SupabaseError('Application not found');
      }

      return { data: result };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get application with full details
   */
  async getApplicationWithDetails(applicationId: string): Promise<ApiResponse<CoachApplicationWithDetails>> {
    try {
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('coach_applications')
          .select(`
            *,
            applicant:profiles!coach_applications_user_id_fkey(*),
            documents:application_documents(*, verified_by_profile:profiles(full_name)),
            references:application_references(*),
            reviews:application_reviews(*, reviewer:profiles!application_reviews_reviewer_id_fkey(full_name, avatar_url)),
            interviews:application_interviews(*, interviewer:profiles!application_interviews_interviewer_id_fkey(full_name)),
            status_history:application_status_history(*, changed_by_profile:profiles(full_name)),
            notifications:application_notifications(*, recipient:profiles!application_notifications_recipient_id_fkey(full_name))
          `)
          .eq('id', applicationId)
          .single();
      });

      if (!result) {
        throw new SupabaseError('Application not found');
      }

      const progress = await this.calculateApplicationProgress(result.id);
      const applicationWithProgress = {
        ...result,
        progress
      } as CoachApplicationWithDetails;

      return { data: applicationWithProgress };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  // =====================================================================
  // PRIVATE HELPER METHODS
  // =====================================================================

  private async validateApplicationForSubmission(
    application: CoachApplicationWithDetails
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic application data validation
    if (!application.first_name?.trim()) {
  void errors.push('First name is required');
    }

    if (!application.last_name?.trim()) {
  void errors.push('Last name is required');
    }

    if (!application.email?.trim()) {
  void errors.push('Email is required');
    }

    if (!application.phone?.trim()) {
  void errors.push('Phone number is required');
    }

    if (!application.ipec_certification_number?.trim()) {
  void errors.push('iPEC certification number is required');
    }

    if (!application.certification_date) {
  void errors.push('Certification date is required');
    }

    if (application.experience_years < 0) {
  void errors.push('Experience years must be a positive number');
    }

    if (!application.bio?.trim() || application.bio.length < 100) {
  void errors.push('Bio must be at least 100 characters');
    }

    if (!application.specializations?.length) {
  void errors.push('At least one specialization is required');
    }

    if (!application.languages?.length) {
  void errors.push('At least one language is required');
    }

    if (!application.cover_letter?.trim() || application.cover_letter.length < 200) {
  void errors.push('Cover letter must be at least 200 characters');
    }

    // Document validation
    const requiredDocTypes = ['resume', 'certification', 'identity'];
    const uploadedDocTypes = application.documents?.map(doc => doc.document_type) || [];
    
    for (const docType of requiredDocTypes) {
      if (!uploadedDocTypes.includes(docType as any)) {
  void errors.push(`${docType} document is required`);
      }
    }

    // Reference validation
    if (!application.references?.length || application.references.length < 2) {
  void errors.push('At least 2 professional references are required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async calculateApplicationProgress(applicationId: string): Promise<number> {
    try {
      // Use the database function we created
      const result = await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .rpc('calculate_application_progress', { app_id: applicationId });
      });

      return result || 0;
    } catch {
      return 0;
    }
  }

  private async getNextSteps(applicationId: string): Promise<string[]> {
    const application = await this.getApplication(applicationId);
    if (application.error || !application.data) {
      return [];
    }

    const {status} = application.data;
    const steps: string[] = [];

    switch (status) {
      case 'draft':
  void steps.push('Complete application form');
  void steps.push('Upload required documents');
  void steps.push('Add professional references');
  void steps.push('Submit application');
        break;
      case 'submitted':
  void steps.push('Application under initial review');
  void steps.push('Wait for admin response');
        break;
      case 'under_review':
  void steps.push('Application being reviewed by admins');
  void steps.push('Documents being verified');
        break;
      case 'documents_requested':
  void steps.push('Upload additional requested documents');
  void steps.push('Respond to admin feedback');
        break;
      case 'interview_scheduled':
  void steps.push('Prepare for coaching interview');
  void steps.push('Complete interview process');
        break;
      case 'approved':
  void steps.push('Set up coach profile');
  void steps.push('Complete onboarding process');
  void steps.push('Start accepting clients');
        break;
      case 'rejected':
  void steps.push('Review rejection feedback');
  void steps.push('Address concerns and reapply if possible');
        break;
      default:
        break;
    }

    return steps;
  }

  private async updateApplicationStatus(
    applicationId: string, 
    newStatus: Tables<'coach_applications'>['status'], 
    changedBy?: string
  ): Promise<void> {
    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('coach_applications')
        .update({ 
          status: newStatus,
          reviewer_id: changedBy 
        })
        .eq('id', applicationId);
    });
  }

  private async createReviewQueueItem(
    applicationId: string, 
    queueType: Tables<'admin_review_queues'>['queue_type'], 
    priority = 3
  ): Promise<void> {
    const queueData = {
      application_id: applicationId,
      queue_type: queueType,
      priority,
      status: 'pending' as const,
      estimated_hours: this.getEstimatedHours(queueType),
      complexity_score: 1
    };

    await supabaseUtils.db.safeQuery(async () => {
      return await supabase
        .from('admin_review_queues')
        .insert(queueData);
    });
  }

  private getEstimatedHours(queueType: Tables<'admin_review_queues'>['queue_type']): number {
    const estimates = {
      'initial_review': 1.0,
      'document_verification': 2.0,
      'reference_check': 1.5,
      'interview_scheduling': 0.5,
      'final_approval': 0.5
    };
    return estimates[queueType] || 1.0;
  }

  private async processReviewDecision(
    applicationId: string,
    decision: Tables<'application_reviews'>['decision'],
    reviewerId: string
  ): Promise<void> {
    switch (decision) {
      case 'approve':
        await this.updateApplicationStatus(applicationId, 'approved', reviewerId);
        await this.sendApplicationNotification(applicationId, 'approved');
        break;
      case 'reject':
        await this.updateApplicationStatus(applicationId, 'rejected', reviewerId);
        await this.sendApplicationNotification(applicationId, 'rejected');
        break;
      case 'request_info':
        await this.updateApplicationStatus(applicationId, 'documents_requested', reviewerId);
        await this.sendApplicationNotification(applicationId, 'documents_requested');
        break;
      case 'schedule_interview':
        await this.updateApplicationStatus(applicationId, 'interview_scheduled', reviewerId);
        await this.createReviewQueueItem(applicationId, 'interview_scheduling', 2);
        await this.sendApplicationNotification(applicationId, 'interview_scheduled');
        break;
    }
  }

  private async sendApplicationNotification(
    applicationId: string,
    notificationType: Tables<'application_notifications'>['type']
  ): Promise<void> {
    // Get application details
    const application = await this.getApplication(applicationId);
    if (application.error || !application.data) {
      return;
    }

    const templates = this.getNotificationTemplates();
    const template = templates[notificationType];
    
    if (template) {
      const notificationData = {
        application_id: applicationId,
        recipient_id: application.data.user_id,
        type: notificationType,
        title: template.title,
        message: template.message,
        delivery_method: 'email' as const,
        email_subject: template.subject,
        email_template: template.email_body,
        priority: template.priority || 1
      };

      await supabaseUtils.db.safeQuery(async () => {
        return await supabase
          .from('application_notifications')
          .insert(notificationData);
      });

      // TODO: Actually send the email using your email service
      // await emailService.sendEmail(...)
    }
  }

  private getNotificationTemplates(): Record<string, any> {
    return {
      'application_submitted': {
        title: 'Application Submitted Successfully',
        subject: 'Your Coach Application Has Been Submitted',
        message: 'Thank you for submitting your coach application. We\'ll review it and get back to you soon.',
        email_body: 'Your application for becoming an iPEC coach has been received and is now under review.',
        priority: 2
      },
      'under_review': {
        title: 'Application Under Review',
        subject: 'Your Coach Application Is Under Review',
        message: 'Your application is currently being reviewed by our team.',
        email_body: 'We are currently reviewing your coaching application and documentation.',
        priority: 2
      },
      'documents_requested': {
        title: 'Additional Documents Required',
        subject: 'Additional Documents Required for Your Application',
        message: 'We need some additional documents to continue processing your application.',
        email_body: 'Please upload the requested additional documents to complete your application.',
        priority: 3
      },
      'interview_scheduled': {
        title: 'Interview Scheduled',
        subject: 'Your Coaching Interview Has Been Scheduled',
        message: 'Congratulations! Your interview has been scheduled.',
        email_body: 'We\'re excited to interview you for our coaching program. Details will follow.',
        priority: 4
      },
      'approved': {
        title: 'Application Approved!',
        subject: 'Welcome to iPEC Coach Connect!',
        message: 'Congratulations! Your application has been approved.',
        email_body: 'Welcome to our network of professional coaches. Let\'s get you set up!',
        priority: 5
      },
      'rejected': {
        title: 'Application Update',
        subject: 'Update on Your Coach Application',
        message: 'Thank you for your interest. We have an update on your application.',
        email_body: 'After careful review, we\'ve decided not to move forward at this time.',
        priority: 3
      }
    };
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
  void Math.random().toString(36).substring(2, 15);
  }

  private async sendReferenceEmail(
    reference: any, 
    verificationRequest: ReferenceVerificationRequest
  ): Promise<void> {
    // TODO: Implement email sending logic
  void console.log('Sending reference email to:', reference.email);
  void console.log('Verification request:', verificationRequest);
  }
}

// Export singleton instance
export const coachApplicationService = new CoachApplicationService();

export default coachApplicationService;