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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedIndex(-1);
    locationInputRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', { location, specialty });
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
          <form onSubmit={handleSearch} role="search" aria-label="Find coaches">
            <div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Location Input */}
                <div className="flex-1 relative">
                  <label htmlFor="location-input" className="sr-only">
                    Enter your location
                  </label>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                  <input
                    id="location-input"
                    ref={locationInputRef}
                    type="text"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    aria-expanded={showSuggestions}
                    aria-haspopup="listbox"
                    aria-owns={showSuggestions ? "location-suggestions" : undefined}
                    aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
                    className="w-full pl-10 pr-12 py-3 min-h-[48px] rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 touch-manipulation text-base"
                    autoComplete="address-line1"
                    inputMode="text"
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocation('');
                        setSuggestions([]);
                        setSelectedIndex(-1);
                      }}
                      aria-label="Clear location"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md p-1 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                  {/* Location Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      id="location-suggestions"
                      role="listbox"
                      aria-label="Location suggestions"
                      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.placeId}
                          id={`suggestion-${index}`}
                          role="option"
                          type="button"
                          aria-selected={selectedIndex === index}
                          className={`w-full px-4 py-2 text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            selectedIndex === index ? 'bg-brand-50 text-brand-900' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
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
                  <label htmlFor="specialty-input" className="sr-only">
                    Search by specialty
                  </label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                  <input
                    id="specialty-input"
                    type="text"
                    placeholder="Search by specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 touch-manipulation text-base"
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>

                <Button 
                  type="submit"
                  variant="gradient" 
                  size="lg"
                  className="whitespace-nowrap shadow-lg"
                  aria-describedby="search-description"
                >
                  Find Coaches
                </Button>
              </div>
              <div id="search-description" className="sr-only">
                Search for coaches by location and specialty
              </div>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLocationSearch}
              className="bg-white/10 text-white hover:bg-white/20 touch-manipulation min-h-[44px] min-w-[44px] px-4 py-2"
              icon={<Compass className="h-4 w-4" />}
              isLoading={isLoadingLocation}
              aria-label="Find coaches near my current location"
            >
              Coaches near me
            </Button>
            {specialties.map((s) => (
              <Button
                key={s}
                variant="ghost"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20 touch-manipulation min-h-[44px] min-w-[44px] px-3 py-2"
                onClick={() => setSpecialty(s)}
                aria-label={`Search for ${s} coaches`}
              >
                <span className="text-sm">{s}</span>
              </Button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}