export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  goals: string[];
  preferences: {
    coachingType: string[];
    priceRange: {
      min: number;
      max: number;
    };
    location: {
      type: 'remote' | 'in-person' | 'hybrid';
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  createdAt: string;
}

export interface Coach {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio: string;
  specialties: string[];
  certifications: {
    type: string;
    issueDate: string;
    verificationId: string;
  }[];
  pricing: {
    hourlyRate: number;
    packageRates?: {
      sessions: number;
      price: number;
    }[];
  };
  availability: {
    timezone: string;
    schedule: {
      day: string;
      slots: string[];
    }[];
  };
  location: {
    type: 'remote' | 'in-person' | 'hybrid';
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  };
  rating: number;
  reviewCount: number;
  createdAt: string;
  distance?: number;
}