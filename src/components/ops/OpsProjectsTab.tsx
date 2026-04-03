import { useState, useRef } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { COMMISSIONS } from '@/data/mockData';
import type { Project } from '@/data/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import OpsNotesTextarea from '@/components/ops/OpsNotesTextarea';
import {
  BarChart3, Zap, Battery, MapPin, DollarSign, Mail, Phone, Calendar,
  ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, FileText, Camera,
  Shield, Eye, Send, Upload, ClipboardCheck, MessageSquare, Save, RotateCcw,
  Pencil, UserPlus, Link2, AlertTriangle, Trash2
} from 'lucide-react';
import DeleteProjectDialog from '@/components/shared/DeleteProjectDialog';

interface OpsProjectsTabProps {
  acceptedDeals?: Project[];
}

const OpsProjectsTab = ({ acceptedDeals = [] }: OpsProjectsTabProps) => {
  const store = useDataSource();
  const allProjects = [...store.projects, ...acceptedDeals.filter(d => !store.projects.some(p => p.id === d.id))];

  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Record<string, 'milestones' | 'edit'>>({});
  const [expandedMilestone, setExpandedMilestone] = useState<{ projectId: string; idx: number } | null>(null);

  // Editor state
  const [editedFields, setEditedFields] = useState<Record<string, Record<string, string>>>({});
  const [savedProjects, setSavedProjects] = useState<string[]>([]);
  const [auroraAccounts, setAuroraAccounts] = useState<Record<string, { email: string; status: string }>>({});
  const [deleteProject, setDeleteProject] = useState<{ id: string; name: string; code?: string } | null>(null);
  const [showAuroraModal, setShowAuroraModal] = useState<string | null>(null);
  const [auroraEmail, setAuroraEmail] = useState('');

  // Milestone report state
  const [reportModal, setReportModal] = useState<{ projectId: string; itemId: string; label: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ projectId: string; itemId: string } | null>(null);

  const getOffsetPercent = (p: Project) => {
    const systemKw = parseFloat(p.systemSize);
    const annualProduction = systemKw * 1350;
    return Math.round((annualProduction / p.annualUsage) * 100);
  };

  // Editor helpers
  const handleFieldChange = (projectId: string, field: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [projectId]: { ...(prev[projectId] || {}), [field]: value } }));
  };
  const getFieldValue = (projectId: string, field: string, original: string) => editedFields[projectId]?.[field] ?? original;
  const hasChanges = (projectId: string) => Object.keys(editedFields[projectId] || {}).length > 0;
  const handleSave = (projectId: string) => {
    setSavedProjects(prev => [...prev, projectId]);
    setTimeout(() => setSavedProjects(prev => prev.filter(id => id !== projectId)), 2000);
  };
  const handleRevert = (projectId: string) => {
    setEditedFields(prev => { const next = { ...prev }; delete next[projectId]; return next; });
  };
  const handleCreateAurora = (projectId: string) => {
    if (!auroraEmail.trim()) return;
    setAuroraAccounts(prev => ({ ...prev, [projectId]: { email: auroraEmail, status: 'active' } }));
    setShowAuroraModal(null);
    setAuroraEmail('');
  };

  // File upload helpers
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
  const handleReportSubmit = () => {
    if (!reportModal || !reportText.trim()) return;
    store.setTextEntry(reportModal.projectId, reportModal.itemId, reportText);
    store.toggleChecklist(reportModal.projectId, reportModal.itemId, true);
    setReportModal(null);
    setReportText('');
  };

  const getSection = (pid: string) => activeSection[pid] || 'milestones';

  const statusColors: Record<string, string> = {
    active: 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border-[hsl(var(--green))]/30',
    delayed: 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/30',
    on_hold: 'bg-[hsl(var(--red))]/15 text-[hsl(var(--red))] border-[hsl(var(--red))]/30',
    completed: 'bg-primary/15 text-primary border-primary/30',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 animate-fade-in-up">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Projects
          </h2>
          <span className="text-xs text-muted-foreground">{allProjects.length} projects</span>
        </div>

        <div className="space-y-3">
          {allProjects.map(p => {
            const isExpanded = expandedProject === p.id;
            const offset = getOffsetPercent(p);
            const offsetOk = offset >= 80;
            const milestoneState = store.getMilestoneState(p.id);
            const comm = COMMISSIONS.find(c => c.projectId === p.id);
            const section = getSection(p.id);

            return (
              <div key={p.id} className="bg-[hsl(var(--bg2))] border border-border rounded-xl overflow-hidden">
                {/* Progress bar */}
                <div className="flex gap-px h-1">
                  {Array.from({ length: p.totalMilestones }).map((_, i) => (
                    <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                  ))}
                </div>

                {/* Project Header */}
                <div
                  onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[hsl(var(--bg3))] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{p.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${offsetOk ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border-[hsl(var(--green))]/30' : 'bg-[hsl(var(--red))]/15 text-[hsl(var(--red))] border-[hsl(var(--red))]/30'}`}>
                      {offset}% Offset
                    </span>
                    <div className="flex items-center gap-1">
                      {MILESTONE_SOPS.map((sop, i) => {
                        const fundSt = milestoneState.fundStatus[i];
                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold cursor-help ${
                                i < p.currentMilestone
                                  ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                                    fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                                    'bg-primary/15 text-primary'
                                  : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                                  'bg-[hsl(var(--bg3))] text-muted-foreground'
                              }`}>
                                M{i + 1}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] p-3 bg-[hsl(var(--bg2))] border-border">
                              <div className="text-xs font-black text-foreground mb-1">{sop.name}</div>
                              <div className="text-[10px] text-muted-foreground">{sop.fundPercent}% fund release</div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${statusColors[p.status] || 'bg-primary/10 text-primary border-primary/30'}`}>
                      {p.stage}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Quick Info Bar */}
                    <div className="px-5 py-3 bg-[hsl(var(--bg3))]/50 border-b border-border grid grid-cols-6 gap-4 text-xs">
                      <div><span className="text-muted-foreground">System:</span> <span className="font-bold text-foreground">{p.systemSize}</span></div>
                      <div><span className="text-muted-foreground">Battery:</span> <span className="font-bold text-foreground">{p.battery}</span></div>
                      <div><span className="text-muted-foreground">Installer:</span> <span className="font-bold text-foreground">{p.installerName}</span></div>
                      <div><span className="text-muted-foreground">Rep:</span> <span className="font-bold text-foreground">{p.repName}</span></div>
                      <div><span className="text-muted-foreground">Usage:</span> <span className="font-bold text-foreground">{p.annualUsage.toLocaleString()} kWh</span></div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="font-bold text-foreground truncate">{p.email}</span>
                      </div>
                    </div>

                    {/* Section Tabs */}
                    <div className="px-5 py-2 border-b border-border flex items-center gap-1">
                      <button
                        onClick={() => setActiveSection(prev => ({ ...prev, [p.id]: 'milestones' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${section === 'milestones' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--bg3))]'}`}
                      >
                        <Shield className="w-3 h-3 inline mr-1" /> Milestones & SOP
                      </button>
                      <button
                        onClick={() => setActiveSection(prev => ({ ...prev, [p.id]: 'edit' }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${section === 'edit' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--bg3))]'}`}
                      >
                        <Pencil className="w-3 h-3" /> Edit Project
                        {hasChanges(p.id) && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--yellow))]" />}
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => setDeleteProject({ id: p.id, name: p.customerName, code: p.id })}
                        className="px-3 py-1.5 rounded-md text-xs font-bold text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>

                    {/* Milestones Section */}
                    {section === 'milestones' && (
                      <div>
                        <div className="divide-y divide-border">
                          {MILESTONE_SOPS.map((sop, milestoneIdx) => {
                            const isPassed = milestoneIdx < p.currentMilestone;
                            const isCurrent = milestoneIdx === p.currentMilestone;
                            const isExpandedM = expandedMilestone?.projectId === p.id && expandedMilestone?.idx === milestoneIdx;
                            const fundSt = milestoneState.fundStatus[milestoneIdx] || 'none';
                            const allReady = store.isMilestoneReady(p.id, milestoneIdx);

                            return (
                              <div key={milestoneIdx}>
                                <div
                                  className={`px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[hsl(var(--bg3))]/30 transition-colors ${isCurrent ? 'bg-primary/5' : ''}`}
                                  onClick={() => setExpandedMilestone(isExpandedM ? null : { projectId: p.id, idx: milestoneIdx })}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                                      isPassed ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                                      isCurrent ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                                      'bg-[hsl(var(--bg3))] text-muted-foreground'
                                    }`}>
                                      M{milestoneIdx + 1}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-foreground">{sop.name}</div>
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        {isPassed ? <><CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> Completed</> : isCurrent ? <><Clock className="w-3 h-3 text-[hsl(var(--yellow))]" /> In Progress</> : <><Clock className="w-3 h-3" /> Pending</>} · {sop.fundPercent}% fund release
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isPassed && (
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        fundSt === 'released' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' :
                                        fundSt === 'approved' ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]' :
                                        fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]' :
                                        'bg-[hsl(var(--bg3))] text-muted-foreground'
                                      }`}>
                                        {fundSt === 'released' ? 'Released' : fundSt === 'approved' ? 'Approved' : fundSt === 'pending' ? 'Pending Release' : 'Not Queued'}
                                      </span>
                                    )}
                                    {isExpandedM ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                  </div>
                                </div>

                                {/* Expanded SOP Checklist */}
                                {isExpandedM && (
                                  <div className="px-5 pb-4 space-y-3">
                                    <div className="bg-[hsl(var(--bg3))]/50 rounded-lg p-4">
                                      <div className="text-[10px] text-muted-foreground mb-3 font-bold tracking-wider uppercase">
                                        SOP Checklist — {sop.description}
                                      </div>
                                      <div className="space-y-2">
                                        {sop.checklist.map(item => {
                                          const isDone = milestoneState.checklistDone[item.id];
                                          const uploads = milestoneState.uploads[item.id] || [];
                                          const textEntry = milestoneState.textEntries[item.id];
                                          const dateEntry = milestoneState.dateEntries[item.id];
                                          const isOpsItem = item.actor === 'backend_ops';
                                          const isInstallerItem = item.actor === 'installer';

                                          return (
                                            <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isDone ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-[hsl(var(--bg2))] border-border'}`}>
                                              {isOpsItem && !item.requiresText && (
                                                <button
                                                  onClick={() => store.toggleChecklist(p.id, item.id, !isDone)}
                                                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-[hsl(var(--green))] border-[hsl(var(--green))]' : 'border-border hover:border-primary'}`}
                                                >
                                                  {isDone && <CheckCircle className="w-3 h-3 text-white" />}
                                                </button>
                                              )}
                                              {isInstallerItem && (
                                                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-[hsl(var(--bg3))]'}`}>
                                                  {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                                                </div>
                                              )}
                                              {isOpsItem && item.requiresText && (
                                                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-[hsl(var(--bg3))]'}`}>
                                                  {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <FileText className="w-3 h-3 text-muted-foreground" />}
                                                </div>
                                              )}
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="text-xs font-bold text-foreground">{item.label}</div>
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${isInstallerItem ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]' : 'bg-primary/10 text-primary'}`}>
                                                    {item.actor === 'backend_ops' ? 'OPS' : item.actor === 'installer' ? 'INSTALLER' : item.actor.toUpperCase()}
                                                  </span>
                                                </div>
                                                {item.requiresUpload && (
                                                  <div className="mt-2">
                                                    {uploads.length > 0 ? (
                                                      <div className="space-y-1">
                                                        {uploads.map((f, fi) => (
                                                          <div key={fi} className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--green))]">
                                                            <FileText className="w-3 h-3" /> {f}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : isInstallerItem ? (
                                                      <div className="text-[10px] text-muted-foreground italic">Waiting for installer upload...</div>
                                                    ) : (
                                                      <button onClick={() => triggerUpload(p.id, item.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/25 rounded-md text-[10px] font-bold text-primary hover:bg-primary/20 transition-all">
                                                        <Upload className="w-3 h-3" /> {item.uploadLabel || 'Upload'}
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
                                                {item.requiresText && (
                                                  <div className="mt-2">
                                                    {textEntry ? (
                                                      <div className="bg-[hsl(var(--bg3))] rounded p-2 text-[10px] text-foreground">{textEntry}</div>
                                                    ) : (
                                                      <button
                                                        onClick={() => { setReportModal({ projectId: p.id, itemId: item.id, label: item.textLabel || item.label }); setReportText(''); }}
                                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-md text-[10px] font-bold text-[hsl(var(--blue))] hover:bg-[hsl(var(--blue))]/20 transition-all"
                                                      >
                                                        <MessageSquare className="w-3 h-3" /> Write {item.textLabel || 'Report'}
                                                      </button>
                                                    )}
                                                  </div>
                                                )}
                                                {item.requiresDate && (
                                                  <div className="mt-2">
                                                    {dateEntry ? (
                                                      <div className="text-[10px] text-[hsl(var(--green))] font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateEntry}</div>
                                                    ) : (
                                                      <input type="date" onChange={(e) => store.setDateEntry(p.id, item.id, e.target.value)} className="px-2 py-1 bg-[hsl(var(--bg3))] border border-border rounded text-[10px] text-foreground outline-none focus:border-primary" />
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {isCurrent && (
                                        <div className="mt-4 flex items-center justify-between">
                                          <div className="text-[10px] text-muted-foreground">
                                            {allReady ? 'All checklist items complete' : `${sop.checklist.filter(c => milestoneState.checklistDone[c.id]).length}/${sop.checklist.length} items done`}
                                          </div>
                                          <button
                                            disabled={!allReady}
                                            onClick={() => store.approveMilestone(p.id, milestoneIdx)}
                                            className="px-4 py-2 bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border border-[hsl(var(--green))]/30 rounded-lg text-xs font-bold hover:bg-[hsl(var(--green))]/25 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                                          >
                                            <ClipboardCheck className="w-3.5 h-3.5" /> Approve M{milestoneIdx + 1} & Queue Fund Release
                                          </button>
                                        </div>
                                      )}

                                      {(isCurrent || isPassed) && (
                                        <div className="mt-3">
                                          <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">Ops Notes</div>
                                          <OpsNotesTextarea
                                            value={milestoneState.opsNotes[milestoneIdx] || ''}
                                            onCommit={(val) => store.setOpsNotes(p.id, milestoneIdx, val)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Actions */}
                        <div className="px-5 py-3 bg-[hsl(var(--bg3))]/30 border-t border-border flex items-center gap-3">
                          <a href="https://www.smartmetertexas.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-md text-xs text-[hsl(var(--blue))] font-bold hover:bg-[hsl(var(--blue))]/20 transition-all flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> Smart Meter TX
                          </a>
                          <a href="https://aurorasolar.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-md text-xs text-primary font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> Aurora Design
                          </a>
                          <button className="px-3 py-1.5 bg-[hsl(var(--purple))]/10 border border-[hsl(var(--purple))]/25 rounded-md text-xs text-[hsl(var(--purple))] font-bold hover:bg-[hsl(var(--purple))]/20 transition-all flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5" /> Site Photos
                          </button>
                          <button className="px-3 py-1.5 bg-[hsl(var(--yellow))]/10 border border-[hsl(var(--yellow))]/25 rounded-md text-xs text-[hsl(var(--yellow))] font-bold hover:bg-[hsl(var(--yellow))]/20 transition-all flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5" /> Contact Installer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Section */}
                    {section === 'edit' && (
                      <div className="p-5 space-y-4">
                        {/* Save Bar */}
                        <div className="flex items-center justify-end gap-2">
                          {savedProjects.includes(p.id) && (
                            <span className="text-[10px] font-bold text-[hsl(var(--green))] flex items-center gap-1 animate-fade-in-up">
                              <CheckCircle className="w-3 h-3" /> Saved
                            </span>
                          )}
                          <button onClick={() => handleRevert(p.id)} disabled={!hasChanges(p.id)} className="px-3 py-1.5 bg-[hsl(var(--bg3))] border border-border rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-30 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Revert
                          </button>
                          <button onClick={() => handleSave(p.id)} disabled={!hasChanges(p.id)} className="px-3 py-1.5 bg-primary/15 border border-primary/30 rounded-md text-xs font-bold text-primary hover:bg-primary/25 transition-all disabled:opacity-30 active:scale-95 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Save Changes
                          </button>
                        </div>

                        {/* Editable Fields */}
                        <div className="bg-[hsl(var(--bg3))]/50 rounded-lg p-4">
                          <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3 flex items-center gap-1.5">
                            <Pencil className="w-3 h-3" /> Customer & Project Information
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'First Name', field: 'firstName', value: p.customerName.split(' ')[0] },
                              { label: 'Last Name', field: 'lastName', value: p.customerName.split(' ').slice(1).join(' ') },
                              { label: 'Email', field: 'email', value: p.email },
                              { label: 'Phone', field: 'phone', value: p.phone },
                              { label: 'Address', field: 'address', value: p.address },
                              { label: 'Annual Usage (kWh)', field: 'annualUsage', value: p.annualUsage.toString() },
                              { label: 'System Size', field: 'systemSize', value: p.systemSize },
                              { label: 'Battery', field: 'battery', value: p.battery },
                              { label: 'Sold PPW', field: 'soldPPW', value: p.soldPPW.toString() },
                              { label: 'Rep Name', field: 'repName', value: p.repName },
                              { label: 'Installer', field: 'installerName', value: p.installerName },
                              { label: 'Status', field: 'status', value: p.status },
                            ].map(f => (
                              <div key={f.field}>
                                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
                                <input
                                  value={getFieldValue(p.id, f.field, f.value)}
                                  onChange={e => handleFieldChange(p.id, f.field, e.target.value)}
                                  className="w-full px-3 py-2 bg-[hsl(var(--bg2))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary transition-all"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Aurora Account */}
                        <div className="bg-[hsl(var(--bg3))]/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                              <Eye className="w-3 h-3" /> Aurora Account
                            </h4>
                            {!auroraAccounts[p.id] ? (
                              <button onClick={() => { setShowAuroraModal(p.id); setAuroraEmail(p.email); }} className="px-3 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-md text-xs text-[hsl(var(--blue))] font-bold hover:bg-[hsl(var(--blue))]/20 transition-all active:scale-95 flex items-center gap-1.5">
                                <UserPlus className="w-3 h-3" /> Create Aurora Account
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-[hsl(var(--green))] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Active · {auroraAccounts[p.id].email}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[hsl(var(--bg2))] border border-border rounded-lg p-3">
                              <div className="text-[10px] text-muted-foreground mb-1">Design Status</div>
                              <div className="text-sm font-bold text-foreground">{p.currentMilestone >= 2 ? 'Design Complete' : 'Awaiting Survey'}</div>
                            </div>
                            <div className="bg-[hsl(var(--bg2))] border border-border rounded-lg p-3">
                              <div className="text-[10px] text-muted-foreground mb-1">System Design</div>
                              <div className="text-sm font-bold text-foreground">{p.systemSize} + {p.battery}</div>
                            </div>
                            <button className="bg-[hsl(var(--bg2))] border border-border rounded-lg p-3 text-left hover:border-primary transition-all">
                              <Link2 className="w-4 h-4 text-primary mb-1" />
                              <div className="text-xs font-bold text-primary">Open Aurora</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {allProjects.length === 0 && (
            <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-12 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-3">No projects yet. Accept deals from the Action ASAP queue.</p>
            </div>
          )}
        </div>

        {/* Report Modal */}
        {reportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setReportModal(null)}>
            <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-6 w-[500px] animate-scale-in" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-black text-foreground mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[hsl(var(--blue))]" />
                {reportModal.label}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">This report will be visible to the financier portal.</p>
              <textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder="Write your detailed report here..."
                rows={6}
                className="w-full px-3 py-2.5 bg-[hsl(var(--bg3))] border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary resize-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setReportModal(null)} className="px-4 py-2 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                <button onClick={handleReportSubmit} disabled={!reportText.trim()} className="px-4 py-2 bg-primary/15 border border-primary/30 rounded-lg text-xs font-bold text-primary hover:bg-primary/25 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Aurora Modal */}
        {showAuroraModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowAuroraModal(null)}>
            <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-6 w-[400px] animate-scale-in" onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-black text-foreground mb-1 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[hsl(var(--blue))]" /> Create Aurora Account
              </h3>
              <p className="text-xs text-muted-foreground mb-4">This will create a synced Aurora account for the sales rep.</p>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Rep Email</label>
                <input value={auroraEmail} onChange={e => setAuroraEmail(e.target.value)} className="w-full px-3 py-2 bg-[hsl(var(--bg3))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setShowAuroraModal(null)} className="px-4 py-2 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                <button onClick={() => handleCreateAurora(showAuroraModal)} className="px-4 py-2 bg-[hsl(var(--blue))]/15 border border-[hsl(var(--blue))]/30 rounded-lg text-xs font-bold text-[hsl(var(--blue))] hover:bg-[hsl(var(--blue))]/25 transition-all active:scale-95 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default OpsProjectsTab;
