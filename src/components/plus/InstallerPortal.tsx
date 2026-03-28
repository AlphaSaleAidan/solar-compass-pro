import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES, UPFRONT_MILESTONES } from '@/data/mockData';
import { Zap, TrendingUp, Clock, CheckCircle, DollarSign, Wrench, Star, ChevronDown, ChevronRight, AlertTriangle, Timer, Trophy, Truck, Send, Shield, FileText } from 'lucide-react';

const INSTALLER_MILESTONES = [
  { name: 'Contract + Survey', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 30 },
  { name: 'Utility Inspection', percent: 10 },
  { name: 'PTO Granted', percent: 10 },
];

const TICKETS = [
  { id: 'TK-001', projectId: 'ASP-2030', issue: 'Roof repair required before install', status: 'open', priority: 'high', daysOpen: 3 },
  { id: 'TK-002', projectId: 'ASP-2026', issue: 'HOA approval pending — shingle color variance', status: 'in_progress', priority: 'medium', daysOpen: 5 },
  { id: 'TK-003', projectId: 'ASP-2024', issue: 'Interconnection document missing utility signature', status: 'resolved', priority: 'low', daysOpen: 1 },
];

const InstallerPortal = () => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'payments' | 'tickets' | 'tiers'>('overview');

  const installerProjects = PROJECTS.filter(p => p.installerName === 'SunTech Installations' || p.installerName === 'Pro Solar TX');
  const totalInstallValue = installerProjects.reduce((s, p) => s + p.projectCost, 0);
  const completedCount = installerProjects.filter(p => p.currentMilestone >= 5).length;
  const activeCount = installerProjects.filter(p => p.status === 'active' && p.currentMilestone < 5).length;
  const avgDaysToPTO = 24;
  const onTimeRate = 87;
  const speedBonusEarned = installerProjects.filter(p => p.currentMilestone >= 6).length * (totalInstallValue / installerProjects.length * 0.05);

  // Loyalty tier calculation
  const tierLevel = completedCount >= 15 ? 3 : completedCount >= 5 ? 2 : 1;
  const tierNames = ['Entry', 'Proven', 'Premier'];
  const tierColors = ['text-muted-foreground', 'text-[hsl(var(--blue))]', 'text-[hsl(var(--yellow))]'];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Projects', value: activeCount.toString(), icon: Wrench, color: 'text-primary' },
                { label: 'Total Install Value', value: `$${(totalInstallValue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-[hsl(var(--green))]' },
                { label: 'Avg Days to PTO', value: `${avgDaysToPTO}d`, icon: Timer, color: 'text-[hsl(var(--blue))]' },
                { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: TrendingUp, color: 'text-primary' },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Speed Bonus & Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[hsl(var(--yellow))]" />
                  <h3 className="text-sm font-extrabold text-card-foreground">26-Day Speed Bonus</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">+5% on every project that hits PTO within 26 days of signing.</p>
                <div className="space-y-2">
                  {[
                    { size: '$25K install', bonus: '$1,250' },
                    { size: '$35K install', bonus: '$1,750' },
                    { size: '$45K install', bonus: '$2,250' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted rounded-xl">
                      <span className="text-xs text-muted-foreground">{b.size}</span>
                      <span className="text-sm font-bold text-[hsl(var(--yellow))]">{b.bonus}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Speed Bonus Earned (YTD)</span>
                  <span className="text-lg font-black text-[hsl(var(--green))]">${Math.round(speedBonusEarned).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-[hsl(var(--yellow))]" />
                  <h3 className="text-sm font-extrabold text-card-foreground">Loyalty Tier</h3>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`text-3xl font-black ${tierColors[tierLevel - 1]}`}>Tier {tierLevel}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                    tierLevel === 3 ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                    tierLevel === 2 ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))] border-[hsl(var(--blue))]/25' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    {tierNames[tierLevel - 1]}
                  </span>
                </div>
                <div className="space-y-2">
                  {(tierLevel >= 1 ? ['2-4 day payment release', 'Standard deal allocation', 'Speed bonus eligible'] : []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> {p}
                    </div>
                  ))}
                  {(tierLevel >= 2 ? ['Priority deal queue', 'Dedicated ASP ops contact', 'GoNano bundle access'] : []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--blue))]">
                      <CheckCircle className="w-3 h-3" /> {p}
                    </div>
                  ))}
                  {(tierLevel >= 3 ? ['1-2 day payment release', 'Guaranteed volume commits', 'Speed bonus + 2%'] : []).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--yellow))]">
                      <Star className="w-3 h-3" /> {p}
                    </div>
                  ))}
                </div>
                {tierLevel < 3 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">
                      Next tier: {tierLevel === 1 ? '5 projects + 80% on-time' : '15 projects + 95% on-time'}
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tierLevel === 1 ? (completedCount / 5) * 100 : (completedCount / 15) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> Active Projects
                </h3>
                <button onClick={() => setActiveSection('projects')} className="text-xs text-primary font-bold hover:underline">View All</button>
              </div>
              {installerProjects.filter(p => p.status === 'active').slice(0, 3).map(p => (
                <div key={p.id} className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id} · {p.systemSize} + {p.battery}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                          i < p.currentMilestone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>M{i + 1}</div>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[hsl(var(--green))]">${Math.round(p.projectCost).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-3">
            {installerProjects.map(p => {
              const isExpanded = expandedProject === p.id;
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      <button className="text-muted-foreground">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-[hsl(var(--green))]">${p.projectCost.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{p.systemSize} + {p.battery}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        p.status === 'active' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25' :
                        p.status === 'delayed' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                        'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4">
                      {/* Milestone Payment Breakdown */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Milestone Payments</h4>
                        <div className="grid grid-cols-6 gap-2">
                          {INSTALLER_MILESTONES.map((m, i) => {
                            const amount = Math.round(p.projectCost * (m.percent / 100));
                            const isPassed = i < p.currentMilestone;
                            return (
                              <div key={i} className={`rounded-xl p-3 text-center border ${
                                isPassed ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'
                              }`}>
                                <div className={`text-xs font-extrabold mb-0.5 ${isPassed ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                                <div className={`text-sm font-black ${isPassed ? 'text-[hsl(var(--green))]' : 'text-card-foreground'}`}>${amount.toLocaleString()}</div>
                                <div className="text-[9px] text-muted-foreground">{m.percent}%</div>
                                <div className="text-[9px] text-muted-foreground mt-1 truncate">{m.name}</div>
                                {isPassed && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-1" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Project Info */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-0.5">Rep</div>
                          <div className="text-xs font-bold text-card-foreground">{p.repName}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-0.5">Permit</div>
                          <div className="text-xs font-bold text-card-foreground capitalize">{p.permitStatus}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-0.5">Roof</div>
                          <div className={`text-xs font-bold ${p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : p.roofCondition === 'minor_damage' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`}>
                            {p.roofCondition.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      {/* Contact Info */}
                      <div className="flex gap-3">
                        <div className="text-[10px] text-muted-foreground">
                          Customer: <span className="text-card-foreground font-bold">{p.customerName}</span> · {p.phone} · {p.email}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">Total Earned</div>
                <div className="text-2xl font-black text-[hsl(var(--green))]">${Math.round(totalInstallValue * 0.7).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">Pending Release</div>
                <div className="text-2xl font-black text-[hsl(var(--yellow))]">${Math.round(totalInstallValue * 0.2).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">Speed Bonuses</div>
                <div className="text-2xl font-black text-primary">${Math.round(speedBonusEarned).toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[hsl(var(--green))]" /> Payment History
              </div>
              {installerProjects.flatMap(p =>
                INSTALLER_MILESTONES.filter((_, i) => i < p.currentMilestone).map((m, i) => ({
                  project: p,
                  milestone: m,
                  idx: i,
                  amount: Math.round(p.projectCost * (m.percent / 100)),
                }))
              ).sort((a, b) => b.amount - a.amount).slice(0, 12).map((item, i) => (
                <div key={i} className="px-5 py-3 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--green))]/10 flex items-center justify-center text-xs font-extrabold text-[hsl(var(--green))]">
                      M{item.idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{item.project.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{item.project.id} · {item.milestone.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[hsl(var(--green))]">+${item.amount.toLocaleString()}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--green))]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tickets':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--yellow))]" /> Active Tickets
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Every open ticket blocks a milestone payment. Closing it fast pays everyone involved.</p>
              <div className="space-y-3">
                {TICKETS.map(t => (
                  <div key={t.id} className={`rounded-xl border p-4 ${
                    t.status === 'resolved' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' :
                    t.priority === 'high' ? 'bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20' :
                    'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-card-foreground">{t.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          t.priority === 'high' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                          t.priority === 'medium' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>{t.priority}</span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${
                        t.status === 'resolved' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'
                      }`}>
                        {t.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-card-foreground font-bold mb-1">{t.issue}</div>
                    <div className="text-[10px] text-muted-foreground">{t.projectId} · Open {t.daysOpen} day(s)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Section Nav */}
      <div className="flex gap-1.5">
        {([
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'projects', label: 'Projects', icon: Wrench },
          { key: 'payments', label: 'Payments', icon: DollarSign },
          { key: 'tickets', label: 'Tickets', icon: AlertTriangle },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === s.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-card-foreground hover:bg-muted/80'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {renderSection()}
    </div>
  );
};

export default InstallerPortal;
