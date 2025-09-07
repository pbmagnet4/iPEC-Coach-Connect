/**
 * Multi-Step Coach Application Wizard Component
 * 
 * A comprehensive application form that guides users through the complete
 * coach onboarding process with validation, document upload, and progress tracking.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Send,
  Upload,
  User,
  Users,
  X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useUserContext } from '../../hooks/useUserContext';
import { coachApplicationService } from '../../services/coach-application.service';
import type {
  ApplicationReferenceFormData,
  CoachApplicationFormData,
  CoachApplicationWithDetails,
  DocumentUploadData,
  Tables
} from '../../types/database';

// Step configuration
const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic personal and contact information',
    icon: User,
    fields: ['first_name', 'last_name', 'email', 'phone']
  },
  {
    id: 'professional',
    title: 'Professional Background',
    description: 'Certification, experience, and expertise',
    icon: Award,
    fields: ['ipec_certification_number', 'certification_level', 'certification_date', 'experience_years', 'hourly_rate', 'specializations', 'languages']
  },
  {
    id: 'profile',
    title: 'Profile & Bio',
    description: 'Professional bio and online presence',
    icon: FileText,
    fields: ['bio', 'website', 'linkedin_url', 'cover_letter', 'motivation']
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required certifications and documents',
    icon: Upload,
    fields: ['documents']
  },
  {
    id: 'references',
    title: 'References',
    description: 'Professional references and recommendations',
    icon: Users,
    fields: ['references']
  }
];

// Specialization options
const SPECIALIZATIONS = [
  'Life Coaching',
  'Executive Coaching',
  'Career Coaching',
  'Wellness Coaching',
  'Relationship Coaching',
  'Leadership Development',
  'Stress Management',
  'Goal Setting',
  'Work-Life Balance',
  'Personal Development',
  'Team Coaching',
  'Transition Coaching'
];

// Language options
const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Chinese (Mandarin)',
  'Japanese',
  'Korean',
  'Arabic',
  'Russian'
];

interface CoachApplicationWizardProps {
  existingApplication?: CoachApplicationWithDetails | null;
  onApplicationSubmitted?: (application: Tables<'coach_applications'>) => void;
  onApplicationSaved?: (application: Tables<'coach_applications'>) => void;
}

export function CoachApplicationWizard({
  existingApplication,
  onApplicationSubmitted,
  onApplicationSaved
}: CoachApplicationWizardProps) {
  const { user, profile } = useUserContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data state
  const [formData, setFormData] = useState<CoachApplicationFormData>({
    first_name: existingApplication?.first_name || profile?.full_name?.split(' ')[0] || '',
    last_name: existingApplication?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '',
    email: existingApplication?.email || user?.email || '',
    phone: existingApplication?.phone || profile?.phone || '',
    ipec_certification_number: existingApplication?.ipec_certification_number || '',
    certification_level: existingApplication?.certification_level || 'Associate',
    certification_date: existingApplication?.certification_date || '',
    experience_years: existingApplication?.experience_years || 0,
    hourly_rate: existingApplication?.hourly_rate || undefined,
    bio: existingApplication?.bio || profile?.bio || '',
    specializations: existingApplication?.specializations || [],
    languages: existingApplication?.languages || [],
    website: existingApplication?.website || '',
    linkedin_url: existingApplication?.linkedin_url || '',
    cover_letter: existingApplication?.cover_letter || '',
    motivation: existingApplication?.motivation || '',
    additional_notes: existingApplication?.additional_notes || '',
    referral_source: existingApplication?.referral_source || '',
    references: existingApplication?.references?.map(ref => ({
      name: ref.name,
      email: ref.email,
      phone: ref.phone || '',
      relationship: ref.relationship,
      organization: ref.organization || ''
    })) || []
  });

  // Document upload state
  const [documentFiles, setDocumentFiles] = useState<Record<string, File[]>>({
    resume: [],
    certifications: [],
    identity: [],
    insurance: [],
    portfolio: [],
    additional: []
  });

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (existingApplication && formData.first_name) {
        handleAutoSave();
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearTimeout(autoSave);
  }, [formData]);

  const handleAutoSave = async () => {
    if (!existingApplication || isSaving) return;

    setIsSaving(true);
    try {
      const result = await coachApplicationService.updateApplication(
        existingApplication.id,
        formData
      );
      
      if (result.data && onApplicationSaved) {
        onApplicationSaved(result.data);
      }
    } catch (error) {
  void console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateStep = (stepIndex: number): { isValid: boolean; errors: Record<string, string> } => {
    const step = STEPS[stepIndex];
    const stepErrors: Record<string, string> = {};

    step.fields.forEach(field => {
      switch (field) {
        case 'first_name':
          if (!formData.first_name?.trim()) {
            stepErrors.first_name = 'First name is required';
          }
          break;
        case 'last_name':
          if (!formData.last_name?.trim()) {
            stepErrors.last_name = 'Last name is required';
          }
          break;
        case 'email':
          if (!formData.email?.trim()) {
            stepErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            stepErrors.email = 'Please enter a valid email address';
          }
          break;
        case 'phone':
          if (!formData.phone?.trim()) {
            stepErrors.phone = 'Phone number is required';
          }
          break;
        case 'ipec_certification_number':
          if (!formData.ipec_certification_number?.trim()) {
            stepErrors.ipec_certification_number = 'iPEC certification number is required';
          }
          break;
        case 'certification_date':
          if (!formData.certification_date) {
            stepErrors.certification_date = 'Certification date is required';
          }
          break;
        case 'experience_years':
          if (formData.experience_years < 0) {
            stepErrors.experience_years = 'Experience years must be a positive number';
          }
          break;
        case 'bio':
          if (!formData.bio?.trim()) {
            stepErrors.bio = 'Professional bio is required';
          } else if (formData.bio.length < 100) {
            stepErrors.bio = 'Bio must be at least 100 characters';
          }
          break;
        case 'specializations':
          if (!formData.specializations?.length) {
            stepErrors.specializations = 'At least one specialization is required';
          }
          break;
        case 'languages':
          if (!formData.languages?.length) {
            stepErrors.languages = 'At least one language is required';
          }
          break;
        case 'cover_letter':
          if (!formData.cover_letter?.trim()) {
            stepErrors.cover_letter = 'Cover letter is required';
          } else if (formData.cover_letter.length < 200) {
            stepErrors.cover_letter = 'Cover letter must be at least 200 characters';
          }
          break;
        case 'documents':
          if (!documentFiles.resume?.length) {
            stepErrors.documents = 'Resume is required';
          }
          if (!documentFiles.certifications?.length) {
            stepErrors.documents = 'At least one certification document is required';
          }
          break;
        case 'references':
          if (!formData.references?.length || formData.references.length < 2) {
            stepErrors.references = 'At least 2 professional references are required';
          } else {
            formData.references.forEach((ref, index) => {
              if (!ref.name?.trim()) {
                stepErrors[`reference_${index}_name`] = 'Reference name is required';
              }
              if (!ref.email?.trim()) {
                stepErrors[`reference_${index}_email`] = 'Reference email is required';
              }
              if (!ref.relationship?.trim()) {
                stepErrors[`reference_${index}_relationship`] = 'Relationship is required';
              }
            });
          }
          break;
      }
    });

    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors
    };
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    setErrors(validation.errors);

    if (validation.isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all steps
    let allValid = true;
    let allErrors: Record<string, string> = {};

    for (let i = 0; i < STEPS.length; i++) {
      const validation = validateStep(i);
      if (!validation.isValid) {
        allValid = false;
        allErrors = { ...allErrors, ...validation.errors };
      }
    }

    setErrors(allErrors);

    if (!allValid) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      let applicationId = existingApplication?.id;

      // Create or update application
      if (!existingApplication) {
        const createResult = await coachApplicationService.createApplication(formData);
        if (createResult.error) {
          throw new Error(createResult.error.message);
        }
        applicationId = createResult.data?.id;
      } else {
        const updateResult = await coachApplicationService.updateApplication(
          existingApplication.id,
          formData
        );
        if (updateResult.error) {
          throw new Error(updateResult.error.message);
        }
      }

      if (!applicationId) {
        throw new Error('Failed to get application ID');
      }

      // Upload documents
      if (Object.values(documentFiles).some(files => files.length > 0)) {
        const documentsToUpload: DocumentUploadData[] = [];
        
        Object.entries(documentFiles).forEach(([docType, files]) => {
          if (files.length > 0) {
            documentsToUpload.push({
              document_type: docType as any,
              files,
              is_required: ['resume', 'certifications', 'identity'].includes(docType)
            });
          }
        });

        const uploadResult = await coachApplicationService.uploadDocuments(
          applicationId,
          documentsToUpload
        );

        if (uploadResult.error) {
          throw new Error(`Document upload failed: ${uploadResult.error.message}`);
        }
      }

      // Submit application
      const submitResult = await coachApplicationService.submitApplication(applicationId);
      if (submitResult.error) {
        throw new Error(submitResult.error.message);
      }

      setSubmitStatus('success');
      
      if (onApplicationSubmitted && submitResult.data) {
        onApplicationSubmitted(submitResult.data);
      }

    } catch (error: any) {
  void console.error('Application submission failed:', error);
      setSubmitStatus('error');
      setErrors({ submit: error.message || 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof CoachApplicationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (docType: string, files: FileList) => {
    setDocumentFiles(prev => ({
      ...prev,
      [docType]: [...prev[docType] || [], ...Array.from(files)]
    }));
  };

  const removeFile = (docType: string, fileIndex: number) => {
    setDocumentFiles(prev => ({
      ...prev,
      [docType]: prev[docType].filter((_, index) => index !== fileIndex)
    }));
  };

  const addReference = () => {
    const newReference: ApplicationReferenceFormData = {
      name: '',
      email: '',
      phone: '',
      relationship: '',
      organization: ''
    };
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, newReference]
    }));
  };

  const updateReference = (index: number, field: keyof ApplicationReferenceFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const toggleSpecialization = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const currentStepData = STEPS[currentStep];
  const StepIcon = currentStepData.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Show success state
  if (submitStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Body className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-8 w-8 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Thank you for submitting your coach application. We'll review your application 
              and get back to you within 5-7 business days.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                <Clock className="h-4 w-4" />
                What happens next?
              </div>
              <ul className="text-sm text-blue-600 space-y-1 text-left">
                <li>• Initial application review (1-2 business days)</li>
                <li>• Document verification (2-3 business days)</li>
                <li>• Reference checks (3-4 business days)</li>
                <li>• Final decision and onboarding (5-7 business days)</li>
              </ul>
            </div>
            
            <Button
              variant="outline"
              href="/profile"
              className="mr-4"
            >
              Go to Profile
            </Button>
            
            <Button
              variant="gradient"
              href="/dashboard"
            >
              Go to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Coach Application
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving && (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Saving...
              </>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <motion.div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    isCurrent ? 'text-brand-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <Card.Body className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Content */}
              {currentStep === 0 && <PersonalInfoStep />}
              {currentStep === 1 && <ProfessionalStep />}
              {currentStep === 2 && <ProfileStep />}
              {currentStep === 3 && <DocumentsStep />}
              {currentStep === 4 && <ReferencesStep />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>
            
            {currentStep === STEPS.length - 1 ? (
              <Button
                variant="gradient"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                icon={<Send className="h-4 w-4" />}
              >
                Submit Application
              </Button>
            ) : (
              <Button
                variant="gradient"
                onClick={handleNext}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Next Step
              </Button>
            )}
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Please correct the following errors:
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Step Components
  function PersonalInfoStep() {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={(e) => updateFormData('first_name', e.target.value)}
            error={errors.first_name}
            required
          />
          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => updateFormData('last_name', e.target.value)}
            error={errors.last_name}
            required
          />
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            error={errors.email}
            required
          />
          <Input
            type="tel"
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            error={errors.phone}
            required
          />
        </div>
      </div>
    );
  }

  function ProfessionalStep() {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="iPEC Certification Number"
            value={formData.ipec_certification_number}
            onChange={(e) => updateFormData('ipec_certification_number', e.target.value)}
            error={errors.ipec_certification_number}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certification Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.certification_level}
              onChange={(e) => updateFormData('certification_level', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Associate">Associate</option>
              <option value="Professional">Professional</option>
              <option value="Master">Master</option>
            </select>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            type="date"
            label="Certification Date"
            value={formData.certification_date}
            onChange={(e) => updateFormData('certification_date', e.target.value)}
            error={errors.certification_date}
            required
          />
          <Input
            type="number"
            label="Years of Coaching Experience"
            value={formData.experience_years.toString()}
            onChange={(e) => updateFormData('experience_years', parseInt(e.target.value) || 0)}
            error={errors.experience_years}
            min="0"
            required
          />
        </div>
        
        <Input
          type="number"
          label="Hourly Rate (USD)"
          value={formData.hourly_rate?.toString() || ''}
          onChange={(e) => updateFormData('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
          min="25"
          step="5"
          placeholder="Optional - you can set this later"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specializations <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SPECIALIZATIONS.map(specialization => (
              <label key={specialization} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.specializations.includes(specialization)}
                  onChange={() => toggleSpecialization(specialization)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">{specialization}</span>
              </label>
            ))}
          </div>
          {errors.specializations && (
            <p className="mt-1 text-sm text-red-600">{errors.specializations}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map(language => (
              <label key={language} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.languages.includes(language)}
                  onChange={() => toggleLanguage(language)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">{language}</span>
              </label>
            ))}
          </div>
          {errors.languages && (
            <p className="mt-1 text-sm text-red-600">{errors.languages}</p>
          )}
        </div>
      </div>
    );
  }

  function ProfileStep() {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Professional Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => updateFormData('bio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={4}
            placeholder="Tell us about your coaching background, philosophy, and experience..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.bio && (
              <p className="text-sm text-red-600">{errors.bio}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.bio?.length || 0} / 100 min characters
            </p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => updateFormData('website', e.target.value)}
            placeholder="https://yourwebsite.com"
          />
          <Input
            label="LinkedIn Profile"
            value={formData.linkedin_url}
            onChange={(e) => updateFormData('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Letter <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.cover_letter}
            onChange={(e) => updateFormData('cover_letter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={6}
            placeholder="Why do you want to join iPEC Coach Connect? What unique value do you bring?"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.cover_letter && (
              <p className="text-sm text-red-600">{errors.cover_letter}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.cover_letter?.length || 0} / 200 min characters
            </p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What motivates you to coach?
          </label>
          <textarea
            value={formData.motivation || ''}
            onChange={(e) => updateFormData('motivation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            rows={3}
            placeholder="Optional: Share what drives your passion for coaching..."
          />
        </div>
      </div>
    );
  }

  function DocumentsStep() {
    const documentTypes = [
      { key: 'resume', label: 'Resume/CV', required: true, accept: '.pdf,.doc,.docx' },
      { key: 'certifications', label: 'iPEC Certifications', required: true, accept: '.pdf,.jpg,.jpeg,.png' },
      { key: 'identity', label: 'Identity Document', required: true, accept: '.pdf,.jpg,.jpeg,.png' },
      { key: 'insurance', label: 'Professional Liability Insurance', required: false, accept: '.pdf,.jpg,.jpeg,.png' },
      { key: 'portfolio', label: 'Portfolio/Work Samples', required: false, accept: '.pdf,.doc,.docx' },
      { key: 'additional', label: 'Additional Documents', required: false, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
            <HelpCircle className="h-4 w-4" />
            Document Requirements
          </div>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• All documents must be clear and legible</li>
            <li>• File size limit: 10MB per document</li>
            <li>• Accepted formats: PDF, JPG, PNG, DOC, DOCX</li>
            <li>• Identity document must show full name and photo</li>
          </ul>
        </div>

        {documentTypes.map(docType => (
          <div key={docType.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {docType.label} {docType.required && <span className="text-red-500">*</span>}
            </label>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-brand-400 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <span className="text-brand-600 hover:text-brand-500">Upload files</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple={docType.key !== 'identity'}
                      accept={docType.accept}
                      onChange={(e) => e.target.files && handleFileUpload(docType.key, e.target.files)}
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {docType.accept.split(',').join(', ').toUpperCase()} up to 10MB
                </p>
              </div>
            </div>
            
            {/* Uploaded Files */}
            {documentFiles[docType.key]?.length > 0 && (
              <div className="mt-2 space-y-2">
                {documentFiles[docType.key].map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(docType.key, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {errors.documents && (
          <p className="text-sm text-red-600">{errors.documents}</p>
        )}
      </div>
    );
  }

  function ReferencesStep() {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <Users className="h-4 w-4" />
            Professional References
          </div>
          <p className="text-sm text-amber-600">
            Please provide at least 2 professional references who can speak to your coaching abilities and experience.
          </p>
        </div>

        {formData.references.map((reference, index) => (
          <Card key={index}>
            <Card.Body className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Reference {index + 1}</h3>
                {formData.references.length > 1 && (
                  <button
                    onClick={() => removeReference(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={reference.name}
                  onChange={(e) => updateReference(index, 'name', e.target.value)}
                  error={errors[`reference_${index}_name`]}
                  required
                />
                <Input
                  type="email"
                  label="Email Address"
                  value={reference.email}
                  onChange={(e) => updateReference(index, 'email', e.target.value)}
                  error={errors[`reference_${index}_email`]}
                  required
                />
                <Input
                  type="tel"
                  label="Phone Number"
                  value={reference.phone || ''}
                  onChange={(e) => updateReference(index, 'phone', e.target.value)}
                />
                <Input
                  label="Relationship"
                  value={reference.relationship}
                  onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                  error={errors[`reference_${index}_relationship`]}
                  placeholder="e.g., Former client, supervisor, colleague"
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Organization"
                    value={reference.organization || ''}
                    onChange={(e) => updateReference(index, 'organization', e.target.value)}
                    placeholder="Company or organization name"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
        
        {formData.references.length < 5 && (
          <Button
            variant="outline"
            onClick={addReference}
            className="w-full border-dashed"
            icon={<Users className="h-4 w-4" />}
          >
            Add Another Reference
          </Button>
        )}
        
        {errors.references && (
          <p className="text-sm text-red-600">{errors.references}</p>
        )}
      </div>
    );
  }
}