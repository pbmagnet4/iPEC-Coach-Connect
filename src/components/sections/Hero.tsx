import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Compass } from 'lucide-react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { getLocationSuggestions, LocationSuggestion } from '../../lib/location';

const specialties = [
  'Career Transition',
  'Leadership Development',
  'Personal Growth',
  'Work-Life Balance',
  'Executive Coaching',
  'Life Purpose',
];

export function Hero() {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicks outside the suggestions dropdown
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (location.length > 2) {
        const results = await getLocationSuggestions(location);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [location]);

  const handleLocationSearch = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Here you would typically make an API call to reverse geocode the coordinates
          setLocation('Current Location');
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.description);
    setShowSuggestions(false);
  };

  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80"
          alt="Coaching background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 to-brand-800/95" />
      </div>

      <Container className="relative">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Find Your Perfect iPEC Coach
          </h1>
          <p className="text-xl text-brand-50 mb-12 leading-relaxed">
            Connect with certified iPEC coaches who can help you unlock your full potential through Core Energy™ Coaching.
          </p>

          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Location Input */}
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Enter your location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {location && (
                  <button
                    onClick={() => {
                      setLocation('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                {/* Location Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  >
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{suggestion.mainText}</div>
                          <div className="text-sm text-gray-500">{suggestion.secondaryText}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specialty Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <Button 
                variant="gradient" 
                size="lg"
                className="whitespace-nowrap shadow-lg"
              >
                Find Coaches
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLocationSearch}
              className="bg-white/10 text-white hover:bg-white/20"
              icon={<Compass className="h-4 w-4" />}
              isLoading={isLoadingLocation}
            >
              Coaches near me
            </Button>
            {specialties.map((s) => (
              <Button
                key={s}
                variant="ghost"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20"
                onClick={() => setSpecialty(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}