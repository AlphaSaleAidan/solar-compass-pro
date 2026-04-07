import { useState, useRef } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { MILESTONE_NAMES } from '@/data/mockData';
import OpsNotesTextarea from '@/components/ops/OpsNotesTextarea';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight, Shield, Zap, FileText, Camera, Send, Flag, Eye, Upload, ClipboardCheck, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cascadeMilestoneVerified } from '@/lib/notificationCascade';

const MilestoneVerification = () => {
  const store = useDataSource();
  const { user } = useAuth();
  const { projects } = store;
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<{ projectId: string; idx: number } | null>(null);
  const [reportModal, setReportModal] = useState<{ projectId: string; itemId: string; label: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ projectId: string; itemId: string } | null>(null);

  // Only show projects that need active milestone approval from ops
  // A project appears here when non-ops actors have completed their checklist items for the current milestone
  const activeProjects = projects.filter(p => {
    if (p.currentMilestone >= 7) return false;
    const sop = MILESTONE_SOPS[p.currentMilestone];
    if (!sop) return false;
    const state = store.getMilestoneState(p.id);
    // Check if all non-ops checklist items are done (installer/sales_rep have submitted their parts)
    const nonOpsItems = sop.checklist.filter(c => c.actor !== 'backend_ops' && c.actor !== 'financier');
    const nonOpsDone = nonOpsItems.length === 0 || nonOpsItems.every(item => state.checklistDone[item.id]);
    return nonOpsDone;
  });

  const getOffsetPercent = (p: typeof projects[0]) => {
    const systemKw = parseFloat(p.systemSize);
    const annualProduction = systemKw * 1350;
    return Math.round((annualProduction / p.annualUsage) * 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pendingUpload || !e.target.files?.length) return;
    const file = e.target.files[0];
    store.uploadFile(pendingUpload.projectId, pendingUpload.itemId, file.name);
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

  return (
    <div className="space-y-5 animate-fade-in-up">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          ASP Milestone Verification
        </h2>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary">
            {activeProjects.length} Active Projects
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {activeProjects.map(p => {
          const isExpanded = expandedProject === p.id;
          const offset = getOffsetPercent(p);
          const offsetOk = offset >= 80;
          const milestoneState = store.getMilestoneState(p.id);

          return (
            <div key={p.id} className="bg-[hsl(var(--bg2))] border border-border rounded-xl overflow-hidden">
              {/* Project Header */}
              <div
                onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[hsl(var(--bg3))] transition-all"
              >
                <div className="flex items-center gap-4">
                  <button className="text-muted-foreground">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="text-sm font-bold text-foreground">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    offsetOk
                      ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border-[hsl(var(--green))]/30'
                      : 'bg-[hsl(var(--red))]/15 text-[hsl(var(--red))] border-[hsl(var(--red))]/30'
                  }`}>
                    {offset}% Offset
                  </span>
                  {/* Milestone Progress Bubbles */}
                  <div className="flex items-center gap-1">
                    {MILESTONE_SOPS.map((sop, i) => {
                      const fundSt = milestoneState.fundStatus[i];
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold ${
                            i < p.currentMilestone
                              ? fundSt === 'released' ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                                fundSt === 'pending' ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                                'bg-primary/15 text-primary'
                              : i === p.currentMilestone ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                              'bg-[hsl(var(--bg3))] text-muted-foreground'
                          }`}
                        >
                          M{i + 1}
                        </div>
                      );
                    })}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                    p.status === 'active' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' :
                    p.status === 'delayed' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]' :
                    p.status === 'on_hold' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))]' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {p.stage}
                  </span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Project Quick Info */}
                  <div className="px-5 py-3 bg-[hsl(var(--bg3))]/50 border-b border-border grid grid-cols-5 gap-4 text-xs">
                    <div><span className="text-muted-foreground">System:</span> <span className="font-bold text-foreground">{p.systemSize}</span></div>
                    <div><span className="text-muted-foreground">Battery:</span> <span className="font-bold text-foreground">{p.battery}</span></div>
                    <div><span className="text-muted-foreground">Installer:</span> <span className="font-bold text-foreground">{p.installerName}</span></div>
                    <div><span className="text-muted-foreground">Rep:</span> <span className="font-bold text-foreground">{p.repName}</span></div>
                    <div><span className="text-muted-foreground">Usage:</span> <span className="font-bold text-foreground">{p.annualUsage.toLocaleString()} kWh</span></div>
                  </div>

                  {/* Milestone SOP Rows */}
                  <div className="divide-y divide-border">
                    {MILESTONE_SOPS.map((sop, milestoneIdx) => {
                      const isPassed = milestoneIdx < p.currentMilestone;
                      const isCurrent = milestoneIdx === p.currentMilestone;
                      const isExpandedM = expandedMilestone?.projectId === p.id && expandedMilestone?.idx === milestoneIdx;
                      const fundSt = milestoneState.fundStatus[milestoneIdx] || 'none';
                      const allReady = store.isMilestoneReady(p.id, milestoneIdx);
                      const opsReady = store.isMilestoneReady(p.id, milestoneIdx, 'backend_ops');

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
                              {/* Fund status badge */}
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

                          {/* Expanded Milestone SOP Checklist */}
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
                                        {/* Checkbox for ops items */}
                                        {isOpsItem && !item.requiresText && (
                                          <button
                                            onClick={() => store.toggleChecklist(p.id, item.id, !isDone)}
                                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                              isDone ? 'bg-[hsl(var(--green))] border-[hsl(var(--green))]' : 'border-border hover:border-primary'
                                            }`}
                                          >
                                            {isDone && <CheckCircle className="w-3 h-3 text-white" />}
                                          </button>
                                        )}
                                        {/* Status indicator for installer items */}
                                        {isInstallerItem && (
                                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-[hsl(var(--bg3))]'}`}>
                                            {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                                          </div>
                                        )}
                                        {/* Report button items */}
                                        {isOpsItem && item.requiresText && (
                                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-[hsl(var(--green))]/15' : 'bg-[hsl(var(--bg3))]'}`}>
                                            {isDone ? <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" /> : <FileText className="w-3 h-3 text-muted-foreground" />}
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-bold text-foreground">{item.label}</div>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                              isInstallerItem ? 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))]' :
                                              'bg-primary/10 text-primary'
                                            }`}>
                                              {item.actor === 'backend_ops' ? 'OPS' : item.actor === 'installer' ? 'INSTALLER' : item.actor.toUpperCase()}
                                            </span>
                                          </div>
                                          {/* Upload section */}
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
                                                <button
                                                  onClick={() => triggerUpload(p.id, item.id)}
                                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/25 rounded-md text-[10px] font-bold text-primary hover:bg-primary/20 transition-all"
                                                >
                                                  <Upload className="w-3 h-3" /> {item.uploadLabel || 'Upload'}
                                                </button>
                                              )}
                                            </div>
                                          )}
                                          {/* Text report section */}
                                          {item.requiresText && (
                                            <div className="mt-2">
                                              {textEntry ? (
                                                <div className="bg-[hsl(var(--bg3))] rounded p-2 text-[10px] text-foreground">
                                                  {textEntry}
                                                </div>
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
                                          {/* Date section */}
                                          {item.requiresDate && (
                                            <div className="mt-2">
                                              {dateEntry ? (
                                                <div className="text-[10px] text-[hsl(var(--green))] font-bold">📅 {dateEntry}</div>
                                              ) : (
                                                <input
                                                  type="date"
                                                  onChange={(e) => store.setDateEntry(p.id, item.id, e.target.value)}
                                                  className="px-2 py-1 bg-[hsl(var(--bg3))] border border-border rounded text-[10px] text-foreground outline-none focus:border-primary"
                                                />
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Approve Milestone Button */}
                                {isCurrent && (
                                  <div className="mt-4 flex items-center justify-between">
                                    <div className="text-[10px] text-muted-foreground">
                                      {allReady ? 'All checklist items complete' : `${sop.checklist.filter(c => milestoneState.checklistDone[c.id]).length}/${sop.checklist.length} items done`}
                                    </div>
                                    <button
                                      disabled={!allReady}
                                      onClick={() => {
                                        store.approveMilestone(p.id, milestoneIdx);
                                        // Wave → Financier + Installer notified
                                        if (user && !user.isDemo) {
                                          const mNames = ['SOW Confirmed', 'Permit + Materials', 'Install Scheduled', 'Install Complete', 'Utility Inspection', 'PTO Granted', 'Speed Bonus'];
                                          const pcts = ['15%', '20%', '15%', '20%', '20%', '10%', '5%'];
                                          cascadeMilestoneVerified(p.id, user.id, p.customerName || `Project ${p.id}`, mNames[milestoneIdx] || `M${milestoneIdx+1}`, pcts[milestoneIdx] || '');
                                        }
                                      }}
                                      className="px-4 py-2 bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border border-[hsl(var(--green))]/30 rounded-lg text-xs font-bold hover:bg-[hsl(var(--green))]/25 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                                    >
                                      <ClipboardCheck className="w-3.5 h-3.5" /> Approve M{milestoneIdx + 1} & Queue Fund Release
                                    </button>
                                  </div>
                                )}

                                {/* Ops Notes */}
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
            </div>
          );
        })}

        {activeProjects.length === 0 && (
          <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground mt-3">No active milestone projects yet. Accept deals from the Action ASAP queue.</p>
          </div>
        )}
      </div>

      {/* Report Writing Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center modal-backdrop-enter" onClick={() => setReportModal(null)}>
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
    </div>
  );
};

export default MilestoneVerification;
