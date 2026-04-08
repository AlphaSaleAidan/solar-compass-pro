import React, { createContext, useContext, ReactNode } from 'react';
import { SupabaseProjectStoreProvider, useSupabaseProjectStore } from '@/contexts/SupabaseProjectStore';

// Beta: All data flows through Supabase. No demo store.

type StoreType = ReturnType<typeof useSupabaseProjectStore>;
const UnifiedStoreContext = createContext<StoreType | null>(null);

const SupabaseBridge = ({ children }: { children: ReactNode }) => {
  const store = useSupabaseProjectStore();
  return (
    <UnifiedStoreContext.Provider value={store}>
      {children}
    </UnifiedStoreContext.Provider>
  );
};

export const DataSourceProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SupabaseProjectStoreProvider>
      <SupabaseBridge>{children}</SupabaseBridge>
    </SupabaseProjectStoreProvider>
  );
};

// Unified hook — always reads from Supabase
export const useDataSource = (): StoreType => {
  const ctx = useContext(UnifiedStoreContext);
  if (!ctx) throw new Error('useDataSource must be used within DataSourceProvider');
  return ctx;
};
