import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'sales_rep' | 'backend_ops' | 'installer' | 'financier' | 'master';
export type PortalMode = 'asp' | 'asp_plus';

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  name: string;
  portalMode: PortalMode;
  organizationId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole, mode: PortalMode) => Promise<boolean>;
  logout: () => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  setUserRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [portalMode, setPortalMode] = useState<PortalMode>('asp');
  const [loading, setLoading] = useState(true);

  const buildAppUser = useCallback(async (
    supaUser: User,
    selectedRole: UserRole,
    mode: PortalMode
  ): Promise<AppUser> => {
    // Fetch roles
    const { data: rolesData } = await supabase.rpc('get_user_roles', { _user_id: supaUser.id });
    const roles = (rolesData as UserRole[]) || [];

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, organization_id')
      .eq('user_id', supaUser.id)
      .single();

    // If user has master role, allow any role selection
    const isMaster = roles.includes('master');
    const effectiveRole = isMaster ? selectedRole : (roles.includes(selectedRole) ? selectedRole : roles[0] || selectedRole);

    return {
      id: supaUser.id,
      username: supaUser.email || '',
      email: supaUser.email || '',
      role: effectiveRole,
      roles,
      name: profile?.full_name || supaUser.email || 'User',
      portalMode: mode,
      organizationId: profile?.organization_id || undefined,
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Preserve current role/mode if already set
        const currentRole = user?.role || 'sales_rep';
        const currentMode = user?.portalMode || 'asp';
        const appUser = await buildAppUser(session.user, currentRole, currentMode);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await buildAppUser(session.user, 'sales_rep', 'asp');
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [buildAppUser]);

  const login = useCallback(async (email: string, password: string, role: UserRole, mode: PortalMode): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error.message);
        return false;
      }
      if (data.user) {
        const appUser = await buildAppUser(data.user, role, mode);
        setUser(appUser);
        setPortalMode(mode);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  }, [buildAppUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPortalMode('asp');
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setUser(prev => prev ? { ...prev, role } : null);
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return user.roles.includes(role) || user.roles.includes('master');
  }, [user]);

  const isMaster = user?.roles.includes('master') || false;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      portalMode,
      setPortalMode,
      setUserRole,
      hasRole,
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
