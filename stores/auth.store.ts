import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: 1 | 2 | 3 | 4;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

const mockUser: UserProfile = {
  id: 'user-hoik',
  name: 'Hoik',
  email: 'hoik@example.com',
  level: 3,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: USE_MOCK ? mockUser : null,
  token: USE_MOCK ? 'mock-access-token' : null,
  isLoading: false,
  setAuth: (user, token) => set({ user, token }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  completeOnboarding: () => set({ user: mockUser, token: 'mock-access-token' }),
  logout: () => set({ user: null, token: null }),
}));
