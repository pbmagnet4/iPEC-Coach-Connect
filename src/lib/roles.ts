import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'client' | 'coach' | null;

interface RoleState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
    }),
    {
      name: 'role-storage', // unique name for localStorage key
    }
  )
);

export function isCoach(role: UserRole): boolean {
  return role === 'coach';
}

export function isClient(role: UserRole): boolean {
  return role === 'client';
}