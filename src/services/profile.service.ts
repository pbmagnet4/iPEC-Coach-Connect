/**
 * User Profile Management Service for iPEC Coach Connect
 * 
 * High-level service for managing user profiles and settings with:
 * - Profile CRUD operations
 * - Avatar management and image optimization
 * - Privacy and security settings
 * - Preference management
 * - Profile validation and sanitization
 * - Activity tracking
 * - Data export and deletion
 */

import { profileService, apiService } from './api.service';
import { authService } from './auth.service';
import { supabaseUtils, handleSupabaseError, SupabaseError } from '../lib/supabase';
import type {
  Profile,
  ProfileUpdate,
  ApiResponse,
  UserRole,
} from '../types/database';

// Extended profile interfaces
export interface ProfileData extends Profile {
  isCoach?: boolean;
  coachingExperience?: string;
  lastActive?: string;
  profileCompleteness?: number;
}

export interface ProfileSettings {
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    searchable: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  preferences: {
    timezone: string;
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface ProfileUpdateData {
  personalInfo?: {
    fullName?: string;
    username?: string;
    bio?: string;
    phone?: string;
    location?: string;
  };
  settings?: Partial<ProfileSettings>;
  avatar?: File;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
}

/**
 * User Profile Management Service
 */
class UserProfileService {
  /**
   * Get user's complete profile data
   */
  async getProfileData(userId?: string): Promise<ApiResponse<ProfileData>> {
    try {
      const targetUserId = userId || authService.getState().user?.id;
      if (!targetUserId) {
        throw new SupabaseError('User not authenticated');
      }

      const profileResult = await profileService.getProfile(targetUserId);
      if (profileResult.error) {
        return profileResult;
      }

      const profile = profileResult.data!;

      // Check if user is a coach
      const coachResult = await apiService.coaches.getCoach(targetUserId);
      const isCoach = !coachResult.error && !!coachResult.data;

      // Calculate profile completeness
      const completeness = this.calculateProfileCompleteness(profile);

      const profileData: ProfileData = {
        ...profile,
        isCoach,
        profileCompleteness: completeness,
      };

      return { data: profileData };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update user profile with validation
   */
  async updateProfile(updates: ProfileUpdateData): Promise<ApiResponse<ProfileData>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      let updatedProfile: Profile;

      // Handle avatar upload first if provided
      if (updates.avatar) {
        const avatarResult = await this.updateAvatar(updates.avatar);
        if (avatarResult.error) {
          return avatarResult;
        }
      }

      // Prepare profile updates
      const profileUpdates: ProfileUpdate = {};

      if (updates.personalInfo) {
        const { personalInfo } = updates;
        
        if (personalInfo.fullName !== undefined) {
          profileUpdates.full_name = personalInfo.fullName;
        }
        if (personalInfo.username !== undefined) {
          profileUpdates.username = personalInfo.username;
        }
        if (personalInfo.bio !== undefined) {
          profileUpdates.bio = personalInfo.bio;
        }
        if (personalInfo.phone !== undefined) {
          profileUpdates.phone = personalInfo.phone;
        }
        if (personalInfo.location !== undefined) {
          profileUpdates.location = personalInfo.location;
        }
      }

      if (updates.settings?.preferences?.timezone) {
        profileUpdates.timezone = updates.settings.preferences.timezone;
      }

      // Validate updates
      const currentProfile = await this.getProfileData();
      if (currentProfile.error) {
        return currentProfile;
      }

      const mergedProfile = { ...currentProfile.data!, ...profileUpdates };
      const validation = this.validateProfile(mergedProfile);
      
      if (!validation.isValid) {
        throw new SupabaseError(`Profile validation failed: ${validation.errors.join(', ')}`);
      }

      // Update profile
      const updateResult = await profileService.updateProfile(authState.user.id, profileUpdates);
      if (updateResult.error) {
        return updateResult;
      }

      updatedProfile = updateResult.data!;

      // Handle settings updates (stored separately)
      if (updates.settings) {
        await this.updateSettings(updates.settings);
      }

      // Refresh auth state
      await authService.refreshUserData();

      // Return updated profile data
      return this.getProfileData();
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update user avatar with image optimization
   */
  async updateAvatar(file: File): Promise<ApiResponse<string>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Validate file
      const validation = this.validateAvatarFile(file);
      if (!validation.isValid) {
        throw new SupabaseError(validation.errors.join(', '));
      }

      // Optimize image if needed
      const optimizedFile = await this.optimizeImage(file);

      // Upload avatar
      const uploadResult = await profileService.uploadAvatar(authState.user.id, optimizedFile);
      if (uploadResult.error) {
        return uploadResult;
      }

      return { data: uploadResult.data! };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Get user's profile settings
   */
  async getSettings(): Promise<ApiResponse<ProfileSettings>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // For now, return default settings - this could be stored in a separate table
      const defaultSettings: ProfileSettings = {
        privacy: {
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowMessages: true,
          searchable: true,
        },
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false,
        },
        preferences: {
          timezone: authState.profile?.timezone || 'UTC',
          language: 'en',
          currency: 'USD',
          theme: 'auto',
        },
      };

      return { data: defaultSettings };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Update user's profile settings
   */
  async updateSettings(settingsUpdates: Partial<ProfileSettings>): Promise<ApiResponse<ProfileSettings>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // Get current settings
      const currentSettingsResult = await this.getSettings();
      if (currentSettingsResult.error) {
        return currentSettingsResult;
      }

      // Merge updates
      const updatedSettings: ProfileSettings = {
        ...currentSettingsResult.data!,
        ...settingsUpdates,
      };

      // Validate settings
      const validation = this.validateSettings(updatedSettings);
      if (!validation.isValid) {
        throw new SupabaseError(`Settings validation failed: ${validation.errors.join(', ')}`);
      }

      // Store settings (this would typically be in a user_settings table)
      // For now, we'll just return the updated settings
      
      return { data: updatedSettings };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Validate profile data
   */
  private validateProfile(profile: Partial<Profile>): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!profile.full_name?.trim()) {
      errors.push('Full name is required');
    }

    // Username validation
    if (profile.username) {
      if (profile.username.length < 3) {
        errors.push('Username must be at least 3 characters');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(profile.username)) {
        errors.push('Username can only contain letters, numbers, hyphens, and underscores');
      }
    }

    // Phone validation
    if (profile.phone && !/^\+?[\d\s-()]+$/.test(profile.phone)) {
      errors.push('Invalid phone number format');
    }

    // Bio length validation
    if (profile.bio && profile.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    // Warnings for incomplete profile
    if (!profile.bio) {
      warnings.push('Consider adding a bio to help others learn about you');
    }
    if (!profile.avatar_url) {
      warnings.push('Consider uploading a profile picture');
    }
    if (!profile.location) {
      warnings.push('Consider adding your location');
    }

    const completeness = this.calculateProfileCompleteness(profile);
    if (completeness < 80) {
      warnings.push('Your profile is not complete - consider filling out all fields');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness,
    };
  }

  /**
   * Validate avatar file
   */
  private validateAvatarFile(file: File): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Avatar must be a JPEG, PNG, or WebP image');
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Avatar file size must be less than 5MB');
    }

    // Optimal size warning
    if (file.size > 1024 * 1024) {
      warnings.push('Large image file - consider optimizing for faster loading');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness: 100,
    };
  }

