import React, { useEffect, useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FeaturedCoachSkeleton } from '../ui/skeleton';
import { AccessibleLoading, ProgressiveImage } from '../ui/loading';
import { generateBlurDataURL } from '../../hooks/useImageLoading';
import { coachManagementService, type CoachProfile } from '../../services/coach.service';
import { toast } from '../ui/Toast';

interface FeaturedCoach {
  id: string;
  name: string;
  image: string | null;
  specialty: string;
  rating: number;
  price: number;
}

// This will be replaced with real API call - no more static data

// Real API call to fetch featured coaches
const useFeaturedCoaches = () => {
  const [coaches, setCoaches] = useState<FeaturedCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch top-rated coaches from the real API
      const result = await coachManagementService.searchCoaches(
        {}, // No filters - get all coaches
        { 
          limit: 3, 
          orderBy: 'rating', 
          orderDirection: 'desc' 
        }
      );
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Transform API data to component format
      const featuredCoaches: FeaturedCoach[] = result.data!.data.map((coach: CoachProfile) => ({
        id: coach.id,
        name: coach.profile?.full_name || 'Coach',
        image: coach.profile?.avatar_url || null,
        specialty: coach.specializations?.[0] || 'iPEC Coach',
        rating: coach.rating || 5.0,
        price: coach.hourly_rate || 150,
      }));
      
      setCoaches(featuredCoaches);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load featured coaches';
      setError(new Error(errorMessage));
  void oast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  return { coaches, loading, error, refetch: loadCoaches };
};

export function FeaturedCoaches() {
  const { coaches, loading, error, refetch } = useFeaturedCoaches();

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Top-Rated Coaches</h2>
          <Link 
            to="/coaches" 
            className="text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <AccessibleLoading
          loading={loading}
          loadingText="Loading featured coaches"
          completedText="Featured coaches loaded successfully"
          errorText="Failed to load featured coaches"
          error={error}
          announceChanges={true}
          focusOnComplete={true}
          data-testid="featured-coaches-section"
        >
          {/* Loading state with skeleton */}
          <FeaturedCoachSkeleton
            loading={loading}
            count={3}
            variant="grid"
            showRating={true}
            showPrice={true}
            showSpecialty={true}
            data-testid="featured-coaches-skeleton"
          >
            {/* Error state */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Unable to load featured coaches
                </h3>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <Button onClick={refetch} variant="primary">
                  Try Again
                </Button>
              </div>
            )}

            {/* Success state with coaches */}
            {!loading && !error && coaches.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8" data-testid="featured-coaches-grid">
                {coaches.map((coach) => (
                  <Card key={coach.id} hover variant="default">
                    {/* Progressive image with blur-to-sharp transition */}
                    <ProgressiveImage
                      src={coach.image || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80'}
                      alt={`${coach.name} - Professional Coach`}
                      placeholder="blur"
                      blurDataURL={generateBlurDataURL(8, 6, '#f3f4f6')}
                      className="w-full h-48 object-cover"
                      priority={coaches.indexOf(coach) < 2} // Prioritize first 2 images
                      quality={80}
                      showProgress={false}
                      containerClassName="relative overflow-hidden"
                      data-testid={`coach-image-${coach.id}`}
                    />
                    
                    <Card.Body>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{coach.name}</h3>
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                          <span className="text-gray-600 text-sm ml-1" aria-label={`Rating: ${coach.rating} out of 5`}>
                            {coach.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">
                        {coach.specialty}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-brand-600 font-semibold" aria-label={`Price: $${coach.price} per session`}>
                          ${coach.price}/session
                        </span>
                        <Button
                          href={`/coaches/${coach.id}`}
                          variant="primary"
                          size="sm"
                          aria-label={`View ${coach.name}'s profile`}
                        >
                          View Profile
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && coaches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No featured coaches available
                </h3>
                <p className="text-gray-600">
                  Check back later for our top-rated coaches.
                </p>
              </div>
            )}
          </FeaturedCoachSkeleton>
        </AccessibleLoading>
      </Container>
    </section>
  );
}