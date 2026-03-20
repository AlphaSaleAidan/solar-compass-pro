import { useState } from 'react';
import { APPOINTMENTS } from '@/data/mockData';

const CalendarTab = () => {
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNewAppt(false);
    setForm({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  };

  const getStarDisplay = (appt: typeof APPOINTMENTS[0]) => {
    const checks = [appt.gotBill, appt.gotContact, appt.bothHomeowners, appt.meterPhoto, appt.billOver250];
    const score = checks.filter(Boolean).length;
    return { score, stars: '⭐'.repeat(score) };
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">📅 Appointment Calendar</h2>
        <button
          onClick={() => setShowNewAppt(!showNewAppt)}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-lg hover:-translate-y-px transition-all"
        >
          + New Appointment
        </button>
      </div>

      {/* New Appointment Form */}
      {showNewAppt && (
        <div className="bg-bg2 border border-primary/30 rounded-xl p-5 animate-scale-in">
          <h3 className="text-sm font-black text-white mb-4">📋 Set New Appointment</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Name', key: 'name', placeholder: 'Customer name' },
                { label: 'Address', key: 'address', placeholder: 'Full address' },
                { label: 'Phone', key: 'phone', placeholder: '(xxx) xxx-xxxx' },
                { label: 'Email', key: 'email', placeholder: 'email@example.com' },
                { label: 'High Bill ($)', key: 'highBill', placeholder: 'e.g. 350' },
                { label: 'Low Bill ($)', key: 'lowBill', placeholder: 'e.g. 120' },
                { label: 'Date', key: 'date', placeholder: 'YYYY-MM-DD' },
                { label: 'Time', key: 'time', placeholder: 'e.g. 2:00 PM' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mb-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="radio" name="elec" checked={form.allElectric === 'yes'} onChange={() => setForm({ ...form, allElectric: 'yes' })} className="accent-teal" />
                All Electric
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="radio" name="elec" checked={form.allElectric === 'no'} onChange={() => setForm({ ...form, allElectric: 'no' })} className="accent-teal" />
                Gas + Electric
              </label>
            </div>
            <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-extrabold rounded-lg hover:-translate-y-px transition-all">
              Submit Appointment →
            </button>
          </form>
        </div>
      )}

      {/* Appointment List */}
      <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-bg3">
              {['Date/Time', 'Customer', 'Location', 'Bills', 'Rating', 'Setter', 'Closer', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground font-extrabold tracking-[1.5px] uppercase border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {APPOINTMENTS.map((a) => {
              const { score, stars } = getStarDisplay(a);
              return (
                <tr key={a.id} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-bold text-primary">{a.date}</div>
                    <div className="text-[11px] text-muted-foreground">{a.time}</div>
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-bold text-white">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 border-b border-border text-xs text-muted-foreground">{a.address}</td>
                  <td className="px-4 py-3 border-b border-border">
                    <div className="text-xs"><span className="text-asp-red font-bold">${a.highBill}</span> / <span className="text-asp-green font-bold">${a.lowBill}</span></div>
                    <div className="text-[10px] text-muted-foreground">{a.allElectric ? 'All Electric' : 'Gas + Electric'}</div>
                  </td>
                  <td className="px-4 py-3 border-b border-border">
                    <div className="text-sm">{stars}</div>
                    <div className="text-[10px] text-muted-foreground">{score}/5 criteria</div>
                  </td>
                  <td className="px-4 py-3 border-b border-border text-xs text-muted-foreground">{a.setter}</td>
                  <td className="px-4 py-3 border-b border-border text-xs text-muted-foreground">{a.closer || '—'}</td>
                  <td className="px-4 py-3 border-b border-border">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      a.status === 'assigned' ? 'bg-asp-green/15 text-asp-green border-asp-green/30' : 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Auto-Rating Criteria */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-2">⭐ Auto-Rating Criteria (5 Star Set)</h4>
        <div className="grid grid-cols-5 gap-2">
          {['1. Got the bill', '2. All contact info', '3. Both homeowners', '4. Meter photo', '5. Bill over $250'].map((c) => (
            <div key={c} className="bg-bg3 rounded-md px-3 py-2 text-[11px] text-muted-foreground">{c}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;
