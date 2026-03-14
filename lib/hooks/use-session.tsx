'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  permissions: string[];
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else if (res.status === 401) {
        // Explicit unauthorized — session is gone, clear and redirect.
        setUser(null);
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          window.location.replace(
            `/login?expired=1&from=${encodeURIComponent(window.location.pathname)}`,
          );
        }
      }
      // Any other non-OK status → keep stale user so profile doesn't vanish.
    } catch {
      // Transient network error — do NOT wipe the user. Keep stale data.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
