import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityEntry {
  id: string;
  project_id: string;
  actor_name: string;
  actor_role: string;
  action_type: string;
  description: string;
  metadata: Record<string, any>;
  portal: string;
  created_at: string;
}

const portalFromRole = (role: string): string => {
  switch (role) {
    case 'sales_rep': return 'Sales Rep';
    case 'backend_ops': return 'Backend Ops';
    case 'installer': return 'Installer';
    case 'financier': return 'Financier';
    case 'master': return 'Master';
    default: return 'Unknown';
  }
};

export const useActivityLog = (projectId?: string) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!projectId || user?.isDemo) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_activity_log' as any)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setActivities(data as unknown as ActivityEntry[]);
    }
    setLoading(false);
  }, [projectId, user?.isDemo]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Realtime subscription for this project's activity
  useEffect(() => {
    if (!projectId || user?.isDemo) return;

    const channel = supabase
      .channel(`activity-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_activity_log',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newEntry = payload.new as unknown as ActivityEntry;
        setActivities(prev => [newEntry, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, user?.isDemo]);

  const logActivity = useCallback(async (
    projectId: string,
    actionType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!user || user.isDemo) return;

    await supabase.from('project_activity_log' as any).insert({
      project_id: projectId,
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action_type: actionType,
      description,
      metadata,
      portal: portalFromRole(user.role),
    } as any);
  }, [user]);

  return { activities, loading, logActivity, refetch: fetchActivities };
};

// Global hook for all projects (used in dashboards)
export const useAllActivityLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isDemo) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from('project_activity_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setActivities(data as unknown as ActivityEntry[]);
      }
      setLoading(false);
    };
    fetch();

    // Realtime for all activity
    const channel = supabase
      .channel('all-activity')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_activity_log',
      }, (payload) => {
        const newEntry = payload.new as unknown as ActivityEntry;
        setActivities(prev => [newEntry, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const logActivity = useCallback(async (
    projectId: string,
    actionType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!user || user.isDemo) return;

    await supabase.from('project_activity_log' as any).insert({
      project_id: projectId,
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action_type: actionType,
      description,
      metadata,
      portal: portalFromRole(user.role),
    } as any);
  }, [user]);

  return { activities, loading, logActivity };
};
