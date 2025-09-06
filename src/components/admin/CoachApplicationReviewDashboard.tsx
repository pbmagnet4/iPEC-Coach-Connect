/**
 * Coach Application Review Dashboard for Admins
 * 
 * Comprehensive admin interface for reviewing coach applications,
 * managing the approval workflow, and tracking application progress.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Search,
  Star,
  User,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useUserContext } from '../../hooks/useUserContext';
import { coachApplicationService } from '../../services/coach-application.service';
import { coachIntegrationService } from '../../services/coach-integration.service';
import type {
  ApplicationReviewFormData,
  CoachApplicationFilters,
  CoachApplicationWithDetails,
  Tables
} from '../../types/database';

interface CoachApplicationReviewDashboardProps {
  onApplicationApproved?: (application: Tables<'coach_applications'>) => void;
  onApplicationRejected?: (application: Tables<'coach_applications'>) => void;
}

export function CoachApplicationReviewDashboard({
  onApplicationApproved,
  onApplicationRejected
}: CoachApplicationReviewDashboardProps) {
  const { user } = useUserContext();
  const [applications, setApplications] = useState<CoachApplicationWithDetails[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CoachApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<CoachApplicationFilters>({});
  const [selectedApplication, setSelectedApplication] = useState<CoachApplicationWithDetails | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    interviewerName: '',
    meetingUrl: ''
  });

  // Review form state
  const [reviewData, setReviewData] = useState<ApplicationReviewFormData>({
    review_type: 'initial',
    decision: undefined,
    credentials_rating: undefined,
    experience_rating: undefined,
    communication_rating: undefined,
    professionalism_rating: undefined,
    overall_rating: undefined,
    strengths: '',
    concerns: '',
    recommendations: '',
    notes: ''
  });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, activeFilters]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const result = await coachApplicationService.getApplicationsForReview({
        status: ['submitted', 'under_review', 'documents_requested', 'interview_scheduled']
      });

      if (result.data) {
        setApplications(result.data.data);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.first_name.toLowerCase().includes(term) ||
        app.last_name.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.ipec_certification_number.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (activeFilters.status?.length) {
      filtered = filtered.filter(app => activeFilters.status!.includes(app.status));
    }

    // Certification level filter
    if (activeFilters.certification_level?.length) {
      filtered = filtered.filter(app => 
        activeFilters.certification_level!.includes(app.certification_level)
      );
    }

    // Experience filter
    if (activeFilters.experience_years_min !== undefined) {
      filtered = filtered.filter(app => app.experience_years >= activeFilters.experience_years_min!);
    }

    if (activeFilters.experience_years_max !== undefined) {
      filtered = filtered.filter(app => app.experience_years <= activeFilters.experience_years_max!);
    }

    setFilteredApplications(filtered);
  };

  const handleReviewApplication = (application: CoachApplicationWithDetails) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
    
    // Reset review form
    setReviewData({
      review_type: 'initial',
      decision: undefined,
      credentials_rating: undefined,
      experience_rating: undefined,
      communication_rating: undefined,
      professionalism_rating: undefined,
      overall_rating: undefined,
      strengths: '',
      concerns: '',
      recommendations: '',
      notes: ''
    });
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !user) return;

    setIsSubmittingReview(true);
    try {
      const interviewDateTime = `${interviewData.date}T${interviewData.time}:00`;
      
      const result = await coachIntegrationService.scheduleCoachInterview(
        selectedApplication.id,
        interviewDateTime,
        interviewData.meetingUrl,
        interviewData.interviewerName,
        user.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule interview');
      }

      // Update local applications
      await loadApplications();

      // Close modals
      setShowInterviewScheduler(false);
      setShowReviewModal(false);
      setSelectedApplication(null);

      // Reset interview form
      setInterviewData({
        date: '',
        time: '',
        interviewerName: '',
        meetingUrl: ''
      });

      alert('Interview scheduled successfully!');

    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      alert(error.message || 'Failed to schedule interview');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication || !user) return;

    setIsSubmittingReview(true);
    try {
      let result: any;

      // Use integration service for approve/reject decisions
      if (reviewData.decision === 'approve') {
        result = await coachIntegrationService.approveAndActivateCoach({
          applicationId: selectedApplication.id,
          adminId: user.id,
          adminNotes: reviewData.notes || undefined,
          coachProfile: {
            bio: selectedApplication.bio || undefined,
            specializations: selectedApplication.specializations || undefined,
            hourlyRate: selectedApplication.hourly_rate || undefined
          }
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to approve application');
        }

        // Trigger callback with approved application
        if (onApplicationApproved) {
          const updatedApp = await coachApplicationService.getApplication(selectedApplication.id);
          if (updatedApp.data) {
            onApplicationApproved(updatedApp.data);
          }
        }

      } else if (reviewData.decision === 'reject') {
        const rejectionReason = reviewData.concerns || 'Application does not meet current requirements.';
        
        result = await coachIntegrationService.rejectCoachApplication(
          selectedApplication.id,
          user.id,
          rejectionReason,
          reviewData.notes || undefined
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to reject application');
        }

        // Trigger callback with rejected application
        if (onApplicationRejected) {
          const updatedApp = await coachApplicationService.getApplication(selectedApplication.id);
          if (updatedApp.data) {
            onApplicationRejected(updatedApp.data);
          }
        }

      } else if (reviewData.decision === 'request_documents' || reviewData.decision === 'request_info') {
        const requestedDocuments = [
          'Updated iPEC Certification',
          'Professional References',
          'Insurance Documentation'
        ];
        
        result = await coachIntegrationService.requestAdditionalDocuments(
          selectedApplication.id,
          requestedDocuments,
          user.id,
          reviewData.notes || undefined
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to request documents');
        }

      } else if (reviewData.decision === 'schedule_interview') {
        // Show interview scheduler modal instead of processing immediately
        setShowInterviewScheduler(true);
        setIsSubmittingReview(false);
        return; // Exit early to show interview scheduler

      } else {
        // Fallback to standard review submission for other decisions
        result = await coachApplicationService.submitReview(
          selectedApplication.id,
          reviewData
        );

        if (result.error) {
          throw new Error(result.error.message);
        }
      }

      // Update local applications
      await loadApplications();

      // Close modal
      setShowReviewModal(false);
      setSelectedApplication(null);

      // Show success message
      const message = reviewData.decision === 'approve' 
        ? 'Coach application approved successfully!' 
        : reviewData.decision === 'reject' 
        ? 'Application has been rejected.' 
        : reviewData.decision === 'request_documents' || reviewData.decision === 'request_info'
        ? 'Additional documents have been requested.'
        : 'Review submitted successfully.';
      
      alert(message);

    } catch (error: any) {
      console.error('Failed to submit review:', error);
      alert(error.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'documents_requested':
        return 'bg-orange-100 text-orange-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyBadge = (application: CoachApplicationWithDetails) => {
    const now = new Date();
    const submittedAt = new Date(application.submitted_at || application.created_at);
    const daysSinceSubmission = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceSubmission > 5) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (daysSinceSubmission > 3) {
      return <Badge variant="warning" className="text-xs">Due Soon</Badge>;
    }
    return null;
  };

  const calculateOverallRating = () => {
    const ratings = [
      reviewData.credentials_rating,
      reviewData.experience_rating,
      reviewData.communication_rating,
      reviewData.professionalism_rating
    ].filter(r => r !== undefined);

    if (ratings.length === 0) return undefined;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  };

  useEffect(() => {
    const overallRating = calculateOverallRating();
    if (overallRating !== undefined) {
      setReviewData(prev => ({ ...prev, overall_rating: Number(overallRating.toFixed(2)) }));
    }
  }, [reviewData.credentials_rating, reviewData.experience_rating, reviewData.communication_rating, reviewData.professionalism_rating]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Coach Application Reviews
          </h1>
          <p className="text-gray-600">
            Review and approve coach applications for iPEC Coach Connect
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {filteredApplications.length} Applications
          </Badge>
          
          <Button
            variant="outline"
            onClick={loadApplications}
            icon={<Download className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <Card.Body className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or certification number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['submitted', 'under_review', 'documents_requested', 'interview_scheduled'].map(status => (
                <Button
                  key={status}
                  variant={activeFilters.status?.includes(status as any) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const currentStatuses = activeFilters.status || [];
                    const newStatuses = currentStatuses.includes(status as any)
                      ? currentStatuses.filter(s => s !== status)
                      : [...currentStatuses, status as any];
                    
                    setActiveFilters(prev => ({ ...prev, status: newStatuses }));
                  }}
                >
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Applications List */}
      <div className="grid gap-6">
        {filteredApplications.length === 0 ? (
          <Card>
            <Card.Body className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No applications found
              </h3>
              <p className="text-gray-500">
                {searchTerm || Object.keys(activeFilters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'No pending coach applications to review'
                }
              </p>
            </Card.Body>
          </Card>
        ) : (
          filteredApplications.map(application => (
            <ApplicationCard
              key={application.id}
              application={application}
              onReview={handleReviewApplication}
              urgencyBadge={getUrgencyBadge(application)}
              statusColor={getStatusColor(application.status)}
            />
          ))
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedApplication && (
          <Modal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            title={`Review Application: ${selectedApplication.first_name} ${selectedApplication.last_name}`}
            size="xl"
          >
            <div className="space-y-6">
              {/* Application Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Certification:</span> {selectedApplication.certification_level}
                  </div>
                  <div>
                    <span className="font-medium">Experience:</span> {selectedApplication.experience_years} years
                  </div>
                  <div>
                    <span className="font-medium">Specializations:</span> {selectedApplication.specializations.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Progress:</span> {selectedApplication.progress}%
                  </div>
                </div>
              </div>

              {/* Review Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Type
                </label>
                <select
                  value={reviewData.review_type}
                  onChange={(e) => setReviewData(prev => ({ 
                    ...prev, 
                    review_type: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="initial">Initial Review</option>
                  <option value="documents">Document Verification</option>
                  <option value="references">Reference Check</option>
                  <option value="interview">Interview Review</option>
                  <option value="final">Final Approval</option>
                </select>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'credentials_rating', label: 'Credentials' },
                  { key: 'experience_rating', label: 'Experience' },
                  { key: 'communication_rating', label: 'Communication' },
                  { key: 'professionalism_rating', label: 'Professionalism' }
                ].map(rating => (
                  <div key={rating.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {rating.label} Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(value => (
                        <button
                          key={value}
                          onClick={() => setReviewData(prev => ({ 
                            ...prev, 
                            [rating.key]: value 
                          }))}
                          className={`w-8 h-8 rounded ${
                            (reviewData as any)[rating.key] >= value
                              ? 'bg-yellow-400 text-yellow-900'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          <Star className="h-4 w-4 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Rating (calculated) */}
              {reviewData.overall_rating !== undefined && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">Overall Rating:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-900">
                        {reviewData.overall_rating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(reviewData.overall_rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Comments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strengths
                  </label>
                  <textarea
                    value={reviewData.strengths || ''}
                    onChange={(e) => setReviewData(prev => ({ 
                      ...prev, 
                      strengths: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={3}
                    placeholder="What are the applicant's key strengths?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concerns
                  </label>
                  <textarea
                    value={reviewData.concerns || ''}
                    onChange={(e) => setReviewData(prev => ({ 
                      ...prev, 
                      concerns: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={3}
                    placeholder="Any concerns or areas for improvement?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={reviewData.notes || ''}
                  onChange={(e) => setReviewData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  placeholder="Additional review notes..."
                />
              </div>

              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'approve', label: 'Approve', color: 'bg-green-500 hover:bg-green-600' },
                    { value: 'reject', label: 'Reject', color: 'bg-red-500 hover:bg-red-600' },
                    { value: 'request_info', label: 'Request Info', color: 'bg-orange-500 hover:bg-orange-600' },
                    { value: 'schedule_interview', label: 'Schedule Interview', color: 'bg-blue-500 hover:bg-blue-600' }
                  ].map(decision => (
                    <button
                      key={decision.value}
                      onClick={() => setReviewData(prev => ({ 
                        ...prev, 
                        decision: decision.value as any 
                      }))}
                      className={`px-4 py-2 rounded text-white font-medium ${decision.color} ${
                        reviewData.decision === decision.value 
                          ? 'ring-2 ring-offset-2 ring-gray-500' 
                          : ''
                      }`}
                    >
                      {decision.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSubmitReview}
                  isLoading={isSubmittingReview}
                  disabled={!reviewData.decision}
                  icon={<CheckSquare className="h-4 w-4" />}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Interview Scheduler Modal */}
        {showInterviewScheduler && selectedApplication && (
          <Modal
            isOpen={showInterviewScheduler}
            onClose={() => setShowInterviewScheduler(false)}
            title="Schedule Interview"
          >
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Scheduling interview for {selectedApplication.first_name} {selectedApplication.last_name}
                </h4>
                <p className="text-sm text-blue-700">
                  {selectedApplication.email}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date
                  </label>
                  <Input
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Time
                  </label>
                  <Input
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer Name
                </label>
                <Input
                  value={interviewData.interviewerName}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, interviewerName: e.target.value }))}
                  placeholder="Enter interviewer's name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting URL
                </label>
                <Input
                  value={interviewData.meetingUrl}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This link will be sent to the applicant
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowInterviewScheduler(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleScheduleInterview}
                  isLoading={isSubmittingReview}
                  disabled={!interviewData.date || !interviewData.time || !interviewData.interviewerName || !interviewData.meetingUrl}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: CoachApplicationWithDetails;
  onReview: (application: CoachApplicationWithDetails) => void;
  urgencyBadge: React.ReactNode;
  statusColor: string;
}

function ApplicationCard({ application, onReview, urgencyBadge, statusColor }: ApplicationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover>
        <Card.Body className="p-6">
          <div className="flex items-start justify-between">
            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {application.first_name[0]}{application.last_name[0]}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {application.first_name} {application.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {application.email}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={statusColor}>
                    {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {urgencyBadge}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Certification:</span>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-brand-500" />
                    {application.certification_level}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Experience:</span>
                  <div>{application.experience_years} years</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <div>{formatDate(application.submitted_at || application.created_at)}</div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Progress:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${application.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{application.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {application.documents?.length || 0} documents
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {application.references?.length || 0} references
                </div>
                {application.reviews?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {application.average_rating?.toFixed(1) || 'N/A'} rating
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                icon={<Eye className="h-4 w-4" />}
              >
                {showDetails ? 'Hide' : 'View'} Details
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => onReview(application)}
                icon={<CheckCircle className="h-4 w-4" />}
              >
                Review
              </Button>
            </div>
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bio */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {application.bio}
                    </p>
                  </div>

                  {/* Specializations */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {application.specializations.map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Documents Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                    <div className="space-y-1">
                      {application.documents?.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <span>{doc.document_type}</span>
                          <Badge 
                            variant={doc.verification_status === 'verified' ? 'success' : 'outline'}
                            className="text-xs"
                          >
                            {doc.verification_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* References Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">References</h4>
                    <div className="space-y-1">
                      {application.references?.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between text-sm">
                          <span>{ref.name}</span>
                          <Badge 
                            variant={ref.contact_status === 'responded' ? 'success' : 'outline'}
                            className="text-xs"
                          >
                            {ref.contact_status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previous Reviews */}
                {application.reviews && application.reviews.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Previous Reviews</h4>
                    <div className="space-y-3">
                      {application.reviews.map(review => (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm">
                              <span className="font-medium">{review.reviewer.full_name}</span>
                              <span className="text-gray-500 ml-2">
                                {review.review_type} review
                              </span>
                            </div>
                            {review.overall_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{review.overall_rating}</span>
                              </div>
                            )}
                          </div>
                          {review.notes && (
                            <p className="text-sm text-gray-600">{review.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card.Body>
      </Card>
    </motion.div>
  );
}