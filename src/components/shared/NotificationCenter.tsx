/**
 * NotificationCenter — "The Wave" UI
 *
 * Shows real-time notifications for the current user's role.
 * As one ticket resolves, the next person in the chain sees their notification.
 * Bell icon with badge → dropdown panel with grouped notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, FileText, DollarSign, Clock, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  subscribeToNotifications, getInMemoryNotifications, subscribeMemory,
  markReadInMemory, markAllReadInMemory,
  type Notification, type NotificationType,
} from '@/lib/notificationCascade';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Icon mapping ───────────────────────────────────────────────────── */
const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  deal_submitted:      { icon: FileText,       color: 'text-cyan-400',   bgColor: 'bg-cyan-400/10' },
  qc_approved:         { icon: CheckCircle,    color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  qc_rejected:         { icon: AlertTriangle,  color: 'text-red-400',    bgColor: 'bg-red-400/10' },
  milestone_completed: { icon: Zap,            color: 'text-amber-400',  bgColor: 'bg-amber-400/10' },
  milestone_verified:  { icon: CheckCircle,    color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  funds_released:      { icon: DollarSign,     color: 'text-green-400',  bgColor: 'bg-green-400/10' },
  ticket_created:      { icon: AlertTriangle,  color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  ticket_resolved:     { icon: CheckCircle,    color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  document_uploaded:   { icon: FileText,       color: 'text-blue-400',   bgColor: 'bg-blue-400/10' },
  welcome_call_done:   { icon: Bell,           color: 'text-cyan-400',   bgColor: 'bg-cyan-400/10' },
  site_survey_done:    { icon: FileText,       color: 'text-cyan-400',   bgColor: 'bg-cyan-400/10' },
  install_scheduled:   { icon: Clock,          color: 'text-blue-400',   bgColor: 'bg-blue-400/10' },
  pto_granted:         { icon: Zap,            color: 'text-primary',    bgColor: 'bg-primary/10' },
  note_added:          { icon: FileText,       color: 'text-white/60',   bgColor: 'bg-white/5' },
  status_change:       { icon: ChevronRight,   color: 'text-white/60',   bgColor: 'bg-white/5' },
};

const PRIORITY_STYLES = {
  low: 'border-l-white/10',
  medium: 'border-l-blue-400/40',
  high: 'border-l-amber-400/60',
  urgent: 'border-l-red-400/80 bg-red-400/[0.03]',
};

/* ─── Time formatting ────────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── Component ──────────────────────────────────────────────────────── */
export default function NotificationCenter() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = profile?.role || 'sales_rep';
  const userId = user?.id || '';

  // Fetch existing notifications — try Supabase first, fallback to in-memory
  const fetchNotifications = useCallback(async () => {
    if (!userId || !role) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`to_role.eq.${role},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as Notification[]);
        setLoading(false);
        return;
      }
    } catch {
      // Table likely doesn't exist
    }

    // Fallback: use in-memory notifications
    const mem = getInMemoryNotifications().filter(
      n => n.to_role === role || n.to_user_id === userId,
    );
    setNotifications(mem);
    setLoading(false);
  }, [userId, role]);

  // Subscribe to real-time + in-memory notifications
  useEffect(() => {
    fetchNotifications();

    if (!userId || !role) return;

    // Subscribe to Supabase real-time (works when table exists)
    const unsubRT = subscribeToNotifications(role, userId, (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });

    // Also subscribe to in-memory notifications (always works)
    const unsubMem = subscribeMemory((notif) => {
      if (notif.to_role === role || notif.to_user_id === userId) {
        setNotifications(prev => [notif, ...prev.filter(n => n.id !== notif.id)]);
      }
    });

    return () => { unsubRT(); unsubMem(); };
  }, [userId, role, fetchNotifications]);

  // Mark a notification as read
  const markRead = async (id: string) => {
    markReadInMemory(id);
    supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Mark all as read
  const markAllRead = async () => {
    markAllReadInMemory();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id).filter(Boolean);
    if (unreadIds.length > 0) {
      supabase.from('notifications').update({ read: true }).in('id', unreadIds).then(() => {});
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5 text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-black text-[10px] font-black">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] z-50 rounded-xl bg-[hsl(222,25%,8%)] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary/80 hover:text-primary font-medium px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-white/30">No notifications yet</p>
                  <p className="text-xs text-white/15 mt-1">They'll appear here as the pipeline flows</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.status_change;
                  const Icon = config.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => notif.id && markRead(notif.id)}
                      className={`w-full text-left px-4 py-3 border-l-2 ${PRIORITY_STYLES[notif.priority]} ${
                        !notif.read ? 'bg-white/[0.02]' : ''
                      } hover:bg-white/[0.04] transition-colors border-b border-white/[0.03]`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-white truncate">{notif.title}</span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-white/20">{notif.created_at ? timeAgo(notif.created_at) : ''}</span>
                            <span className="text-[10px] text-white/10">•</span>
                            <span className="text-[10px] text-white/20">from {notif.from_role.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
