import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import PageTransition from '@/components/shared/PageTransition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardSkeleton, PageLoadingSkeleton } from '@/components/shared/SkeletonLoader';

// Lazy-load heavy portal tabs — splits the 1.5MB bundle
const PuzzleGame = lazy(() => import('@/components/sales/PuzzleGame'));
const RepStats = lazy(() => import('@/components/sales/RepStats'));
const ShopSpin = lazy(() => import('@/components/sales/ShopSpin'));
const Pipeline = lazy(() => import('@/components/sales/Pipeline'));
const Commissions = lazy(() => import('@/components/sales/Commissions'));
const CalendarTab = lazy(() => import('@/components/sales/CalendarTab'));
const RankingsTab = lazy(() => import('@/components/sales/RankingsTab'));
const SellTab = lazy(() => import('@/components/sales/SellTab'));
const QCReview = lazy(() => import('@/components/ops/QCReview'));
const Communication = lazy(() => import('@/components/ops/Communication'));
const MilestoneVerification = lazy(() => import('@/components/ops/MilestoneVerification'));
const OpsProjectsTab = lazy(() => import('@/components/ops/OpsProjectsTab'));
const SuperSupport = lazy(() => import('@/components/ops/SuperSupport'));
const FinalApprovalQueue = lazy(() => import('@/components/ops/FinalApprovalQueue'));
const ExecutiveDashboard = lazy(() => import('@/components/ops/ExecutiveDashboard'));
const PlusPortal = lazy(() => import('@/components/plus/PlusPortal'));
const ActivityFeed = lazy(() => import('@/components/shared/ActivityFeed'));
const AdminPanel = lazy(() => import('@/components/admin/AdminPanel'));
// PortalAmbient3D removed — CinematicBackground is now global in App.tsx
import { useDataSource } from '@/contexts/DataSourceProvider';

const Dashboard = () => {
  const { user } = useAuth();
  const { sellProjects, markSellProjectClean, markSellProjectDirty, dataReady } = useDataSource();
  const isPlus = user?.portalMode === 'asp_plus';
  const isSalesRep = user?.role === 'sales_rep';
  const defaultTab = isPlus ? 'Projects' : isSalesRep ? 'Dashboard' : 'QC Review';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [convertedProjectData, setConvertedProjectData] = useState<{ name: string; email: string; phone: string; address: string } | null>(null);

  if (!user) return null;

  const handleConvertToProject = (data: { name: string; email: string; phone: string; address: string }) => {
    setConvertedProjectData(data);
    setActiveTab('Alpha');
  };

  const renderContent = () => {
    // Activity tab is shared across all portals
    if (activeTab === 'Activity') {
      return <ActivityFeed />;
    }
    // Admin tab — master + backend_ops only
    if (activeTab === 'Admin') {
      return <AdminPanel />;
    }

    if (isPlus) {
      if (activeTab === 'Portal') return <PlusPortal />;
      return <PlusPortal />;
    }

    if (isSalesRep) {
      switch (activeTab) {
        case 'Dashboard':
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-4 md:space-y-5">
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
        case 'Alpha':
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
        <main className="relative pt-[66px] px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6">
          {!dataReady ? (
            <DashboardSkeleton />
          ) : (
            <ErrorBoundary section={activeTab}>
              <Suspense fallback={<PageLoadingSkeleton label={`Loading ${activeTab}…`} />}>
                <PageTransition pageKey={activeTab} variant="wave">
                  {renderContent()}
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
