import { useState } from 'react';
import { SellProject } from '@/data/mockData';
import { CheckCircle, XCircle, AlertTriangle, User, Sun, Camera, FileText, Video, ClipboardCheck, ChevronDown, ChevronUp, Shield } from 'lucide-react';

interface FinalApprovalQueueProps {
  projects: SellProject[];
  onMarkClean: (projectId: string) => void;
  onMarkDirty: (projectId: string, notes: string) => void;
}

// 7-Point QC Checklist per the SOP
const QC_CHECKLIST = [
  { id: 'data_accuracy', label: 'Data Accuracy', description: 'Name, address, phone, email, financier match across ASP and Aurora' },
  { id: 'offset_verification', label: 'Offset Verification', description: 'System production ≥ 80% of homeowner usage' },
  { id: 'site_survey_photos', label: 'Site Survey Photos', description: 'All required sections present (Rafters, Shingles, Drone, Main Panel). No visible roof damage' },
  { id: 'system_design', label: 'System Design', description: 'Panel count, kW, battery, adders match what was sold and financed' },
  { id: 'document_completeness', label: 'Document Completeness', description: 'All TPO docs fully signed. No blank signature fields' },
  { id: 'welcome_call_recording', label: 'Welcome Call Recording', description: 'Recording present. All 10 questions answered. Q9 = No. Q7 = 2.99%' },
  { id: 'no_open_flags', label: 'No Open Flags', description: 'No active flags from Welcome Call' },
];

