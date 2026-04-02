import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Zap, LogOut, User, Crown, ArrowLeftRight, Settings, Wifi, WifiOff } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';
import UserSettingsModal from '@/components/settings/UserSettingsModal';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppHeader = ({ activeTab, onTabChange }: AppHeaderProps) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  if (!user) return null;

  const isPlus = user.portalMode === 'asp_plus';
  const isMaster = user.roles?.includes('master') || user.isDemo;

  const getTabDisplay = (tab: string) => {
    if (tab === '🦁') return <Crown className="w-4 h-4" />;
    return tab;
  };

  const aspTabs = user.role === 'sales_rep'
    ? ['Dashboard', 'Pipeline', 'Commissions', 'Calendar', 'Rankings', '🦁']
    : ['QC Review', 'Final Approval', 'Milestones', 'Projects', 'Communication', 'Super Support'];

  const aspPlusTabs = user.role === 'financier'
    ? ['Portal']
    : ['Portal'];

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
    <header className="fixed top-0 left-0 right-0 z-50 h-[58px] flex items-center px-6 gap-2 border-b border-border backdrop-blur-xl" style={{ background: isPlus ? 'rgba(255,255,255,0.97)' : 'rgba(7,9,13,0.97)' }}>
      <div className="flex items-center gap-2.5 mr-3 shrink-0">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className={`text-base font-black whitespace-nowrap ${isPlus ? 'text-gray-900' : 'text-foreground'}`}>
          ASP {isPlus && <span className="text-primary">+</span>}
        </span>
      </div>

      <nav className="flex items-center gap-0.5 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1.5 text-[13px] font-semibold rounded-md transition-all duration-150 whitespace-nowrap ${
              activeTab === tab
                ? 'text-primary bg-primary/10'
                : isPlus ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-muted-foreground hover:text-foreground hover:bg-bg3'
            }`}
          >
            {getTabDisplay(tab)}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        {isMaster && (
          <div className="flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3 text-gray-500" />
            {(['sales_rep', 'backend_ops', 'installer', 'financier'] as UserRole[]).map(r => (
              <button key={r} onClick={() => handleRoleSwitch(r)}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                  user.role === r
                    ? 'bg-primary/10 text-primary'
                    : isPlus ? 'text-gray-400 hover:text-gray-700' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {r === 'sales_rep' ? 'SR' : r === 'backend_ops' ? 'OPS' : r === 'installer' ? 'INS' : 'FIN'}
              </button>
            ))}
          </div>
        )}

        {roleBadge()}
        {user.isDemo && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-400/25">DEMO</span>
        )}
        <button
          onClick={() => setShowSettings(true)}
          className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm border-2 transition-all hover:border-primary ${isPlus ? 'bg-gray-100 border-gray-200' : 'bg-bg4 border-border2'}`}
          title="Settings"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
        <span className={`text-xs font-bold ${isPlus ? 'text-gray-700' : 'text-gray-300'}`}>{user.name}</span>
        <button
          onClick={handleLogout}
          className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all duration-150 flex items-center gap-1.5 ${
            isPlus ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500' : 'bg-bg3 border-border text-muted-foreground hover:border-asp-red hover:text-asp-red'
          }`}
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      </div>
      <UserSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        onAvatarChange={(url) => setAvatarUrl(url)}
      />
    </header>
  );
};

export default AppHeader;
