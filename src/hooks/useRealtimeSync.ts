import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Universal realtime sync hook — subscribes to all project-related tables
 * and fires callbacks when changes occur from ANY portal.
 * Backend Ops is source of truth: ops changes override all.
 */
export const useRealtimeSync = (callbacks: {
  onProjectChange?: (payload: any) => void;
  onMilestoneChange?: (payload: any) => void;
  onMilestoneStateChange?: (payload: any) => void;
  onActivityChange?: (payload: any) => void;
}) => {
  const { user } = useAuth();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!user || user.isDemo) return;

    const channel = supabase
      .channel('cross-portal-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
      }, (payload) => {
        callbacksRef.current.onProjectChange?.(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_milestones',
      }, (payload) => {
        callbacksRef.current.onMilestoneChange?.(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'milestone_states',
      }, (payload) => {
        callbacksRef.current.onMilestoneStateChange?.(payload);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_activity_log',
      }, (payload) => {
        callbacksRef.current.onActivityChange?.(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};

export default useRealtimeSync;