const FinalApprovalQueue = ({ projects, onMarkClean, onMarkDirty }: FinalApprovalQueueProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dirtyNotes, setDirtyNotes] = useState<Record<string, string>>({});
  const [qcChecks, setQcChecks] = useState<Record<string, Record<string, boolean>>>({});

  const pendingProjects = projects.filter(p => p.approvalStatus === 'pending');
  const reviewedProjects = projects.filter(p => p.approvalStatus === 'clean' || p.approvalStatus === 'dirty');

  const toggleQcCheck = (projectId: string, checkId: string) => {
    setQcChecks(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), [checkId]: !(prev[projectId]?.[checkId]) },
    }));
  };

  const getQcPassCount = (projectId: string) => {
    const checks = qcChecks[projectId] || {};
    return QC_CHECKLIST.filter(c => checks[c.id]).length;
  };

  const allQcPassed = (projectId: string) => getQcPassCount(projectId) === QC_CHECKLIST.length;

  // Auto-check flags based on project data
  const getAutoFlags = (p: SellProject) => {
    const flags: string[] = [];
    if (!p.auroraSynced) flags.push('Aurora not synced');
    if (!p.welcomeCallComplete) flags.push('Welcome call incomplete');
    if (!p.siteSurveyComplete) flags.push('Site survey incomplete');
    const wcFlags = (p as any).welcomeCallFlags as Array<{ question: string; issue: string }> | undefined;
    if (wcFlags && wcFlags.length > 0) {
      wcFlags.forEach(f => flags.push(`${f.question}: ${f.issue}`));
    }
    return flags;
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" /> Final Approval Queue
      </h2>
      <p className="text-xs text-muted-foreground -mt-3">
        7-Point QC Review — verify each item before marking clean or dirty.
      </p>

      {/* Pending */}
      {pendingProjects.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-asp-green mx-auto" />
          <p className="text-muted-foreground mt-3">No pending submissions — all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingProjects.map(p => {
            const isExpanded = expandedId === p.id;
            const autoFlags = getAutoFlags(p);
            const passCount = getQcPassCount(p.id);

            return (
              <div key={p.id} className="bg-bg2 border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-bg3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-bold text-white">{p.firstName} {p.lastName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.id} · {p.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-bold">{passCount}/7 QC</span>
                    <span className="px-2 py-0.5 bg-asp-yellow/15 text-asp-yellow border border-asp-yellow/30 rounded-full text-[10px] font-extrabold">
                      PENDING
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* System info */}
                    {p.auroraData && (
                      <div className="bg-bg3 border border-border rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">System from Aurora</div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div><span className="text-muted-foreground">System:</span> <span className="text-foreground font-bold">{p.auroraData.systemSize}</span></div>
                          <div><span className="text-muted-foreground">Battery:</span> <span className="text-foreground font-bold">{p.auroraData.battery}</span></div>
                          <div><span className="text-muted-foreground">Financier:</span> <span className="text-asp-green font-bold">{p.auroraData.financier}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Auto flags warning */}
                    {autoFlags.length > 0 && (
                      <div className="bg-asp-red/10 border border-asp-red/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-asp-red text-xs font-bold mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Auto-Detected Issues ({autoFlags.length})
                        </div>
                        <div className="space-y-1">
                          {autoFlags.map((f, i) => (
                            <div key={i} className="text-xs text-muted-foreground">• {f}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7-Point QC Checklist */}
                    <div className="bg-bg3 border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-primary" /> 7-Point QC Checklist
                        </div>
                        <span className={`text-[10px] font-extrabold ${allQcPassed(p.id) ? 'text-asp-green' : 'text-muted-foreground'}`}>
                          {passCount}/7
                        </span>
                      </div>
                      <div className="space-y-2">
                        {QC_CHECKLIST.map((check, i) => {
                          const checked = qcChecks[p.id]?.[check.id] || false;
                          return (
                            <button
                              key={check.id}
                              onClick={() => toggleQcCheck(p.id, check.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                                checked ? 'bg-asp-green/5 border border-asp-green/20' : 'bg-bg2 border border-border hover:bg-bg3'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                checked ? 'bg-asp-green border-asp-green' : 'border-muted-foreground/30'
                              }`}>
                                {checked && <CheckCircle className="w-3 h-3 text-black" />}
                              </div>
                              <div>
                                <div className={`text-xs font-bold ${checked ? 'text-asp-green' : 'text-foreground'}`}>
                                  {i + 1}. {check.label}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{check.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Completion checklist summary */}
                    <div className="bg-bg3 border border-border rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Completion Status</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Aurora Synced', done: !!p.auroraSynced, icon: Sun },
                          { label: 'Converted to Sale', done: !!p.convertedToSale, icon: CheckCircle },
                          { label: 'Documents', done: p.documents.every(d => d.sent), icon: FileText },
                          { label: 'Welcome Call', done: !!p.welcomeCallComplete, icon: Video },
                          { label: 'Site Survey', done: !!p.siteSurveyComplete, icon: Camera },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2">
                            {item.done ? <CheckCircle className="w-3.5 h-3.5 text-asp-green" /> : <XCircle className="w-3.5 h-3.5 text-asp-red" />}
                            <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Welcome call answers */}
                    {p.welcomeCallAnswers && (
                      <div className="bg-bg3 border border-border rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Welcome Call Answers</div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {p.welcomeCallAnswers.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              {a.correct === undefined ? (
                                <span className="text-primary mt-0.5 shrink-0">📝</span>
                              ) : a.correct ? (
                                <CheckCircle className="w-3 h-3 text-asp-green shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-asp-red shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="text-muted-foreground">Q{i + 1}:</span> <span className="text-foreground font-bold">{a.answer}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Site survey photos */}
                    {p.siteSurveyPhotos && Object.keys(p.siteSurveyPhotos).length > 0 && (
                      <div className="bg-bg3 border border-border rounded-lg p-3">
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Site Survey Photos</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(p.siteSurveyPhotos).map(([section, photos]) => (
                            <div key={section} className="px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-bold">
                              {section}: {photos.length} photo(s)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Notes (required for dirty)</label>
                        <textarea
                          value={dirtyNotes[p.id] || ''}
                          onChange={e => setDirtyNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Enter reason if marking dirty..."
                          className="w-full px-3 py-2 bg-bg3 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary resize-none h-16"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => onMarkClean(p.id)}
                          disabled={!allQcPassed(p.id)}
                          className="flex-1 py-2.5 bg-asp-green/15 text-asp-green border border-asp-green/30 rounded-xl text-xs font-bold hover:bg-asp-green/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Clean {!allQcPassed(p.id) && `(${passCount}/7)`}
                        </button>
                        <button
                          onClick={() => {
                            if (!dirtyNotes[p.id]?.trim()) return;
                            onMarkDirty(p.id, dirtyNotes[p.id]);
                          }}
                          disabled={!dirtyNotes[p.id]?.trim()}
                          className="flex-1 py-2.5 bg-asp-red/15 text-asp-red border border-asp-red/30 rounded-xl text-xs font-bold hover:bg-asp-red/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Mark Dirty
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recently reviewed */}
      {reviewedProjects.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Recently Reviewed</h3>
          <div className="space-y-2">
            {reviewedProjects.map(p => (
              <div key={p.id} className="bg-bg2 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.approvalStatus === 'clean' ? (
                    <CheckCircle className="w-4 h-4 text-asp-green" />
                  ) : (
                    <XCircle className="w-4 h-4 text-asp-red" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-foreground">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.id}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  p.approvalStatus === 'clean'
                    ? 'bg-asp-green/15 text-asp-green border border-asp-green/30'
                    : 'bg-asp-red/15 text-asp-red border border-asp-red/30'
                }`}>
                  {p.approvalStatus?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalApprovalQueue;
