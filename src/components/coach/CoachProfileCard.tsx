/**
 * Coach Profile Card Component
 * 
 * Displays comprehensive coach information with trust signals,
 * verification badges, and credibility indicators.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Calendar, 
  MessageCircle, 
  Award,
  TrendingUp,
  Shield,
  CheckCircle,
  Phone,
  Video,
  Heart
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { VerificationBadge, CoachVerificationPanel } from '../trust/VerificationBadge';
import { TrustSignal } from '../trust/TrustSignal';
import { CoachSelectionTrust } from '../trust/TrustMicrocopy';
import { cn } from '../../lib/utils';
import type { Coach } from '../../types';

interface CoachProfileCardProps {
  coach: Coach;
  variant?: 'card' | 'detailed' | 'compact';
  showTrustSignals?: boolean;
  showBookingButton?: boolean;
  onBook?: (coachId: string) => void;
  onMessage?: (coachId: string) => void;
  onViewProfile?: (coachId: string) => void;
  className?: string;
}

export function CoachProfileCard({
  coach,
  variant = 'card',
  showTrustSignals = true,
  showBookingButton = true,
  onBook,
  onMessage,
  onViewProfile,
  className
}: CoachProfileCardProps) {
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="text-sm font-medium text-gray-700 ml-1">{rating}</span>
        <span className="text-sm text-gray-500">({coach.reviewCount})</span>
      </div>
    );
  };

  const renderVerificationBadges = () => {
    if (!coach.trustMetrics?.badges) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {coach.trustMetrics.badges.map((badge, index) => (
          <VerificationBadge
            key={index}
            type={badge.type}
            level={badge.level}
            size="sm"
            showText={false}
            animate={false}
          />
        ))}
      </div>
    );
  };

  const renderTrustStats = () => {
    if (!coach.trustMetrics?.stats) return null;

    const stats = coach.trustMetrics.stats;
    
    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-900">{stats.totalSessions}</div>
          <div className="text-gray-600">Sessions</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{stats.successRate}%</div>
          <div className="text-gray-600">Success Rate</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{stats.responseTime}</div>
          <div className="text-gray-600">Response Time</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">{stats.yearsExperience} years</div>
          <div className="text-gray-600">Experience</div>
        </div>
      </div>
    );
  };

  const renderSpecialties = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {coach.specialties.slice(0, 3).map((specialty, index) => (
          <Badge key={index} variant="default" className="text-xs">
            {specialty}
          </Badge>
        ))}
        {coach.specialties.length > 3 && (
          <Badge variant="default" className="text-xs">
            +{coach.specialties.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  const renderLocationInfo = () => {
    const location = coach.location;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="h-4 w-4" />
        <span className="capitalize">{location.type}</span>
        {location.address && (
          <span>• {location.address.city}, {location.address.state}</span>
        )}
        {coach.distance && (
          <span>• {coach.distance.toFixed(1)} mi</span>
        )}
      </div>
    );
  };

  const renderPricing = () => {
    return (
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900">
          ${coach.pricing.hourlyRate}/hour
        </div>
        {coach.pricing.packageRates && coach.pricing.packageRates.length > 0 && (
          <div className="text-sm text-gray-600">
            Package deals available
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    return (
      <div className="flex gap-2">
        {onMessage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMessage(coach.id)}
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Message
          </Button>
        )}
        {onViewProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile(coach.id)}
          >
            View Profile
          </Button>
        )}
        {showBookingButton && onBook && (
          <Button
            variant="gradient"
            size="sm"
            onClick={() => onBook(coach.id)}
            icon={<Calendar className="h-4 w-4" />}
          >
            Book Session
          </Button>
        )}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <Avatar
            src={coach.profileImage}
            alt={`${coach.firstName} ${coach.lastName}`}
            size="md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">
                {coach.firstName} {coach.lastName}
              </h3>
              {showTrustSignals && renderVerificationBadges()}
            </div>
            {renderStarRating(coach.rating)}
            <div className="text-sm text-gray-600 mt-1">
              {coach.specialties.slice(0, 2).join(', ')}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">${coach.pricing.hourlyRate}/hr</div>
            {renderActionButtons()}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'p-8 bg-white rounded-xl border border-gray-200 shadow-sm',
          className
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-6">
            <Avatar
              src={coach.profileImage}
              alt={`${coach.firstName} ${coach.lastName}`}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {coach.firstName} {coach.lastName}
                </h2>
                {showTrustSignals && coach.trustMetrics?.verificationLevel && (
                  <TrustSignal
                    type="verification"
                    variant="badge"
                    title="Verified Coach"
                    size="sm"
                    icon={CheckCircle}
                  />
                )}
              </div>
              {renderStarRating(coach.rating)}
              {renderLocationInfo()}
              <div className="mt-3">
                {renderSpecialties()}
              </div>
            </div>
            {renderPricing()}
          </div>

          {/* Bio */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 leading-relaxed">{coach.bio}</p>
          </div>

          {/* Trust Metrics */}
          {showTrustSignals && coach.trustMetrics && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Coach Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Verification Badges</h4>
                  {renderVerificationBadges()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Performance Stats</h4>
                  {renderTrustStats()}
                </div>
              </div>
            </div>
          )}

          {/* Specialties */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.map((specialty, index) => (
                <Badge key={index} variant="default">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
            <div className="space-y-2">
              {coach.certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{cert.type}</span>
                  <span className="text-xs text-gray-500">
                    • Issued {new Date(cert.issueDate).getFullYear()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Save for later</span>
            </div>
            {renderActionButtons()}
          </div>

          {/* Trust Microcopy */}
          {showTrustSignals && (
            <CoachSelectionTrust />
          )}
        </div>
      </motion.div>
    );
  }

  // Default card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar
            src={coach.profileImage}
            alt={`${coach.firstName} ${coach.lastName}`}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {coach.firstName} {coach.lastName}
              </h3>
              {showTrustSignals && renderVerificationBadges()}
            </div>
            {renderStarRating(coach.rating)}
            {renderLocationInfo()}
            <div className="mt-2">
              {renderSpecialties()}
            </div>
          </div>
          {renderPricing()}
        </div>

        {/* Bio */}
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
          {coach.bio}
        </p>

        {/* Trust Stats */}
        {showTrustSignals && coach.trustMetrics?.stats && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-gray-900">{coach.trustMetrics.stats.totalSessions}</div>
                <div className="text-gray-600">Sessions</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{coach.trustMetrics.stats.successRate}%</div>
                <div className="text-gray-600">Success</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{coach.trustMetrics.stats.responseTime}</div>
                <div className="text-gray-600">Response</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{coach.trustMetrics.stats.yearsExperience}y</div>
                <div className="text-gray-600">Experience</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Available today</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span>Video sessions</span>
            </div>
          </div>
          {renderActionButtons()}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Coach Grid Component - Displays multiple coaches in a grid layout
 */
interface CoachGridProps {
  coaches: Coach[];
  variant?: 'card' | 'compact';
  showTrustSignals?: boolean;
  showBookingButton?: boolean;
  onBook?: (coachId: string) => void;
  onMessage?: (coachId: string) => void;
  onViewProfile?: (coachId: string) => void;
  className?: string;
}

export function CoachGrid({
  coaches,
  variant = 'card',
  showTrustSignals = true,
  showBookingButton = true,
  onBook,
  onMessage,
  onViewProfile,
  className
}: CoachGridProps) {
  const gridClass = variant === 'compact' 
    ? 'grid grid-cols-1 gap-4' 
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className={cn(gridClass, className)}>
      {coaches.map((coach) => (
        <CoachProfileCard
          key={coach.id}
          coach={coach}
          variant={variant}
          showTrustSignals={showTrustSignals}
          showBookingButton={showBookingButton}
          onBook={onBook}
          onMessage={onMessage}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
}