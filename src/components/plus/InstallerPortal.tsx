import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES } from '@/data/mockData';
import { Zap, TrendingUp, Clock, CheckCircle, DollarSign, Wrench, Star, ChevronDown, ChevronRight, AlertTriangle, Timer, Trophy, Truck, Send, Shield, FileText, Flag, User, MapPin, Phone, Mail, Battery, Sun, Info, X } from 'lucide-react';

const INSTALLER_MILESTONES = [
  { name: 'Contract + Survey', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 30 },
  { name: 'Utility Inspection', percent: 10 },
  { name: 'PTO Granted', percent: 10 },
];

const TICKETS = [
  { id: 'TK-001', projectId: 'ASP-2030', customerName: 'Angela Davis', issue: 'Roof repair required before install — northeast section has water damage and structural sagging near chimney. Installer unable to proceed until homeowner completes repairs. Structural engineer report needed before re-scheduling.', status: 'open', priority: 'high', daysOpen: 3, flaggedBy: 'Marcus R.' },
  { id: 'TK-002', projectId: 'ASP-2026', customerName: 'Patricia Williams', issue: 'HOA approval pending — shingle color variance detected during install prep. HOA requires written approval for panel placement on south-facing roof. Installer on hold awaiting HOA board meeting scheduled for April 2nd.', status: 'in_progress', priority: 'medium', daysOpen: 5, flaggedBy: 'Jordan K.' },
  { id: 'TK-003', projectId: 'ASP-2024', customerName: 'James Hernandez', issue: 'Interconnection document missing utility signature — net metering application was submitted but utility returned form due to missing customer wet signature on page 3. Re-submission required.', status: 'resolved', priority: 'low', daysOpen: 1, flaggedBy: 'Caitlin F.' },
];

const PAYMENT_DETAILS = [
  { approvedDate: '2026-03-15', receivedDate: '2026-03-18', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-03-10', receivedDate: '2026-03-13', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-03-05', receivedDate: '2026-03-08', approvedBy: 'Caitlin Frost (Ops Specialist)' },
  { approvedDate: '2026-02-28', receivedDate: '2026-03-02', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-02-20', receivedDate: '2026-02-23', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-02-15', receivedDate: '2026-02-18', approvedBy: 'Caitlin Frost (Ops Specialist)' },
  { approvedDate: '2026-02-10', receivedDate: '2026-02-13', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-02-05', receivedDate: '2026-02-08', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-01-28', receivedDate: '2026-01-31', approvedBy: 'Caitlin Frost (Ops Specialist)' },
  { approvedDate: '2026-01-20', receivedDate: '2026-01-23', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-01-15', receivedDate: '2026-01-18', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-01-10', receivedDate: '2026-01-13', approvedBy: 'Caitlin Frost (Ops Specialist)' },
];

