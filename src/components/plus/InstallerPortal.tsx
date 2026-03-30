import { useState, useRef } from 'react';
import { useProjectStore } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { MILESTONE_NAMES } from '@/data/mockData';
import { Zap, TrendingUp, Clock, CheckCircle, DollarSign, Wrench, Star, ChevronDown, ChevronRight, AlertTriangle, Timer, Trophy, Truck, Send, Shield, FileText, Flag, User, MapPin, Phone, Mail, Battery, Sun, Info, X, Upload, ClipboardCheck } from 'lucide-react';

const INSTALLER_MILESTONES = [
  { name: 'SOW Confirmed', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 20 },
  { name: 'Utility Inspection', percent: 20 },
  { name: 'PTO Granted', percent: 10 },
];

const TICKETS = [
  { id: 'TK-001', projectId: 'ASP-2030', customerName: 'Angela Davis', issue: 'Roof repair required before install — northeast section has water damage and structural sagging near chimney.', status: 'open', priority: 'high', daysOpen: 3, flaggedBy: 'Marcus R.' },
  { id: 'TK-002', projectId: 'ASP-2026', customerName: 'Patricia Williams', issue: 'HOA approval pending — shingle color variance detected during install prep.', status: 'in_progress', priority: 'medium', daysOpen: 5, flaggedBy: 'Jordan K.' },
  { id: 'TK-003', projectId: 'ASP-2024', customerName: 'James Hernandez', issue: 'Interconnection document missing utility signature.', status: 'resolved', priority: 'low', daysOpen: 1, flaggedBy: 'Caitlin F.' },
];

const PAYMENT_DETAILS = [
  { approvedDate: '2026-03-15', receivedDate: '2026-03-18', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-03-10', receivedDate: '2026-03-13', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-03-05', receivedDate: '2026-03-08', approvedBy: 'Caitlin Frost (Ops Specialist)' },
  { approvedDate: '2026-02-28', receivedDate: '2026-03-02', approvedBy: 'Marcus Reeves (Ops Manager)' },
  { approvedDate: '2026-02-20', receivedDate: '2026-02-23', approvedBy: 'Jordan Kim (Ops Lead)' },
  { approvedDate: '2026-02-15', receivedDate: '2026-02-18', approvedBy: 'Caitlin Frost (Ops Specialist)' },
];

