import { useState } from 'react';
import { COMMISSIONS, UPFRONT_MILESTONES } from '@/data/mockData';
import { DollarSign, Clock, Calculator, Ticket, ChevronDown, ChevronUp, Info, CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react';

const Commissions = () => {
  const [calcSize, setCalcSize] = useState('10');
  const [calcPPW, setCalcPPW] = useState('4.25');
  const [calcRedline, setCalcRedline] = useState('2.35');
  const [calcAdders, setCalcAdders] = useState('8500');
  const [calcSplit, setCalcSplit] = useState('60');
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpfrontExplainer, setShowUpfrontExplainer] = useState(false);
  const [expandedComm, setExpandedComm] = useState<string | null>(null);

  const calcSystemCost = parseFloat(calcSize) * 1000 * parseFloat(calcRedline);
  const calcSoldTotal = parseFloat(calcSize) * 1000 * parseFloat(calcPPW);
  const calcCommission = calcSoldTotal - calcSystemCost - parseFloat(calcAdders);
  const calcYourComm = calcCommission * (parseFloat(calcSplit) / 100);

  const totalPending = COMMISSIONS.filter((c) => c.status === 'pending').reduce((s, c) => s + c.yourCommission, 0);
  const totalPaid = COMMISSIONS.filter((c) => c.status === 'paid').reduce((s, c) => s + c.yourCommission, 0);

  // Monthly vs yearly
  const displayPending = timePeriod === 'yearly' ? totalPending * 12 : totalPending;
  const displayPaid = timePeriod === 'yearly' ? totalPaid * 12 : totalPaid;

  const statusColors: Record<string, string> = {
    paid: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    pending: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    processing: 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
  };

  // Calculate total upfront pay across all deals
  const totalUpfronts = COMMISSIONS.reduce((total, c) => {
    return total + c.upfronts.filter(u => u.completed).reduce((s, u) => s + (typeof u.closerPay === 'number' ? u.closerPay : 0), 0);
  }, 0);
  const pendingUpfronts = COMMISSIONS.reduce((total, c) => {
    return total + c.upfronts.filter(u => !u.completed).reduce((s, u) => s + (typeof u.closerPay === 'number' ? u.closerPay : 0), 0);
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
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

      {/* Incoming Upfront Pay */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-asp-green" />
            <h3 className="text-sm font-black text-foreground">Incoming Upfront Pay</h3>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground font-bold uppercase">Earned</div>
              <div className="text-sm font-black text-asp-green">${totalUpfronts}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground font-bold uppercase">Pending</div>
              <div className="text-sm font-black text-asp-yellow">${pendingUpfronts}</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {COMMISSIONS.slice(0, 4).map((c) => (
            <div key={c.projectId} className="bg-bg3 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedComm(expandedComm === c.projectId ? null : c.projectId)}
              >
                <div>
                  <div className="text-sm font-bold text-foreground">{c.customerName}</div>
                  <div className="text-[10px] text-muted-foreground">{c.projectId} · {c.battery}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-black text-asp-green">${c.yourCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-[9px] text-muted-foreground">Total Commission</div>
                  </div>
                  {expandedComm === c.projectId ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              {expandedComm === c.projectId && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {c.upfronts.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        {u.completed ? <CheckCircle className="w-3.5 h-3.5 text-asp-green" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className={u.completed ? 'text-foreground' : 'text-muted-foreground'}>{u.milestone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{u.completedDate || 'Pending'}</span>
                        <span className={`font-bold ${u.completed ? 'text-asp-green' : 'text-muted-foreground'}`}>
                          ${typeof u.closerPay === 'number' ? u.closerPay : u.closerPay}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{u.expectedPay}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
              {/* Setter Pay */}
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
                          <div className="text-sm font-black text-foreground">
                            {i === 4 ? `$${u.setterPay} + %` : `$${u.setterPay}`}
                          </div>
                          <div className={`text-[9px] font-bold ${u.setterClawback ? 'text-asp-yellow' : 'text-asp-green'}`}>
                            {u.setterClawback ? '⚠ Clawback on cancel' : '✓ No Clawback'}
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
                <div className="bg-bg3 px-3 py-2 border-t border-border">
                  <div className="text-[10px] text-muted-foreground">Total Per Deal</div>
                  <div className="text-sm font-black text-foreground">$700 + %</div>
                  <div className="text-[9px] text-muted-foreground">$350 protected / $175 clawback eligible + backend %</div>
                </div>
              </div>

              {/* Closer Pay */}
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
                          <div className="text-sm font-black text-foreground">
                            {typeof u.closerPay === 'number' ? `$${u.closerPay}` : u.closerPay}
                          </div>
                          <div className={`text-[9px] font-bold ${u.closerClawback ? 'text-asp-yellow' : 'text-asp-green'}`}>
                            {u.closerClawback ? '⚠ Clawback on cancel' : '✓ No Clawback'}
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
                <div className="bg-bg3 px-3 py-2 border-t border-border">
                  <div className="text-[10px] text-muted-foreground">Total Upfront + Bonus</div>
                  <div className="text-sm font-black text-foreground">$350 + %</div>
                  <div className="text-[9px] text-muted-foreground">$175 protected / $125 clawback eligible</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission List */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg3">
              {['Project', 'System', 'Battery', 'Sold PPW', 'Adders', 'Commission', 'Your Split', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground font-extrabold tracking-[1.5px] uppercase border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMISSIONS.map((c) => (
              <tr key={c.projectId} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 border-b border-border">
                  <div className="font-bold text-sm text-foreground">{c.customerName}</div>
                  <div className="text-[10px] text-muted-foreground">{c.projectId}</div>
                </td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{c.systemSize}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{c.battery}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">${c.soldPPW}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">${c.adderCost.toLocaleString()}</td>
                <td className="px-4 py-3 border-b border-border text-sm font-bold text-primary">${c.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 border-b border-border text-sm font-bold text-foreground">${c.yourCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 border-b border-border">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase border ${statusColors[c.status]}`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Commissions;
