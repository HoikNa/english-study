import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: 1 | 2 | 3 | 4;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setAuth: (user: UserProfile, token: string, refreshToken: string) => void;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: USE_MOCK ? mockUser : null,
      token: USE_MOCK ? 'mock-access-token' : null,
      refreshToken: USE_MOCK ? 'mock-refresh-token' : null,
      isLoading: false,
      hasHydrated: false,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      completeOnboarding: () => set({ user: mockUser, token: 'mock-access-token', refreshToken: 'mock-refresh-token' }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
    }),
    {
      name: 'speakready-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
