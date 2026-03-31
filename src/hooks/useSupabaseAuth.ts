import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'sales_rep' | 'backend_ops' | 'installer' | 'financier' | 'master';

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: {
    full_name: string;
    email: string;
    phone?: string;
    organization_id?: string;
    avatar_url?: string;
  } | null;
  loading: boolean;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    profile: null,
    loading: true,
  });

  const fetchUserData = useCallback(async (user: User) => {
    try {
      // Fetch roles
      const { data: rolesData } = await supabase.rpc('get_user_roles', { _user_id: user.id });
      const roles = (rolesData as AppRole[]) || [];

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, organization_id, avatar_url')
        .eq('user_id', user.id)
        .single();

      setState(prev => ({
        ...prev,
        user,
        roles,
        profile: profileData || { full_name: user.email || '', email: user.email || '' },
        loading: false,
      }));
    } catch (err) {
      console.error('Error fetching user data:', err);
      setState(prev => ({ ...prev, user, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState(prev => ({ ...prev, session }));
      if (session?.user) {
        // Defer data fetch to avoid Supabase deadlock
        setTimeout(() => fetchUserData(session.user), 0);
      } else {
        setState({ user: null, session: null, roles: [], profile: null, loading: false });
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session }));
        fetchUserData(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, _phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const hasRole = useCallback((role: AppRole) => {
    return state.roles.includes(role) || state.roles.includes('master');
  }, [state.roles]);

  const isMaster = useCallback(() => state.roles.includes('master'), [state.roles]);

  const getPrimaryRole = useCallback((): AppRole | null => {
    if (state.roles.includes('master')) return 'master';
    // Priority order
    const priority: AppRole[] = ['sales_rep', 'backend_ops', 'installer', 'financier'];
    return priority.find(r => state.roles.includes(r)) || null;
  }, [state.roles]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    hasRole,
    isMaster,
    getPrimaryRole,
    isAuthenticated: !!state.session,
  };
}
