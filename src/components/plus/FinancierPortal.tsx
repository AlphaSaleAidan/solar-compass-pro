import { useState, useRef, useLayoutEffect } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import MilestoneTimeline from '@/components/shared/MilestoneTimeline';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, BarChart3, Lock, X, MapPin, Phone, Mail, Flag, FileText, Camera, ClipboardCheck, Calendar, ExternalLink, Download, MessageSquare, Eye, Video, Trash2, XCircle, RefreshCw } from 'lucide-react';
import DeleteProjectDialog from '@/components/shared/DeleteProjectDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Escrow milestone percentages are derived from MILESTONE_SOPS (no hardcoded mock data)

const DEFAULT_LAYERS = [
  { name: 'Utility Bill Verification', desc: 'Real savings confirmed before pipeline entry', active: true },
  { name: '80% True Offset Cap', desc: 'Undersized deals rejected at origination', active: true },
  { name: 'Installer Performance Scoring', desc: 'Only high-scoring network installers receive deals', active: true },
  { name: 'Milestone-Gated Payments', desc: 'No capital moves without ASP-verified completion', active: true },
  { name: 'Distributed Rep Commissions', desc: 'Reps invested through PTO — not just the close', active: true },
  { name: 'Ticket Resolution System', desc: 'Issues gate next milestone — 72hr resolution or escalation', active: true },
  { name: 'Battery-First Design', desc: '100% storage attachment improves satisfaction', active: true },
];

// FUNDS_RELEASE_HISTORY removed — escrow tab now derives release history from real project data

// RISK_FLAGS removed — risk tab now uses store.tickets

