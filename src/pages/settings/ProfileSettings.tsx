import React, { useEffect, useState } from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { AlertCircle, CheckCircle, Clock, Eye, Globe, Loader2, Save, Upload } from 'lucide-react';
import { useForm } from '../../hooks/useForm';
import { profileValidationSchemas } from '../../lib/form-validation';
import { AnimatePresence, motion } from 'framer-motion';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  timezone: string;
  language: string;
  visibility: 'public' | 'private' | 'coaches';
  profilePicture?: File;
}

// Mock profile service - replace with actual implementation
const profileService = {
  async updateProfile(data: ProfileFormData) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate success/failure
    if (Math.random() > 0.1) {
      return { success: true, profile: data };
    } else {
      throw new Error('Failed to update profile. Please try again.');
    }
  },

  async uploadProfilePicture(file: File) {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to upload image'));
  void reader.readAsDataURL(file);
    });
  }
};

export function ProfileSettings() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>(
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80'
  );
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const form = useForm<ProfileFormData>({
    schema: profileValidationSchemas.profile,
    initialData: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      bio: 'Passionate about personal development and growth.',
      location: 'New York, NY',
      timezone: 'America/New_York',
      language: 'English',
      visibility: 'public',
    },
    onSubmit: async (data) => {
      setSaveStatus('saving');
      setSaveError('');
      
      try {
        await profileService.updateProfile(data);
        setSaveStatus('success');

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } catch (error) {
        setSaveStatus('error');
        setSaveError(error instanceof Error ? error.message : 'Failed to update profile');
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500,
    autoSave: {
      enabled: true,
      onAutoSave: async (data) => {
        // Auto-save draft changes
  void console.log('Auto-saving profile changes:', data);
      },
      interval: 3000,
    },
  });

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Profile picture must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSaveError('Profile picture must be JPEG, PNG, or WebP');
      return;
    }

    setUploadingPicture(true);
    setSaveError('');

    try {
      const imageUrl = await profileService.uploadProfilePicture(file) as string;
      setProfilePictureUrl(imageUrl);
  void form.setFieldValue('profilePicture', file);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <form onSubmit={form.handleSubmit()} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-gray-600 mt-2">
                Manage your personal information and profile visibility
              </p>
            </div>
            
            {form.formState.isDirty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg"
              >
                <Clock className="h-4 w-4" />
                <span>Unsaved changes</span>
              </motion.div>
            )}
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {saveStatus === 'error' && saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{saveError}</span>
              </motion.div>
            )}

            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Profile updated successfully!</p>
                  <p className="text-sm">Your changes have been saved.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Picture */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Profile Picture</h2>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar
                    src={profilePictureUrl}
                    alt="Profile"
                    size="lg"
                  />
                  {uploadingPicture && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPicture}
                      className="cursor-pointer"
                    >
                      {uploadingPicture ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Picture
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingPicture}
                    />
                  </label>
                  <p className="text-sm text-gray-600">
                    Recommended: Square image, at least 400x400 pixels. Max size: 5MB
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Personal Information */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  {...form.getFieldProps('firstName')}
                  label="First Name *"
                  placeholder="Enter your first name"
                />
                <Input
                  {...form.getFieldProps('lastName')}
                  label="Last Name *"
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  {...form.getFieldProps('email')}
                  type="email"
                  label="Email Address *"
                  placeholder="your.email@example.com"
                />
                <Input
                  {...form.getFieldProps('phone')}
                  type="tel"
                  label="Phone Number"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <TextArea
                {...form.getFieldProps('bio')}
                label="Bio"
                placeholder="Tell us about yourself..."
                rows={4}
                helpText={`${form.getFieldValue('bio')?.length || 0}/1000 characters`}
              />
            </Card.Body>
          </Card>

          {/* Location & Language */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Location & Language</h2>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  {...form.getFieldProps('location')}
                  label="Location"
                  placeholder="City, State/Country"
                  icon={<Globe className="h-5 w-5" />}
                />
                <Select
                  {...form.getFieldProps('timezone')}
                  label="Timezone"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">GMT (London)</option>
                  <option value="Europe/Paris">CET (Paris)</option>
                  <option value="Asia/Tokyo">JST (Tokyo)</option>
                  <option value="Australia/Sydney">AEST (Sydney)</option>
                </Select>
              </div>
              
              <Select
                {...form.getFieldProps('language')}
                label="Preferred Language"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Italian">Italian</option>
                <option value="Chinese">Chinese (Mandarin)</option>
                <option value="Japanese">Japanese</option>
              </Select>
            </Card.Body>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Privacy Settings</h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Select
                      {...form.getFieldProps('visibility')}
                      label="Profile Visibility"
                    >
                      <option value="public">Public - Visible to everyone</option>
                      <option value="private">Private - Only visible to you</option>
                      <option value="coaches">Coaches Only - Visible to coaches and admins</option>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your profile visibility affects how other users can find and contact you. 
                    Public profiles are included in coach searches and directories.
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {form.formState.isDirty ? (
                <span className="text-amber-600">You have unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.resetForm()}
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
              >
                Reset Changes
              </Button>
              
              <Button
                type="submit"
                variant="gradient"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
                className="min-w-[140px]"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}