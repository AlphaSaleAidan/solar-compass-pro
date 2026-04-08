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
import MilestoneVerification from '@/components/ops/MilestoneVerification';
import OpsProjectsTab from '@/components/ops/OpsProjectsTab';
import SuperSupport from '@/components/ops/SuperSupport';
import FinalApprovalQueue from '@/components/ops/FinalApprovalQueue';
import ExecutiveDashboard from '@/components/ops/ExecutiveDashboard';
import PlusPortal from '@/components/plus/PlusPortal';
import ActivityFeed from '@/components/shared/ActivityFeed';
import PageTransition from '@/components/shared/PageTransition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
// PortalAmbient3D removed — CinematicBackground is now global in App.tsx
import { useDataSource } from '@/contexts/DataSourceProvider';

const Dashboard = () => {
  const { user } = useAuth();
  const { sellProjects, markSellProjectClean, markSellProjectDirty } = useDataSource();
  const isPlus = user?.portalMode === 'asp_plus';
  const isSalesRep = user?.role === 'sales_rep';
  const defaultTab = isPlus ? 'Projects' : isSalesRep ? 'Dashboard' : 'QC Review';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [convertedProjectData, setConvertedProjectData] = useState<{ name: string; email: string; phone: string; address: string } | null>(null);

  if (!user) return null;

  const handleConvertToProject = (data: { name: string; email: string; phone: string; address: string }) => {
    setConvertedProjectData(data);
    setActiveTab('🦁');
  };

  const renderContent = () => {
    // Activity tab is shared across all portals
    if (activeTab === 'Activity') {
      return <ActivityFeed />;
    }

    if (isPlus) {
      if (activeTab === 'Portal') return <PlusPortal />;
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
          return <CalendarTab onConvertToProject={handleConvertToProject} />;
        case 'Rankings':
          return <RankingsTab />;
        case '🦁':
          return <SellTab initialProjectData={convertedProjectData} />;
        default:
          return null;
      }
    }

    // Backend Ops
    switch (activeTab) {
      case 'Executive':
        return <ExecutiveDashboard />;
      case 'QC Review':
        return <QCReview />;
      case 'Final Approval':
        return (
          <FinalApprovalQueue
            projects={sellProjects.filter(p => p.submittedForApproval && p.qcInitialApproved)}
            onMarkClean={markSellProjectClean}
            onMarkDirty={markSellProjectDirty}
          />
        );
      case 'Milestones':
        return <MilestoneVerification />;
      case 'Projects':
        return <OpsProjectsTab />;
      case 'Communication':
        return <Communication />;
      case 'Super Support':
        return <SuperSupport />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="min-h-screen relative">
        {/* 3D background is now global in App.tsx */}
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="relative mt-[58px] p-6">
          <ErrorBoundary section={activeTab}>
            <PageTransition pageKey={activeTab} variant="wave">
              {renderContent()}
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
