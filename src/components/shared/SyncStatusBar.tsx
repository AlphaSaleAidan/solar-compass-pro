import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Wifi, WifiOff, Activity, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PortalStatus {
  portal: string;
  lastActivity: string | null;
  isActive: boolean;
  color: string;
  icon: string;
}

const SyncStatusBar = ({ projectId }: { projectId?: string }) => {
  const { user } = useAuth();
  const [portalStatuses, setPortalStatuses] = useState<PortalStatus[]>([
    { portal: 'SR', lastActivity: null, isActive: false, color: 'bg-muted-foreground', icon: '🏠' },
    { portal: 'Ops', lastActivity: null, isActive: false, color: 'bg-muted-foreground', icon: '⚙️' },
    { portal: 'Ins', lastActivity: null, isActive: false, color: 'bg-muted-foreground', icon: '🔧' },
    { portal: 'Fin', lastActivity: null, isActive: false, color: 'bg-muted-foreground', icon: '💰' },
  ]);
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    if (!projectId || user?.isDemo) return;

    const fetchStatuses = async () => {
      const { data } = await supabase
        .from('project_activity_log' as any)
        .select('portal, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const entries = data as unknown as { portal: string; created_at: string }[];
        const now = Date.now();
        const portalMap: Record<string, string> = {};
        
        entries.forEach((e) => {
          const key = e.portal === 'Sales Rep' ? 'SR' : e.portal === 'Backend Ops' ? 'Ops' : e.portal === 'Installer' ? 'Ins' : e.portal === 'Financier' ? 'Fin' : e.portal;
          if (!portalMap[key]) portalMap[key] = e.created_at;
        });

        setPortalStatuses(prev => prev.map(p => {
          const lastTs = portalMap[p.portal];
          if (!lastTs) return { ...p, isActive: false, color: 'bg-muted-foreground' };
          const ageMs = now - new Date(lastTs).getTime();
          const isActive = ageMs < 24 * 60 * 60 * 1000; // active within 24h
          return {
            ...p,
            lastActivity: lastTs,
            isActive,
            color: isActive ? 'bg-asp-green' : ageMs < 7 * 24 * 60 * 60 * 1000 ? 'bg-asp-yellow' : 'bg-muted-foreground',
          };
        }));
      }
    };

    fetchStatuses();

    const channel = supabase
      .channel(`sync-status-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_activity_log',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        fetchStatuses();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, user?.isDemo]);

  // Realtime connection status
  useEffect(() => {
    const channel = supabase.channel('sync-heartbeat')
      .subscribe((status) => {
        setSynced(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const formatAge = (ts: string | null) => {
    if (!ts) return 'No activity';
    const ms = Date.now() - new Date(ts).getTime();
    if (ms < 60000) return 'Just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection indicator */}
      <div className="flex items-center gap-1">
        {synced ? (
          <Wifi className="w-3 h-3 text-asp-green" />
        ) : (
          <WifiOff className="w-3 h-3 text-asp-red" />
        )}
        <span className="text-[9px] text-muted-foreground font-bold uppercase">
          {synced ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Portal status dots */}
      {projectId && (
        <div className="flex items-center gap-1 ml-1">
          {portalStatuses.map(p => (
            <Tooltip key={p.portal}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 cursor-help">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                  <span className="text-[8px] text-muted-foreground font-bold">{p.portal}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-bg2 border-border p-2">
                <div className="text-[10px]">
                  <div className="font-bold text-foreground">{p.portal} Portal</div>
                  <div className="text-muted-foreground">{formatAge(p.lastActivity)}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
};

/** Compact sync badge for project cards */
export const SyncBadge = ({ projectId }: { projectId: string }) => {
  const { user } = useAuth();
  const [portalsActive, setPortalsActive] = useState(0);

  useEffect(() => {
    if (user?.isDemo) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('project_activity_log' as any)
        .select('portal')
        .eq('project_id', projectId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(50);

      if (data) {
        const entries = data as unknown as { portal: string }[];
        const unique = new Set(entries.map(e => e.portal));
        setPortalsActive(unique.size);
      }
    };
    fetch();
  }, [projectId, user?.isDemo]);

  return (
    <div className="flex items-center gap-1">
      <Users className="w-3 h-3 text-muted-foreground" />
      <span className="text-[9px] text-muted-foreground font-bold">{portalsActive}/4</span>
    </div>
  );
};

export default SyncStatusBar;
