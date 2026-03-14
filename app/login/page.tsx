'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
        context: 'signin',
      });
      const buttonDiv = document.getElementById('google-signin-btn');
      if (buttonDiv) {
        window.google?.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  const handleGoogleCallback = async (response: { credential: string }) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          clientId: googleClientId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Authentication failed');
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError('Unable to connect to authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-4">
      <div className="max-w-sm w-full space-y-6">
        {/* Branding */}
        <div className="text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center font-bold text-3xl text-foreground mx-auto mb-4">
            L
          </div>
          <h1 className="text-3xl font-bold text-foreground">Legacy Realty DFW</h1>
          <p className="mt-2 text-sm text-surface-400">Office Portal</p>
        </div>

        {/* Sign-in card */}
        <div className="w-full space-y-5 bg-surface-800/50 p-8 rounded-lg border border-surface-700">
          {googleClientId ? (
            <div className="flex flex-col items-center gap-4">
              <div id="google-signin-btn" />
              {isSubmitting && (
                <p className="text-sm text-surface-400">Signing in...</p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-amber-400">
                Google SSO is not configured.
              </p>
              <p className="text-xs text-surface-500 mt-2">
                Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.
              </p>
            </div>
          )}

          {error && (
            <div
              className="rounded-lg bg-red-950/30 border border-red-900/50 p-3"
              role="alert"
            >
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-surface-600">
          Sign in with your Google account to access the office portal.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950 p-4">
          <div className="text-surface-400">Loading...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
