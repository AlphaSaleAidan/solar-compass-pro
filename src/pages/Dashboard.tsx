import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import PuzzleGame from '@/components/sales/PuzzleGame';
import RepStats from '@/components/sales/RepStats';
import ShopSpin from '@/components/sales/ShopSpin';
import Pipeline from '@/components/sales/Pipeline';
import Commissions from '@/components/sales/Commissions';
import CalendarTab from '@/components/sales/CalendarTab';
import RankingsTab from '@/components/sales/RankingsTab';
import SellTab from '@/components/sales/SellTab';
import QCReview from '@/components/ops/QCReview';
import Communication from '@/components/ops/Communication';
import PlusPortal from '@/components/plus/PlusPortal';

const Dashboard = () => {
  const { user } = useAuth();
  const isPlus = user?.portalMode === 'asp_plus';
  const isSalesRep = user?.role === 'sales_rep';
  const defaultTab = isPlus ? 'Projects' : isSalesRep ? 'Dashboard' : 'QC Review';
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (!user) return null;

  const renderContent = () => {
    if (isPlus) {
      return <PlusPortal />;
    }

    if (isSalesRep) {
      switch (activeTab) {
        case 'Dashboard':
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <PuzzleGame />
                <RepStats />
              </div>
              <ShopSpin />
            </div>
          );
        case 'Pipeline':
          return <Pipeline />;
        case 'Commissions':
          return <Commissions />;
        case 'Calendar':
          return <CalendarTab />;
        case 'Rankings':
          return <RankingsTab />;
        default:
          return null;
      }
    }

    // Backend Ops
    switch (activeTab) {
      case 'QC Review':
        return <QCReview />;
      case 'Projects':
        return <Pipeline />;
      case 'Communication':
        return <Communication />;
      default:
        return null;
    }
  };

  return (
    <div className={isPlus ? 'asp-plus' : ''}>
      <div className="min-h-screen bg-background">
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="mt-[58px] p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
