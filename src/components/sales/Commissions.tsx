import { useState } from 'react';
import { COMMISSIONS } from '@/data/mockData';

const Commissions = () => {
  const [calcSize, setCalcSize] = useState('10');
  const [calcPPW, setCalcPPW] = useState('3.85');
  const [calcRedline, setCalcRedline] = useState('2.35');
  const [calcAdders, setCalcAdders] = useState('8500');
  const [calcSplit, setCalcSplit] = useState('60');

  const calcSystemCost = parseFloat(calcSize) * 1000 * parseFloat(calcRedline);
  const calcSoldTotal = parseFloat(calcSize) * 1000 * parseFloat(calcPPW);
  const calcCommission = calcSoldTotal - calcSystemCost - parseFloat(calcAdders);
  const calcYourComm = calcCommission * (parseFloat(calcSplit) / 100);

  const totalPending = COMMISSIONS.filter((c) => c.status === 'pending').reduce((s, c) => s + c.yourCommission, 0);
  const totalPaid = COMMISSIONS.filter((c) => c.status === 'paid').reduce((s, c) => s + c.yourCommission, 0);

  const statusColors: Record<string, string> = {
    paid: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    pending: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    processing: 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">💰 Total Paid</div>
          <div className="text-2xl font-black text-asp-green">${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">⏳ Pending Pay</div>
          <div className="text-2xl font-black text-asp-yellow">${totalPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">📅 Next Pay Date</div>
          <div className="text-2xl font-black text-white">Apr 15</div>
        </div>
      </div>

      {/* Redline notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-xs text-primary font-bold">
        📌 Current Redline: <span className="text-lg font-black">$2.35/W</span> · Formula: (Sold PPW − Redline) × Watts − Adders × Split% = Your Commission
      </div>

      {/* Commission Calculator */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <h3 className="text-sm font-black text-white mb-4">🧮 Commission Calculator</h3>
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

      {/* Commission List */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg3">
              {['Project', 'System', 'Sold PPW', 'Redline', 'Adders', 'Commission', 'Your Split', 'Status', 'Pay Date'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground font-extrabold tracking-[1.5px] uppercase border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMISSIONS.map((c) => (
              <tr key={c.projectId} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 border-b border-border">
                  <div className="font-bold text-sm text-white">{c.customerName}</div>
                  <div className="text-[10px] text-muted-foreground">{c.projectId}</div>
                </td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{c.systemSize}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">${c.soldPPW}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-asp-yellow font-bold">${c.redline}</td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">${c.adderCost.toLocaleString()}</td>
                <td className="px-4 py-3 border-b border-border text-sm font-bold text-primary">${c.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 border-b border-border text-sm font-bold text-white">${c.yourCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-4 py-3 border-b border-border">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase border ${statusColors[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{c.expectedPayDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Commissions;
