import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES } from '@/data/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Pipeline = () => {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    active: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    delayed: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    on_hold: 'bg-asp-red/15 text-asp-red border-asp-red/30',
    completed: 'bg-primary/15 text-primary border-primary/30',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">📊 Pipeline Overview</h2>
          <span className="text-xs text-muted-foreground">{PROJECTS.length} active projects</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PROJECTS.map((p) => (
            <div
              key={p.id}
              className="bg-bg2 border border-border rounded-xl overflow-hidden hover:border-border2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
            >
              {/* Milestone strip */}
              <div className="flex gap-px h-1">
                {Array.from({ length: p.totalMilestones }).map((_, i) => (
                  <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                ))}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-base font-extrabold text-white">{p.customerName}</div>
                    <div className="text-[10px] text-muted-foreground font-bold tracking-wider">{p.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${statusColors[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Financial details */}
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-xs">
                  <div className="bg-bg3 rounded-md px-2 py-1.5 text-center">
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">Contract</div>
                    <div className="font-extrabold text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="bg-bg3 rounded-md px-2 py-1.5 text-center">
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">Project Cost</div>
                    <div className="font-extrabold text-foreground">${(p.projectCost / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="bg-bg3 rounded-md px-2 py-1.5 text-center">
                    <div className="text-[9px] text-muted-foreground font-bold uppercase">Terms</div>
                    <div className="font-extrabold text-foreground">{p.loanTerms}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs text-muted-foreground">
                  <div>⚡ <strong className="text-foreground">{p.systemSize}</strong></div>
                  <div>🔋 <strong className="text-foreground">{p.battery || 'None'}</strong></div>
                  <div>📍 <strong className="text-foreground">{p.address.split(',')[1]?.trim()}</strong></div>
                  <div>💰 <strong className="text-foreground">${p.soldPPW}/W</strong></div>
                </div>

                {/* Milestones with tooltips */}
                <div className="bg-bg3 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Current Stage</span>
                    <span className="text-xs font-extrabold text-primary">{p.stage}</span>
                  </div>
                  <div className="flex gap-1">
                    {MILESTONE_NAMES.map((name, i) => {
                      const detail = p.milestoneDetails[i];
                      const isPassed = i < p.currentMilestone;
                      const isCurrent = i === p.currentMilestone;
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-5 w-7 rounded flex items-center justify-center text-[9px] font-extrabold cursor-help ${
                                isPassed
                                  ? 'bg-primary text-primary-foreground'
                                  : isCurrent
                                  ? 'bg-primary/20 text-primary border border-primary'
                                  : 'bg-bg4 text-muted-foreground'
                              }`}
                            >
                              M{i + 1}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] p-3 bg-bg2 border-border">
                            <div className="text-xs font-black text-white mb-1">{name}</div>
                            {isPassed ? (
                              <div className="space-y-1">
                                <div className="text-[10px] text-asp-green font-bold">✅ Completed</div>
                                {detail?.completedDate && (
                                  <div className="text-[10px] text-muted-foreground">Completed: {detail.completedDate}</div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-[10px] text-asp-yellow font-bold mb-1">{isCurrent ? '🔄 In Progress' : '⏳ Pending'}</div>
                                <div className="text-[10px] text-muted-foreground font-bold">Requirements:</div>
                                {detail?.requirements.map((req, ri) => (
                                  <div key={ri} className="text-[10px] text-muted-foreground pl-2">• {req}</div>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                {/* Project dates - shown when expanded */}
                {expandedProject === p.id && (
                  <div className="animate-fade-in-up space-y-3">
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase mb-2">Project Timeline</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>📋 Submitted: <strong className="text-foreground">{p.dates.submitted}</strong></div>
                        <div>📸 Site Survey: <strong className="text-foreground">{p.dates.siteSurvey || 'Pending'}</strong></div>
                        <div>📄 SOW Confirmed: <strong className="text-foreground">{p.dates.sowConfirmed || 'Pending'}</strong></div>
                        <div>🏛️ Permit Submitted: <strong className="text-foreground">{p.dates.permitSubmitted || 'Pending'}</strong></div>
                        <div className="col-span-2">📞 Last HO Contact: <strong className="text-foreground">{p.dates.lastHOContact}</strong></div>
                      </div>
                    </div>

                    {/* Customer Checklist */}
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase mb-2">Customer Checklist</div>
                      <div className="space-y-1 text-xs">
                        {[
                          { label: 'Credit Passed', done: p.checklist.creditPassed },
                          { label: 'Finance Docs Signed', done: p.checklist.financeDocsSigned },
                          { label: 'Welcome Call Completed', done: p.checklist.welcomeCallCompleted },
                          { label: 'Site Survey Done', done: p.checklist.siteSurveyDone },
                          { label: 'ASP Onboarding', done: p.checklist.aspOnboarding },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <span className={item.done ? 'text-asp-green' : 'text-asp-red'}>{item.done ? '✅' : '❌'}</span>
                            <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer info */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>📧 {p.email} · 📱 {p.phone}</div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">{p.repName}</strong> · Rep
                  </div>
                  <div className="text-[11px] text-muted-foreground text-right">
                    <strong className="text-foreground">{p.installerName}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Pipeline;
