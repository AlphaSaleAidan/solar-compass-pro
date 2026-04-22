import { useState } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { UPFRONT_MILESTONES } from '@/data/mockData';
import { calculateCommission } from '@/lib/commissionCalc';
import { DollarSign, Clock, Calculator, Ticket, ChevronDown, ChevronUp, Info, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import AddSetterDialog from './AddSetterDialog';

const Commissions = () => {
  const store = useDataSource();
  const allProjects = store.projects;

  // Calculate commissions from live project data
  const COMMISSIONS = allProjects.map(p => calculateCommission(p));

  const [calcSize, setCalcSize] = useState('10');
  const [calcPPW, setCalcPPW] = useState('4.25');
  const [calcRedline, setCalcRedline] = useState('2.35');
  const [calcAdders, setCalcAdders] = useState('8500');
  const [calcSplit, setCalcSplit] = useState('100');
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpfrontExplainer, setShowUpfrontExplainer] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [setterDialogProject, setSetterDialogProject] = useState<{ id: string; name: string } | null>(null);

  const calcSystemCost = parseFloat(calcSize) * 1000 * parseFloat(calcRedline);
  const calcSoldTotal = parseFloat(calcSize) * 1000 * parseFloat(calcPPW);
  const calcCommission = calcSoldTotal - calcSystemCost - parseFloat(calcAdders);
  const calcYourComm = calcCommission * (parseFloat(calcSplit) / 100);

  const totalPending = COMMISSIONS.filter((c) => c.status === 'pending').reduce((s, c) => s + c.yourCommission, 0);
  const totalPaid = COMMISSIONS.filter((c) => c.status === 'paid').reduce((s, c) => s + c.yourCommission, 0);

  const displayPending = timePeriod === 'yearly' ? totalPending * 12 : totalPending;
  const displayPaid = timePeriod === 'yearly' ? totalPaid * 12 : totalPaid;

  const statusColors: Record<string, string> = {
    paid: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    pending: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    processing: 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
  };

  // Build continuous list of all upfront line items
  const allUpfrontLineItems = COMMISSIONS.flatMap(c =>
    c.upfronts.map(u => ({
      projectId: c.projectId,
      customerName: c.customerName,
      milestone: u.milestone,
      closerPay: typeof u.closerPay === 'number' ? u.closerPay : 0,
      completed: u.completed,
      completedDate: u.completedDate,
      expectedPay: u.expectedPay,
    }))
  ).sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return 0;
  });

  return (
    <div className="space-y-5 portal-section-enter">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-4 h-4 text-asp-green" />
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Total Paid</div>
          </div>
          <div className="text-2xl font-black text-asp-green">${displayPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="w-4 h-4 text-asp-yellow" />
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Pending Pay</div>
          </div>
          <div className="text-2xl font-black text-asp-yellow">${displayPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Monthly/Yearly Toggle */}
      <div className="flex gap-2">
        {(['monthly', 'yearly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setTimePeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              timePeriod === p ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-bg3 border-border text-muted-foreground'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Commission Calculator */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-foreground">Commission Calculator</h3>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'System (kW)', val: calcSize, set: setCalcSize },
            { label: 'Sold PPW', val: calcPPW, set: setCalcPPW },
            { label: 'Redline PPW', val: calcRedline, set: setCalcRedline },
            { label: 'Adders ($)', val: calcAdders, set: setCalcAdders },
            { label: 'Split (%)', val: calcSplit, set: setCalcSplit },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
              <input
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-bg3 border border-border rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-muted-foreground font-bold">Gross Commission</div>
            <div className="text-lg font-black text-primary">${calcCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="text-2xl text-muted-foreground">→</div>
          <div className="bg-primary/10 border border-primary/25 rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-primary font-bold">Your Commission ({calcSplit}%)</div>
            <div className="text-lg font-black text-primary">${calcYourComm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* Payment History (completed items only) */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-asp-green" />
          <h3 className="text-sm font-black text-foreground">Payment History</h3>
        </div>
        {allUpfrontLineItems.filter(item => item.completed).length > 0 ? (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {allUpfrontLineItems.filter(item => item.completed).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-bg3 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle className="w-3.5 h-3.5 text-asp-green shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{item.customerName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.milestone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{item.completedDate || 'Pending'}</span>
                  <span className="text-sm font-bold text-asp-green">
                    ${item.closerPay}
                  </span>
                  <span className="text-[9px] text-muted-foreground w-16 text-right">{item.expectedPay}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4 bg-bg3 rounded-lg">No payment history yet</div>
        )}
      </div>

      {/* Upfront Pay Explainer */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowUpfrontExplainer(!showUpfrontExplainer)}
          className="w-full flex items-center justify-between p-4 hover:bg-bg3/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">How Upfront Pay Works</span>
          </div>
          {showUpfrontExplainer ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showUpfrontExplainer && (
          <div className="px-4 pb-4 animate-fade-in-up">
            <p className="text-xs text-muted-foreground mb-4">
              Setters and closers both receive pay at multiple milestone points — keeping your sales team engaged from first knock to final PTO. 
              ASP upfront pay is within 24 hours of milestone completion. Install pay can take up to 1 week.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-bg3 px-3 py-2 border-b border-border">
                  <div className="text-[10px] text-asp-red font-bold tracking-wider uppercase">Appointment Setter</div>
                  <div className="text-sm font-black text-foreground">Setter Pay</div>
                </div>
                <div className="divide-y divide-border">
                  {UPFRONT_MILESTONES.map((u, i) => (
                    <div key={i} className="px-3 py-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-foreground">{u.milestone}</div>
                          <div className="text-[10px] text-muted-foreground">{u.setterNote}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-foreground">{i === 4 ? `$${u.setterPay} + %` : `$${u.setterPay}`}</div>
                          <div className={`text-[9px] font-bold ${u.setterClawback ? 'text-asp-yellow' : 'text-asp-green'}`}>
                            {u.setterClawback ? '⚠ Clawback' : '✓ Protected'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Ticket className="w-3 h-3 text-primary" />
                        <span className="text-[9px] text-primary font-bold">+{u.ticketsEarned} tickets</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-bg3 px-3 py-2 border-b border-border">
                  <div className="text-[10px] text-asp-yellow font-bold tracking-wider uppercase">Closer</div>
                  <div className="text-sm font-black text-foreground">Closer Pay</div>
                </div>
                <div className="divide-y divide-border">
                  {UPFRONT_MILESTONES.map((u, i) => (
                    <div key={i} className="px-3 py-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-foreground">{u.milestone}</div>
                          <div className="text-[10px] text-muted-foreground">{u.closerNote}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-foreground">{typeof u.closerPay === 'number' ? `$${u.closerPay}` : u.closerPay}</div>
                          <div className={`text-[9px] font-bold ${u.closerClawback ? 'text-asp-yellow' : 'text-asp-green'}`}>
                            {u.closerClawback ? '⚠ Clawback' : '✓ Protected'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Ticket className="w-3 h-3 text-primary" />
                        <span className="text-[9px] text-primary font-bold">+{u.ticketsEarned} tickets</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-foreground">Projects</h3>
        </div>
        {COMMISSIONS.length > 0 ? (
          <div className="space-y-2">
            {COMMISSIONS.map((c) => {
              const project = allProjects.find(p => p.id === c.projectId);
              const isExpanded = expandedProject === c.projectId;
              return (
                <div key={c.projectId} className="bg-bg3 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-bg4/50 transition-colors"
                    onClick={() => setExpandedProject(isExpanded ? null : c.projectId)}
                  >
                    <div>
                      <div className="text-sm font-bold text-foreground">{c.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{c.projectId} · {c.systemSize} · {c.battery}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-sm font-black ${c.yourCommission >= 0 ? 'text-asp-green' : 'text-asp-red'}`}>
                          ${c.yourCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${statusColors[c.status]}`}>{c.status}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {isExpanded && project && (
                    <div className="px-3 pb-3 border-t border-border pt-3 animate-fade-in-up space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-bg4 rounded px-2 py-1.5">
                          <div className="text-[9px] text-muted-foreground font-bold uppercase">Contract Value</div>
                          <div className="font-black text-foreground">${project.contractValue.toLocaleString()}</div>
                        </div>
                        <div className="bg-bg4 rounded px-2 py-1.5">
                          <div className="text-[9px] text-muted-foreground font-bold uppercase">System Cost</div>
                          <div className="font-black text-foreground">${project.projectCost.toLocaleString()}</div>
                        </div>
                        <div className="bg-bg4 rounded px-2 py-1.5">
                          <div className="text-[9px] text-muted-foreground font-bold uppercase">Terms</div>
                          <div className="font-black text-foreground">{project.loanTerms}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Commission Breakdown</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Sold:</span> <strong className="text-foreground">${c.soldTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                          <div><span className="text-muted-foreground">Baseline:</span> <strong className="text-foreground">${c.projectBaseline.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                          <div><span className="text-muted-foreground">Gross:</span> <strong className="text-primary">${c.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                          <div><span className="text-muted-foreground">Your Commission:</span> <strong className="text-asp-green">${c.yourCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
                          {project.setter && (
                            <div className="col-span-2"><span className="text-muted-foreground">Setter:</span> <strong className="text-foreground">{project.setter}</strong></div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Customer Checklist</div>
                        <div className="space-y-1 text-xs">
                          {[
                            { label: 'Credit Passed', done: project.checklist.creditPassed },
                            { label: 'Finance Docs Signed', done: project.checklist.financeDocsSigned },
                            { label: 'Welcome Call Completed', done: project.checklist.welcomeCallCompleted },
                            { label: 'Site Survey Done', done: project.checklist.siteSurveyDone },
                            { label: 'ASP Onboarding', done: project.checklist.aspOnboarding },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                              {item.done ? <CheckCircle className="w-3.5 h-3.5 text-asp-green" /> : <XCircle className="w-3.5 h-3.5 text-asp-red" />}
                              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Upcoming Pay</div>
                        {(() => {
                          const pendingUpfronts = c.upfronts.filter(u => !u.completed);
                          const upfrontTotal = c.upfronts
                            .filter(u => typeof u.closerPay === 'number')
                            .reduce((s, u) => s + (u.closerPay as number), 0);
                          const installPay = Math.max(0, c.yourCommission - upfrontTotal);
                          return pendingUpfronts.length > 0 ? (
                            <div className="space-y-1">
                              {pendingUpfronts.map((u, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-bg4 rounded">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{u.milestone}</span>
                                  </div>
                                  <span className="font-bold text-muted-foreground">
                                    {u.milestone === 'Install Completed'
                                      ? `$${installPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                      : `$${typeof u.closerPay === 'number' ? u.closerPay : u.closerPay}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-asp-green text-center py-2 bg-bg4 rounded">All milestones paid ✓</div>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Milestone Pay</div>
                        <div className="space-y-1">
                          {c.upfronts.filter(u => u.completed).map((u, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-bg4 rounded">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3 text-asp-green" />
                                <span className="text-foreground">{u.milestone}</span>
                              </div>
                              <span className="font-bold text-asp-green">
                                ${typeof u.closerPay === 'number' ? u.closerPay : u.closerPay}
                              </span>
                            </div>
                          ))}
                          {c.upfronts.filter(u => u.completed).length === 0 && (
                            <div className="text-[10px] text-muted-foreground text-center py-2 bg-bg4 rounded">No milestones completed yet</div>
                          )}
                        </div>
                      </div>
                      {/* Add a Setter button */}
                      {!project.setter && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSetterDialogProject({ id: c.projectId, name: c.customerName }); }}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add a Setter
                        </button>
                      )}
                      {project.setter && (
                        <div className="flex items-center gap-2 py-2 px-3 bg-bg4 rounded-lg text-xs">
                          <UserPlus className="w-3.5 h-3.5 text-primary" />
                          <span className="text-muted-foreground">Setter:</span>
                          <strong className="text-foreground">{project.setter}</strong>
                          {project.setterSplitPercent && (
                            <span className="text-muted-foreground ml-auto">{project.setterSplitPercent}% split</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4 bg-bg3 rounded-lg">No projects yet — close deals to see commissions here!</div>
        )}
      </div>

      {/* Add Setter Dialog */}
      {setterDialogProject && (
        <AddSetterDialog
          open={!!setterDialogProject}
          onOpenChange={(open) => !open && setSetterDialogProject(null)}
          projectId={setterDialogProject.id}
          customerName={setterDialogProject.name}
        />
      )}
    </div>
  );
};

export default Commissions;