const InstallerPortal = () => {
  const store = useProjectStore();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'payments' | 'tickets' | 'milestones'>('overview');
  const [hoveredMilestone, setHoveredMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [expandedMilestoneAction, setExpandedMilestoneAction] = useState<{ projectId: string; idx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ projectId: string; itemId: string } | null>(null);

  const installerName = 'SunTech Installations';
  const installerProjects = store.projects.filter(p => p.installerName === installerName || p.installerName === 'Pro Solar TX');
  const completedCount = installerProjects.filter(p => p.currentMilestone >= 5).length;
  const activeCount = installerProjects.filter(p => p.status !== 'completed').length;
  const avgDaysToPTO = 24;
  const onTimeRate = 87;
  const totalInstallValue = installerProjects.reduce((s, p) => s + p.projectCost, 0);
  const speedBonusEarned = installerProjects.filter(p => p.currentMilestone >= 6).length * (totalInstallValue / Math.max(installerProjects.length, 1) * 0.05);

  const tierLevel = completedCount >= 15 ? 3 : completedCount >= 5 ? 2 : 1;
  const tierNames = ['Entry', 'Proven', 'Premier'];
  const tierColors = ['text-muted-foreground', 'text-[hsl(var(--blue))]', 'text-[hsl(var(--yellow))]'];

  const selectedProjectData = selectedProject ? installerProjects.find(p => p.id === selectedProject) : null;

  // Count pending actions for installer across all projects
  const pendingActions = installerProjects.reduce((count, p) => {
    const sop = MILESTONE_SOPS[p.currentMilestone];
    if (!sop) return count;
    const ms = store.getMilestoneState(p.id);
    return count + sop.checklist.filter(c => c.actor === 'installer' && !ms.checklistDone[c.id]).length;
  }, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUpload || !e.target.files?.length) return;
    store.uploadFile(pendingUpload.projectId, pendingUpload.itemId, e.target.files[0].name);
    setPendingUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (projectId: string, itemId: string) => {
    setPendingUpload({ projectId, itemId });
    fileInputRef.current?.click();
  };

  const renderMilestoneTooltip = (project: typeof installerProjects[0], idx: number) => {
    const milestone = project.milestoneDetails[idx];
    if (!milestone) return null;
    const isPassed = idx < project.currentMilestone;
    return (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card border border-border rounded-xl p-3 shadow-lg z-50 pointer-events-none">
        <div className="text-xs font-extrabold text-card-foreground mb-1">{milestone.name}</div>
        {isPassed ? (
          <div className="text-[10px] text-[hsl(var(--green))] font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</div>
        ) : (
          <div className="text-[10px] text-[hsl(var(--yellow))] font-bold">Pending</div>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
      </div>
    );
  };

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
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Milestone Actions section for installer
  const renderMilestoneActions = () => {
    const projectsNeedingAction = installerProjects.filter(p => {
      const sop = MILESTONE_SOPS[p.currentMilestone];
      if (!sop) return false;
      const ms = store.getMilestoneState(p.id);
      return sop.checklist.some(c => c.actor === 'installer' && !ms.checklistDone[c.id]);
    });

    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-card-foreground mb-1 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Your Action Items
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Complete these items to advance milestones. Backend Ops will verify and approve.</p>

          {projectsNeedingAction.length === 0 && (
            <div className="text-center py-8">
              <span className="text-3xl">✅</span>
              <p className="text-xs text-muted-foreground mt-2">No pending action items — all caught up!</p>
            </div>
          )}

          {projectsNeedingAction.map(p => {
            const sop = MILESTONE_SOPS[p.currentMilestone];
            if (!sop) return null;
            const ms = store.getMilestoneState(p.id);
            const installerItems = sop.checklist.filter(c => c.actor === 'installer');
            const isExp = expandedMilestoneAction?.projectId === p.id && expandedMilestoneAction?.idx === p.currentMilestone;

            return (
              <div key={p.id} className="bg-muted rounded-xl border border-border overflow-hidden mb-3">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/80"
                  onClick={() => setExpandedMilestoneAction(isExp ? null : { projectId: p.id, idx: p.currentMilestone })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--yellow))]/15 flex items-center justify-center text-xs font-extrabold text-[hsl(var(--yellow))]">
                      M{p.currentMilestone + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.id} · {sop.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] rounded text-[9px] font-bold">
                      {installerItems.filter(c => !ms.checklistDone[c.id]).length} remaining
                    </span>
                    {isExp ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {installerItems.map(item => {
                      const isDone = ms.checklistDone[item.id];
                      const uploads = ms.uploads[item.id] || [];
                      const dateEntry = ms.dateEntries[item.id];

                      return (
                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isDone ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-card border-border'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-muted'}`}>
                            {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-card-foreground">{item.label}</div>
                            {item.requiresUpload && !isDone && (
                              <button
                                onClick={() => triggerUpload(p.id, item.id)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/25 rounded-md text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                              >
                                <Upload className="w-3.5 h-3.5" /> {item.uploadLabel || 'Upload File'}
                              </button>
                            )}
                            {item.requiresUpload && uploads.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {uploads.map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--green))]">
                                    <FileText className="w-3 h-3" /> {f}
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.requiresDate && !isDone && (
                              <input
                                type="date"
                                onChange={(e) => store.setDateEntry(p.id, item.id, e.target.value)}
                                className="mt-2 px-2.5 py-1.5 bg-card border border-border rounded text-xs text-card-foreground outline-none focus:border-primary"
                              />
                            )}
                            {item.requiresDate && dateEntry && (
                              <div className="mt-1 text-[10px] text-[hsl(var(--green))] font-bold">📅 {dateEntry}</div>
                            )}
                            {!item.requiresUpload && !item.requiresDate && !isDone && (
                              <button
                                onClick={() => store.toggleChecklist(p.id, item.id, true)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-[hsl(var(--green))]/10 border border-[hsl(var(--green))]/25 rounded-md text-xs font-bold text-[hsl(var(--green))] hover:bg-[hsl(var(--green))]/20 transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All Projects Milestone View */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" /> All Project Milestones
          </div>
          {installerProjects.map(p => {
            const ms = store.getMilestoneState(p.id);
            return (
              <div key={p.id} className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                  <div className="text-[10px] text-muted-foreground">{p.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  {MILESTONE_SOPS.map((sop, i) => {
                    const fundSt = ms.fundStatus[i] || 'none';
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                          i < p.currentMilestone
                            ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                              'bg-primary text-primary-foreground'
                            : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                            'bg-muted text-muted-foreground'
                        }`}
                      >
                        M{i + 1}
                      </div>
                    );
                  })}
                  <span className="text-xs font-bold text-[hsl(var(--green))] ml-2">${Math.round(p.projectCost).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Projects', value: activeCount.toString(), icon: Wrench, color: 'text-primary' },
                { label: 'Avg Days to PTO', value: `${avgDaysToPTO}d`, icon: Timer, color: 'text-[hsl(var(--blue))]' },
                { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: TrendingUp, color: 'text-primary' },
                { label: 'Pending Actions', value: pendingActions.toString(), icon: AlertTriangle, color: pendingActions > 0 ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--green))]' },
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

            {/* Pending Actions Alert */}
            {pendingActions > 0 && (
              <div className="bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[hsl(var(--yellow))]" />
                    <div>
                      <div className="text-sm font-bold text-card-foreground">You have {pendingActions} pending milestone action(s)</div>
                      <div className="text-xs text-muted-foreground">Complete these to keep projects moving forward.</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveSection('milestones')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
                    View Actions →
                  </button>
                </div>
              </div>
            )}

            {/* Speed Bonus & Tier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[hsl(var(--yellow))]" />
                  <h3 className="text-sm font-extrabold text-card-foreground">35-Day Speed Bonus</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">+5% on every project that hits PTO within 35 days of permit approval.</p>
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
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Current Benefits</div>
                  {tierLevel === 1 && ['5-7 day payment release', 'Standard deal allocation', 'Speed bonus eligible'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> {p}</div>
                  ))}
                  {tierLevel === 2 && ['2-4 day payment release', 'Priority deal queue', 'Dedicated ASP ops contact'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--blue))]"><CheckCircle className="w-3 h-3" /> {p}</div>
                  ))}
                  {tierLevel === 3 && ['1-2 day payment release', 'Guaranteed volume', 'Speed bonus + 2%'].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--yellow))]"><Star className="w-3 h-3" /> {p}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Active Projects</h3>
                <button onClick={() => setActiveSection('projects')} className="text-xs text-primary font-bold hover:underline">View All</button>
              </div>
              {installerProjects.filter(p => p.status === 'active' || p.status === 'delayed').slice(0, 5).map(p => (
                <div key={p.id} className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedProject(p.id)}>
                  <div>
                    <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id} · {p.systemSize}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {MILESTONE_SOPS.map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                          i < p.currentMilestone ? 'bg-primary text-primary-foreground' : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' : 'bg-muted text-muted-foreground'
                        }`}>M{i + 1}</div>
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

      case 'milestones':
        return renderMilestoneActions();

      case 'projects':
        return (
          <div className="space-y-3">
            {installerProjects.map(p => {
              const isExpanded = expandedProject === p.id;
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-[hsl(var(--green))]">${p.contractValue.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{p.systemSize}</div>
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
                      <div className="grid grid-cols-2 gap-3">
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
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted rounded-xl p-3"><div className="text-[10px] text-muted-foreground">System</div><div className="text-xs font-black text-card-foreground">{p.systemSize}</div></div>
                        <div className="bg-muted rounded-xl p-3"><div className="text-[10px] text-muted-foreground">Battery</div><div className="text-xs font-black text-card-foreground">{p.battery}</div></div>
                        <div className="bg-muted rounded-xl p-3"><div className="text-[10px] text-muted-foreground">Inverter</div><div className="text-xs font-black text-card-foreground">Enphase IQ8+</div></div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Milestone Payments</h4>
                        <div className="grid grid-cols-7 gap-2">
                          {INSTALLER_MILESTONES.map((m, i) => {
                            const amount = Math.round(p.projectCost * (m.percent / 100));
                            const isPassed = i < p.currentMilestone;
                            return (
                              <div key={i} className={`rounded-xl p-3 text-center border ${isPassed ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'}`}>
                                <div className={`text-xs font-extrabold ${isPassed ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                                <div className={`text-sm font-black ${isPassed ? 'text-[hsl(var(--green))]' : 'text-card-foreground'}`}>${(amount / 1000).toFixed(1)}K</div>
                                <div className="text-[9px] text-muted-foreground">{m.percent}%</div>
                                {isPassed && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-1" />}
                              </div>
                            );
                          })}
                          <div className="rounded-xl p-3 text-center border bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20">
                            <div className="text-xs font-extrabold text-[hsl(var(--yellow))]">M7</div>
                            <div className="text-xs font-black text-[hsl(var(--yellow))]">+5%</div>
                            <div className="text-[8px] text-muted-foreground">Speed</div>
                          </div>
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
                  project: p, milestone: m, idx: i, amount: Math.round(p.projectCost * (m.percent / 100)),
                }))
              ).sort((a, b) => b.amount - a.amount).slice(0, 12).map((item, i) => {
                const details = PAYMENT_DETAILS[i % PAYMENT_DETAILS.length];
                const isExpanded = expandedPayment === i;
                return (
                  <div key={i} className="border-b border-border">
                    <div onClick={() => setExpandedPayment(isExpanded ? null : i)} className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--green))]/10 flex items-center justify-center text-xs font-extrabold text-[hsl(var(--green))]">M{item.idx + 1}</div>
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
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Approved On</span><span className="text-xs font-bold text-card-foreground">{details.approvedDate}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Payment Received</span><span className="text-xs font-bold text-[hsl(var(--green))]">{details.receivedDate}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Approved By</span><span className="text-xs font-bold text-card-foreground">{details.approvedBy}</span></div>
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
                          'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25'
                        }`}>{t.priority}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${t.status === 'resolved' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-card-foreground mb-2">
                      <Flag className="w-3 h-3 text-[hsl(var(--red))] inline mr-1" />
                      Account for <span className="text-primary">{t.customerName}</span> has been flagged by ASP Pro+ Team for the following reasons:
                    </div>
                    <div className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3">{t.issue}</div>
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      <div className="flex gap-1.5">
        {([
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'milestones', label: 'Milestones', icon: ClipboardCheck },
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
            {s.key === 'milestones' && pendingActions > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[hsl(var(--yellow))] text-black rounded-full text-[8px] font-extrabold">{pendingActions}</span>
            )}
          </button>
        ))}
      </div>

      {renderSection()}
      {selectedProjectData && renderProjectDetail()}
    </div>
  );
};

export default InstallerPortal;
