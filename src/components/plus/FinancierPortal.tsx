import { useState, useRef } from 'react';
import { useProjectStore } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { Shield, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, BarChart3, Lock, X, MapPin, Phone, Mail, Flag, FileText, Camera, ClipboardCheck, Calendar, ExternalLink, Download, MessageSquare, Eye, Zap, Send, Upload, Plus, History } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const FUNDS_RELEASE_HISTORY = [
  { project: 'ASP-2025', customer: 'Luis Martinez', milestone: 'M4 — Install Complete', percent: 20, amount: 6000, fundedDate: '2026-02-10', approvedBy: 'Marcus Reeves (Capital Ops)', documents: ['Install completion certificate', 'System commissioning report'], photos: ['Completed array photo', 'Inverter installation photo'], report: 'Installation completed 02/08 — 22 panels mounted on south-facing roof. All microinverters communicating. System commissioning report shows 8.5 kW DC capacity.' },
  { project: 'ASP-2027', customer: 'James Robinson', milestone: 'M3 — Install Scheduled', percent: 15, amount: 5100, fundedDate: '2026-02-18', approvedBy: 'Caitlin Frost (Escrow Specialist)', documents: ['Install crew assignment', 'Homeowner install confirmation'], photos: ['Pre-install roof condition photos'], report: 'Install crew assigned for 02/22. Homeowner confirmed window. Roof truss spacing 24" OC — standard mount hardware approved.' },
  { project: 'ASP-2029', customer: 'Monica Chen', milestone: 'M2 — Permit + Materials', percent: 20, amount: 7400, fundedDate: '2026-02-25', approvedBy: 'Jordan Kim (Fund Manager)', documents: ['City permit approval', 'Material order confirmation'], photos: ['Permit document scan'], report: 'Permit #HOU-2026-53190 approved. 28x REC Alpha 400W panels + 2x Tesla Powerwall 3 ordered.' },
  { project: 'ASP-2031', customer: 'Robert Tran', milestone: 'M5 — Utility Inspection', percent: 20, amount: 5800, fundedDate: '2026-03-01', approvedBy: 'Marcus Reeves (Capital Ops)', documents: ['Utility inspection report', 'Net metering application'], photos: ['Meter swap photo', 'Inspection tag photo'], report: 'CenterPoint Energy inspection passed. Meter upgraded to bi-directional. Net metering accepted.' },
  { project: 'ASP-2033', customer: 'Stephanie Okafor', milestone: 'M1 — SOW Confirmed', percent: 15, amount: 6375, fundedDate: '2026-03-05', approvedBy: 'Jordan Kim (Fund Manager)', documents: ['Signed SOW contract', 'Utility bill verification'], photos: ['Property exterior photo'], report: 'SOW executed for 12.5 kW system. 80% offset target met. Credit Tier 1 confirmed.' },
  { project: 'ASP-2035', customer: 'David Nakamura', milestone: 'M6 — PTO Granted', percent: 10, amount: 3200, fundedDate: '2026-03-12', approvedBy: 'Caitlin Frost (Escrow Specialist)', documents: ['PTO certificate', 'Warranty registration'], photos: ['System monitoring screenshot'], report: 'PTO granted by CenterPoint on 03/10. All 20 microinverters online. Warranty registered.' },
  { project: 'ASP-2028', customer: 'Karen Washington', milestone: 'M4 — Install Complete', percent: 20, amount: 6600, fundedDate: '2026-03-08', approvedBy: 'Marcus Reeves (Capital Ops)', documents: ['Install completion certificate', 'Photo verification packet'], photos: ['Completed roof array', 'Battery wall mount'], report: 'Install completed 03/06 by SunPro Team Alpha. 24 panels on south-facing hip roof. Tesla Powerwall 3 mounted.' },
  { project: 'ASP-2032', customer: 'Anthony Reyes', milestone: 'M3 — Install Scheduled', percent: 15, amount: 4950, fundedDate: '2026-03-15', approvedBy: 'Jordan Kim (Fund Manager)', documents: ['Install crew assignment', 'Material staging receipt'], photos: ['Staged materials photo'], report: 'Crew locked for 03/20. All materials staged. Homeowner confirmed — taking PTO day for install.' },
  { project: 'ASP-2036', customer: 'Lisa Gutierrez', milestone: 'M1 — SOW Confirmed', percent: 15, amount: 4800, fundedDate: '2026-03-18', approvedBy: 'Marcus Reeves (Capital Ops)', documents: ['Signed SOW contract', 'Credit approval letter'], photos: ['Front property photo'], report: 'SOW signed for 9.4 kW system. Usage at 1,280 kWh/mo — offset target met. Fast-tracked to permitting.' },
  { project: 'ASP-2037', customer: 'Priya Sharma', milestone: 'M2 — Permit + Materials', percent: 20, amount: 5200, fundedDate: '2026-03-20', approvedBy: 'Caitlin Frost (Escrow Specialist)', documents: ['City permit approval', 'Equipment order confirmation'], photos: ['Permit scan'], report: 'Permit approved. 24x panels + Duracell 20kW ordered. Materials ETA 03/28.' },
];

