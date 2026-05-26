import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const API_PREFIX = '/api/v1';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 60000,
});

const refreshClient = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 60000,
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      })
      .then((res) => {
        useAuthStore.getState().setToken(res.data.access_token);
        useAuthStore.getState().setRefreshToken(res.data.refresh_token);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    console.error('[API Error]', err.message);
    const originalRequest = err.config as RetryableRequestConfig | undefined;
    const refreshToken = useAuthStore.getState().refreshToken;

    if (err.response?.status === 401 && originalRequest && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken(refreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    } else if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(err);
  }
);

export { USE_MOCK };

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const detail = typeof data === 'object' && data !== null && 'detail' in data
      ? String((data as { detail?: unknown }).detail)
      : typeof data === 'string'
        ? data
        : error.message;
    return status ? `HTTP ${status}: ${detail}` : error.message;
  }

  return error instanceof Error ? error.message : 'Unknown error';
}
