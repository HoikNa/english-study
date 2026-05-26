import { useEffect } from 'react';
import { apiClient, USE_MOCK } from '@/lib/api';
import { useAuthStore, UserProfile } from '@/stores/auth.store';

interface AuthApiUser {
  id: string;
  email: string;
  nickname: string;
  level: 1 | 2 | 3 | 4;
}

function normalizeUser(user: AuthApiUser): UserProfile {
  return {
    id: user.id,
    name: user.nickname,
    email: user.email,
    level: user.level ?? 3,
  };
}

export function useAuthSession() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (USE_MOCK || !hasHydrated || !token) {
      return;
    }

    let cancelled = false;

    async function validateSession() {
      setLoading(true);
      try {
        const res = await apiClient.get<AuthApiUser>('/auth/me');
        if (!cancelled) {
          setUser(normalizeUser(res.data));
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, logout, setLoading, setUser, token]);
}
