import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { getActiveSellProjects } from '@/lib/deriveSellProject';
import MilestoneTimeline from '@/components/shared/MilestoneTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Clock, CheckCircle, DollarSign, Wrench, Star, ChevronDown, ChevronRight, AlertTriangle, Timer, Trophy, Truck, Send, Shield, FileText, Flag, User, MapPin, Phone, Mail, Battery, Sun, Info, X, Upload, ClipboardCheck, Camera, MessageSquare, History, Plus, Calendar, Eye, ExternalLink, Trash2, XCircle, RefreshCw, Lock } from 'lucide-react';
import DeleteProjectDialog from '@/components/shared/DeleteProjectDialog';
import { CelebrationAnimation } from '@/components/shared/CelebrationAnimation';
import { cascadeMilestoneCompleted } from '@/lib/notificationCascade';
import { useGamification } from '@/hooks/useGamification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const INSTALLER_MILESTONES = [
  { name: 'SOW Confirmed', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 20 },
  { name: 'Utility Inspection', percent: 20 },
  { name: 'PTO Granted', percent: 10 },
];

// Tickets and payment details are now sourced from the Supabase store (no mock data)

const InstallerPortal = () => {
  const store = useDataSource();
  const { user } = useAuth();
  const gamification = useGamification();
  const isDemo = user?.isDemo;
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'payments' | 'tickets' | 'milestones' | 'rejected'>('overview');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [expandedMilestoneAction, setExpandedMilestoneAction] = useState<{ projectId: string; idx: number } | null>(null);
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ projectId: string; itemId: string } | null>(null);
  // Popup state
  const [popupTab, setPopupTab] = useState<'details' | 'milestones' | 'uploads' | 'chat' | 'updates'>('details');
  const [popupExpandedM, setPopupExpandedM] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Merge store.projects with NTP-approved sell projects (SOP wave function)
  // This ensures active deals are visible on the installer portal for M1-M7 workflow
  const installerName = user?.companyName || user?.name || 'Installer';
  const existingSellProjectIds = useMemo(() => new Set(store.projects.map(p => (p as any)._sellProjectId).filter(Boolean)), [store.projects]);
  const sellDerivedProjects = useMemo(() => getActiveSellProjects(store.sellProjects, existingSellProjectIds), [store.sellProjects, existingSellProjectIds]);
  const installerProjects = useMemo(() => [...store.projects, ...sellDerivedProjects], [store.projects, sellDerivedProjects]);
  const completedCount = installerProjects.filter(p => p.currentMilestone >= 5).length;
  const activeCount = installerProjects.filter(p => p.status !== 'completed').length;
  // Compute avg days to PTO from real project data
  const completedProjectDays = installerProjects
    .filter(p => p.currentMilestone >= 6 && p.addedDate)
    .map(p => {
      const start = new Date(p.addedDate).getTime();
      const now = Date.now();
      return Math.round((now - start) / (1000 * 60 * 60 * 24));
    });
  const avgDaysToPTO = completedProjectDays.length > 0
    ? Math.round(completedProjectDays.reduce((a, b) => a + b, 0) / completedProjectDays.length)
    : 0;

  // On-time rate: projects where current milestone is on or ahead of schedule
  // For beta, derive from milestone progress vs elapsed time
  const onTimeCount = installerProjects.filter(p => {
    if (!p.addedDate) return false;
    const daysElapsed = (Date.now() - new Date(p.addedDate).getTime()) / (1000 * 60 * 60 * 24);
    const expectedMilestone = Math.min(7, Math.floor(daysElapsed / 14)); // ~2 weeks per milestone
    return p.currentMilestone >= expectedMilestone;
  }).length;
  const onTimeRate = installerProjects.length > 0
    ? Math.round((onTimeCount / installerProjects.length) * 100)
    : 0;
  const totalInstallValue = installerProjects.reduce((s, p) => s + p.projectCost, 0);
  const speedBonusEarned = installerProjects.filter(p => p.currentMilestone >= 6).length * (totalInstallValue / Math.max(installerProjects.length, 1) * 0.05);

  const tierLevel = completedCount >= 15 ? 3 : completedCount >= 5 ? 2 : 1;
  const tierNames = ['Entry', 'Proven', 'Premier'];
  const tierColors = ['text-muted-foreground', 'text-[hsl(var(--blue))]', 'text-[hsl(var(--yellow))]'];

  const selectedProjectData = selectedProject ? installerProjects.find(p => p.id === selectedProject) : null;

  const pendingActions = installerProjects.reduce((count, p) => {
    const sop = MILESTONE_SOPS[p.currentMilestone];
    if (!sop) return count;
    const ms = store.getMilestoneState(p.id);
    return count + sop.checklist.filter(c => c.actor === 'installer' && !ms.checklistDone[c.id]).length;
  }, 0);

  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_FILE_SIZE_MB = 25;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUpload || !e.target.files?.length) return;
    const file = e.target.files[0];

    // File type validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Accepted: JPG, PNG, WebP, PDF, DOC/DOCX`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    store.uploadFile(pendingUpload.projectId, pendingUpload.itemId, file.name);
    toast.success(`Uploaded: ${file.name}`);
    setPendingUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (projectId: string, itemId: string) => {
    setPendingUpload({ projectId, itemId });
    fileInputRef.current?.click();
  };

  const handleDocUpload = (projectId: string) => {
    const fileName = `installer-doc-${Date.now()}.pdf`;
    store.addFinancierUpload(projectId, fileName, 'document', installerName);
  };

  const handlePhotoUpload = (projectId: string) => {
    const fileName = `install-photo-${Date.now()}.jpg`;
    store.addFinancierUpload(projectId, fileName, 'photo', installerName);
  };

  // Enhanced project detail popup
  const renderProjectDetail = () => {
    if (!selectedProjectData) return null;
    const p = selectedProjectData;
    const ms = store.getMilestoneState(p.id);
    const funded = Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones));
    const fundedPct = Math.round((funded / Math.max(p.projectCost, 1)) * 100);
    const offset = Math.round((parseFloat(p.systemSize || '0') * 1350 / (p.annualUsage || 1)) * 100);
    const projectTickets = store.getTicketsForProject(p.id);
    const projectUploads = store.financierUploads[p.id] || [];
    const projectUpdates = store.financierUpdates[p.id] || [];
    const projectMsgs = store.projectMessages[p.id] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-4 sm:items-center sm:pb-0 modal-backdrop-enter" onClick={() => { setSelectedProject(null); setPopupTab('details'); setPopupExpandedM(null); }}>
        <div className="bg-card border-2 border-muted rounded-2xl w-full max-w-3xl max-h-[75vh] overflow-hidden m-4 shadow-lg flex flex-col modal-content-enter" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-black text-card-foreground">{p.customerName}</h2>
              <div className="text-xs text-muted-foreground">{p.id} · {p.stage} · {p.systemSize}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteProject({ id: p.id, name: p.customerName })}
                className="px-3 py-1.5 bg-destructive/10 border border-destructive/25 rounded-lg text-[10px] font-bold text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-3 py-1.5 bg-[hsl(var(--yellow))]/10 border border-[hsl(var(--yellow))]/25 rounded-lg text-[10px] font-bold text-[hsl(var(--yellow))] hover:bg-[hsl(var(--yellow))]/20 transition-all flex items-center gap-1"
              >
                <Flag className="w-3 h-3" /> Reject
              </button>
              <button
                onClick={() => setShowTicketModal(true)}
                className="px-3 py-1.5 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/25 rounded-lg text-[10px] font-bold text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/20 transition-all flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" /> Create Ticket
              </button>
              <button onClick={() => { setSelectedProject(null); setPopupTab('details'); }} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-2 border-b border-border flex gap-1 shrink-0">
            {([
              { key: 'details', label: 'Details', icon: Info },
              { key: 'milestones', label: 'Milestones', icon: ClipboardCheck },
              { key: 'uploads', label: 'Uploads', icon: Upload },
              { key: 'chat', label: 'Chat', icon: MessageSquare },
              { key: 'updates', label: 'Updates', icon: History },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setPopupTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                  popupTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <t.icon className="w-3 h-3" /> {t.label}
                {t.key === 'chat' && projectMsgs.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 bg-primary/20 text-primary rounded-full text-[8px] font-extrabold">{projectMsgs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {popupTab === 'details' && (
              <div className="space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { label: 'System Cost', value: `$${p.projectCost.toLocaleString()}`, color: 'text-card-foreground' },
                    { label: 'Capital Released', value: `$${funded.toLocaleString()}`, color: 'text-[hsl(var(--green))]' },
                    { label: 'Funded %', value: `${fundedPct}%`, color: fundedPct >= 50 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]' },
                    { label: 'Offset', value: `${offset}%`, color: offset >= 80 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]' },
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
                    <div className="flex justify-between"><span className="text-muted-foreground">Annual Usage</span><span className="font-bold text-card-foreground">{(p.annualUsage || 0).toLocaleString()} kWh</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Roof</span><span className={`font-bold ${p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>{p.roofCondition.replace('_', ' ')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Inverter</span><span className="font-bold text-card-foreground">Enphase IQ8+</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rep</span><span className="font-bold text-card-foreground">{p.repName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Financier</span><span className="font-bold text-card-foreground">ASP Capital</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-bold text-primary">${p.contractValue.toLocaleString()}</span></div>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</span>
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

                {/* M1-7 Quick View */}
                <TooltipProvider delayDuration={200}>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {MILESTONE_SOPS.map((sop, i) => {
                      const isPassed = i < p.currentMilestone;
                      const isCurrent = i === p.currentMilestone;
                      const fundSt = ms.fundStatus[i] || 'none';
                      const amount = Math.round(p.projectCost * (sop.fundPercent / 100));
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => { setPopupTab('milestones'); setPopupExpandedM(i); }}
                              className={`rounded-xl p-2 text-center border cursor-pointer transition-all hover:scale-105 ${
                                isPassed ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-primary/5 border-primary/20'
                                : isCurrent ? 'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                                : 'bg-muted border-border'
                              }`}
                            >
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
                            <div className="text-[9px] text-muted-foreground mt-1 italic">Click to view details →</div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>

                {/* Capital Progress */}
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Capital Released</span>
                    <span className="text-sm font-black text-[hsl(var(--green))]">${funded.toLocaleString()} / ${p.projectCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${fundedPct}%` }} />
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-muted/50 border border-border rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">Project Timeline</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span className="font-bold text-card-foreground">{p.dates?.submitted || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Site Survey</span><span className="font-bold text-card-foreground">{p.dates?.siteSurvey || 'Pending'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">SOW Confirmed</span><span className="font-bold text-card-foreground">{p.dates?.sowConfirmed || 'Pending'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Permit</span><span className="font-bold text-card-foreground">{p.dates?.permitSubmitted || 'Pending'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last HO Contact</span><span className="font-bold text-card-foreground">{p.dates?.lastHOContact || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Open Tickets for this project */}
                {projectTickets.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">Active Tickets ({projectTickets.filter(t => t.status !== 'resolved').length})</h3>
                    {projectTickets.filter(t => t.status !== 'resolved').map(t => (
                      <div key={t.id} className="bg-[hsl(var(--red))]/5 border border-[hsl(var(--red))]/20 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-card-foreground">{t.subject}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                            t.priority === 'critical' || t.priority === 'high' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                            'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25'
                          }`}>{t.priority}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">{t.id} · Created {t.createdAt} · {t.messages.length} message(s)</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {popupTab === 'milestones' && (
              <div className="space-y-2">
                {MILESTONE_SOPS.map((sop, i) => {
                  const isPassed = i < p.currentMilestone;
                  const isCurrent = i === p.currentMilestone;
                  const fundSt = ms.fundStatus[i] || 'none';
                  const isExpM = popupExpandedM === i;
                  const amount = Math.round(p.projectCost * (sop.fundPercent / 100));

                  return (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors ${isCurrent ? 'bg-primary/5' : ''}`}
                        onClick={() => setPopupExpandedM(isExpM ? null : i)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                            isPassed ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                            isCurrent ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                            'bg-muted text-muted-foreground'
                          }`}>M{i + 1}</div>
                          <div>
                            <div className="text-xs font-bold text-card-foreground">{sop.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              {isPassed ? <><CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> Completed</> : isCurrent ? <><Clock className="w-3 h-3 text-[hsl(var(--yellow))]" /> In Progress</> : <><Clock className="w-3 h-3" /> Pending</>}
                              {' · '}{sop.fundPercent}% · ${(amount / 1000).toFixed(1)}K
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
                          {isExpM ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpM && (() => {
                        const isLocked = i > p.currentMilestone;
                        return (
                        <div className="border-t border-border px-4 py-3">
                          {/* Soft-lock: future milestones show checklist read-only */}
                          {isLocked && (
                            <div className="flex items-center gap-2 px-3 py-2.5 mb-3 bg-muted/70 border border-border rounded-lg">
                              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground font-bold">
                                <Lock className="w-3.5 h-3.5 inline-block mr-1 opacity-70" /> Locked — Complete M{p.currentMilestone + 1} ({MILESTONE_SOPS[p.currentMilestone]?.name}) and get Ops approval first
                              </span>
                            </div>
                          )}
                          <div className={`bg-muted/50 rounded-lg p-3 space-y-2 ${isLocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>
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
                                      <div className="mt-1 text-[10px] text-muted-foreground italic">{isLocked ? 'Locked' : 'Awaiting completion...'}</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {ms.opsNotes[i] && (
                              <div className="mt-2 bg-primary/5 border border-primary/15 rounded-lg p-3">
                                <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Backend Ops Notes</div>
                                <div className="text-xs text-card-foreground">{ms.opsNotes[i]}</div>
                              </div>
                            )}
                          </div>
                          {/* Submit Milestone for QC Review */}
                          {isCurrent && (() => {
                            const instItems = sop.checklist.filter(c => c.actor === 'installer');
                            const allDone = instItems.length > 0 && instItems.every(c => ms.checklistDone[c.id]);
                            const submitted = ms.installerSubmitted?.[i];
                            return (
                              <div className="mt-3 pt-3 border-t border-white/5">
                                {submitted ? (
                                  <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--green))]">
                                    <CheckCircle className="w-4 h-4" /> Submitted for QC — awaiting Backend Ops
                                  </div>
                                ) : (
                                  <button
                                    disabled={!allDone}
                                    onClick={() => {
                                      store.submitMilestoneForQC(p.id, i);
                                      if (user && !user.isDemo) {
                                        const mNames = ['SOW Confirmed', 'Permit + Materials', 'Install Scheduled', 'Install Complete', 'Utility Inspection', 'PTO Granted', 'Speed Bonus'];
                                        const pcts = ['15%', '20%', '15%', '20%', '20%', '10%', '5%'];
                                        cascadeMilestoneCompleted(p.id, user.id, p.customerName, mNames[i] || `M${i+1}`, pcts[i] || '');
                                      }
                                      // Gamification: award tickets for milestone submission
                                      gamification.earnTickets(3).catch(() => {});
                                      setShowCelebration(true);
                                      toast.success(`M${i + 1} submitted for QC review`);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary/25 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    <ClipboardCheck className="w-4 h-4" /> Submit M{i + 1} for QC Review
                                  </button>
                                )}
                                {!allDone && !submitted && (
                                  <div className="text-[10px] text-muted-foreground mt-1.5">Complete all installer checklist items first</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}

            {popupTab === 'uploads' && (
              <div className="space-y-4">
                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary', 'bg-primary/10', 'scale-[1.01]'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'scale-[1.01]'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'scale-[1.01]');
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (!['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                        toast.error('Invalid file type. Accepted: JPG, PNG, WebP, PDF, DOC/DOCX');
                        return;
                      }
                      if (file.size > 25 * 1024 * 1024) { toast.error('File too large. Maximum: 25MB'); return; }
                      const type = file.type.startsWith('image/') ? 'photo' : 'document';
                      store.addFinancierUpload(p.id, file.name, type as any, installerName);
                      toast.success(`Uploaded: ${file.name}`);
                      // Brief success flash
                      e.currentTarget.classList.add('ring-2', 'ring-[hsl(var(--green))]', 'bg-[hsl(var(--green))]/10');
                      setTimeout(() => e.currentTarget?.classList.remove('ring-2', 'ring-[hsl(var(--green))]', 'bg-[hsl(var(--green))]/10'), 1200);
                    }
                  }}
                  className="border-2 border-dashed border-border rounded-xl p-5 text-center transition-all duration-300 cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2 transition-transform group-hover:scale-110" />
                  <p className="text-xs font-bold text-muted-foreground">Drag & drop files here or click to browse</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WebP, PDF, DOC · Max 25MB</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDocUpload(p.id)}
                    className="px-3 py-2 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 active:scale-[0.97]"
                  >
                    <FileText className="w-3.5 h-3.5" /> Upload Document
                  </button>
                  <button
                    onClick={() => handlePhotoUpload(p.id)}
                    className="px-3 py-2 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-lg text-xs font-bold text-[hsl(var(--blue))] hover:bg-[hsl(var(--blue))]/20 transition-all flex items-center gap-1.5 active:scale-[0.97]"
                  >
                    <Camera className="w-3.5 h-3.5" /> Upload Photo
                  </button>
                </div>

                {projectUploads.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No uploads yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectUploads.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3 border border-border">
                        {u.type === 'document' ? <FileText className="w-4 h-4 text-primary shrink-0" /> : <Camera className="w-4 h-4 text-[hsl(var(--blue))] shrink-0" />}
                        <div className="flex-1">
                          <div className="text-xs font-bold text-card-foreground">{u.fileName}</div>
                          <div className="text-[10px] text-muted-foreground">{u.uploadedBy} · {u.uploadedAt}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.type === 'document' ? 'bg-primary/10 text-primary' : 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]'}`}>
                          {u.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {popupTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-3 mb-4 max-h-[35vh] overflow-y-auto">
                  {projectMsgs.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No messages yet. Start the conversation below.</p>
                    </div>
                  ) : (
                    projectMsgs.map((m, i) => (
                      <div key={i} className={`flex gap-2.5 max-w-[80%] ${m.role === 'installer' ? 'self-end flex-row-reverse ml-auto' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          m.role === 'installer' ? 'bg-primary/15' : m.role === 'ops' ? 'bg-[hsl(var(--blue))]/15' : 'bg-muted'
                        }`}>
                          {m.role === 'installer' ? <Wrench className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                            m.role === 'installer' ? 'bg-primary text-primary-foreground font-semibold rounded-br-sm' : 'bg-muted text-card-foreground border border-border rounded-bl-sm'
                          }`}>
                            {m.text}
                          </div>
                          <div className={`text-[10px] text-muted-foreground mt-1 ${m.role === 'installer' ? 'text-right pr-1' : 'pl-1'}`}>
                            {m.sender} · {m.time}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        store.addProjectMessage(p.id, { sender: installerName, role: 'installer', text: chatInput.trim(), time: 'Now' });
                        setChatInput('');
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2.5 bg-muted border border-border rounded-lg text-sm text-card-foreground outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        store.addProjectMessage(p.id, { sender: installerName, role: 'installer', text: chatInput.trim(), time: 'Now' });
                        setChatInput('');
                      }
                    }}
                    className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-extrabold rounded-lg hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            )}

            {popupTab === 'updates' && (
              <div className="space-y-4">
                {/* Add update */}
                <div className="bg-muted/50 border border-border rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-2">Post an Update</h3>
                  <textarea
                    value={newUpdateText}
                    onChange={e => setNewUpdateText(e.target.value)}
                    placeholder="Add a project update note..."
                    rows={2}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-card-foreground outline-none focus:border-primary resize-none mb-2"
                  />
                  <button
                    onClick={() => {
                      if (newUpdateText.trim()) {
                        store.addFinancierUpdate(p.id, newUpdateText.trim(), installerName);
                        setNewUpdateText('');
                      }
                    }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Post Update
                  </button>
                </div>

                {/* Update history */}
                {projectUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No updates yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...projectUpdates].reverse().map((u, i) => (
                      <div key={i} className="bg-muted rounded-lg px-4 py-3 border border-border">
                        <div className="text-xs text-card-foreground">{u.text}</div>
                        <div className="text-[10px] text-muted-foreground mt-1.5">— {u.author} · {u.timestamp}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ticket creation modal */}
        {showTicketModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowTicketModal(false)}>
            <div className="bg-card border-2 border-muted rounded-xl p-6 w-[440px] shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-black text-card-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--red))]" />
                Create Ticket for Backend Ops
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={e => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-card-foreground outline-none focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Subject</label>
                  <textarea
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-card-foreground outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setShowTicketModal(false)} className="px-4 py-2 bg-muted border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-card-foreground transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (ticketSubject.trim()) {
                      store.createTicket({
                        projectId: p.id,
                        subject: ticketSubject.trim(),
                        priority: ticketPriority,
                        status: 'open',
                        createdAt: new Date().toISOString().split('T')[0],
                        createdBy: installerName,
                        createdByRole: 'installer',
                        messages: [{ sender: installerName, role: 'installer', text: ticketSubject.trim(), time: 'Now' }],
                      });
                      setTicketSubject('');
                      setShowTicketModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-[hsl(var(--red))]/15 border border-[hsl(var(--red))]/30 rounded-lg text-xs font-bold text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/25 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Project Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowRejectModal(false)}>
            <div className="bg-card border-2 border-muted rounded-xl p-6 w-[440px] shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-black text-card-foreground mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--yellow))]" />
                Reject Project
              </h3>
              <p className="text-xs text-muted-foreground mb-4">This project will be moved to the Rejected queue and can be routed to a different installer.</p>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Reason for Rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g., Cannot service this area, scheduling conflict, roof issues..."
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
                      store.rejectProject(p.id, rejectReason.trim(), installerName, 'installer');
                      toast.success(`${p.customerName} rejected — routed to reassignment queue`);
                      setShowRejectModal(false);
                      setRejectReason('');
                      setSelectedProject(null);
                    }
                  }}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-[hsl(var(--yellow))]/15 border border-[hsl(var(--yellow))]/30 rounded-lg text-xs font-bold text-[hsl(var(--yellow))] hover:bg-[hsl(var(--yellow))]/25 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Flag className="w-3.5 h-3.5" /> Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
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
              <CheckCircle className="w-8 h-8 text-[hsl(var(--green))]" />
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
                              <div className="mt-1 text-[10px] text-[hsl(var(--green))] font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateEntry}</div>
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
                    {/* Submit for QC */}
                    {(() => {
                      const allDone = installerItems.length > 0 && installerItems.every(c => ms.checklistDone[c.id]);
                      const submitted = ms.installerSubmitted?.[p.currentMilestone];
                      return (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          {submitted ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--green))]">
                              <CheckCircle className="w-4 h-4" /> Submitted for QC — awaiting Backend Ops
                            </div>
                          ) : (
                            <button
                              disabled={!allDone}
                              onClick={() => {
                                store.submitMilestoneForQC(p.id, p.currentMilestone);
                                if (user && !user.isDemo) {
                                  const mNames = ['SOW Confirmed', 'Permit + Materials', 'Install Scheduled', 'Install Complete', 'Utility Inspection', 'PTO Granted', 'Speed Bonus'];
                                  const pcts = ['15%', '20%', '15%', '20%', '20%', '10%', '5%'];
                                  cascadeMilestoneCompleted(p.id, user.id, p.customerName, mNames[p.currentMilestone] || `M${p.currentMilestone+1}`, pcts[p.currentMilestone] || '');
                                }
                                gamification.earnTickets(3).catch(() => {});
                                setShowCelebration(true);
                                toast.success(`M${p.currentMilestone + 1} submitted for QC review`);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/15 text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary/25 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ClipboardCheck className="w-4 h-4" /> Submit M{p.currentMilestone + 1} for QC Review
                            </button>
                          )}
                          {!allDone && !submitted && (
                            <div className="text-[10px] text-muted-foreground mt-1.5">Complete all installer items first</div>
                          )}
                        </div>
                      );
                    })()}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {[
                { label: 'Active Projects', value: activeCount.toString(), icon: Wrench, color: 'text-primary' },
                { label: 'Avg Days to PTO', value: `${avgDaysToPTO}d`, icon: Timer, color: 'text-[hsl(var(--blue))]' },
                { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: TrendingUp, color: 'text-primary' },
                { label: 'Pending Actions', value: pendingActions.toString(), icon: AlertTriangle, color: pendingActions > 0 ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--green))]' },
              ].map((s, i) => (
                <div key={i} className="glass-panel stat-glow p-5 stat-card-hover transition-all duration-300 hover-lift">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className={`metric-display ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

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
              <div className="glass-panel p-5">
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

              <div className="glass-panel p-5">
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
            <div className="glass-panel overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-card-foreground flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Active Projects</h3>
                <button onClick={() => setActiveSection('projects')} className="text-xs text-primary font-bold hover:underline">View All →</button>
              </div>
              {installerProjects.filter(p => p.status === 'active' || p.status === 'delayed').slice(0, 5).map(p => {
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
                        <span><span className="font-bold text-card-foreground">${(p.projectCost / 1000).toFixed(1)}K</span> system cost</span>
                        <span><span className={`font-bold ${fundedPct >= 50 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>{fundedPct}%</span> funded</span>
                        <span>{p.address.split(',')[0]}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {MILESTONE_SOPS.map((_, i) => {
                          const fundSt = ms.fundStatus[i] || 'none';
                          return (
                            <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                              i < p.currentMilestone
                                ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/20 text-[hsl(var(--green))]' : 'bg-primary text-primary-foreground'
                                : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' : 'bg-muted text-muted-foreground'
                            }`}>M{i + 1}</div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'milestones':
        return renderMilestoneActions();

      case 'projects':
        return (
          <div className="space-y-3">
            {/* Project filter dropdown */}
            {installerProjects.length > 1 && (
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={expandedProject || ''}
                  onChange={e => setExpandedProject(e.target.value || null)}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-full max-w-xs"
                >
                  <option value="">All Projects ({installerProjects.length})</option>
                  {installerProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.customerName} — {p.id}</option>
                  ))}
                </select>
              </div>
            )}
            {installerProjects.length === 0 && (
              <div className="text-center py-12 bg-card border border-border rounded-2xl">
                <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm font-bold text-card-foreground mb-1">No assigned projects yet</div>
                <div className="text-xs text-muted-foreground max-w-xs mx-auto">Projects will appear here once they've been converted from the sales pipeline and assigned to your installer account.</div>
              </div>
            )}
            {installerProjects.map(p => {
              const isExpanded = expandedProject === p.id;
              const ms = store.getMilestoneState(p.id);
              const funded = Math.round(p.projectCost * (p.currentMilestone / p.totalMilestones));
              const fundedPct = Math.round((funded / Math.max(p.projectCost, 1)) * 100);
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden card-press">
                  <div className="flex gap-px h-1.5">
                    {Array.from({ length: p.totalMilestones }).map((_, i) => (
                      <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.systemSize} · {p.battery} · ${p.soldPPW.toFixed(2)}/W</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {MILESTONE_SOPS.map((_, i) => {
                          const fundSt = ms.fundStatus[i] || 'none';
                          return (
                            <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                              i < p.currentMilestone
                                ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/20 text-[hsl(var(--green))]' : 'bg-primary text-primary-foreground'
                                : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' : 'bg-muted text-muted-foreground'
                            }`}>M{i + 1}</div>
                          );
                        })}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-[hsl(var(--green))]">${p.projectCost.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">{fundedPct}% funded</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        p.stage === 'Install Complete' || p.stage === 'PTO Granted' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' :
                        p.stage === 'Permit Submitted' || p.stage === 'Install Scheduled' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]' :
                        'bg-primary/10 text-primary'
                      }`}>{p.stage}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4">
                      {/* Accept Project — required before M1 submission */}
                      {!p.installerAccepted && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-primary/[0.06] border border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-card-foreground">Accept Project Assignment</div>
                              <div className="text-[10px] text-muted-foreground">Review SOW and accept before starting M1 — Contract Signed</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              store.updateProject({ ...p, installerAccepted: true } as any);
                              toast.success(`Project accepted — ${p.customerName}. You can now begin M1 submission.`);
                            }}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept Project
                          </button>
                        </motion.div>
                      )}
                      {/* M1-M7 Visual Timeline */}
                      <MilestoneTimeline currentMilestone={p.currentMilestone} fundStatus={ms.fundStatus} />
                      {/* Quick Info */}
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 text-xs bg-muted/50 rounded-xl p-3">
                        <div><span className="text-muted-foreground">System:</span> <span className="font-bold text-card-foreground">{p.systemSize}</span></div>
                        <div><span className="text-muted-foreground">Battery:</span> <span className="font-bold text-card-foreground">{p.battery}</span></div>
                        <div><span className="text-muted-foreground">PPW:</span> <span className="font-bold text-card-foreground">${p.soldPPW.toFixed(2)}</span></div>
                        <div><span className="text-muted-foreground">Offset:</span> <span className={`font-bold ${Math.round((parseFloat(p.systemSize || '0') * 1350 / (p.annualUsage || 1)) * 100) >= 80 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>{Math.round((parseFloat(p.systemSize || '0') * 1350 / (p.annualUsage || 1)) * 100)}%</span></div>
                        <div><span className="text-muted-foreground">Rep:</span> <span className="font-bold text-card-foreground">{p.repName}</span></div>
                        <div><span className="text-muted-foreground">Usage:</span> <span className="font-bold text-card-foreground">{(p.annualUsage || 0).toLocaleString()} kWh</span></div>
                        <div><span className="text-muted-foreground">Roof:</span> <span className={`font-bold ${p.roofCondition === 'good' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>{p.roofCondition.replace('_', ' ')}</span></div>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.address}</span>
                      </div>

                      {/* Milestone Payments */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Milestone Payments</h4>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {MILESTONE_SOPS.map((sop, i) => {
                            const amount = Math.round(p.projectCost * (sop.fundPercent / 100));
                            const isPassed = i < p.currentMilestone;
                            const isCurrent = i === p.currentMilestone;
                            const fundSt = ms.fundStatus[i] || 'none';
                            return (
                              <div key={i} className={`rounded-xl p-3 text-center border cursor-pointer hover:scale-105 transition-all ${
                                isPassed ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-primary/5 border-primary/20'
                                : isCurrent ? 'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                                : 'bg-muted border-border'
                              }`} onClick={() => setSelectedProject(p.id)}>
                                <div className={`text-xs font-extrabold ${isPassed ? 'text-[hsl(var(--green))]' : isCurrent ? 'text-[hsl(var(--yellow))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                                <div className={`text-sm font-black ${isPassed ? 'text-[hsl(var(--green))]' : 'text-card-foreground'}`}>${(amount / 1000).toFixed(1)}K</div>
                                <div className="text-[9px] text-muted-foreground">{sop.fundPercent}%</div>
                                {isPassed && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-1" />}
                                {isCurrent && <Clock className="w-3 h-3 text-[hsl(var(--yellow))] mx-auto mt-1" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <button onClick={() => setSelectedProject(p.id)} className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Details
                        </button>
                        <button onClick={() => { setSelectedProject(p.id); setPopupTab('milestones'); }} className="px-3 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-lg text-xs font-bold text-[hsl(var(--blue))] hover:bg-[hsl(var(--blue))]/20 transition-all flex items-center gap-1">
                          <ClipboardCheck className="w-3 h-3" /> Milestones
                        </button>
                        <button onClick={() => { setSelectedProject(p.id); setPopupTab('chat'); }} className="px-3 py-1.5 bg-[hsl(var(--green))]/10 border border-[hsl(var(--green))]/25 rounded-lg text-xs font-bold text-[hsl(var(--green))] hover:bg-[hsl(var(--green))]/20 transition-all flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Chat
                        </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

      case 'tickets': {
        const allTickets = store.tickets || [];
        return (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-[hsl(var(--red))]" /> Flagged Accounts
              </h3>
              {allTickets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-[hsl(var(--green))] mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No active tickets — all clear</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTickets.map(t => {
                    const proj = store.projects.find(p => p.id === t.projectId);
                    const custName = proj?.customerName || t.projectId;
                    return (
                      <div key={t.id} className={`rounded-xl border p-4 ${
                        t.status === 'resolved' ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' :
                        t.priority === 'high' || t.priority === 'critical' ? 'bg-[hsl(var(--red))]/5 border-[hsl(var(--red))]/20' :
                        'bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Flag className="w-3.5 h-3.5 text-[hsl(var(--red))]" />
                            <span className="text-xs font-extrabold text-card-foreground">{t.id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                              t.priority === 'high' || t.priority === 'critical' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                              'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25'
                            }`}>{t.priority}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${t.status === 'resolved' ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--yellow))]'}`}>
                            {((t.status || 'unknown').replace('_', ' '))}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-card-foreground mb-2">
                          <Flag className="w-3 h-3 text-[hsl(var(--red))] inline mr-1" />
                          Account for <span className="text-primary">{custName}</span> flagged
                        </div>
                        <div className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3">{t.description}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'rejected': {
        const rejected = store.getRejectedProjects();
        return (
          <div className="space-y-4">
            <div className="glass-panel p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-1 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-[hsl(var(--red))]" /> Rejected Projects
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Projects rejected by an installer or financier. Reassign to route to a new party.</p>

              {rejected.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-[hsl(var(--green))] mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">No rejected projects</p>
                </div>
              ) : rejected.map((r, idx) => (
                <div key={r.project.id} className="bg-muted rounded-xl border border-border p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-card-foreground">{r.project.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{r.project.id} · {r.project.systemSize} · ${r.project.projectCost.toLocaleString()}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] rounded text-[9px] font-bold uppercase">{r.rejectedByRole}</span>
                  </div>
                  <div className="bg-card/50 border border-border rounded-lg p-3 mb-3">
                    <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">Rejection Reason</div>
                    <div className="text-xs text-card-foreground">{r.reason}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">By {r.rejectedBy} · {new Date(r.rejectedAt).toLocaleDateString()}</div>
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
      <CelebrationAnimation trigger={showCelebration} onComplete={() => setShowCelebration(false)} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      <div ref={sectionNavRef} className="relative flex gap-1.5">
        {/* Animated background pill */}
        <motion.div
          className="absolute top-0 h-full rounded-xl bg-primary"
          style={{ zIndex: 0 }}
          animate={{ left: sectionIndicator.left, width: sectionIndicator.width }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
        />
        {([
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'milestones', label: 'Milestones', icon: ClipboardCheck },
          { key: 'projects', label: 'Projects', icon: Wrench },
          { key: 'payments', label: 'Payments', icon: DollarSign },
          { key: 'tickets', label: 'Tickets', icon: Flag },
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
            {s.key === 'milestones' && pendingActions > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${activeSection === s.key ? 'bg-white/20 text-white' : 'bg-[hsl(var(--yellow))] text-black'}`}>{pendingActions}</span>
            )}
            {s.key === 'rejected' && store.getRejectedProjects().filter(r => r.rejectedByRole === 'installer').length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${activeSection === s.key ? 'bg-white/20 text-white' : 'bg-[hsl(var(--red))] text-white'}`}>{store.getRejectedProjects().filter(r => r.rejectedByRole === 'installer').length}</span>
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

export default InstallerPortal;