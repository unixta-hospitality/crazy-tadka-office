'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface EnabledFeaturesContextValue {
  /** Set of enabled feature IDs */
  enabledIds: Set<string>;
  /** Whether we're still loading */
  loading: boolean;
  /** Refresh enabled features from the API */
  refresh: () => Promise<void>;
  /** Check if a specific feature is enabled */
  isEnabled: (featureId: string) => boolean;
}

const EnabledFeaturesContext = createContext<EnabledFeaturesContextValue>({
  enabledIds: new Set(),
  loading: true,
  refresh: async () => {},
  isEnabled: () => false,
});

export function EnabledFeaturesProvider({ children }: { children: ReactNode }) {
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/features');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(
          (data.features || [])
            .filter((f: { enabled: boolean }) => f.enabled)
            .map((f: { id: string }) => f.id)
        );
        setEnabledIds(ids);
      }
    } catch {
      // Keep current state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (featureId: string) => enabledIds.has(featureId),
    [enabledIds]
  );

  return (
    <EnabledFeaturesContext.Provider value={{ enabledIds, loading, refresh, isEnabled }}>
      {children}
    </EnabledFeaturesContext.Provider>
  );
}

export function useFeatures() {
  return useContext(EnabledFeaturesContext);
}
