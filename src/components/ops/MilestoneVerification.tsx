import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES } from '@/data/mockData';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight, Shield, Zap, FileText, Camera, Send, Flag, Users, Eye } from 'lucide-react';

interface FlagReport {
  projectId: string;
  milestone: number;
  reason: string;
  notifyInstaller: boolean;
}

const MilestoneVerification = () => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [flagReports, setFlagReports] = useState<FlagReport[]>([]);
  const [flagModal, setFlagModal] = useState<{ projectId: string; milestone: number } | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [notifyInstaller, setNotifyInstaller] = useState(true);
  const [confirmedMilestones, setConfirmedMilestones] = useState<Record<string, number[]>>({});
  const [usageOverrides, setUsageOverrides] = useState<Record<string, string>>({});

  const handleConfirmMilestone = (projectId: string, milestoneIdx: number) => {
    setConfirmedMilestones(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), milestoneIdx],
    }));
  };

  const handleFlagSubmit = () => {
    if (!flagModal || !flagReason.trim()) return;
    setFlagReports(prev => [...prev, { ...flagModal, reason: flagReason, notifyInstaller }]);
    setFlagModal(null);
    setFlagReason('');
    setNotifyInstaller(true);
  };

  const isMilestoneConfirmed = (projectId: string, idx: number) =>
    confirmedMilestones[projectId]?.includes(idx) || false;

  const isMilestoneFlagged = (projectId: string, idx: number) =>
    flagReports.some(f => f.projectId === projectId && f.milestone === idx);

  const getOffsetPercent = (p: typeof PROJECTS[0]) => {
    const systemKw = parseFloat(p.systemSize);
    const annualProduction = systemKw * 1350;
    return Math.round((annualProduction / p.annualUsage) * 100);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          ASP Milestone Verification
        </h2>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary">
            {PROJECTS.filter(p => p.currentMilestone < 7).length} Active Projects
          </div>
          <div className="px-3 py-1.5 bg-[hsl(var(--red))]/10 border border-[hsl(var(--red))]/25 rounded-lg text-xs font-bold text-[hsl(var(--red))]">
            {flagReports.length} Flagged
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {PROJECTS.map(p => {
          const isExpanded = expandedProject === p.id;
          const offset = getOffsetPercent(p);
          const offsetOk = offset >= 80;

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
                  {/* Offset Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                    offsetOk
                      ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border-[hsl(var(--green))]/30'
                      : 'bg-[hsl(var(--red))]/15 text-[hsl(var(--red))] border-[hsl(var(--red))]/30'
                  }`}>
                    {offset}% Offset
                  </span>
                  {/* Milestone Progress */}
                  <div className="flex items-center gap-1">
                    {MILESTONE_NAMES.map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border ${
                          i < p.currentMilestone
                            ? isMilestoneFlagged(p.id, i) ? 'bg-[hsl(var(--red))] border-[hsl(var(--red))]' :
                              isMilestoneConfirmed(p.id, i) ? 'bg-[hsl(var(--green))] border-[hsl(var(--green))]' :
                              'bg-primary border-primary'
                            : 'bg-transparent border-border'
                        }`}
                      />
                    ))}
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

              {/* Expanded Milestone Detail */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Offset Verification */}
                  <div className="px-5 py-4 bg-[hsl(var(--bg3))]/50 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Annual Usage Offset Verification
                      </h4>
                      {!offsetOk && (
                        <span className="text-[10px] font-bold text-[hsl(var(--red))] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Below 80% — Requires Review
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Annual Usage</div>
                        <div className="text-sm font-bold text-foreground">{p.annualUsage.toLocaleString()} kWh</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">System Production (est.)</div>
                        <div className="text-sm font-bold text-foreground">{(parseFloat(p.systemSize) * 1350).toLocaleString()} kWh</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Offset</div>
                        <div className={`text-sm font-bold ${offsetOk ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>{offset}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Manual Override (kWh)</div>
                        <input
                          value={usageOverrides[p.id] || ''}
                          onChange={e => setUsageOverrides(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder={p.annualUsage.toString()}
                          className="w-full px-2.5 py-1.5 bg-[hsl(var(--bg3))] border border-border rounded-md text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Milestone Rows */}
                  <div className="divide-y divide-border">
                    {p.milestoneDetails.map((m, i) => {
                      const isPassed = i < p.currentMilestone;
                      const isCurrent = i === p.currentMilestone;
                      const confirmed = isMilestoneConfirmed(p.id, i);
                      const flagged = isMilestoneFlagged(p.id, i);
                      const flag = flagReports.find(f => f.projectId === p.id && f.milestone === i);

                      return (
                        <div key={i} className={`px-5 py-3.5 flex items-center justify-between ${isCurrent ? 'bg-primary/5' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                              flagged ? 'bg-[hsl(var(--red))]/15 text-[hsl(var(--red))]' :
                              confirmed ? 'bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]' :
                              isPassed ? 'bg-primary/15 text-primary' :
                              isCurrent ? 'bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]' :
                              'bg-[hsl(var(--bg3))] text-muted-foreground'
                            }`}>
                              M{i + 1}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{m.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {isPassed && m.completedDate ? `Completed ${m.completedDate}` : isCurrent ? 'In Progress' : 'Pending'}
                              </div>
                              {flagged && flag && (
                                <div className="text-[10px] text-[hsl(var(--red))] mt-0.5 flex items-center gap-1">
                                  <Flag className="w-3 h-3" /> {flag.reason}
                                  {flag.notifyInstaller && <span className="text-[hsl(var(--yellow))]">· Installer Notified</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Requirements */}
                            <div className="hidden lg:flex items-center gap-1.5 mr-4">
                              {m.requirements.map((req, ri) => (
                                <span key={ri} className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  isPassed ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]' : 'bg-[hsl(var(--bg3))] text-muted-foreground'
                                }`}>
                                  {req.split(' ').slice(0, 3).join(' ')}...
                                </span>
                              ))}
                            </div>
                            {isPassed && !confirmed && !flagged && (
                              <>
                                <button
                                  onClick={() => handleConfirmMilestone(p.id, i)}
                                  className="px-2.5 py-1.5 bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border border-[hsl(var(--green))]/30 rounded-md text-[10px] font-bold hover:bg-[hsl(var(--green))]/25 transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Verify
                                </button>
                                <button
                                  onClick={() => setFlagModal({ projectId: p.id, milestone: i })}
                                  className="px-2.5 py-1.5 bg-[hsl(var(--red))]/15 text-[hsl(var(--red))] border border-[hsl(var(--red))]/30 rounded-md text-[10px] font-bold hover:bg-[hsl(var(--red))]/25 transition-all active:scale-95 flex items-center gap-1"
                                >
                                  <Flag className="w-3 h-3" /> Flag
                                </button>
                              </>
                            )}
                            {confirmed && (
                              <span className="text-[10px] font-bold text-[hsl(var(--green))] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </span>
                            )}
                            {flagged && (
                              <span className="text-[10px] font-bold text-[hsl(var(--red))] flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Documents & Photos Quick Access */}
                  <div className="px-5 py-4 bg-[hsl(var(--bg3))]/30 border-t border-border flex items-center gap-3">
                    <button className="px-3 py-1.5 bg-[hsl(var(--blue))]/10 border border-[hsl(var(--blue))]/25 rounded-md text-xs text-[hsl(var(--blue))] font-bold hover:bg-[hsl(var(--blue))]/20 transition-all active:scale-95 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> View Documents ({p.documentsSignedCount}/{p.totalDocuments})
                    </button>
                    <button className="px-3 py-1.5 bg-[hsl(var(--purple))]/10 border border-[hsl(var(--purple))]/25 rounded-md text-xs text-[hsl(var(--purple))] font-bold hover:bg-[hsl(var(--purple))]/20 transition-all active:scale-95 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Site Survey Photos
                    </button>
                    <button className="px-3 py-1.5 bg-primary/10 border border-primary/25 rounded-md text-xs text-primary font-bold hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Aurora Design
                    </button>
                    <button className="px-3 py-1.5 bg-[hsl(var(--yellow))]/10 border border-[hsl(var(--yellow))]/25 rounded-md text-xs text-[hsl(var(--yellow))] font-bold hover:bg-[hsl(var(--yellow))]/20 transition-all active:scale-95 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Notify Installer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setFlagModal(null)}>
          <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-6 w-[440px] animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-foreground mb-1 flex items-center gap-2">
              <Flag className="w-4 h-4 text-[hsl(var(--red))]" />
              Flag Milestone Error
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {flagModal.projectId} · {MILESTONE_NAMES[flagModal.milestone]}
            </p>
            <textarea
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              placeholder="Describe the issue (e.g., missing permit docs, incorrect panel count, photo mismatch)..."
              rows={4}
              className="w-full px-3 py-2.5 bg-[hsl(var(--bg3))] border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary resize-none mb-3"
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyInstaller}
                onChange={e => setNotifyInstaller(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground font-bold">Auto-notify installer ({PROJECTS.find(p => p.id === flagModal.projectId)?.installerName})</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setFlagModal(null)} className="px-4 py-2 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                Cancel
              </button>
              <button onClick={handleFlagSubmit} className="px-4 py-2 bg-[hsl(var(--red))]/15 border border-[hsl(var(--red))]/30 rounded-lg text-xs font-bold text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/25 transition-all active:scale-95 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Submit Flag Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneVerification;
