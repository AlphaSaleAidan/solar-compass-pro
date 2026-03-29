import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES } from '@/data/mockData';
import { Shield, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, BarChart3, Lock, Zap, Target, ArrowDownRight, ArrowUpRight, X, User, MapPin, Phone, Mail, Flag } from 'lucide-react';

const ESCROW_MILESTONES = [
  { name: 'SOW Confirmed', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 20 },
  { name: 'Utility Inspection', percent: 20 },
  { name: 'PTO Granted', percent: 10 },
];

const DEFAULT_LAYERS = [
  { name: 'Utility Bill Verification', desc: 'Real savings confirmed before pipeline entry', active: true },
  { name: '80% True Offset Cap', desc: 'Undersized deals rejected at origination', active: true },
  { name: 'Installer Performance Scoring', desc: 'Only high-scoring network installers receive deals', active: true },
  { name: 'Milestone-Gated Payments', desc: 'No capital moves without ASP-verified completion', active: true },
  { name: 'Distributed Rep Commissions', desc: 'Reps invested through PTO — not just the close', active: true },
  { name: 'Ticket Resolution System', desc: 'Issues gate next milestone — 72hr resolution or escalation', active: true },
  { name: 'Battery-First Design', desc: '100% storage attachment improves satisfaction', active: true },
];

const ESCROW_PAYMENT_DETAILS = [
  { approvedDate: '2026-03-14', releasedDate: '2026-03-16', approvedBy: 'Marcus Reeves (Capital Ops)', notes: 'SOW verified — all documents confirmed' },
  { approvedDate: '2026-03-08', releasedDate: '2026-03-10', approvedBy: 'Jordan Kim (Fund Manager)', notes: 'Permit approved by jurisdiction — materials ordered' },
  { approvedDate: '2026-02-28', releasedDate: '2026-03-01', approvedBy: 'Caitlin Frost (Escrow Specialist)', notes: 'Install date locked — crew assigned' },
  { approvedDate: '2026-02-20', releasedDate: '2026-02-22', approvedBy: 'Marcus Reeves (Capital Ops)', notes: 'Install complete — inspection photos verified' },
  { approvedDate: '2026-02-12', releasedDate: '2026-02-14', approvedBy: 'Jordan Kim (Fund Manager)', notes: 'Utility meter inspection passed' },
  { approvedDate: '2026-02-05', releasedDate: '2026-02-07', approvedBy: 'Caitlin Frost (Escrow Specialist)', notes: 'PTO granted — system activated' },
  { approvedDate: '2026-01-28', releasedDate: '2026-01-30', approvedBy: 'Marcus Reeves (Capital Ops)', notes: 'Speed bonus qualified — under 26 days' },
  { approvedDate: '2026-01-20', releasedDate: '2026-01-22', approvedBy: 'Jordan Kim (Fund Manager)', notes: 'All milestone gates cleared' },
];

const RISK_FLAGS = [
  { id: 'RF-001', projectId: 'ASP-2030', customerName: 'Angela Davis', issue: 'Roof structural damage on northeast section — water damage and sagging near chimney detected during install prep. Capital release paused at M3 pending homeowner repair completion and structural engineer sign-off.', priority: 'high', daysOpen: 8, flaggedBy: 'Marcus Reeves (Capital Ops)' },
  { id: 'RF-002', projectId: 'ASP-2034', customerName: 'Deborah White', issue: 'Financing on hold — customer credit re-evaluation triggered after employment change reported. Escrow funds locked at M2 until updated income documentation is received and verified by underwriting.', priority: 'high', daysOpen: 12, flaggedBy: 'Jordan Kim (Fund Manager)' },
  { id: 'RF-003', projectId: 'ASP-2026', customerName: 'Patricia Williams', issue: 'HOA approval delay — panel placement variance requires written board approval. Capital deployment paused at M3. Next HOA board meeting scheduled April 2nd.', priority: 'medium', daysOpen: 5, flaggedBy: 'Caitlin Frost (Escrow Specialist)' },
];

