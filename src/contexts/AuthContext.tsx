import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

import { type OrgRole, hasPermission, type Permission, getRoleLabel } from '@/lib/rbac';

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
  isDemo: boolean;
  platformAccess: string[];
  organizationId?: string;
  companyName?: string;
  orgRole?: OrgRole;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password: string, role: UserRole, mode: PortalMode) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  switchRole: (role: UserRole) => void;
  session: Session | null;
  /** RBAC: check if current user has a specific permission */
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER_MAP: Record<UserRole, string> = {
  sales_rep: 'Jordan Mills',
  backend_ops: 'Admin Ops',
  installer: 'SunTech Installations',
  financier: 'Apex Capital Group',
  master: 'Master Admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [portalMode, setPortalMode] = useState<PortalMode>('asp');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Listen for Supabase auth state changes
  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(prev => {
          if (!initialSessionHandled) return prev;
          loadProductionUser(newSession.user);
          return prev;
        });
      } else {
        setUser(null);
      }
      if (initialSessionHandled) setLoading(false);
    });

    // Check existing session once
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      initialSessionHandled = true;
      setSession(existingSession);
      if (existingSession?.user) {
        loadProductionUser(existingSession.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProductionUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Run both queries in parallel for faster login
      const [rolesResult, profileResult] = await Promise.all([
        supabase.rpc('get_user_roles', { user_uuid: supabaseUser.id }),
        supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
      ]);

      // Map DB roles (app_role enum) to UI UserRole
      const dbRoles = (rolesResult.data || []) as string[];
      const userRoles: UserRole[] = dbRoles.map(r =>
        r === 'master_admin' ? 'master' : r as UserRole
      );
      const profile = profileResult.data;

      const isMaster = userRoles.includes('master') || dbRoles.includes('master_admin');
      const primaryRole = isMaster ? 'master' : userRoles[0] || 'sales_rep';
      const platformAccess = isMaster
        ? ['sales_rep', 'backend_ops', 'installer', 'financier']
        : (profile as any)?.platform_access || [primaryRole];

      const mode: PortalMode = ['installer', 'financier'].includes(primaryRole) ? 'asp_plus' : 'asp';

      setPortalMode(mode);
      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email || '',
        email: supabaseUser.email || '',
        role: primaryRole,
        roles: userRoles,
        name: profile?.full_name || supabaseUser.email || 'User',
        portalMode: mode,
        isDemo: false,
        platformAccess,
        organizationId: profile?.organization_id || undefined,
        companyName: (profile as any)?.company_name || undefined,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading production user:', err);
      setLoading(false);
    }
  };

  // Beta: demo login removed. Keeping function signature for compatibility.
  const login = async (_username: string, _password: string, _role: UserRole, _mode: PortalMode): Promise<boolean> => {
    return false; // Demo disabled — use loginWithEmail
  };

  // Supabase production login
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPortalMode('asp');
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    const mode: PortalMode = ['installer', 'financier'].includes(role) ? 'asp_plus' : 'asp';
    setUser(prev => prev ? {
      ...prev,
      role,
      name: prev.isDemo ? DEMO_USER_MAP[role] : prev.name,
      portalMode: mode,
    } : null);
    setPortalMode(mode);
  };

  /** RBAC permission check — maps UserRole → OrgRole for the hierarchy system */
  const can = (permission: Permission): boolean => {
    if (!user) return false;
    // Map legacy UserRole to OrgRole
    const orgRole: OrgRole = user.role === 'master' ? 'master_admin'
      : user.role === 'backend_ops' ? 'regional' // Ops users get regional-level access
      : user.role as OrgRole;
    return hasPermission(orgRole, permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, logout, portalMode, setPortalMode, switchRole, session, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
