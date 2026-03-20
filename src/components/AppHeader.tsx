import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppHeader = ({ activeTab, onTabChange }: AppHeaderProps) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isPlus = user.portalMode === 'asp_plus';

  const aspTabs = user.role === 'sales_rep'
    ? ['Dashboard', 'Pipeline', 'Commissions', 'Calendar', 'Rankings']
    : ['QC Review', 'Projects', 'Communication'];

  const aspPlusTabs = ['Projects', 'Milestones', 'Documents', 'Funding'];

  const tabs = isPlus ? aspPlusTabs : aspTabs;

  const roleBadge = () => {
    const labels: Record<string, { text: string; cls: string }> = {
      sales_rep: { text: 'Sales Rep', cls: 'bg-primary/10 text-primary border-primary/25' },
      backend_ops: { text: 'Backend Ops', cls: 'bg-asp-blue/10 text-asp-blue border-asp-blue/25' },
      installer: { text: 'Installer', cls: 'bg-primary/10 text-primary border-primary/25' },
      financier: { text: 'Financier', cls: 'bg-asp-yellow/10 text-asp-yellow border-asp-yellow/25' },
    };
    const r = labels[user.role];
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${r.cls}`}>{r.text}</span>;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[58px] flex items-center px-6 gap-2 border-b border-border backdrop-blur-xl" style={{ background: isPlus ? 'rgba(255,255,255,0.97)' : 'rgba(7,9,13,0.97)' }}>
      <div className="flex items-center gap-2.5 mr-3 shrink-0">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-sm font-black text-primary-foreground">⚡</div>
        <span className={`text-base font-black whitespace-nowrap ${isPlus ? 'text-gray-900' : 'text-white'}`}>
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
            {tab}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        {roleBadge()}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${isPlus ? 'bg-gray-100 border-gray-200' : 'bg-bg4 border-border2'}`}>
          👤
        </div>
        <span className={`text-xs font-bold ${isPlus ? 'text-gray-700' : 'text-gray-300'}`}>{user.name}</span>
        <button
          onClick={logout}
          className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all duration-150 ${
            isPlus ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500' : 'bg-bg3 border-border text-muted-foreground hover:border-asp-red hover:text-asp-red'
          }`}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