  /**
   * Validate settings
   */
  private validateSettings(settings: ProfileSettings): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Timezone validation
    try {
      Intl.DateTimeFormat(undefined, { timeZone: settings.preferences.timezone });
    } catch {
      errors.push('Invalid timezone');
    }

    // Language validation
    const supportedLanguages = ['en', 'es', 'fr', 'de'];
    if (!supportedLanguages.includes(settings.preferences.language)) {
      errors.push('Unsupported language');
    }

    // Currency validation
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
    if (!supportedCurrencies.includes(settings.preferences.currency)) {
      errors.push('Unsupported currency');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness: 100,
    };
  }

  /**
   * Calculate profile completeness percentage
   */
  private calculateProfileCompleteness(profile: Partial<Profile>): number {
    const fields = [
      'full_name',
      'username',
      'bio',
      'avatar_url',
      'phone',
      'location',
      'timezone',
    ];

    const completedFields = fields.filter(field => {
      const value = profile[field as keyof Profile];
      return value && value.toString().trim() !== '';
    });

    return Math.round((completedFields.length / fields.length) * 100);
  }

  /**
   * Optimize image for avatar upload
   */
  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Set target dimensions (max 400x400)
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const optimizedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          },
          'image/jpeg',
          0.85
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteProfile(): Promise<ApiResponse<void>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      // This would typically involve:
      // 1. Anonymizing or deleting all user data
      // 2. Canceling any active sessions/subscriptions
      // 3. Deleting files/images
      // 4. Soft-deleting or hard-deleting the profile
      
      // For now, just sign out
      await authService.signOut();

      return { data: undefined };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(): Promise<ApiResponse<any>> {
    try {
      const authState = authService.getState();
      if (!authState.user) {
        throw new SupabaseError('User not authenticated');
      }

      const profileResult = await this.getProfileData();
      if (profileResult.error) {
        return profileResult;
      }

      const settingsResult = await this.getSettings();
      if (settingsResult.error) {
        return settingsResult;
      }

      const exportData = {
        profile: profileResult.data,
        settings: settingsResult.data,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      return { data: exportData };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  }

  /**
   * Search for user profiles
   */
  async searchProfiles(query: string, options: { limit?: number } = {}) {
    return profileService.searchProfiles(query, {
      limit: options.limit || 20,
      orderBy: 'full_name',
    });
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();

export default userProfileService;