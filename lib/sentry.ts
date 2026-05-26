import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import type { ComponentType } from 'react';

import type { UserProfile } from '@/stores/auth.store';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const isSentryEnabled = Boolean(dsn);

if (isSentryEnabled) {
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    release: `speakready-my@${Constants.expoConfig?.version ?? 'unknown'}`,
    tracesSampleRate: __DEV__ ? 1.0 : 0.05,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
  });
}

export function withSentry<P extends Record<string, unknown>>(component: ComponentType<P>): ComponentType<P> {
  return isSentryEnabled ? Sentry.wrap(component) : component;
}

export function setSentryUser(user: UserProfile | null): void {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.setUser(user ? { id: user.id, email: user.email, username: user.name } : null);
}

export function captureSentryMessage(message: string): string | undefined {
  if (!isSentryEnabled) {
    return undefined;
  }

  const eventId = Sentry.captureMessage(message, 'info');
  void Sentry.flush();
  return eventId;
}
