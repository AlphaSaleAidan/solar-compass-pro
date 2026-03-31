import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Zap, LogOut, User, Crown, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ROLE_LABELS: Record<string, { text: string; cls: string }> = {
  sales_rep: { text: 'Sales Rep', cls: 'bg-primary/10 text-primary border-primary/25' },
  backend_ops: { text: 'Backend Ops', cls: 'bg-asp-blue/10 text-asp-blue border-asp-blue/25' },
  installer: { text: 'Installer', cls: 'bg-primary/10 text-primary border-primary/25' },
  financier: { text: 'Financier', cls: 'bg-asp-yellow/10 text-asp-yellow border-asp-yellow/25' },
  master: { text: 'Master', cls: 'bg-asp-red/10 text-asp-red border-asp-red/25' },
};

const AppHeader = ({ activeTab, onTabChange }: AppHeaderProps) => {
  const { user, logout, isMaster, setActiveRole, activeRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowRoleMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const isPlus = user.portalMode === 'asp_plus';

  const getTabDisplay = (tab: string) => {
    if (tab === '🦁') return <Crown className="w-4 h-4" />;
    return tab;
  };

  const aspTabs = activeRole === 'sales_rep'
    ? ['Dashboard', 'Pipeline', 'Commissions', 'Calendar', 'Rankings', '🦁']
    : ['QC Review', 'Final Approval', 'Milestones', 'Projects', 'Communication', 'Super Support'];

  const aspPlusTabs = ['Portal'];
  const tabs = isPlus ? aspPlusTabs : aspTabs;

  const switchableRoles: UserRole[] = isMaster
    ? ['sales_rep', 'backend_ops', 'installer', 'financier']
    : (user.roles.filter(r => r !== 'master') as UserRole[]);

  const r = ROLE_LABELS[activeRole] || ROLE_LABELS.sales_rep;

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
        {/* Role badge / switcher */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => switchableRoles.length > 1 && setShowRoleMenu(!showRoleMenu)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${r.cls} flex items-center gap-1 ${switchableRoles.length > 1 ? 'cursor-pointer hover:opacity-80' : ''}`}
          >
            {r.text}
            {switchableRoles.length > 1 && <ChevronDown className="w-3 h-3" />}
          </button>
          {showRoleMenu && (
            <div className={`absolute top-full right-0 mt-1 rounded-lg border shadow-xl py-1 min-w-[160px] z-50 ${isPlus ? 'bg-white border-gray-200' : 'bg-bg2 border-border'}`}>
              {switchableRoles.map((role) => {
                const label = ROLE_LABELS[role];
                return (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveRole(role);
                      setShowRoleMenu(false);
                      onTabChange(
                        ['installer', 'financier'].includes(role) ? 'Portal'
                        : role === 'sales_rep' ? 'Dashboard'
                        : 'QC Review'
                      );
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                      activeRole === role
                        ? 'text-primary bg-primary/5'
                        : isPlus ? 'text-gray-600 hover:bg-gray-50' : 'text-muted-foreground hover:bg-bg3'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${activeRole === role ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    {label.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${isPlus ? 'bg-gray-100 border-gray-200' : 'bg-bg4 border-border2'}`}>
          <User className="w-4 h-4" />
        </div>
        <span className={`text-xs font-bold ${isPlus ? 'text-gray-700' : 'text-gray-300'}`}>{user.name}</span>
        <button
          onClick={logout}
          className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all duration-150 flex items-center gap-1.5 ${
            isPlus ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500' : 'bg-bg3 border-border text-muted-foreground hover:border-asp-red hover:text-asp-red'
          }`}
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
