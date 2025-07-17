import { getDistance } from 'geolib';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinates;
  city?: string;
  state?: string;
  country?: string;
}

export interface LocationSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
  coordinates?: Coordinates;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Here you would typically make an API call to reverse geocode the coordinates
          // For demo purposes, we'll return mock data
          resolve({
            coordinates: { latitude, longitude },
            city: 'New York',
            state: 'NY',
            country: 'United States'
          });
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export function calculateDistance(from: Coordinates, to: Coordinates): number {
  return getDistance(
    { latitude: from.latitude, longitude: from.longitude },
    { latitude: to.latitude, longitude: to.longitude }
  ) / 1609.34; // Convert meters to miles
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return 'Less than a mile away';
  }
  return `${Math.round(distance)} miles away`;
}

// Mock location suggestions for demo purposes
// In production, this would use a real geocoding service like Google Places API
export async function getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  if (!query) return [];

  const mockLocations = [
    {
      description: 'New York, NY, USA',
      placeId: 'ny-1',
      mainText: 'New York',
      secondaryText: 'NY, USA',
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      description: 'Los Angeles, CA, USA',
      placeId: 'la-1',
      mainText: 'Los Angeles',
      secondaryText: 'CA, USA',
      coordinates: { latitude: 34.0522, longitude: -118.2437 }
    },
    {
      description: 'Chicago, IL, USA',
      placeId: 'chi-1',
      mainText: 'Chicago',
      secondaryText: 'IL, USA',
      coordinates: { latitude: 41.8781, longitude: -87.6298 }
    },
    {
      description: 'San Francisco, CA, USA',
      placeId: 'sf-1',
      mainText: 'San Francisco',
      secondaryText: 'CA, USA',
      coordinates: { latitude: 37.7749, longitude: -122.4194 }
    },
    {
      description: 'Miami, FL, USA',
      placeId: 'mia-1',
      mainText: 'Miami',
      secondaryText: 'FL, USA',
      coordinates: { latitude: 25.7617, longitude: -80.1918 }
    }
  ];

  return mockLocations.filter(location => 
    location.description.toLowerCase().includes(query.toLowerCase())
  );
}