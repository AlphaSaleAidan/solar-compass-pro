import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Use functional update to check demo status without adding to deps
        setUser(prev => {
          if (prev?.isDemo) return prev;
          // Load production user asynchronously
          loadProductionUser(newSession.user);
          return prev;
        });
      } else {
        setUser(prev => prev?.isDemo ? prev : null);
      }
      setLoading(false);
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        loadProductionUser(existingSession.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProductionUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch user roles
      const { data: roles } = await supabase.rpc('get_user_roles', { _user_id: supabaseUser.id });
      const userRoles = (roles || []) as UserRole[];

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      const isMaster = userRoles.includes('master');
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
    } catch (err) {
      console.error('Error loading production user:', err);
    }
  };

  // Demo login (test001 / ASP26!)
  const login = async (username: string, password: string, role: UserRole, mode: PortalMode): Promise<boolean> => {
    if (username === 'Test001' && password === 'ASP26!') {
      setUser({
        id: 'demo-user',
        username,
        email: 'test001@alphasale.co',
        role,
        roles: ['sales_rep', 'backend_ops', 'installer', 'financier', 'master'],
        name: DEMO_USER_MAP[role],
        portalMode: mode,
        isDemo: true,
        platformAccess: ['sales_rep', 'backend_ops', 'installer', 'financier'],
      });
      setPortalMode(mode);
      return true;
    }
    return false;
  };

  // Production Supabase login
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    if (user?.isDemo) {
      setUser(null);
      setPortalMode('asp');
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setPortalMode('asp');
    }
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

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, logout, portalMode, setPortalMode, switchRole, session }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
