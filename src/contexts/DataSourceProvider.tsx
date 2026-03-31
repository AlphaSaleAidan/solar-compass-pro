import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectStoreProvider, useProjectStore } from '@/contexts/ProjectStore';
import { SupabaseProjectStoreProvider, useSupabaseProjectStore } from '@/contexts/SupabaseProjectStore';

// Wrapper that provides the correct store based on user mode.
// Demo users get in-memory ProjectStore. Production users get Supabase-backed store.

// We use a bridge component pattern: the inner component reads from the correct context
// and provides it through a unified context.

type StoreType = ReturnType<typeof useProjectStore>;
const UnifiedStoreContext = createContext<StoreType | null>(null);

// Bridge: reads from demo store and provides to unified context
const DemoBridge = ({ children }: { children: ReactNode }) => {
  const store = useProjectStore();
  return (
    <UnifiedStoreContext.Provider value={store}>
      {children}
    </UnifiedStoreContext.Provider>
  );
};

// Bridge: reads from Supabase store and provides to unified context
const SupabaseBridge = ({ children }: { children: ReactNode }) => {
  const store = useSupabaseProjectStore();
  return (
    <UnifiedStoreContext.Provider value={store}>
      {children}
    </UnifiedStoreContext.Provider>
  );
};

export const DataSourceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Demo mode or no user: use in-memory ProjectStore
  if (!user || user.isDemo) {
    return (
      <ProjectStoreProvider>
        <DemoBridge>{children}</DemoBridge>
      </ProjectStoreProvider>
    );
  }

  // Production mode: use Supabase-backed store
  return (
    <SupabaseProjectStoreProvider>
      <SupabaseBridge>{children}</SupabaseBridge>
    </SupabaseProjectStoreProvider>
  );
};

// Unified hook - always reads from UnifiedStoreContext
export const useDataSource = (): StoreType => {
  const ctx = useContext(UnifiedStoreContext);
  if (!ctx) throw new Error('useDataSource must be used within DataSourceProvider');
  return ctx;
};
