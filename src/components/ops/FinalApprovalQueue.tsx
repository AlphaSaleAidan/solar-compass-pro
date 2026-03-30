import { useState } from 'react';
import { SellProject } from '@/data/mockData';
import { CheckCircle, XCircle, AlertTriangle, User, Sun, Camera, FileText, Video, ClipboardCheck, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface FinalApprovalQueueProps {
  projects: SellProject[];
  onMarkClean: (projectId: string) => void;
  onMarkDirty: (projectId: string, notes: string) => void;
}

const FinalApprovalQueue = ({ projects, onMarkClean, onMarkDirty }: FinalApprovalQueueProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dirtyNotes, setDirtyNotes] = useState<Record<string, string>>({});

  const pendingProjects = projects.filter(p => p.approvalStatus === 'pending');
  const reviewedProjects = projects.filter(p => p.approvalStatus === 'clean' || p.approvalStatus === 'dirty');

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" /> Final Approval Queue
      </h2>
      <p className="text-xs text-muted-foreground -mt-3">
        Sales rep submissions requiring clean/dirty review before pipeline assignment.
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

                    {/* Checklist summary */}
                    <div className="bg-bg3 border border-border rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Completion Checklist</div>
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
                          className="flex-1 py-2.5 bg-asp-green/15 text-asp-green border border-asp-green/30 rounded-xl text-xs font-bold hover:bg-asp-green/25 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Clean
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
