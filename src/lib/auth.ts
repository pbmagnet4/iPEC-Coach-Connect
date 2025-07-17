import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, useRole } from './roles';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => {
        set({ user });
        // Update role when user changes
        useRole.getState().setRole(user?.role || null);
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({ user: state.user }), // only persist user data
    }
  )
);

export async function handleGoogleSignIn() {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    // Here you would typically make an API call to your backend
    // to handle Google Sign-In and return user data
    const mockUserData: User = {
      id: '123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'client', // This would come from your backend
      profileImage: 'https://example.com/avatar.jpg',
    };

    auth.setUser(mockUserData);
    return mockUserData;
  } catch (error) {
    auth.setError('Failed to sign in with Google');
    throw error;
  } finally {
    auth.setLoading(false);
  }
}

export async function signOut() {
  const auth = useAuth.getState();
  auth.setLoading(true);
  auth.setError(null);

  try {
    // Here you would typically make an API call to your backend
    auth.setUser(null);
    useRole.getState().setRole(null);
  } catch (error) {
    auth.setError('Failed to sign out');
    throw error;
  } finally {
    auth.setLoading(false);
  }
}