const FinancierPortal = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'portfolio' | 'escrow' | 'risk'>('overview');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedEscrow, setExpandedEscrow] = useState<number | null>(null);

  const totalPortfolio = PROJECTS.reduce((s, p) => s + p.contractValue, 0);
  const totalFunded = PROJECTS.reduce((s, p) => s + Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones)), 0);
  const activeProjects = PROJECTS.filter(p => p.status !== 'completed').length;
  const defaultRate = 5.2;
  const previousDefaultRate = 18;
  const avgDaysToPTO = 24;
  const cancelRate = 7;

  const selectedProjectData = selectedProject ? PROJECTS.find(p => p.id === selectedProject) : null;

  const renderMilestoneTooltip = (project: typeof PROJECTS[0], idx: number) => {
    const milestone = project.milestoneDetails[idx];
    if (!milestone) return null;
    const isPassed = idx < project.currentMilestone;
    return (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card border border-border rounded-xl p-3 shadow-lg z-50 pointer-events-none">
        <div className="text-xs font-extrabold text-card-foreground mb-1">{milestone.name}</div>
        {isPassed ? (
          <>
            <div className="text-[10px] text-[hsl(var(--green))] font-bold flex items-center gap-1 mb-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </div>
            {milestone.completedDate && <div className="text-[10px] text-muted-foreground">Date: {milestone.completedDate}</div>}
            {milestone.completedBy && <div className="text-[10px] text-muted-foreground">Verified by: {milestone.completedBy}</div>}
          </>
        ) : (
          <>
            <div className="text-[10px] text-[hsl(var(--yellow))] font-bold mb-1">Pending — Requirements:</div>
            <ul className="space-y-0.5">
              {milestone.requirements.map((r, ri) => (
                <li key={ri} className="text-[9px] text-muted-foreground flex items-start gap-1">
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
      </div>
    );
  };

  const renderProjectDetail = () => {
    if (!selectedProjectData) return null;
    const p = selectedProjectData;
    const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
        <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-card-foreground">{p.customerName}</h2>
              <div className="text-xs text-muted-foreground">{p.id} · {p.stage}</div>
            </div>
            <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Customer Info */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: 'Name', value: p.customerName },
                  { icon: MapPin, label: 'Address', value: p.address },
                  { icon: Phone, label: 'Phone', value: p.phone },
                  { icon: Mail, label: 'Email', value: p.email },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-xl p-3">
                    <item.icon className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-bold text-card-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Financial Details */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Financial Details</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Contract Value', value: `$${p.contractValue.toLocaleString()}`, color: 'text-primary' },
                  { label: 'System Cost', value: `$${p.projectCost.toLocaleString()}`, color: 'text-card-foreground' },
                  { label: 'Interest Rate', value: `${p.interestRate}%`, color: 'text-primary' },
                  { label: 'Terms', value: p.loanTerms, color: 'text-card-foreground' },
                  { label: 'Capital Released', value: `$${funded.toLocaleString()}`, color: 'text-[hsl(var(--green))]' },
                  { label: 'In Escrow', value: `$${(p.contractValue - funded).toLocaleString()}`, color: 'text-[hsl(var(--yellow))]' },
                ].map((item, i) => (
                  <div key={i} className="bg-muted rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* System */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">System & Adders</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">System Size</div>
                  <div className="text-sm font-black text-card-foreground">{p.systemSize}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Battery</div>
                  <div className="text-sm font-black text-card-foreground">{p.battery}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Inverter</div>
                  <div className="text-sm font-black text-card-foreground">Enphase IQ8+</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {p.adders.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
                    <span className="text-sm font-bold text-card-foreground">{a.name}</span>
                    <span className="text-sm font-black text-[hsl(var(--green))]">${a.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Sales Rep & Installer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Sales Rep</h3>
                <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-card-foreground">{p.repName}</div>
                    <div className="text-[10px] text-muted-foreground">ASP Sales Rep</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Installer</h3>
                <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-card-foreground">{p.installerName}</div>
                    <div className="text-[10px] text-muted-foreground">Network Installer</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Escrow Progress */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Escrow Release Progress</h3>
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Capital Released</span>
                  <span className="text-sm font-black text-[hsl(var(--green))]">${funded.toLocaleString()}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${(funded / p.contractValue) * 100}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round((funded / p.contractValue) * 100)}% of ${p.contractValue.toLocaleString()}</div>
              </div>
            </div>
            {/* Milestones */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Milestone Progress</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {p.milestoneDetails.map((m, i) => {
                  const isPassed = i < p.currentMilestone;
                  return (
                    <div key={i} className={`rounded-xl p-2 text-center border ${isPassed ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'}`}>
                      <div className={`text-[10px] font-extrabold ${isPassed ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                      <div className="text-[8px] text-muted-foreground mt-0.5 truncate">{m.name}</div>
                      {isPassed && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Portfolio', value: `$${(totalPortfolio / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'text-primary', sub: `${PROJECTS.length} projects` },
                { label: 'Capital Deployed', value: `$${(totalFunded / 1000000).toFixed(2)}M`, icon: TrendingUp, color: 'text-[hsl(var(--green))]', sub: `${Math.round((totalFunded / totalPortfolio) * 100)}% deployed` },
                { label: 'Default Rate', value: `${defaultRate}%`, icon: Shield, color: 'text-[hsl(var(--green))]', sub: `↓ from ${previousDefaultRate}%` },
                { label: 'Avg Days to PTO', value: `${avgDaysToPTO}d`, icon: Clock, color: 'text-[hsl(var(--blue))]', sub: `Target: 26d` },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Before vs After */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> ASP Impact — Before vs After
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Default Rate', before: '18%', after: `${defaultRate}%`, improvement: `${Math.round(((previousDefaultRate - defaultRate) / previousDefaultRate) * 100)}%` },
                  { label: 'Days to PTO', before: '60d', after: `${avgDaysToPTO}d`, improvement: `${Math.round(((60 - avgDaysToPTO) / 60) * 100)}%` },
                  { label: 'Cancel Rate', before: '20%', after: `${cancelRate}%`, improvement: `${Math.round(((20 - cancelRate) / 20) * 100)}%` },
                ].map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-3">{m.label}</div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-lg font-bold text-[hsl(var(--red))]/60 line-through">{m.before}</div>
                      <ArrowDownRight className="w-4 h-4 text-[hsl(var(--green))]" />
                      <div className="text-lg font-black text-[hsl(var(--green))]">{m.after}</div>
                    </div>
                    <div className="text-xs font-bold text-[hsl(var(--green))] mt-2 flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {m.improvement} improvement
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Projects with hoverable milestones + clickable */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Portfolio Projects
                </h3>
                <button onClick={() => setActiveSection('portfolio')} className="text-xs text-primary font-bold hover:underline">View All</button>
              </div>
              {PROJECTS.filter(p => p.status !== 'completed').slice(0, 5).map(p => {
                const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
                return (
                  <div
                    key={p.id}
                    className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProject(p.id)}
                  >
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.id} · ${(p.contractValue / 1000).toFixed(1)}K · {p.loanTerms}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            className={`relative w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold cursor-default ${
                              i < p.currentMilestone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}
                            onMouseEnter={(e) => { e.stopPropagation(); setHoveredMilestone({ projectId: p.id, idx: i }); }}
                            onMouseLeave={() => setHoveredMilestone(null)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            M{i + 1}
                            {hoveredMilestone?.projectId === p.id && hoveredMilestone?.idx === i && renderMilestoneTooltip(p, i)}
                          </div>
                        ))}
                      </div>
                      <span className={`text-xs font-bold ${
                        p.status === 'active' ? 'text-[hsl(var(--green))]' : p.status === 'delayed' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'
                      }`}>{p.status}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escrow Summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Escrow Fund Status
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">In Escrow</div>
                  <div className="text-xl font-black text-[hsl(var(--yellow))]">${((totalPortfolio - totalFunded) / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">Released</div>
                  <div className="text-xl font-black text-[hsl(var(--green))]">${(totalFunded / 1000).toFixed(0)}K</div>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full transition-all" style={{ width: `${(totalFunded / totalPortfolio) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>{Math.round((totalFunded / totalPortfolio) * 100)}% deployed</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );

      case 'portfolio':
        return (
          <div className="space-y-3">
            {PROJECTS.map(p => {
              const isExpanded = expandedProject === p.id;
              const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
              const remaining = p.contractValue - funded;
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-px h-1.5">
                    {Array.from({ length: p.totalMilestones }).map((_, i) => (
                      <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.address.split(',').slice(-2).join(',')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                        <div className="text-[10px] text-muted-foreground">{p.loanTerms}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        p.status === 'active' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25' :
                        p.status === 'delayed' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                        p.status === 'on_hold' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                        'bg-primary/10 text-primary border-primary/25'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4">
                      {/* Customer + Rep Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <div className="text-[10px] text-muted-foreground">Customer</div>
                            <div className="text-xs font-bold text-card-foreground">{p.customerName}</div>
                            <div className="text-[10px] text-muted-foreground">{p.phone} · {p.email}</div>
                          </div>
                        </div>
                        <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <div className="text-[10px] text-muted-foreground">Installer</div>
                            <div className="text-xs font-bold text-card-foreground">{p.installerName}</div>
                            <div className="text-[10px] text-muted-foreground">Rep: {p.repName}</div>
                          </div>
                        </div>
                      </div>
                      {/* System Details */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">System</div>
                          <div className="text-xs font-black text-card-foreground">{p.systemSize} + {p.battery}</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">Adders</div>
                          <div className="text-xs font-black text-card-foreground">{p.adders.map(a => a.name).join(', ')}</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">Inverter</div>
                          <div className="text-xs font-black text-card-foreground">Enphase IQ8+</div>
                        </div>
                      </div>
                      {/* Escrow Release */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Escrow Release Schedule</h4>
                        <div className="grid grid-cols-7 gap-2">
                          {ESCROW_MILESTONES.map((m, i) => {
                            const amount = Math.round(p.contractValue * (m.percent / 100));
                            const released = i < p.currentMilestone;
                            return (
                              <div key={i} className={`rounded-xl p-3 text-center border ${released ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'}`}>
                                <div className={`text-xs font-extrabold ${released ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                                <div className={`text-xs font-black ${released ? 'text-[hsl(var(--green))]' : 'text-card-foreground'}`}>${(amount / 1000).toFixed(1)}K</div>
                                <div className="text-[8px] text-muted-foreground">{m.percent}%</div>
                                {released && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-1" />}
                              </div>
                            );
                          })}
                          <div className="rounded-xl p-3 text-center border bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20">
                            <div className="text-xs font-extrabold text-[hsl(var(--yellow))]">M7</div>
                            <div className="text-xs font-black text-[hsl(var(--yellow))]">+5%</div>
                            <div className="text-[8px] text-muted-foreground">Speed</div>
                            <Zap className="w-3 h-3 text-[hsl(var(--yellow))] mx-auto mt-1" />
                          </div>
                        </div>
                      </div>
                      {/* Financial */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Contract Value', value: `$${p.contractValue.toLocaleString()}` },
                          { label: 'System Cost', value: `$${p.projectCost.toLocaleString()}` },
                          { label: 'Interest Rate', value: `${p.interestRate}%` },
                          { label: 'Terms', value: p.loanTerms },
                        ].map((item, i) => (
                          <div key={i} className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">{item.label}</div>
                            <div className="text-sm font-black text-card-foreground">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Capital Status */}
                      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">Capital Released</span>
                          <span className="text-sm font-black text-[hsl(var(--green))]">${funded.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">In Escrow</span>
                          <span className="text-sm font-black text-[hsl(var(--yellow))]">${remaining.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${(funded / p.contractValue) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'escrow':
        return (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Milestone-Gated Capital Structure
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Funds held in ASP-managed escrow. 7 milestone gates — each requires documented ASP verification before release.</p>
              <div className="grid grid-cols-7 gap-3">
                {ESCROW_MILESTONES.map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center border border-border">
                    <div className="text-base font-black text-primary mb-1">M{i + 1}</div>
                    <div className="text-lg font-black text-card-foreground">{m.percent}%</div>
                    <div className="text-[9px] text-muted-foreground mt-1 leading-tight">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Project Escrow — clickable */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[hsl(var(--green))]" /> Escrow by Project
              </div>
              {PROJECTS.map((p, pi) => {
                const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
                const pct = Math.round((funded / p.contractValue) * 100);
                const isExpanded = expandedEscrow === pi;
                const details = ESCROW_PAYMENT_DETAILS[pi % ESCROW_PAYMENT_DETAILS.length];
                return (
                  <div key={p.id} className="border-b border-border">
                    <div
                      className="px-5 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedEscrow(isExpanded ? null : pi)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className="text-sm font-bold text-card-foreground">{p.customerName}</span>
                          <span className="text-[10px] text-muted-foreground">{p.id}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[hsl(var(--green))] font-bold">${funded.toLocaleString()} released</span>
                          <span className="text-xs text-muted-foreground">/ ${p.contractValue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <div className="bg-muted rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Last Approved On</span>
                            <span className="text-xs font-bold text-card-foreground">{details.approvedDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Funds Released</span>
                            <span className="text-xs font-bold text-[hsl(var(--green))]">{details.releasedDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Approved By</span>
                            <span className="text-xs font-bold text-card-foreground">{details.approvedBy}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Notes</span>
                            <span className="text-xs text-muted-foreground">{details.notes}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> 7-Layer Default Reduction Stack
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Active from origination. Target: 30% default reduction from day one.</p>
              <div className="space-y-3">
                {DEFAULT_LAYERS.map((layer, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 bg-muted rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-card-foreground">{layer.name}</div>
                      <div className="text-[10px] text-muted-foreground">{layer.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--green))]" />
                      <span className="text-[10px] font-bold text-[hsl(var(--green))]">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Flags — same style as installer tickets */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--red))]" /> Flagged Accounts
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Capital deployment paused on flagged projects until issues are resolved.</p>
              <div className="space-y-3">
                {RISK_FLAGS.map(t => (
                  <div key={t.id} className={`rounded-xl border p-4 ${
                    t.priority === 'high' ? 'bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20' :
                    'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flag className="w-3.5 h-3.5 text-[hsl(var(--red))]" />
                        <span className="text-xs font-extrabold text-card-foreground">{t.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                          t.priority === 'high' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                          'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25'
                        }`}>{t.priority}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[hsl(var(--yellow))] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Open {t.daysOpen} days
                      </span>
                    </div>
                    <div className="text-xs font-bold text-card-foreground mb-2 flex items-center gap-1.5">
                      <Flag className="w-3 h-3 text-[hsl(var(--red))]" />
                      Account for <span className="text-primary">{t.customerName}</span> has been flagged by ASP Pro+ Team for the following reasons:
                    </div>
                    <div className="text-sm text-card-foreground mb-2 bg-muted/50 rounded-lg p-3">{t.issue}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground">{t.projectId}</div>
                      <div className="text-[10px] text-muted-foreground">Flagged by: <span className="font-bold text-card-foreground">{t.flaggedBy}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Health */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Portfolio Health</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Active', count: PROJECTS.filter(p => p.status === 'active').length, color: 'bg-[hsl(var(--green))]' },
                    { label: 'Delayed', count: PROJECTS.filter(p => p.status === 'delayed').length, color: 'bg-[hsl(var(--yellow))]' },
                    { label: 'On Hold', count: PROJECTS.filter(p => p.status === 'on_hold').length, color: 'bg-[hsl(var(--red))]' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        <span className="text-xs text-card-foreground">{s.label}</span>
                      </div>
                      <span className="text-sm font-black text-card-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">At-Risk Projects</h4>
                <div className="space-y-3">
                  {PROJECTS.filter(p => p.status === 'delayed' || p.status === 'on_hold').map(p => (
                    <div key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors" onClick={() => setSelectedProject(p.id)}>
                      <AlertTriangle className={`w-3 h-3 ${p.status === 'delayed' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`} />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-card-foreground">{p.customerName}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{p.stage}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
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
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'portfolio', label: 'Portfolio', icon: DollarSign },
          { key: 'escrow', label: 'Escrow', icon: Lock },
          { key: 'risk', label: 'Risk Stack', icon: Shield },
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
      {selectedProjectData && renderProjectDetail()}
    </div>
  );
};

export default FinancierPortal;
