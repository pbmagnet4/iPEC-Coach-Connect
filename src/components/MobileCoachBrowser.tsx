import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Languages, 
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X
} from 'lucide-react';
import { useSwipeGesture, useHapticFeedback, useTap } from '../hooks/useTouchGestures';
import { MobileButton } from './ui/MobileButton';
import { MobileInput } from './ui/MobileInput';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { cn } from '../lib/utils';

interface Coach {
  id: string;
  name: string;
  title: string;
  image: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  languages: string[];
  specializations: string[];
  experience: number;
  responseTime: string;
  availability: 'available' | 'busy' | 'offline';
  bio: string;
  certifications: string[];
  isBookmarked: boolean;
}

interface MobileCoachBrowserProps {
  coaches: Coach[];
  onCoachSelect: (coach: Coach) => void;
  onBookmark: (coachId: string) => void;
  onFilter: (filters: FilterOptions) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

interface FilterOptions {
  search: string;
  specializations: string[];
  languages: string[];
  priceRange: [number, number];
  availability: string[];
  rating: number;
}

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const SWIPE_THRESHOLD = 50;
const SWIPE_POWER = 0.2;

export function MobileCoachBrowser({
  coaches,
  onCoachSelect,
  onBookmark,
  onFilter,
  loading = false,
  hasMore = false,
  onLoadMore,
}: MobileCoachBrowserProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    specializations: [],
    languages: [],
    priceRange: [0, 500],
    availability: [],
    rating: 0,
  });
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { lightFeedback, mediumFeedback, successFeedback } = useHapticFeedback();
  const { screenReader, liveRegions } = useAccessibility();

  const currentCoach = coaches[currentIndex];
  const isLastCoach = currentIndex === coaches.length - 1;
  const isFirstCoach = currentIndex === 0;

  // Swipe gesture handling
  const swipeRef = useSwipeGesture({
    onSwipeLeft: (distance) => {
      if (distance > SWIPE_THRESHOLD) {
        handleNext();
        lightFeedback();
      }
    },
    onSwipeRight: (distance) => {
      if (distance > SWIPE_THRESHOLD) {
        handlePrevious();
        lightFeedback();
      }
    },
    threshold: SWIPE_THRESHOLD,
    enabled: !showFilters,
  });

  // Tap gesture for coach selection
  const tapRef = useTap({
    onTap: () => {
      if (currentCoach) {
        onCoachSelect(currentCoach);
        mediumFeedback();
      }
    },
    onDoubleTap: () => {
      if (currentCoach) {
        handleBookmark(currentCoach.id);
        successFeedback();
      }
    },
    enabled: !showFilters,
  });

  // Merge gesture refs
  const mergedRef = useCallback((element: HTMLDivElement | null) => {
    if (swipeRef.current !== element) swipeRef.current = element;
    if (tapRef.current !== element) tapRef.current = element;
    if (containerRef.current !== element) containerRef.current = element;
  }, [swipeRef, tapRef]);

  const handleNext = useCallback(() => {
    if (isLastCoach) {
      if (hasMore) {
        onLoadMore?.();
      }
      return;
    }

    setDirection('left');
    setCurrentIndex(prev => Math.min(prev + 1, coaches.length - 1));
    
    // Announce to screen reader
    const nextCoach = coaches[currentIndex + 1];
    if (nextCoach) {
      screenReader.announce(`Showing ${nextCoach.name}, ${nextCoach.title}`);
    }
  }, [isLastCoach, hasMore, onLoadMore, coaches, currentIndex, screenReader]);

  const handlePrevious = useCallback(() => {
    if (isFirstCoach) return;

    setDirection('right');
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    
    // Announce to screen reader
    const prevCoach = coaches[currentIndex - 1];
    if (prevCoach) {
      screenReader.announce(`Showing ${prevCoach.name}, ${prevCoach.title}`);
    }
  }, [isFirstCoach, coaches, currentIndex, screenReader]);

  const handleBookmark = useCallback((coachId: string) => {
    onBookmark(coachId);
    const coach = coaches.find(c => c.id === coachId);
    if (coach) {
      const message = coach.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks';
      liveRegions.announcePolite(message);
    }
  }, [onBookmark, coaches, liveRegions]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -SWIPE_THRESHOLD) {
      handleNext();
    } else if (swipe > SWIPE_THRESHOLD) {
      handlePrevious();
    }
  };

  const applyFilters = useCallback(() => {
    onFilter(filters);
    setShowFilters(false);
    liveRegions.announcePolite('Filters applied');
  }, [filters, onFilter, liveRegions]);

  const resetFilters = useCallback(() => {
    const resetFilters: FilterOptions = {
      search: '',
      specializations: [],
      languages: [],
      priceRange: [0, 500],
      availability: [],
      rating: 0,
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
    liveRegions.announcePolite('Filters reset');
  }, [onFilter, liveRegions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <span className="sr-only">Loading coaches...</span>
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
        <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
        <MobileButton onClick={resetFilters} variant="outline">
          Reset Filters
        </MobileButton>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Header with search and filter */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <MobileInput
              placeholder="Search coaches..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              mobileKeyboard="search"
              touchOptimized
            />
          </div>
          <MobileButton
            variant="outline"
            size="touch"
            onClick={() => setShowFilters(true)}
            aria-label="Open filters"
          >
            <Filter className="h-5 w-5" />
          </MobileButton>
        </div>

        {/* Coach counter */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {currentIndex + 1} of {coaches.length} coaches
          </p>
        </div>
      </div>

      {/* Coach cards container */}
      <div 
        ref={mergedRef}
        className="relative h-[500px] overflow-hidden rounded-xl"
        role="region"
        aria-label="Coach browser"
        aria-live="polite"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction === 'left' ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction === 'left' ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            {currentCoach && (
              <CoachCard
                coach={currentCoach}
                onBookmark={() => handleBookmark(currentCoach.id)}
                onSelect={() => onCoachSelect(currentCoach)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <MobileButton
            variant="ghost"
            size="touch"
            onClick={handlePrevious}
            disabled={isFirstCoach}
            className="ml-2 bg-white/80 backdrop-blur-sm"
            aria-label="Previous coach"
          >
            <ChevronLeft className="h-6 w-6" />
          </MobileButton>
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center">
          <MobileButton
            variant="ghost"
            size="touch"
            onClick={handleNext}
            disabled={isLastCoach && !hasMore}
            className="mr-2 bg-white/80 backdrop-blur-sm"
            aria-label="Next coach"
          >
            <ChevronRight className="h-6 w-6" />
          </MobileButton>
        </div>
      </div>

      {/* Gesture hints */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>← Swipe or tap arrows to browse • Double-tap to bookmark →</p>
      </div>

      {/* Load more indicator */}
      {isLastCoach && hasMore && (
        <div className="mt-4 text-center">
          <MobileButton onClick={onLoadMore} variant="outline">
            Load More Coaches
          </MobileButton>
        </div>
      )}

      {/* Filter modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white rounded-t-xl md:rounded-xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filter Coaches</h3>
                <MobileButton
                  variant="ghost"
                  size="touch"
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  <X className="h-6 w-6" />
                </MobileButton>
              </div>

              {/* Filter content would go here */}
              <div className="space-y-4">
                <p className="text-gray-600">Filter options coming soon...</p>
              </div>

              <div className="flex gap-3 mt-6">
                <MobileButton
                  variant="outline"
                  onClick={resetFilters}
                  className="flex-1"
                >
                  Reset
                </MobileButton>
                <MobileButton
                  variant="primary"
                  onClick={applyFilters}
                  className="flex-1"
                >
                  Apply Filters
                </MobileButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual coach card component
function CoachCard({ 
  coach, 
  onBookmark, 
  onSelect 
}: { 
  coach: Coach; 
  onBookmark: () => void; 
  onSelect: () => void; 
}) {
  const { lightFeedback } = useHapticFeedback();

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Coach image */}
      <div className="relative h-48 bg-gradient-to-br from-brand-100 to-blue-100">
        <img
          src={coach.image}
          alt={coach.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Bookmark button */}
        <MobileButton
          variant="ghost"
          size="touch"
          onClick={() => {
            onBookmark();
            lightFeedback();
          }}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm"
          aria-label={coach.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Heart 
            className={cn(
              "h-5 w-5",
              coach.isBookmarked ? "fill-red-500 text-red-500" : "text-gray-600"
            )} 
          />
        </MobileButton>

        {/* Availability indicator */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            coach.availability === 'available' && "bg-green-500 text-white",
            coach.availability === 'busy' && "bg-yellow-500 text-white",
            coach.availability === 'offline' && "bg-gray-500 text-white"
          )}>
            {coach.availability}
          </div>
        </div>
      </div>

      {/* Coach info */}
      <div className="p-4 flex-1">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{coach.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{coach.title}</p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{coach.rating}</span>
            <span className="text-sm text-gray-500">({coach.reviewCount})</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{coach.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Responds in {coach.responseTime}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Languages className="h-4 w-4" />
            <span>{coach.languages.join(', ')}</span>
          </div>
        </div>

        {/* Specializations */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {coach.specializations.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="inline-block px-2 py-1 bg-brand-100 text-brand-800 text-xs rounded-full"
              >
                {spec}
              </span>
            ))}
            {coach.specializations.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{coach.specializations.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Rate */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-brand-600">${coach.hourlyRate}</span>
            <span className="text-sm text-gray-500">/hour</span>
          </div>
          
          <MobileButton
            variant="gradient"
            size="md"
            onClick={() => {
              onSelect();
              lightFeedback();
            }}
          >
            View Profile
          </MobileButton>
        </div>
      </div>
    </div>
  );
}