const InstallerPortal = () => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'payments' | 'tickets'>('overview');
  const [hoveredMilestone, setHoveredMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

  const installerProjects = PROJECTS.filter(p => p.installerName === 'SunTech Installations' || p.installerName === 'Pro Solar TX');
  const completedCount = installerProjects.filter(p => p.currentMilestone >= 5).length;
  const activeCount = installerProjects.filter(p => p.status !== 'completed').length;
  const avgDaysToPTO = 24;
  const onTimeRate = 87;
  const totalInstallValue = installerProjects.reduce((s, p) => s + p.projectCost, 0);
  const speedBonusEarned = installerProjects.filter(p => p.currentMilestone >= 6).length * (totalInstallValue / installerProjects.length * 0.05);

  // Loyalty tier
  const tierLevel = completedCount >= 15 ? 3 : completedCount >= 5 ? 2 : 1;
  const tierNames = ['Entry', 'Proven', 'Premier'];
  const tierColors = ['text-muted-foreground', 'text-[hsl(var(--blue))]', 'text-[hsl(var(--yellow))]'];

  // Find selected project details
  const selectedProjectData = selectedProject ? installerProjects.find(p => p.id === selectedProject) : null;

  const renderMilestoneTooltip = (project: typeof installerProjects[0], idx: number) => {
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
            {milestone.completedDate && (
              <div className="text-[10px] text-muted-foreground">Date: {milestone.completedDate}</div>
            )}
            {milestone.completedBy && (
              <div className="text-[10px] text-muted-foreground">Verified by: {milestone.completedBy}</div>
            )}
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

  // Project detail modal
  const renderProjectDetail = () => {
    if (!selectedProjectData) return null;
    const p = selectedProjectData;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
        <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[55vh] overflow-y-auto m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
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
                <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                  <User className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted-foreground">Name</div>
                    <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted-foreground">Address</div>
                    <div className="text-sm font-bold text-card-foreground">{p.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted-foreground">Phone</div>
                    <div className="text-sm font-bold text-card-foreground">{p.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-[10px] text-muted-foreground">Email</div>
                    <div className="text-sm font-bold text-card-foreground">{p.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Details */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">System Details</h3>
              <div className="grid grid-cols-3 gap-3">
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
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Contract Value</div>
                  <div className="text-sm font-black text-[hsl(var(--green))]">${p.contractValue.toLocaleString()}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Project Cost</div>
                  <div className="text-sm font-black text-card-foreground">${p.projectCost.toLocaleString()}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">Terms</div>
                  <div className="text-sm font-black text-card-foreground">{p.loanTerms}</div>
                </div>
              </div>
            </div>

            {/* Project Adders */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Project Adders</h3>
              <div className="space-y-1.5">
                {p.adders.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
                    <span className="text-sm font-bold text-card-foreground">{a.name}</span>
                    <span className="text-sm font-black text-[hsl(var(--green))]">${a.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Rep */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Sales Rep</h3>
              <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-card-foreground">{p.repName}</div>
                  <div className="text-[10px] text-muted-foreground">Alpha Sale Pro Representative</div>
                </div>
              </div>
            </div>

            {/* Roof & Permit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Roof Condition</h3>
                <div className={`rounded-xl p-3 border ${
                  p.roofCondition === 'good' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' :
                  p.roofCondition === 'minor_damage' ? 'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20' :
                  'bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20'
                }`}>
                  <div className={`text-sm font-bold capitalize ${
                    p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : p.roofCondition === 'minor_damage' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'
                  }`}>{p.roofCondition.replace('_', ' ')}</div>
                  {p.roofIssues.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {p.roofIssues.map((issue, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground">• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Permit Status</h3>
                <div className={`rounded-xl p-3 border ${
                  p.permitStatus === 'approved' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' :
                  p.permitStatus === 'submitted' ? 'bg-[hsl(var(--blue))]/5 border-[hsl(var(--blue))]/20' :
                  'bg-muted border-border'
                }`}>
                  <div className={`text-sm font-bold capitalize ${
                    p.permitStatus === 'approved' ? 'text-[hsl(var(--green))]' : p.permitStatus === 'submitted' ? 'text-[hsl(var(--blue))]' : 'text-muted-foreground'
                  }`}>{p.permitStatus}</div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Milestone Progress</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {p.milestoneDetails.map((m, i) => {
                  const isPassed = i < p.currentMilestone;
                  return (
                    <div key={i} className={`rounded-xl p-2 text-center border ${
                      isPassed ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'
                    }`}>
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
            {/* Stats Grid - removed Total Install Value */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active Projects', value: activeCount.toString(), icon: Wrench, color: 'text-primary' },
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

                {/* Current tier perks */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Your Current Benefits</div>
                  {tierLevel === 1 && ['5-7 day payment release', 'Standard deal allocation', 'Speed bonus eligible'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> {p}
                    </div>
                  ))}
                  {tierLevel === 2 && ['2-4 day payment release', 'Priority deal queue', 'Dedicated ASP ops contact', 'GoNano bundle access'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--blue))]">
                      <CheckCircle className="w-3 h-3" /> {p}
                    </div>
                  ))}
                  {tierLevel === 3 && ['1-2 day payment release', 'Guaranteed volume commits', 'Speed bonus + 2%', 'VIP project priority'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--yellow))]">
                      <Star className="w-3 h-3" /> {p}
                    </div>
                  ))}
                </div>

                {/* How to reach next tiers */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">How to Advance</div>
                  {tierLevel < 2 && (
                    <div className="bg-[hsl(var(--blue))]/5 border border-[hsl(var(--blue))]/15 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3 h-3 text-[hsl(var(--blue))]" />
                        <span className="text-xs font-extrabold text-[hsl(var(--blue))]">Tier 2 — Proven</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Complete <span className="font-bold text-card-foreground">5 projects</span> with <span className="font-bold text-card-foreground">80%+ on-time rate</span></div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Unlock: 2-4 day payments, priority queue, dedicated ops contact</div>
                    </div>
                  )}
                  {tierLevel < 3 && (
                    <div className="bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/15 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="w-3 h-3 text-[hsl(var(--yellow))]" />
                        <span className="text-xs font-extrabold text-[hsl(var(--yellow))]">Tier 3 — Premier</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Complete <span className="font-bold text-card-foreground">15 projects</span> with <span className="font-bold text-card-foreground">95%+ on-time rate</span></div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Unlock: 1-2 day payments, guaranteed volume, speed bonus + 2%</div>
                    </div>
                  )}
                  {tierLevel < 3 && (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tierLevel === 1 ? (completedCount / 5) * 100 : (completedCount / 15) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Projects with hoverable milestones + clickable */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> Active Projects
                </h3>
                <button onClick={() => setActiveSection('projects')} className="text-xs text-primary font-bold hover:underline">View All</button>
              </div>
              {installerProjects.filter(p => p.status === 'active' || p.status === 'delayed').slice(0, 5).map(p => (
                <div
                  key={p.id}
                  className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedProject(p.id)}
                >
                  <div>
                    <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id} · {p.systemSize} + {p.battery}</div>
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
                    <span className="text-xs font-bold text-[hsl(var(--green))]">${Math.round(p.projectCost).toLocaleString()}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
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
                        <div className="text-sm font-black text-[hsl(var(--green))]">${p.contractValue.toLocaleString()}</div>
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
                    <div className="border-t border-border px-5 py-4 space-y-5">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Customer Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="text-[10px] text-muted-foreground">Name</div>
                              <div className="text-xs font-bold text-card-foreground">{p.customerName}</div>
                            </div>
                          </div>
                          <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="text-[10px] text-muted-foreground">Address</div>
                              <div className="text-xs font-bold text-card-foreground">{p.address}</div>
                            </div>
                          </div>
                          <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="text-[10px] text-muted-foreground">Phone</div>
                              <div className="text-xs font-bold text-card-foreground">{p.phone}</div>
                            </div>
                          </div>
                          <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="text-[10px] text-muted-foreground">Email</div>
                              <div className="text-xs font-bold text-card-foreground">{p.email}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Details */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">System Details</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">System Size</div>
                            <div className="text-xs font-black text-card-foreground">{p.systemSize}</div>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">Battery</div>
                            <div className="text-xs font-black text-card-foreground">{p.battery}</div>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">Inverter</div>
                            <div className="text-xs font-black text-card-foreground">Enphase IQ8+</div>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">Contract Value</div>
                            <div className="text-xs font-black text-[hsl(var(--green))]">${p.contractValue.toLocaleString()}</div>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">Project Cost</div>
                            <div className="text-xs font-black text-card-foreground">${p.projectCost.toLocaleString()}</div>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <div className="text-[10px] text-muted-foreground">Terms</div>
                            <div className="text-xs font-black text-card-foreground">{p.loanTerms}</div>
                          </div>
                        </div>
                      </div>

                      {/* Adders */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Project Adders</h4>
                        <div className="space-y-1.5">
                          {p.adders.map((a, i) => (
                            <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-4 py-2">
                              <span className="text-xs font-bold text-card-foreground">{a.name}</span>
                              <span className="text-xs font-black text-[hsl(var(--green))]">${a.cost.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sales Rep */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Sales Representative</h4>
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

                      {/* Roof & Permit */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">Roof</h4>
                          <div className={`text-xs font-bold capitalize ${p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : p.roofCondition === 'minor_damage' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`}>
                            {p.roofCondition.replace('_', ' ')}
                          </div>
                          {p.roofIssues.map((issue, i) => <div key={i} className="text-[10px] text-muted-foreground mt-0.5">• {issue}</div>)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">Permit</h4>
                          <div className={`text-xs font-bold capitalize ${p.permitStatus === 'approved' ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>{p.permitStatus}</div>
                        </div>
                      </div>

                      {/* Milestones */}
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
              ).sort((a, b) => b.amount - a.amount).slice(0, 12).map((item, i) => {
                const details = PAYMENT_DETAILS[i % PAYMENT_DETAILS.length];
                const isExpanded = expandedPayment === i;
                return (
                  <div key={i} className="border-b border-border">
                    <div
                      onClick={() => setExpandedPayment(isExpanded ? null : i)}
                      className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                    >
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
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-3 pt-0">
                        <div className="bg-muted rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Approved On</span>
                            <span className="text-xs font-bold text-card-foreground">{details.approvedDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Payment Received</span>
                            <span className="text-xs font-bold text-[hsl(var(--green))]">{details.receivedDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Approved By</span>
                            <span className="text-xs font-bold text-card-foreground">{details.approvedBy}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Notes</span>
                            <span className="text-xs text-muted-foreground">Milestone verified — all docs complete</span>
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

      case 'tickets':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--red))]" /> Flagged Accounts
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
                        <Flag className="w-3.5 h-3.5 text-[hsl(var(--red))]" />
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
                    <div className="text-xs font-bold text-card-foreground mb-2 flex items-center gap-1.5">
                      <Flag className="w-3 h-3 text-[hsl(var(--red))]" />
                      Account for <span className="text-primary">{t.customerName}</span> has been flagged by ASP Pro+ Team for the following reasons:
                    </div>
                    <div className="text-sm text-card-foreground mb-2 bg-muted/50 rounded-lg p-3">{t.issue}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground">{t.projectId} · Open {t.daysOpen} day(s)</div>
                      <div className="text-[10px] text-muted-foreground">Flagged by: <span className="font-bold text-card-foreground">{t.flaggedBy}</span></div>
                    </div>
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
          { key: 'tickets', label: 'Tickets', icon: Flag },
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

export default InstallerPortal;
