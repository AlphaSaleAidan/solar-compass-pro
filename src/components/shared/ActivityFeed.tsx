import { useAllActivityLog, type ActivityEntry } from '@/hooks/useActivityLog';
import { Activity, Clock, CheckCircle, FileText, MessageSquare, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';

const actionIcons: Record<string, typeof Activity> = {
  milestone_completed: CheckCircle,
  milestone_approved: CheckCircle,
  fund_released: DollarSign,
  document_uploaded: FileText,
  message_sent: MessageSquare,
  status_changed: ArrowRight,
  project_updated: Activity,
  ticket_created: AlertTriangle,
  default: Activity,
};

const portalColors: Record<string, string> = {
  'Sales Rep': 'bg-primary/15 text-primary border-primary/30',
  'Backend Ops': 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
  'Installer': 'bg-asp-green/15 text-asp-green border-asp-green/30',
  'Financier': 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
  'Master': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const formatTime = (ts: string) => {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
};

interface ActivityFeedProps {
  projectId?: string;
  maxItems?: number;
  compact?: boolean;
}

const ActivityFeed = ({ projectId, maxItems = 20, compact = false }: ActivityFeedProps) => {
  const { activities, loading } = useAllActivityLog();

  const filtered = projectId
    ? activities.filter(a => a.project_id === projectId)
    : activities;

  const display = filtered.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">Activity Feed</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-bg3 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'bg-bg2 border border-border rounded-xl p-4'}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Cross-Portal Activity</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{display.length} events</span>
        </div>
      )}

      {display.length > 0 ? (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {display.map((entry) => {
            const IconComp = actionIcons[entry.action_type] || actionIcons.default;
            const portalColor = portalColors[entry.portal] || portalColors['Master'];

            return (
              <div key={entry.id} className="flex items-start gap-2 py-2 px-3 bg-bg3 rounded-lg">
                <IconComp className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{entry.actor_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${portalColor}`}>
                      {entry.portal}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{entry.description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">{formatTime(entry.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-6 bg-bg3 rounded-lg">
          No cross-portal activity yet — actions from all platforms will appear here in real-time
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