const FinancierPortal = () => {
  const store = useDataSource();
  const { projects } = store;
  const [activeSection, setActiveSection] = useState<'overview' | 'portfolio' | 'escrow' | 'risk' | 'pending' | 'rejected'>('overview');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [flaggedProjects, setFlaggedProjects] = useState<Set<string>>(new Set());
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string } | null>(null);
  const [flagNotes, setFlagNotes] = useState<Record<string, string>>({});
  // Popup state
  const [popupTab, setPopupTab] = useState<'details' | 'milestones' | 'uploads' | 'chat' | 'updates'>('details');
  const [popupExpandedM, setPopupExpandedM] = useState<number | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 sm:items-center sm:pb-0 modal-backdrop-enter" onClick={() => setSelectedProject(null)}>
        <div className="bg-card border-2 border-muted rounded-2xl w-full max-w-2xl max-h-[55vh] overflow-y-auto m-4 shadow-lg modal-content-enter" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <div>
              <h2 className="text-lg font-black text-card-foreground">{p.customerName}</h2>
              <div className="text-xs text-muted-foreground">{p.id} · {p.stage}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteProject({ id: p.id, name: p.customerName })}
                className="px-3 py-1.5 bg-destructive/10 border border-destructive/25 rounded-lg text-[10px] font-bold text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
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

            {/* M1-M7 Visual Timeline */}
            <div className="bg-muted/50 border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Milestone Progress</h3>
              <MilestoneTimeline currentMilestone={p.currentMilestone} fundStatus={ms.fundStatus} />
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

            {/* Welcome Call Recording */}
            {p.welcomeCallRecordingUrl && (
              <div className="bg-muted/50 border border-border rounded-xl p-4">
                <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-primary" /> Welcome Call Recording
                </h3>
                <div className="flex items-center gap-3 p-2.5 bg-muted border border-primary/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Video className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-card-foreground">{p.customerName} — Welcome Call</div>
                    <div className="text-[10px] text-muted-foreground">Recording ID: {p.welcomeCallRecordingUrl}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors">
                    ▶ Play
                  </button>
                </div>
              </div>
            )}

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
                        {isPassed ? (fundSt === 'released' ? '✓ Funds Released' : '✓ Approved') : isCurrent ? 'In Progress' : '○ Pending'}
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

            {/* Flag & Reject buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 bg-[hsl(var(--yellow))]/10 border border-[hsl(var(--yellow))]/25 rounded-lg text-xs text-[hsl(var(--yellow))] font-bold hover:bg-[hsl(var(--yellow))]/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Deal
              </button>
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

          {/* Reject Deal Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowRejectModal(false)}>
              <div className="bg-card border-2 border-muted rounded-xl p-6 w-[440px] shadow-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-black text-card-foreground mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[hsl(var(--yellow))]" />
                  Reject Deal — {p.customerName}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">This deal will be moved to the rejected queue for reassignment to another financier or installer.</p>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Rejection Reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g., Credit risk too high, insufficient collateral, area not serviceable..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-card-foreground outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="px-4 py-2 bg-muted border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-card-foreground transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (rejectReason.trim()) {
                        store.rejectProject(p.id, rejectReason.trim(), 'ASP Capital', 'financier');
                        toast.success(`${p.customerName} rejected — routed to reassignment queue`);
                        setShowRejectModal(false);
                        setRejectReason('');
                        setSelectedProject(null);
                      }
                    }}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2 bg-[hsl(var(--yellow))]/15 border border-[hsl(var(--yellow))]/30 rounded-lg text-xs font-bold text-[hsl(var(--yellow))] hover:bg-[hsl(var(--yellow))]/25 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-30"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
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
                <div key={i} className="glass-panel stat-glow p-5 stat-card-hover transition-all duration-300 portal-section-enter" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black ${s.color} tracking-tight`}>{s.value}</span>
                    {s.valueSuffix && <span className="text-xs text-muted-foreground font-medium">{s.valueSuffix}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Auto-Fund Status Banner */}
            <div className="bg-[hsl(var(--green))]/5 border border-[hsl(var(--green))]/20 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[hsl(var(--green))]" />
                  <div>
                    <div className="text-sm font-bold text-card-foreground">Auto-Fund Active</div>
                    <div className="text-xs text-muted-foreground">Milestone funds release automatically after Backend Ops verification. Your role: approve incoming deals.</div>
                  </div>
                </div>
                <button onClick={() => setActiveSection('pending')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all">
                  View Release Log →
                </button>
              </div>
            </div>

            {/* Rejected projects alert */}
            {store.getRejectedProjects().length > 0 && (
              <div className="bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[hsl(var(--yellow))]" />
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{store.getRejectedProjects().length} rejected project(s) need reassignment</div>
                      <div className="text-xs text-muted-foreground">Route these to a different installer or financier.</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveSection('rejected')} className="px-4 py-2 bg-[hsl(var(--yellow))] text-black rounded-lg text-xs font-bold hover:opacity-90 transition-all">
                    Manage →
                  </button>
                </div>
              </div>
            )}

            {/* Portfolio Projects */}
            <div className="glass-panel overflow-hidden">
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
            <div className="glass-panel p-5">
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

      case 'pending': {
        // Auto-fund log: show all released milestones across projects
        const releasedMilestones = projects.flatMap(p => {
          const ms = store.getMilestoneState(p.id);
          return MILESTONE_SOPS.map((sop, i) => ({ project: p, milestoneIdx: i, sop, fundStatus: ms.fundStatus[i] || 'none' }))
            .filter(item => item.fundStatus === 'released');
        });

        return (
          <div className="space-y-4">
            {/* Auto-fund explanation */}
            <div className="bg-[hsl(var(--green))]/5 border border-[hsl(var(--green))]/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-[hsl(var(--green))]" />
                <span className="text-xs font-bold text-card-foreground">Auto-Fund System Active</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Milestone funds are automatically released after Backend Ops verifies and approves each milestone. No manual fund approval needed.</p>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[hsl(var(--green))]" /> Fund Release Log
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Milestones auto-funded after Ops verification.</p>

              {releasedMilestones.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">No milestones released yet</p>
                </div>
              ) : releasedMilestones.map((item, i) => {
                const amount = Math.round(item.project.projectCost * (item.sop.fundPercent / 100));
                return (
                  <div key={i} className="bg-muted rounded-xl border border-border p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--green))]/15 flex items-center justify-center text-xs font-extrabold text-[hsl(var(--green))]">
                          M{item.milestoneIdx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-card-foreground">{item.project.customerName}</div>
                          <div className="text-[10px] text-muted-foreground">{item.project.id} · {item.sop.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[hsl(var(--green))]">${amount.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{item.sop.fundPercent}% · Auto-released ✓</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Historical fund releases — built from real released milestones above */}
            {releasedMilestones.length > 0 && (
              <div className="glass-panel overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Release History
                </div>
                {releasedMilestones.map((item, i) => {
                  const amount = Math.round(item.project.projectCost * (item.sop.fundPercent / 100));
                  return (
                    <div key={i} className="px-5 py-3 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-[hsl(var(--green))]/10 flex items-center justify-center text-[9px] font-extrabold text-[hsl(var(--green))]">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-card-foreground">{item.project.customerName} — M{item.milestoneIdx + 1}: {item.sop.name}</div>
                          <div className="text-[10px] text-muted-foreground">{item.project.id} · Auto-funded</div>
                        </div>
                      </div>
                      <span className="text-sm font-black text-[hsl(var(--green))]">${amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

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
                <div key={p.id} className={`glass-panel overflow-hidden hover:shadow-md transition-shadow ${isFlagged ? 'border-[hsl(var(--red))]/40' : 'border-border'}`}>
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

      case 'escrow': {
        // Build escrow data from real MILESTONE_SOPS + project data
        const escrowMilestones = MILESTONE_SOPS.map((sop, i) => ({ name: sop.name, percent: sop.fundPercent }));

        // Build release history from real store data
        const releasedMilestones: { projectId: string; customer: string; milestoneIdx: number; milestoneName: string; percent: number; amount: number }[] = [];
        projects.forEach(p => {
          const ms = store.getMilestoneState(p.id);
          MILESTONE_SOPS.forEach((sop, i) => {
            if (ms.fundStatus[i] === 'released') {
              releasedMilestones.push({
                projectId: p.id,
                customer: p.customerName,
                milestoneIdx: i,
                milestoneName: sop.name,
                percent: sop.fundPercent,
                amount: Math.round(p.projectCost * (sop.fundPercent / 100)),
              });
            }
          });
        });

        // Total in escrow (approved but not yet released)
        let totalInEscrow = 0;
        projects.forEach(p => {
          const ms = store.getMilestoneState(p.id);
          MILESTONE_SOPS.forEach((sop, i) => {
            if (i < p.currentMilestone && ms.fundStatus[i] !== 'released') {
              totalInEscrow += Math.round(p.projectCost * (sop.fundPercent / 100));
            }
          });
        });

        return (
          <div className="space-y-5">
            <div className="glass-panel p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Milestone-Gated Capital Structure
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Funds held in ASP-managed escrow. 7 milestone gates — each requires documented ASP verification.</p>
              <div className="grid grid-cols-7 gap-3">
                {escrowMilestones.map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center border border-border">
                    <div className="text-base font-black text-primary mb-1">M{i + 1}</div>
                    <div className="text-lg font-black text-card-foreground">{m.percent}%</div>
                    <div className="text-[9px] text-muted-foreground mt-1">{m.name}</div>
                  </div>
                ))}
              </div>
              {totalInEscrow > 0 && (
                <div className="mt-4 bg-[hsl(var(--yellow))]/5 border border-[hsl(var(--yellow))]/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[hsl(var(--yellow))]">Currently in Escrow</span>
                  <span className="text-lg font-black text-[hsl(var(--yellow))]">${totalInEscrow.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Funds Released History */}
            <div className="glass-panel overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[hsl(var(--green))]" /> Funds Released History ({releasedMilestones.length})
              </div>
              {releasedMilestones.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No funds have been released yet. Milestone approvals will appear here once ops and financier sign off.</p>
                </div>
              ) : releasedMilestones.map((entry, i) => {
                const isOpen = expandedHistory === i;
                return (
                  <div key={`${entry.projectId}-M${entry.milestoneIdx}`} className="border-b border-border">
                    <div className="px-5 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between" onClick={() => setExpandedHistory(isOpen ? null : i)}>
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <div>
                          <div className="text-sm font-bold text-card-foreground">{entry.customer}</div>
                          <div className="text-[10px] text-muted-foreground">{entry.projectId} · M{entry.milestoneIdx + 1} — {entry.milestoneName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold bg-primary text-primary-foreground">
                          M{entry.milestoneIdx + 1}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-[hsl(var(--green))]">${entry.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">{entry.percent}%</div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-[hsl(var(--green))]" />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <div className="bg-muted rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Milestone</span><span className="text-xs font-bold text-card-foreground">M{entry.milestoneIdx + 1} — {entry.milestoneName}</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Amount</span><span className="text-xs font-black text-[hsl(var(--green))]">${entry.amount.toLocaleString()} ({entry.percent}%)</span></div>
                          <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Status</span><span className="text-xs font-bold text-[hsl(var(--green))]">Released</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'risk':
        return (
          <div className="space-y-5">
            <div className="glass-panel p-5">
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

            <div className="glass-panel p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--red))]" /> Flagged Accounts
              </h3>
              <div className="space-y-3">
                {(() => {
                  const openTickets = (store as any).tickets?.filter((t: any) => t.status === 'open') || [];
                  if (openTickets.length === 0) return (
                    <div className="text-center py-6">
                      <Shield className="w-8 h-8 text-[hsl(var(--green))]/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No flagged accounts — portfolio is clean</p>
                    </div>
                  );
                  return openTickets.map((t: any) => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <div key={t.id} className="rounded-xl border p-4 bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Flag className="w-3.5 h-3.5 text-[hsl(var(--red))]" />
                            <span className="text-xs font-extrabold text-card-foreground">{t.id?.slice(0, 8)}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25">Open</span>
                          </div>
                          <span className="text-[10px] font-bold text-[hsl(var(--yellow))] flex items-center gap-1"><Clock className="w-3 h-3" /> {t.createdAt || 'Recent'}</span>
                        </div>
                        <div className="text-xs font-bold text-card-foreground mb-2">
                          <Flag className="w-3 h-3 text-[hsl(var(--red))] inline mr-1" />
                          Account for <span className="text-primary">{proj?.customerName || 'Unknown'}</span> — {t.subject}
                        </div>
                        {t.messages?.[0]?.text && (
                          <div className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3">{t.messages[0].text}</div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5">
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
              <div className="glass-panel p-5">
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

      case 'rejected': {
        const rejected = store.getRejectedProjects();
        return (
          <div className="space-y-4">
            <div className="glass-panel p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-1 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[hsl(var(--red))]" /> Rejected Projects
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Deals rejected by an installer or financier. Reassign to route to a new party.</p>

              {rejected.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-[hsl(var(--green))] mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">No rejected projects — portfolio is clean</p>
                </div>
              ) : rejected.map((r) => (
                <div key={r.project.id} className="bg-muted rounded-xl border border-border p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{r.project.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{r.project.id} · {r.project.systemSize} · ${r.project.projectCost.toLocaleString()}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] rounded text-[9px] font-bold uppercase">
                      Rejected by {r.rejectedByRole}
                    </span>
                  </div>
                  <div className="bg-card/50 border border-border rounded-lg p-3 mb-3">
                    <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Rejection Reason</div>
                    <div className="text-xs text-card-foreground">{r.reason}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">By {r.rejectedBy} · {new Date(r.rejectedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                    <div className="bg-card/30 border border-border rounded-lg p-2">
                      <span className="text-muted-foreground">Original Installer:</span> <span className="font-bold text-card-foreground">{r.originalInstaller}</span>
                    </div>
                    <div className="bg-card/30 border border-border rounded-lg p-2">
                      <span className="text-muted-foreground">Original Financier:</span> <span className="font-bold text-card-foreground">{r.originalFinancier}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        store.reassignProject(r.project.id, 'installer', 'SunPeak Installations');
                        toast.success(`${r.project.customerName} reassigned to SunPeak Installations`);
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reassign Installer
                    </button>
                    <button
                      onClick={() => {
                        store.reassignProject(r.project.id, 'financier', 'ASP Capital');
                        toast.success(`${r.project.customerName} reassigned to ASP Capital`);
                      }}
                      className="px-3 py-1.5 bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border border-[hsl(var(--green))]/20 rounded-lg text-[10px] font-bold hover:bg-[hsl(var(--green))]/20 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reassign Financier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const sectionNavRef = useRef<HTMLDivElement>(null);
  const [sectionIndicator, setSectionIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!sectionNavRef.current) return;
    const activeBtn = sectionNavRef.current.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
    if (activeBtn) {
      const containerRect = sectionNavRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setSectionIndicator({ left: btnRect.left - containerRect.left, width: btnRect.width });
    }
  }, [activeSection]);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={sectionNavRef} className="relative flex gap-1.5">
        {/* Animated background pill */}
        <motion.div
          className="absolute top-0 h-full rounded-xl bg-primary"
          style={{ zIndex: 0 }}
          animate={{ left: sectionIndicator.left, width: sectionIndicator.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
        />
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'pending', label: 'Fund Releases', icon: DollarSign },
          { key: 'portfolio', label: 'Portfolio', icon: TrendingUp },
          { key: 'escrow', label: 'Escrow', icon: Lock },
          { key: 'risk', label: 'Risk Stack', icon: Shield },
          { key: 'rejected', label: 'Rejected', icon: XCircle },
        ] as const).map(s => (
          <button
            key={s.key}
            data-section={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors duration-200 ${
              activeSection === s.key
                ? 'text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
            {s.key === 'pending' && pendingReleases.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${activeSection === s.key ? 'bg-white/20 text-white' : 'bg-[hsl(var(--yellow))] text-black'}`}>{pendingReleases.length}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>
      {selectedProjectData && renderProjectDetail()}
      {deleteProject && (
        <DeleteProjectDialog
          open={!!deleteProject}
          onOpenChange={(v) => { if (!v) setDeleteProject(null); }}
          projectId={deleteProject.id}
          projectName={deleteProject.name}
          projectType="project"
          onDeleted={() => { setDeleteProject(null); setSelectedProject(null); }}
        />
      )}
    </motion.div>
  );
};

export default FinancierPortal;
