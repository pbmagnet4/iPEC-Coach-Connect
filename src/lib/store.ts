import { create } from 'zustand';
import type { Coach, User } from '../types';
import type { LocationData } from './location';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  coaches: Coach[];
  setCoaches: (coaches: Coach[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  userLocation: LocationData | null;
  setUserLocation: (location: LocationData | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  coaches: [],
  setCoaches: (coaches) => set({ coaches }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
}));