const RISK_FLAGS = [
  { id: 'RF-001', projectId: 'ASP-2030', customerName: 'Angela Davis', issue: 'Roof structural damage — water damage and sagging near chimney. Capital paused at M3 pending repair.', priority: 'high', daysOpen: 8, flaggedBy: 'Marcus Reeves (Capital Ops)' },
  { id: 'RF-002', projectId: 'ASP-2034', customerName: 'Deborah White', issue: 'Financing on hold — employment change triggered credit re-evaluation. Escrow locked at M2.', priority: 'high', daysOpen: 12, flaggedBy: 'Jordan Kim (Fund Manager)' },
  { id: 'RF-003', projectId: 'ASP-2026', customerName: 'Patricia Williams', issue: 'HOA approval delay — panel placement variance requires board approval. Capital paused at M3.', priority: 'medium', daysOpen: 5, flaggedBy: 'Caitlin Frost (Escrow Specialist)' },
];

const FinancierPortal = () => {
  const store = useProjectStore();
  const { projects } = store;
  const [activeSection, setActiveSection] = useState<'overview' | 'portfolio' | 'escrow' | 'risk' | 'pending'>('overview');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [flaggedProjects, setFlaggedProjects] = useState<Set<string>>(new Set());
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>({});

  const totalPortfolioContract = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalSystemCost = projects.reduce((s, p) => s + p.projectCost, 0);
  const totalFunded = projects.reduce((s, p) => s + Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones)), 0);

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject) : null;

  // Find pending fund releases across all projects
  const pendingReleases = projects.flatMap(p => {
    const ms = store.getMilestoneState(p.id);
    return MILESTONE_SOPS.map((sop, i) => ({ project: p, milestoneIdx: i, sop, fundStatus: ms.fundStatus[i] || 'none' }))
      .filter(item => item.fundStatus === 'pending' || item.fundStatus === 'approved');
  });


  const renderProjectDetail = () => {
    if (!selectedProjectData) return null;
    const p = selectedProjectData;
    const ms = store.getMilestoneState(p.id);
    const funded = Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones));
    const offset = Math.round((parseFloat(p.systemSize) * 1350 / p.annualUsage) * 100);

    const installerReview = ms.textEntries['m4-installer-review'];
    const sowReport = ms.textEntries['m4-sow-report'];

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 sm:items-center sm:pb-0" onClick={() => setSelectedProject(null)}>
        <div className="bg-card border-2 border-muted rounded-2xl w-full max-w-2xl max-h-[55vh] overflow-y-auto m-4 shadow-lg" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <div>
              <h2 className="text-lg font-black text-card-foreground">{p.customerName}</h2>
              <div className="text-xs text-muted-foreground">{p.id} · {p.stage}</div>
            </div>
            <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="p-6 space-y-5">
            {/* Financial Summary */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Contract Value', value: `$${p.contractValue.toLocaleString()}`, color: 'text-primary' },
                { label: 'System Cost', value: `$${p.projectCost.toLocaleString()}`, color: 'text-card-foreground' },
                { label: 'Capital Released', value: `$${funded.toLocaleString()}`, color: 'text-[hsl(var(--green))]' },
                { label: 'Project Funded %', value: `${Math.round((funded / Math.max(p.projectCost, 1)) * 100)}%`, color: 'text-[hsl(var(--yellow))]' },
              ].map((item, i) => (
                <div key={i} className="bg-muted rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* System & Project Details */}
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">System & Project Details</h3>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">System Size</span><span className="font-bold text-card-foreground">{p.systemSize}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Battery</span><span className="font-bold text-card-foreground">{p.battery}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sold PPW</span><span className="font-bold text-card-foreground">${p.soldPPW.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Annual Usage</span><span className="font-bold text-card-foreground">{p.annualUsage.toLocaleString()} kWh</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Offset</span><span className={`font-bold ${offset >= 80 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>{offset}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Roof</span><span className={`font-bold ${p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>{p.roofCondition.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Installer</span><span className="font-bold text-card-foreground">{p.installerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rep</span><span className="font-bold text-card-foreground">{p.repName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Financier</span><span className="font-bold text-card-foreground">ASP Capital</span></div>
              </div>
            </div>

            {/* Contact & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="View Documents"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="Download Report"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="View Photos"><Camera className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="Messages"><MessageSquare className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="Activity Log"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors" title="Open Full Details"><ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Adders */}
            {p.adders.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">Adders</h3>
                <div className="flex flex-wrap gap-2">
                  {p.adders.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold">
                      {a.name} · ${a.cost.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-7 gap-1.5">
              {MILESTONE_SOPS.map((sop, i) => {
                const isPassed = i < p.currentMilestone;
                const isCurrent = i === p.currentMilestone;
                const fundSt = ms.fundStatus[i] || 'none';
                const amount = Math.round(p.projectCost * (sop.fundPercent / 100));
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className={`rounded-xl p-2 text-center border cursor-pointer transition-all hover:scale-105 ${
                        isPassed ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-primary/5 border-primary/20'
                        : isCurrent ? 'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                        : 'bg-muted border-border'
                      }`}>
                        <div className={`text-[10px] font-extrabold ${isPassed ? 'text-[hsl(var(--green))]' : isCurrent ? 'text-[hsl(var(--yellow))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                        <div className="text-[8px] text-muted-foreground mt-0.5 truncate">{sop.shortName}</div>
                        <div className={`text-[9px] font-bold mt-0.5 ${isPassed ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>${(amount / 1000).toFixed(1)}K</div>
                        {isPassed && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-0.5" />}
                        {isCurrent && <Clock className="w-3 h-3 text-[hsl(var(--yellow))] mx-auto mt-0.5" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] bg-card border border-border text-card-foreground p-3 rounded-xl shadow-lg">
                      <div className="text-xs font-bold mb-1">M{i + 1}: {sop.name}</div>
                      <div className="text-[10px] text-muted-foreground mb-1.5">{sop.description}</div>
                      <div className="text-[10px] font-bold text-primary">Fund Release: {sop.fundPercent}% · ${(amount / 1000).toFixed(1)}K</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${isPassed ? 'text-[hsl(var(--green))]' : isCurrent ? 'text-[hsl(var(--yellow))]' : 'text-muted-foreground'}`}>
                        {isPassed ? (fundSt === 'released' ? '✓ Funds Released' : '✓ Approved') : isCurrent ? '⏳ In Progress' : '○ Pending'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            </TooltipProvider>

            {/* Capital progress */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Capital Released</span>
                <span className="text-sm font-black text-[hsl(var(--green))]">${funded.toLocaleString()} / ${p.projectCost.toLocaleString()}</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${(funded / Math.max(p.projectCost, 1)) * 100}%` }} />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">Project Timeline</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="font-bold text-card-foreground">{p.dates.submitted}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Site Survey</span><span className="font-bold text-card-foreground">{p.dates.siteSurvey || 'Pending'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SOW Confirmed</span><span className="font-bold text-card-foreground">{p.dates.sowConfirmed || 'Pending'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Permit</span><span className="font-bold text-card-foreground">{p.dates.permitSubmitted || 'Pending'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last HO Contact</span><span className="font-bold text-card-foreground">{p.dates.lastHOContact}</span></div>
              </div>
            </div>

            {installerReview && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">Installer Performance Review</h3>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-card-foreground">{installerReview}</div>
              </div>
            )}
            {sowReport && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">SOW vs Real Cost Report</h3>
                <div className="bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/15 rounded-xl p-3 text-xs text-card-foreground">{sowReport}</div>
              </div>
            )}

            {/* Flag button */}
            <div className="flex justify-end">
              {!flaggedProjects.has(p.id) ? (
                <button
                  onClick={() => {
                    const note = prompt('Enter reason for flagging this project:');
                    if (note?.trim()) {
                      setFlaggedProjects(prev => new Set(prev).add(p.id));
                      setFlagNotes(prev => ({ ...prev, [p.id]: note.trim() }));
                    }
                  }}
                  className="px-3 py-1.5 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/25 rounded-lg text-xs text-[hsl(var(--red))] font-bold hover:bg-[hsl(var(--red))]/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" /> Flag for Review
                </button>
              ) : (
                <span className="text-[10px] text-[hsl(var(--red))] font-bold flex items-center gap-1"><Flag className="w-3 h-3" /> Flagged: {flagNotes[p.id]}</span>
              )}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Portfolio Value', value: `$${Math.round(totalPortfolioContract / 1000)}k`, valueSuffix: '', icon: DollarSign, color: 'text-primary', sub: `${projects.length} projects` },
                { label: 'Capital Deployed', value: `$${Math.round(totalFunded / 1000)}k`, valueSuffix: `of $${Math.round(totalSystemCost / 1000)}k`, icon: TrendingUp, color: 'text-[hsl(var(--green))]', sub: `${Math.round((totalFunded / Math.max(totalSystemCost, 1)) * 100)}% deployed` },
                { label: 'Gross Profit', value: `$${Math.round((totalPortfolioContract - totalSystemCost) / 1000)}k`, valueSuffix: '', icon: BarChart3, color: 'text-[hsl(var(--yellow))]', sub: `${Math.round(((totalPortfolioContract - totalSystemCost) / Math.max(totalPortfolioContract, 1)) * 100)}% margin` },
                { label: 'Pending Releases', value: pendingReleases.length.toString(), valueSuffix: '', icon: Clock, color: pendingReleases.length > 0 ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--green))]', sub: pendingReleases.length > 0 ? 'Action required' : 'All clear' },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                    {s.valueSuffix && <span className="text-xs text-muted-foreground font-medium">{s.valueSuffix}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pending Fund Release Alert */}
            {pendingReleases.length > 0 && (
              <div className="bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[hsl(var(--yellow))]" />
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{pendingReleases.length} fund release(s) awaiting approval</div>
                      <div className="text-xs text-muted-foreground">Backend Ops has verified these milestones. Review and release funds.</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveSection('pending')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
                    Review Now →
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio Projects */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Portfolio Projects</h3>
                <button onClick={() => setActiveSection('portfolio')} className="text-xs text-primary font-bold hover:underline">View All →</button>
              </div>
              {projects.filter(p => p.status !== 'completed').slice(0, 5).map(p => {
                const ms = store.getMilestoneState(p.id);
                const funded = Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones));
                const fundedPct = Math.round((funded / Math.max(p.projectCost, 1)) * 100);
                return (
                  <div key={p.id} className="px-5 py-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedProject(p.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.systemSize} · {p.battery} · ${p.soldPPW.toFixed(2)}/W</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.stage === 'Install Complete' || p.stage === 'PTO Granted' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' :
                          p.stage === 'Permit Submitted' || p.stage === 'Install Scheduled' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]' :
                          'bg-primary/10 text-primary'
                        }`}>{p.stage}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span><span className="font-bold text-card-foreground">${(p.contractValue / 1000).toFixed(1)}K</span> contract</span>
                        <span><span className={`font-bold ${fundedPct >= 50 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>{fundedPct}%</span> funded</span>
                        <span>{p.installerName}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {MILESTONE_SOPS.map((_, i) => {
                          const fundSt = ms.fundStatus[i] || 'none';
                          return (
                            <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                              i < p.currentMilestone
                                ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/20 text-[hsl(var(--green))]' :
                                  fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/20 text-[hsl(var(--yellow))]' :
                                  'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>M{i + 1}</div>
                          );
                        })}
                      </div>
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
                  <div className="text-xl font-black text-[hsl(var(--yellow))]">${Math.round((totalSystemCost - totalFunded) / 1000)}k</div>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">Released</div>
                  <div className="text-xl font-black text-[hsl(var(--green))]">${Math.round(totalFunded / 1000)}k</div>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full transition-all" style={{ width: `${(totalFunded / Math.max(totalSystemCost, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Pending Fund Releases
              </h3>
              <p className="text-xs text-muted-foreground mb-4">These milestones have been verified by Backend Ops. Review and approve fund release.</p>

              {pendingReleases.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-[hsl(var(--green))] mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">No pending releases — all caught up!</p>
                </div>
              )}

              {pendingReleases.map((item, i) => {
                const amount = Math.round(item.project.projectCost * (item.sop.fundPercent / 100));
                const ms = store.getMilestoneState(item.project.id);
                const installerReview = ms.textEntries['m4-installer-review'];
                const sowReport = ms.textEntries['m4-sow-report'];

                return (
                  <div key={i} className="bg-muted rounded-xl border border-border p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--yellow))]/15 flex items-center justify-center text-xs font-extrabold text-[hsl(var(--yellow))]">
                          M{item.milestoneIdx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-card-foreground">{item.project.customerName}</div>
                          <div className="text-[10px] text-muted-foreground">{item.project.id} · {item.sop.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[hsl(var(--yellow))]">${amount.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{item.sop.fundPercent}% of system cost</div>
                      </div>
                    </div>

                    {/* Show reports if M4 */}
                    {item.milestoneIdx === 3 && installerReview && (
                      <div className="mb-2 bg-card rounded-lg p-3 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Installer Review</div>
                        <div className="text-xs text-card-foreground">{installerReview}</div>
                      </div>
                    )}
                    {item.milestoneIdx === 3 && sowReport && (
                      <div className="mb-2 bg-card rounded-lg p-3 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">SOW vs Cost Report</div>
                        <div className="text-xs text-card-foreground">{sowReport}</div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      {item.fundStatus === 'pending' && (
                        <button
                          onClick={() => store.approveFundRelease(item.project.id, item.milestoneIdx)}
                          className="px-4 py-2 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary/25 transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Release
                        </button>
                      )}
                      {item.fundStatus === 'approved' && (
                        <button
                          onClick={() => store.releaseFund(item.project.id, item.milestoneIdx)}
                          className="px-4 py-2 bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border border-[hsl(var(--green))]/30 rounded-lg text-xs font-bold hover:bg-[hsl(var(--green))]/25 transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Release Funds — ${amount.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'portfolio':
        return (
          <div className="space-y-3">
            {projects.map(p => {
              const isExpanded = expandedProject === p.id;
              const ms = store.getMilestoneState(p.id);
              const funded = Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones));
              const offset = Math.round((parseFloat(p.systemSize) * 1350 / p.annualUsage) * 100);
              const isFlagged = flaggedProjects.has(p.id);

              return (
                <div key={p.id} className={`bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-shadow ${isFlagged ? 'border-[hsl(var(--red))]/40' : 'border-border'}`}>
                  <div className="flex gap-px h-1.5">
                    {Array.from({ length: p.totalMilestones }).map((_, i) => (
                      <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-bold text-card-foreground flex items-center gap-2">
                          {p.customerName}
                          {isFlagged && <Flag className="w-3.5 h-3.5 text-[hsl(var(--red))]" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-0.5">
                        {MILESTONE_SOPS.map((_, i) => {
                          const fundSt = ms.fundStatus[i] || 'none';
                          return (
                            <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                              i < p.currentMilestone
                                ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/20 text-[hsl(var(--green))]' :
                                  fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/20 text-[hsl(var(--yellow))]' :
                                  'bg-primary text-primary-foreground'
                                : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]'
                                : 'bg-muted text-muted-foreground'
                            }`}>M{i + 1}</div>
                          );
                        })}
                      </div>
                      <div className="text-sm font-black text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        p.status === 'active' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25' :
                        p.status === 'delayed' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                        p.status === 'on_hold' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                        'bg-primary/10 text-primary border-primary/25'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Quick Info */}
                      <div className="px-5 py-3 bg-muted/50 border-b border-border grid grid-cols-7 gap-3 text-xs">
                        <div><span className="text-muted-foreground">System:</span> <span className="font-bold text-card-foreground">{p.systemSize}</span></div>
                        <div><span className="text-muted-foreground">Battery:</span> <span className="font-bold text-card-foreground">{p.battery}</span></div>
                        <div><span className="text-muted-foreground">PPW:</span> <span className="font-bold text-card-foreground">${p.soldPPW.toFixed(2)}</span></div>
                        <div><span className="text-muted-foreground">Offset:</span> <span className={`font-bold ${offset >= 80 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>{offset}%</span></div>
                        <div><span className="text-muted-foreground">Installer:</span> <span className="font-bold text-card-foreground">{p.installerName}</span></div>
                        <div><span className="text-muted-foreground">Rep:</span> <span className="font-bold text-card-foreground">{p.repName}</span></div>
                        <div><span className="text-muted-foreground">Usage:</span> <span className="font-bold text-card-foreground">{p.annualUsage.toLocaleString()} kWh</span></div>
                      </div>

                      {/* Financial Summary */}
                      <div className="px-5 py-3 border-b border-border">
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Contract Value', value: `$${p.contractValue.toLocaleString()}`, color: 'text-primary' },
                            { label: 'System Cost', value: `$${p.projectCost.toLocaleString()}`, color: 'text-card-foreground' },
                            { label: 'Capital Released', value: `$${funded.toLocaleString()}`, color: 'text-[hsl(var(--green))]' },
                            { label: 'Project Funded %', value: `${Math.round((funded / Math.max(p.projectCost, 1)) * 100)}%`, color: 'text-[hsl(var(--yellow))]' },
                          ].map((item, i) => (
                            <div key={i} className="bg-muted rounded-xl p-3">
                              <div className="text-[10px] text-muted-foreground">{item.label}</div>
                              <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${(funded / Math.max(p.projectCost, 1)) * 100}%` }} />
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="px-5 py-3 border-b border-border flex items-center gap-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</span>
                      </div>

                      {/* Milestone SOP Detail (read-only) */}
                      <div className="divide-y divide-border">
                        {MILESTONE_SOPS.map((sop, milestoneIdx) => {
                          const isPassed = milestoneIdx < p.currentMilestone;
                          const isCurrent = milestoneIdx === p.currentMilestone;
                          const fundSt = ms.fundStatus[milestoneIdx] || 'none';
                          const isExpandedM = expandedMilestone?.projectId === p.id && expandedMilestone?.idx === milestoneIdx;

                          return (
                            <div key={milestoneIdx}>
                              <div
                                className={`px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors ${isCurrent ? 'bg-primary/5' : ''}`}
                                onClick={() => setExpandedMilestone(isExpandedM ? null : { projectId: p.id, idx: milestoneIdx })}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                                    isPassed ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                                    isCurrent ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    M{milestoneIdx + 1}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-card-foreground">{sop.name}</div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      {isPassed ? <><CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> Completed</> : isCurrent ? <><Clock className="w-3 h-3 text-[hsl(var(--yellow))]" /> In Progress</> : <><Clock className="w-3 h-3" /> Pending</>} · {sop.fundPercent}%
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(isPassed || fundSt !== 'none') && (
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      fundSt === 'released' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' :
                                      fundSt === 'approved' ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]' :
                                      fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]' :
                                      'bg-muted text-muted-foreground'
                                    }`}>
                                      {fundSt === 'released' ? 'Released' : fundSt === 'approved' ? 'Approved' : fundSt === 'pending' ? 'Pending' : '—'}
                                    </span>
                                  )}
                                  {isExpandedM ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                                </div>
                              </div>

                              {/* Expanded checklist (read-only) */}
                              {isExpandedM && (
                                <div className="px-5 pb-4">
                                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">
                                      Checklist — {sop.description}
                                    </div>
                                    {sop.checklist.map(item => {
                                      const isDone = ms.checklistDone[item.id];
                                      const uploads = ms.uploads[item.id] || [];
                                      const textEntry = ms.textEntries[item.id];
                                      const dateEntry = ms.dateEntries[item.id];

                                      return (
                                        <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isDone ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-card border-border'}`}>
                                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-muted'}`}>
                                            {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <div className="text-xs font-bold text-card-foreground">{item.label}</div>
                                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                                item.actor === 'installer' ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]' :
                                                item.actor === 'backend_ops' ? 'bg-primary/10 text-primary' :
                                                'bg-muted text-muted-foreground'
                                              }`}>
                                                {item.actor === 'backend_ops' ? 'OPS' : item.actor === 'installer' ? 'INSTALLER' : item.actor.toUpperCase()}
                                              </span>
                                            </div>
                                            {uploads.length > 0 && (
                                              <div className="mt-1.5 space-y-1">
                                                {uploads.map((f, fi) => (
                                                  <div key={fi} className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--green))]">
                                                    <FileText className="w-3 h-3" /> {f}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {textEntry && (
                                              <div className="mt-1.5 bg-muted rounded p-2 text-[10px] text-card-foreground">{textEntry}</div>
                                            )}
                                            {dateEntry && (
                                              <div className="mt-1.5 text-[10px] text-[hsl(var(--green))] font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateEntry}</div>
                                            )}
                                            {!isDone && !uploads.length && !textEntry && !dateEntry && (
                                              <div className="mt-1 text-[10px] text-muted-foreground italic">Awaiting completion...</div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Ops Notes (read-only) */}
                                    {ms.opsNotes[milestoneIdx] && (
                                      <div className="mt-2 bg-primary/5 border border-primary/15 rounded-lg p-3">
                                        <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Backend Ops Notes</div>
                                        <div className="text-xs text-card-foreground">{ms.opsNotes[milestoneIdx]}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Flag Button */}
                      <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
                        <div className="text-[10px] text-muted-foreground">
                          {isFlagged && flagNotes[p.id] && <span className="text-[hsl(var(--red))] font-bold">Flagged: {flagNotes[p.id]}</span>}
                        </div>
                        {!isFlagged ? (
                          <button
                            onClick={() => {
                              const note = prompt('Enter reason for flagging this project for review:');
                              if (note && note.trim()) {
                                setFlaggedProjects(prev => new Set(prev).add(p.id));
                                setFlagNotes(prev => ({ ...prev, [p.id]: note.trim() }));
                              }
                            }}
                            className="px-3 py-1.5 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/25 rounded-lg text-xs text-[hsl(var(--red))] font-bold hover:bg-[hsl(var(--red))]/20 transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Flag className="w-3.5 h-3.5" /> Flag for Review
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const next = new Set(flaggedProjects);
                              next.delete(p.id);
                              setFlaggedProjects(next);
                              setFlagNotes(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                            }}
                            className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-muted-foreground font-bold hover:text-card-foreground transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" /> Remove Flag
                          </button>
                        )}
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
              <p className="text-xs text-muted-foreground mb-4">Funds held in ASP-managed escrow. 7 milestone gates — each requires documented ASP verification.</p>
              <div className="grid grid-cols-7 gap-3">
                {ESCROW_MILESTONES.map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center border border-border">
                    <div className="text-base font-black text-primary mb-1">M{i + 1}</div>
                    <div className="text-lg font-black text-card-foreground">{m.percent}%</div>
                    <div className="text-[9px] text-muted-foreground mt-1">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funds Released History */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[hsl(var(--green))]" /> Funds Released History
              </div>
              {FUNDS_RELEASE_HISTORY.map((entry, i) => {
                const isOpen = expandedHistory === i;
                return (
                  <div key={i} className="border-b border-border">
                    <div className="px-5 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between" onClick={() => setExpandedHistory(isOpen ? null : i)}>
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <div>
                          <div className="text-sm font-bold text-card-foreground">{entry.customer}</div>
                          <div className="text-[10px] text-muted-foreground">{entry.project} · {entry.milestone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold bg-primary text-primary-foreground">
                          {entry.milestone.match(/M\d/)?.[0] || 'M1'}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-[hsl(var(--green))]">${entry.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">{entry.percent}% · {entry.fundedDate}</div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-[hsl(var(--green))]" />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-4 space-y-3">
                        <div className="bg-muted rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Funded Date</span><span className="text-xs font-bold text-[hsl(var(--green))]">{entry.fundedDate}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Approved By</span><span className="text-xs font-bold text-card-foreground">{entry.approvedBy}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Amount</span><span className="text-xs font-black text-[hsl(var(--green))]">${entry.amount.toLocaleString()} ({entry.percent}%)</span></div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Documents</div>
                          <div className="space-y-1">
                            {entry.documents.map((doc, di) => (
                              <div key={di} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"><FileText className="w-3 h-3 text-primary shrink-0" /><span className="text-xs text-card-foreground">{doc}</span></div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2 flex items-center gap-1.5"><Camera className="w-3 h-3" /> Photos</div>
                          <div className="space-y-1">
                            {entry.photos.map((photo, phi) => (
                              <div key={phi} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"><Camera className="w-3 h-3 text-primary shrink-0" /><span className="text-xs text-card-foreground">{photo}</span></div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2 flex items-center gap-1.5"><ClipboardCheck className="w-3 h-3" /> Report</div>
                          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                            <div className="text-xs text-card-foreground leading-relaxed">{entry.report}</div>
                            <div className="mt-2 text-[10px] text-muted-foreground">— {entry.approvedBy}, {entry.fundedDate}</div>
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
              <div className="space-y-3">
                {DEFAULT_LAYERS.map((layer, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 bg-muted rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{String(i + 1).padStart(2, '0')}</div>
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

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--red))]" /> Flagged Accounts
              </h3>
              <div className="space-y-3">
                {RISK_FLAGS.map(t => (
                  <div key={t.id} className={`rounded-xl border p-4 ${
                    t.priority === 'high' ? 'bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20' : 'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
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
                      <span className="text-[10px] font-bold text-[hsl(var(--yellow))] flex items-center gap-1"><Clock className="w-3 h-3" /> Open {t.daysOpen} days</span>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Portfolio Health</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Active', count: projects.filter(p => p.status === 'active').length, color: 'bg-[hsl(var(--green))]' },
                    { label: 'Delayed', count: projects.filter(p => p.status === 'delayed').length, color: 'bg-[hsl(var(--yellow))]' },
                    { label: 'On Hold', count: projects.filter(p => p.status === 'on_hold').length, color: 'bg-[hsl(var(--red))]' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${s.color}`} /><span className="text-xs text-card-foreground">{s.label}</span></div>
                      <span className="text-sm font-black text-card-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">At-Risk Projects</h4>
                <div className="space-y-3">
                  {projects.filter(p => p.status === 'delayed' || p.status === 'on_hold').map(p => (
                    <div key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -m-1" onClick={() => setSelectedProject(p.id)}>
                      <AlertTriangle className={`w-3 h-3 ${p.status === 'delayed' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`} />
                      <span className="text-xs font-bold text-card-foreground">{p.customerName}</span>
                      <span className="text-[10px] text-muted-foreground">{p.stage}</span>
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
      <div className="flex gap-1.5">
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'pending', label: 'Fund Releases', icon: DollarSign },
          { key: 'portfolio', label: 'Portfolio', icon: TrendingUp },
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
            {s.key === 'pending' && pendingReleases.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[hsl(var(--yellow))] text-black rounded-full text-[8px] font-extrabold">{pendingReleases.length}</span>
            )}
          </button>
        ))}
      </div>

      {renderSection()}
      {selectedProjectData && renderProjectDetail()}
    </div>
  );
};

export default FinancierPortal;
