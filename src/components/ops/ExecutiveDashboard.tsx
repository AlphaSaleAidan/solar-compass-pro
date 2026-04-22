/**
 * Executive KPI Dashboard — real-time metrics for CEO/VP users.
 * Shows pipeline value, deal stages, milestone performance, QC rates, fund velocity.
 */
import { useMemo } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { calculateCommission } from '@/lib/commissionCalc';
import { inferState } from '@/lib/projectStateMachine';
import { STATE_META, HAPPY_PATH, type ProjectState } from '@/lib/projectStateMachine';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Clock, ShieldCheck, BarChart3, Users, Zap, AlertTriangle,
} from 'lucide-react';

const ExecutiveDashboard = () => {
  const { projects, sellProjects, milestoneStates, tickets } = useDataSource();

  const kpis = useMemo(() => {
    // Pipeline value
    const totalPipelineValue = projects.reduce((sum, p) => {
      const comm = calculateCommission(p);
      return sum + comm.totalDealValue;
    }, 0);

    // Average milestone position
    const avgMilestone = projects.length > 0
      ? projects.reduce((s, p) => s + (p.currentMilestone || 0), 0) / projects.length
      : 0;

    // QC stats
    const totalConverted = sellProjects.filter(p => p.convertedToSale).length;
    const totalApproved = sellProjects.filter(p => p.qcInitialApproved).length;
    const totalRejected = sellProjects.filter(p => p.approvalStatus === 'dirty' || p.approvalStatus === 'rejected' as any).length;
    const qcPassRate = totalConverted > 0 ? Math.round((totalApproved / totalConverted) * 100) : 0;

    // Fund release velocity — count released funds
    let fundsReleased = 0;
    let fundsPending = 0;
    Object.values(milestoneStates).forEach(ms => {
      Object.values(ms.fundStatus || {}).forEach(status => {
        if (status === 'released') fundsReleased++;
        else if (status === 'pending' || status === 'approved') fundsPending++;
      });
    });

    // Deal stages breakdown
    const stageBreakdown: Record<ProjectState, number> = {} as any;
    HAPPY_PATH.forEach(s => { stageBreakdown[s] = 0; });
    stageBreakdown['rejected'] = 0;
    sellProjects.forEach(sp => {
      const state = (sp.lifecycleState || inferState({
        firstName: sp.firstName,
        lastName: sp.lastName,
        creditStatus: sp.creditStatus === 'credit_passed' ? 'passed' : sp.creditStatus,
        auroraSynced: sp.auroraSynced,
        auroraData: sp.auroraData as Record<string, unknown> | null | undefined,
        convertedToSale: sp.convertedToSale,
        qcInitialApproved: sp.qcInitialApproved,
      })) as ProjectState;
      if (stageBreakdown[state] !== undefined) stageBreakdown[state]++;
    });

    // Open tickets
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

    return {
      totalPipelineValue,
      totalDeals: projects.length,
      totalLeads: sellProjects.length,
      avgMilestone,
      qcPassRate,
      totalApproved,
      totalRejected,
      fundsReleased,
      fundsPending,
      stageBreakdown,
      openTickets,
    };
  }, [projects, sellProjects, milestoneStates, tickets]);

  const statCards = [
    {
      label: 'Pipeline Value',
      value: `$${(kpis.totalPipelineValue / 1000).toFixed(0)}K`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-asp-green',
      bg: 'bg-asp-green/10',
    },
    {
      label: 'Active Deals',
      value: kpis.totalDeals.toString(),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Leads',
      value: kpis.totalLeads.toString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'QC Pass Rate',
      value: `${kpis.qcPassRate}%`,
      icon: <ShieldCheck className="w-5 h-5" />,
      color: kpis.qcPassRate >= 80 ? 'text-asp-green' : kpis.qcPassRate >= 60 ? 'text-asp-yellow' : 'text-asp-red',
      bg: kpis.qcPassRate >= 80 ? 'bg-asp-green/10' : kpis.qcPassRate >= 60 ? 'bg-asp-yellow/10' : 'bg-asp-red/10',
    },
    {
      label: 'Avg Milestone',
      value: `M${kpis.avgMilestone.toFixed(1)}`,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Funds Released',
      value: kpis.fundsReleased.toString(),
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Funds Pending',
      value: kpis.fundsPending.toString(),
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Open Tickets',
      value: kpis.openTickets.toString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      color: kpis.openTickets > 0 ? 'text-asp-red' : 'text-gray-500',
      bg: kpis.openTickets > 0 ? 'bg-asp-red/10' : 'bg-gray-500/10',
    },
  ];

  return (
    <div className="space-y-6 portal-section-enter">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-black text-white tracking-wide">Executive Dashboard</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-black/20 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{card.label}</span>
            </div>
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Stage Funnel */}
      <div className="bg-black/20 backdrop-blur-xl border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-4">Deal Stage Funnel</h3>
        <div className="space-y-2">
          {[...HAPPY_PATH, 'rejected' as ProjectState].map((state) => {
            const meta = STATE_META[state];
            const count = kpis.stageBreakdown[state] || 0;
            const maxCount = Math.max(...Object.values(kpis.stageBreakdown), 1);
            const pct = (count / maxCount) * 100;

            return (
              <div key={state} className="flex items-center gap-3">
                <span className={`text-[10px] font-bold tracking-wider uppercase w-20 ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ background: meta.glowColor.replace(/[\d.]+\)$/, '0.3)') }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/60">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
