import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'sales_rep' | 'backend_ops' | 'installer' | 'financier' | 'master';
export type PortalMode = 'asp' | 'asp_plus';

interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
  portalMode: PortalMode;
  organizationId: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalMode, setPortalMode] = useState<PortalMode>('asp');
  const [activeRole, setActiveRoleState] = useState<UserRole>('sales_rep');

  const buildUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, organization_id')
        .eq('user_id', supabaseUser.id)
        .single();

      // Fetch roles using security definer function
      const { data: rolesData } = await supabase.rpc('get_user_roles', { _user_id: supabaseUser.id });

      const roles = (rolesData as UserRole[]) || [];
      if (roles.length === 0) return null;

      // Determine default active role
      const defaultRole = roles.includes('master') ? 'sales_rep' : roles[0];
      const mode: PortalMode = ['installer', 'financier'].includes(defaultRole) ? 'asp_plus' : 'asp';

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || supabaseUser.email || '',
        roles,
        activeRole: defaultRole,
        portalMode: mode,
        organizationId: profile?.organization_id || null,
      };
    } catch (err) {
      console.error('Error building user:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks with Supabase client
        setTimeout(async () => {
          const appUser = await buildUser(session.user);
          if (appUser) {
            setUser(appUser);
            setActiveRoleState(appUser.activeRole);
            setPortalMode(appUser.portalMode);
          }
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await buildUser(session.user);
        if (appUser) {
          setUser(appUser);
          setActiveRoleState(appUser.activeRole);
          setPortalMode(appUser.portalMode);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPortalMode('asp');
    setActiveRoleState('sales_rep');
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    const mode: PortalMode = ['installer', 'financier'].includes(role) ? 'asp_plus' : 'asp';
    setPortalMode(mode);
    if (user) {
      setUser({ ...user, activeRole: role, portalMode: mode });
    }
  };

  const isMaster = user?.roles.includes('master') || false;

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      portalMode, setPortalMode,
      activeRole, setActiveRole,
      isMaster,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
