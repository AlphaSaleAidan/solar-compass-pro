import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectStoreProvider, useProjectStore } from '@/contexts/ProjectStore';
import { SupabaseProjectStoreProvider, useSupabaseProjectStore } from '@/contexts/SupabaseProjectStore';

// This component wraps children in the appropriate data source based on the user's mode.
// Demo users (test001) get the in-memory ProjectStore.
// Production users get the Supabase-backed SupabaseProjectStore.

const DataSourceInner = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const DataSourceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Before login or during loading, wrap in demo store (safe default)
  if (!user) {
    return (
      <ProjectStoreProvider>
        {children}
      </ProjectStoreProvider>
    );
  }

  // Demo mode: use in-memory ProjectStore
  if (user.isDemo) {
    return (
      <ProjectStoreProvider>
        {children}
      </ProjectStoreProvider>
    );
  }

  // Production mode: use Supabase-backed store
  return (
    <SupabaseProjectStoreProvider>
      {children}
    </SupabaseProjectStoreProvider>
  );
};

// Unified hook that returns the correct store based on user mode
export const useDataSource = () => {
  const { user } = useAuth();

  // We need to call both hooks but only one will be active
  // The trick: both contexts exist, but only one is provided
  // So we try the Supabase one first, fall back to demo
  try {
    if (user && !user.isDemo) {
      return useSupabaseProjectStore();
    }
  } catch {
    // Not in SupabaseProjectStoreProvider
  }

  try {
    return useProjectStore();
  } catch {
    // Not in ProjectStoreProvider
  }

  throw new Error('useDataSource must be used within DataSourceProvider');
};
