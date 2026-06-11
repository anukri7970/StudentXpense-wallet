'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { AuthProvider } from '../lib/AuthContext';

let initialized = false;

export default function Providers({ children }) {
  useEffect(() => {
    if (initialized) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: true,
      });
      initialized = true;
    }

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          tracesSampleRate: 0.5,
        });
      });
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
