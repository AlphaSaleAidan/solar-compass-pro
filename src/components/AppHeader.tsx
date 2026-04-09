import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Zap, LogOut, User, Crown, ArrowLeftRight, Wifi, WifiOff, Brain, MessageSquare, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '@/contexts/AuthContext';
import UserSettingsModal from '@/components/settings/UserSettingsModal';
import NotificationCenter from '@/components/shared/NotificationCenter';
import MessageCenter from '@/components/shared/MessageCenter';
import { MessagingService } from '@/lib/messaging';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppHeader = ({ activeTab, onTabChange }: AppHeaderProps) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Animated tab indicator
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (user && !user.isDemo) {
      supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [user]);

  // Messaging unread count
  useEffect(() => {
    if (!user || user.isDemo) return;
    const userId = user.id || 'admin';
    const userName = user.name || 'User';
    const userRole = user.role || 'admin';
    MessagingService.seedDemoData(userId, userName, userRole);
    const update = () => setUnreadMessages(MessagingService.getTotalUnreadCount(userId));
    update();
    const unsub = MessagingService.subscribe(update);
    return unsub;
  }, [user]);

  // Realtime connection health
  useEffect(() => {
    if (!user || user.isDemo) return;
    const channel = supabase.channel('header-sync-check')
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close mobile menu on tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Update tab indicator position (desktop only)
  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const activeBtn = tabsRef.current.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      const containerRect = tabsRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  if (!user) return null;

  const isPlus = user.portalMode === 'asp_plus';
  const isMaster = user.roles?.includes('master') || user.isDemo;

  const getTabDisplay = (tab: string) => {
    if (tab === 'Alpha') return <Crown className="w-4 h-4" />;
    return tab;
  };

  const aspTabs = user.role === 'sales_rep'
    ? ['Dashboard', 'Pipeline', 'Commissions', 'Calendar', 'Rankings', 'Alpha', 'Activity']
    : ['Executive', 'QC Review', 'Final Approval', 'Milestones', 'Projects', 'Communication', 'Super Support', 'Activity'];

  const aspPlusTabs = user.role === 'financier'
    ? ['Portal', 'Activity']
    : ['Portal', 'Activity'];

  const tabs = isPlus ? aspPlusTabs : aspTabs;

  const roleBadge = () => {
    const labels: Record<string, { text: string; cls: string }> = {
      sales_rep: { text: 'Sales Rep', cls: 'bg-primary/10 text-primary border-primary/25' },
      backend_ops: { text: 'Backend Ops', cls: 'bg-asp-blue/10 text-asp-blue border-asp-blue/25' },
      installer: { text: 'Installer', cls: 'bg-primary/10 text-primary border-primary/25' },
      financier: { text: 'Financier', cls: 'bg-asp-yellow/10 text-asp-yellow border-asp-yellow/25' },
      master: { text: 'Master', cls: 'bg-purple-500/10 text-purple-400 border-purple-400/25' },
    };
    const r = labels[user.role] || labels.sales_rep;
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${r.cls}`}>{r.text}</span>;
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    const defaultTab = ['installer', 'financier'].includes(role) ? 'Portal' :
      role === 'sales_rep' ? 'Dashboard' : 'QC Review';
    onTabChange(defaultTab);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[58px] flex items-center px-3 md:px-6 gap-2 border-b backdrop-blur-2xl"
      style={{
        background: 'rgba(6,8,17,0.65)',
        borderColor: 'rgba(255,255,255,0.04)',
        boxShadow: '0 1px 24px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.02)'
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1 md:mr-3 shrink-0">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-base font-black whitespace-nowrap text-foreground hidden sm:inline">
          ASP {isPlus && <span className="text-primary">+</span>}
        </span>
      </div>

      {/* Mobile: hamburger + active tab label */}
      <button
        onClick={() => setMobileMenuOpen(v => !v)}
        className="md:hidden flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-bold text-white hover:bg-white/5 transition-colors"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        <span className="text-xs text-muted-foreground">{activeTab}</span>
      </button>

      {/* Desktop: Tab navigation with animated indicator */}
      <nav ref={tabsRef} className="relative hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
        {/* Sliding indicator pill */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-[30px] rounded-md"
          style={{ background: 'rgba(0,212,200,0.1)' }}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
        />
        {tabs.map((tab) => (
          <button
            key={tab}
            data-tab={tab}
            onClick={() => onTabChange(tab)}
            className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold rounded-md transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {getTabDisplay(tab)}
          </button>
        ))}
      </nav>

      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />

      {/* Right side controls — condensed on mobile */}
      <div className="flex items-center gap-1.5 md:gap-3 ml-auto">
        {/* Live sync indicator — hide on small mobile */}
        {!user.isDemo && (
          <motion.div
            className="hidden sm:flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {realtimeConnected ? (
              <Wifi className="w-3 h-3 text-asp-green" />
            ) : (
              <WifiOff className="w-3 h-3 text-asp-red" />
            )}
            <span className={`text-[9px] font-bold uppercase hidden lg:inline ${realtimeConnected ? 'text-asp-green' : 'text-asp-red'}`}>
              {realtimeConnected ? 'Synced' : 'Offline'}
            </span>
          </motion.div>
        )}

        {/* Role switcher — hide on mobile, show in menu instead */}
        {isMaster && (
          <div className="hidden lg:flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3 text-gray-500" />
            {(['sales_rep', 'backend_ops', 'installer', 'financier'] as UserRole[]).map(r => (
              <button key={r} onClick={() => handleRoleSwitch(r)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all duration-200 ${
                  user.role === r
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                {r === 'sales_rep' ? 'SR' : r === 'backend_ops' ? 'OPS' : r === 'installer' ? 'INS' : 'FIN'}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {!user.isDemo && (
          <button
            onClick={() => setShowMessages(true)}
            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            title="Messages"
          >
            <MessageSquare className="w-5 h-5 text-white/60" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-black text-[10px] font-black">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </button>
        )}

        {/* Notification bell */}
        {!user.isDemo && <NotificationCenter />}

        {/* Role badge — hide text on mobile */}
        <span className="hidden md:inline">{roleBadge()}</span>

        {user.isDemo && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-400/25">DEMO</span>
        )}

        {/* Avatar */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm border-2 transition-all duration-200 hover:border-primary hover:scale-105 bg-bg4 border-border2 shrink-0"
          title="Settings"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>

        {/* User name — hide on mobile */}
        <span className="text-xs font-bold text-gray-300 hidden lg:inline">{user.name}</span>

        {/* Council button — icon-only on mobile */}
        <button
          onClick={() => navigate('/council')}
          className="px-2 md:px-3 py-1.5 text-xs font-bold rounded-md border transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          title="LLM Council"
        >
          <Brain className="w-3 h-3" />
          <span className="hidden sm:inline">Council</span>
        </button>

        {/* Logout — icon-only on mobile */}
        <button
          onClick={handleLogout}
          className="px-2 md:px-3 py-1.5 text-xs font-bold rounded-md border transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] bg-bg3 border-border text-muted-foreground hover:border-asp-red hover:text-asp-red"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
      <UserSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        onAvatarChange={(url) => setAvatarUrl(url)}
      />
    </header>

    {/* Mobile slide-down menu */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[58px] left-0 right-0 z-40 md:hidden border-b backdrop-blur-2xl overflow-hidden"
          style={{
            background: 'rgba(6,8,17,0.92)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Tabs */}
          <div className="p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { onTabChange(tab); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                }`}
              >
                {getTabDisplay(tab)}
              </button>
            ))}
          </div>

          {/* Role switcher in mobile menu */}
          {isMaster && (
            <div className="px-3 pb-3 border-t border-white/[0.06] pt-3">
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-2 px-1">Switch Role</div>
              <div className="grid grid-cols-4 gap-2">
                {(['sales_rep', 'backend_ops', 'installer', 'financier'] as UserRole[]).map(r => (
                  <button key={r} onClick={() => { handleRoleSwitch(r); setMobileMenuOpen(false); }}
                    className={`px-3 py-2.5 text-[11px] font-bold rounded-xl transition-all text-center ${
                      user.role === r
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 border border-white/[0.06]'
                    }`}>
                    {r === 'sales_rep' ? 'Sales Rep' : r === 'backend_ops' ? 'Backend Ops' : r === 'installer' ? 'Installer' : 'Financier'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    <MessageCenter isOpen={showMessages} onClose={() => setShowMessages(false)} />
    </>
  );
};

export default AppHeader;
