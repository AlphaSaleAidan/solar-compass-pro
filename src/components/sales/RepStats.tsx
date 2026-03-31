import { useState } from 'react';
import { DollarSign, BarChart3, Wrench, Calendar, Star, Flame, TrendingUp, XCircle, CheckCircle, UserX, ChevronDown, ChevronUp, MapPin, Phone, Mail, Camera, FileText } from 'lucide-react';
import { useProjectStore } from '@/contexts/ProjectStore';
import { UPFRONT_MILESTONES } from '@/data/mockData';

const RepStats = () => {
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);
  const { projects, sellProjects } = useProjectStore();

  // Compute real stats from project data
  const completedProjects = projects.filter(p => p.status === 'completed' || p.currentMilestone >= 5);
  const activeProjects = projects.filter(p => p.status === 'active');
  
  const totalPaidOut = completedProjects.reduce((sum, p) => {
    const watts = parseFloat(p.systemSize) * 1000;
    const commission = (watts * p.soldPPW - watts * 2.35 - p.adders.reduce((s, a) => s + a.cost, 0)) * 0.6;
    return sum + Math.max(0, commission);
  }, 0);

  const pendingPipeline = activeProjects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
  const installCount = completedProjects.length;

  const creditPassedCount = sellProjects.filter(p => p.creditStatus === 'credit_passed').length;
  const creditFailCount = sellProjects.filter(p => p.creditStatus === 'credit_fail').length;
  const totalDeals = sellProjects.length;
  const creditPassedPct = totalDeals > 0 ? Math.round((creditPassedCount / totalDeals) * 100) : 0;
  const creditFailPct = totalDeals > 0 ? Math.round((creditFailCount / totalDeals) * 100) : 0;
  const nonClosedCount = sellProjects.filter(p => p.creditStatus === 'new').length;
  const nonClosedPct = totalDeals > 0 ? Math.round((nonClosedCount / totalDeals) * 100) : 0;
  const closingPct = totalDeals > 0 ? Math.round(((creditPassedCount + creditFailCount) / totalDeals) * 100) : 0;

  // Deal streak - count consecutive days with deals (simplified: based on recent projects)
  const streak = 0; // Will be computed from real activity data

  const stats = [
    { label: 'Yearly Paid Out', value: `$${Math.round(totalPaidOut).toLocaleString()}`, icon: DollarSign, color: 'text-asp-green' },
    { label: 'Pending Pipeline', value: `$${Math.round(pendingPipeline).toLocaleString()}`, icon: BarChart3, color: 'text-primary' },
    { label: 'Installs', value: installCount.toString(), icon: Wrench, color: 'text-asp-yellow' },
  ];

  const streakStages = [
    { label: '+50% Tickets', threshold: 1, boost: '50%' },
    { label: '+100% Tickets', threshold: 2, boost: '100%' },
    { label: '+200% Tickets', threshold: 3, boost: '200%' },
  ];
  const activeStage = streak >= 3 ? 2 : streak >= 2 ? 1 : streak >= 1 ? 0 : -1;

  return (
    <div className="space-y-3 animate-fade-in-up stagger-1">
      {/* Streak Bar */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <Flame className="w-7 h-7 text-asp-blue" fill="hsl(var(--blue))" />
            <span className="absolute -top-1 -right-2 text-xs font-black text-white bg-asp-blue rounded-full w-5 h-5 flex items-center justify-center">{streak}</span>
          </div>
          <div>
            <div className="text-sm font-black text-foreground">Deal Streak</div>
            <div className="text-[10px] text-muted-foreground">Sell every day to keep your streak!</div>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          {streakStages.map((stage, i) => (
            <div key={i} className="flex-1 relative">
              <div className={`h-3 rounded-full transition-all duration-500 ${
                i <= activeStage
                  ? 'bg-gradient-to-r from-asp-blue to-primary shadow-[0_0_10px_hsl(var(--blue)/0.4)]'
                  : 'bg-bg4'
              }`} />
              <div className={`text-[9px] font-bold mt-1 text-center ${i <= activeStage ? 'text-asp-blue' : 'text-muted-foreground'}`}>
                {stage.label}
              </div>
              <div className={`text-[8px] text-center ${i <= activeStage ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {stage.threshold}+ day{stage.threshold > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      {stats.map((s) => (
        <div key={s.label} className="bg-bg2 border border-border rounded-xl p-4 flex items-center gap-3">
          <s.icon className={`w-5 h-5 ${s.color}`} />
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        </div>
      ))}

      {/* Monthly Stats */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Platform Overview</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-foreground">{totalDeals}</span>
          <span className="text-xs text-muted-foreground">total projects</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Pipeline Projects:</span>
          <span className="text-sm font-bold text-primary">{projects.length}</span>
        </div>
      </div>

      {/* No appointments section - will be populated from real data */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase">Next Appointments Today</div>
        </div>
        <div className="text-xs text-muted-foreground text-center py-2">No appointments scheduled</div>
      </div>

      {/* Closing Metrics */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Performance Metrics</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-black text-primary">{closingPct}%</div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Closing %</div>
            <div className="text-[8px] text-muted-foreground">Sit-to-Close (CF = close)</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-asp-green" />
              <span className="text-lg font-black text-asp-green">{creditPassedPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Credit Passed</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-asp-red" />
              <span className="text-lg font-black text-asp-red">{creditFailPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Credit Fails</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <UserX className="w-3.5 h-3.5 text-asp-blue" />
              <span className="text-lg font-black text-asp-blue">{nonClosedPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">New / Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepStats;
