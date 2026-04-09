import { useState } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import type { Project } from '@/data/mockData';
import { calculateCommission } from '@/lib/commissionCalc';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, Battery, MapPin, DollarSign, FileText, CheckCircle, XCircle, Clock, Calendar, Mail, Phone, ChevronDown, ChevronUp, BarChart3, Camera, Shield } from 'lucide-react';

interface PipelineProps {
  acceptedDeals?: Project[];
}

const Pipeline = ({ acceptedDeals = [] }: PipelineProps) => {
  const store = useDataSource();

  // Derive pipeline entries from converted sell projects that DON'T already
  // exist in the real projects table (avoid duplicates / stale data).
  const realProjectSellIds = new Set(
    store.projects.map(p => (p as any)._sellProjectId || (p as any).sell_project_id).filter(Boolean)
  );
  const sellDerivedProjects: Project[] = store.sellProjects
    .filter(sp => sp.convertedToSale && !realProjectSellIds.has(sp.id))
    .filter(sp => !store.projects.some(rp => rp.customerName === `${sp.firstName} ${sp.lastName}`))
    .map(sp => {
      const sysKw = parseFloat(sp.auroraData?.systemSize || '8.4');
      const ppw = sp.auroraData?.financier ? (sysKw > 10 ? 3.00 : 3.20) : 0;
      return {
        id: sp.id,
        customerName: `${sp.firstName} ${sp.lastName}`,
        address: sp.address || 'Pending',
        email: sp.email || '',
        phone: sp.phone || '',
        systemSize: sp.auroraData?.systemSize || '8.4 kW',
        battery: sp.auroraData?.battery || 'None',
        financier: sp.auroraData?.financier || 'TBD',
        monthlyPayment: sp.auroraData?.monthlyPayment || '$0',
        soldPPW: ppw,
        contractValue: ppw > 0 ? Math.round(sysKw * 1000 * ppw) : (sp.highBill || 200) * 12 * 20,
        projectCost: ppw > 0 ? Math.round(sysKw * 1000 * ppw * 0.75) : (sp.highBill || 200) * 12 * 15,
        repName: sp.repId || 'You',
        installerName: 'Unassigned',
        status: sp.documentsSigned ? 'active' as const : sp.approvalStatus === 'rejected' ? 'on_hold' as const : 'delayed' as const,
        stage: !sp.qcInitialApproved ? 'QC Review' : !sp.documentsSigned ? 'Awaiting NTP' : sp.documentsSigned ? 'Active — M1' : 'Lead',
        currentMilestone: sp.documentsSigned ? 1 : 0,
        totalMilestones: 7,
        documentsSignedCount: sp.documentsSigned ? 3 : 0,
        totalDocuments: 5,
        dates: { submitted: sp.createdAt?.slice(0, 10) || 'N/A', siteSurvey: sp.siteSurveyComplete ? 'Done' : '', sowConfirmed: '', permitSubmitted: '', lastHOContact: 'N/A' },
        milestoneDetails: [],
        adders: [],
        siteSurveyPhotos: [],
        roofCondition: 'good' as const,
        roofIssues: [],
        permitStatus: 'pending' as const,
        annualUsage: 0,
        interestRate: 0,
        loanTerms: '',
        addedDate: sp.createdAt?.slice(0, 10) || '',
        checklist: sp.checklist || { creditPassed: sp.creditStatus === 'credit_passed', financeDocsSigned: !!sp.documentsSigned, welcomeCallCompleted: !!sp.welcomeCallComplete, siteSurveyDone: !!sp.siteSurveyComplete, aspOnboarding: false },
      } as Project;
    });
  // Real projects first, then accepted deals, then sell-derived fallback (no dupes)
  const allProjects = [
    ...store.projects,
    ...acceptedDeals.filter(d => !store.projects.some(p => p.id === d.id)),
    ...sellDerivedProjects.filter(d => !store.projects.some(p => p.id === d.id) && !acceptedDeals.some(a => a.id === d.id)),
  ];
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    active: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    delayed: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    on_hold: 'bg-asp-red/15 text-asp-red border-asp-red/30',
    completed: 'bg-primary/15 text-primary border-primary/30',
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 portal-section-enter">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">Pipeline Overview</h2>
          </div>
          <span className="text-xs text-muted-foreground">{allProjects.length} active projects</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allProjects.map((p) => {
            const comm = calculateCommission(p);
            const yourComm = comm.yourCommission;
            const ms = store.getMilestoneState(p.id);

            return (
              <div
                key={p.id}
                className="group relative bg-bg2 border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,212,200,0.08),0_2px_8px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer card-press"
                onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
              >
                {/* Glass reflection on hover */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex gap-px h-1">
                  {Array.from({ length: p.totalMilestones }).map((_, i) => (
                    <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                  ))}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-base font-extrabold text-foreground">{p.customerName}</div>
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider">{p.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-asp-green">${yourComm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[9px] text-muted-foreground font-bold uppercase">Your Commission</div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border mt-1 ${statusColors[p.status]}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> <strong className="text-foreground">{p.systemSize}</strong></div>
                    <div className="flex items-center gap-1"><Battery className="w-3 h-3 text-asp-green" /> <strong className="text-foreground">{p.battery}</strong></div>
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> <strong className="text-foreground">{p.address.split(',')[1]?.trim()}</strong></div>
                    <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-asp-yellow" /> <strong className="text-foreground">${p.soldPPW}/W</strong></div>
                  </div>

                  {/* Milestones with tooltips */}
                  <div className="bg-bg3 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Current Stage</span>
                      <span className="text-xs font-extrabold text-primary">{p.stage}</span>
                    </div>
                    <div className="flex gap-1">
                      {MILESTONE_SOPS.map((sop, i) => {
                        const isPassed = i < p.currentMilestone;
                        const isCurrent = i === p.currentMilestone;
                        const fundSt = ms.fundStatus[i] || 'none';
                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className={`h-5 w-7 rounded flex items-center justify-center text-[9px] font-extrabold cursor-help ${
                                isPassed
                                  ? fundSt === 'released' ? 'bg-asp-green/20 text-asp-green' :
                                    fundSt === 'pending' ? 'bg-asp-yellow/20 text-asp-yellow' :
                                    'bg-primary text-primary-foreground'
                                  : isCurrent ? 'bg-primary/20 text-primary border border-primary'
                                  : 'bg-bg4 text-muted-foreground'
                              }`}>
                                M{i + 1}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] p-3 bg-bg2 border-border">
                              <div className="text-xs font-black text-foreground mb-1">{sop.name}</div>
                              <div className="text-[10px] text-muted-foreground mb-1">{sop.fundPercent}% fund release</div>
                              {isPassed ? (
                                <div className="flex items-center gap-1 text-[10px] text-asp-green font-bold"><CheckCircle className="w-3 h-3" /> Completed {fundSt === 'released' ? '· Funds Released' : fundSt === 'pending' ? '· Funds Pending' : ''}</div>
                              ) : isCurrent ? (
                                <div className="text-[10px] text-asp-yellow font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground">Pending</div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                  {expandedProject === p.id && (
                    <div className="animate-fade-in-up space-y-3">
                      {/* Commission Breakdown */}
                      <div className="bg-bg3 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase mb-2">Commission Breakdown</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Sold PPW:</span> <strong className="text-foreground">${p.soldPPW}/W</strong></div>
                          <div><span className="text-muted-foreground">Redline:</span> <strong className="text-foreground">$2.35/W</strong></div>
                          <div><span className="text-muted-foreground">System:</span> <strong className="text-foreground">{p.systemSize} ({(parseFloat(p.systemSize) * 1000).toLocaleString()}W)</strong></div>
                          <div><span className="text-muted-foreground">Adders:</span> <strong className="text-foreground">${comm.adderCost.toLocaleString()}</strong></div>
                          <div><span className="text-muted-foreground">Gross:</span> <strong className="text-primary">${comm.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                          <div><span className="text-muted-foreground">Your Commission:</span> <strong className="text-asp-green">${yourComm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                        </div>
                      </div>

                      <div className="bg-bg3 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Project Timeline</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1"><FileText className="w-3 h-3 text-muted-foreground" /> Submitted: <strong className="text-foreground">{p.dates.submitted}</strong></div>
                          <div className="flex items-center gap-1"><Camera className="w-3 h-3 text-muted-foreground" /> Site Survey: <strong className="text-foreground">{p.dates.siteSurvey || 'Pending'}</strong></div>
                          <div className="flex items-center gap-1"><FileText className="w-3 h-3 text-muted-foreground" /> SOW Confirmed: <strong className="text-foreground">{p.dates.sowConfirmed || 'Pending'}</strong></div>
                          <div className="flex items-center gap-1"><Shield className="w-3 h-3 text-muted-foreground" /> Permit: <strong className="text-foreground">{p.dates.permitSubmitted || 'Pending'}</strong></div>
                          <div className="col-span-2 flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> Last HO Contact: <strong className="text-foreground">{p.dates.lastHOContact}</strong></div>
                        </div>
                      </div>

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
                              {item.done ? <CheckCircle className="w-3.5 h-3.5 text-asp-green" /> : <XCircle className="w-3.5 h-3.5 text-asp-red" />}
                              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email} · <Phone className="w-3 h-3" /> {p.phone}</div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <div className="text-[11px] text-muted-foreground"><strong className="text-foreground">{p.repName}</strong> · Rep</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-muted-foreground text-right"><strong className="text-foreground">{p.installerName}</strong></div>
                      {expandedProject === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Pipeline;
