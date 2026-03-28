import { useState } from 'react';
import { APPOINTMENTS } from '@/data/mockData';
import { Calendar, Plus, Star, MapPin, Phone, Mail, ChevronDown, ChevronUp, Camera, FileText, MessageSquare, ArrowRight } from 'lucide-react';

interface CalendarTabProps {
  onConvertToProject?: (appt: typeof APPOINTMENTS[0]) => void;
}

const CalendarTab = ({ onConvertToProject }: CalendarTabProps) => {
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: 2026, month: 2 }; // March 2026 (0-indexed)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt = {
      id: Date.now(),
      name: form.name,
      address: form.address || 'TBD',
      phone: form.phone,
      email: form.email,
      date: form.date,
      time: form.time,
      highBill: Number(form.highBill) || 0,
      lowBill: Number(form.lowBill) || 0,
      allElectric: form.allElectric === 'yes',
      stars: 0,
      setter: 'You',
      closer: null as string | null,
      status: 'open',
      gotBill: false,
      gotContact: !!(form.phone && form.email),
      bothHomeowners: false,
      meterPhoto: false,
      billOver250: (Number(form.highBill) || 0) > 250,
      outcome: null as string | null,
      closerNotes: '',
      billPhoto: null as string | null,
      meterPhotoUrl: null as string | null,
      surveyPhotos: [] as string[],
    };
    setAppointments(prev => [newAppt, ...prev]);
    setShowNewAppt(false);
    setForm({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  };

  const getStarCount = (appt: typeof APPOINTMENTS[0]) => {
    return [appt.gotBill, appt.gotContact, appt.bothHomeowners, appt.meterPhoto, appt.billOver250].filter(Boolean).length;
  };

  const handleDisposition = (apptId: number, outcome: string) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, outcome } : a));
  };

  const handleAssignCloser = (apptId: number, closer: string) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, closer, status: closer ? 'assigned' : a.status } : a));
  };

  const outcomeColors: Record<string, string> = {
    closed: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    credit_fail: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    no_close: 'bg-asp-blue/15 text-asp-blue border-asp-blue/30',
    no_sit: 'bg-asp-red/15 text-asp-red border-asp-red/30',
  };

  const outcomeLabels: Record<string, string> = {
    closed: 'Closed',
    credit_fail: 'Credit Fail',
    no_close: 'No Close',
    no_sit: 'No Sit',
  };

  // Full month calendar logic
  const { year, month } = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) calendarCells.push(null);
  for (let d = 1; d <= totalDays; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const getApptsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.date === dateStr);
  };

  const prevMonth = () => setCalendarMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 });
  const nextMonth = () => setCalendarMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 });

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground">Appointment Calendar</h2>
        </div>
        <button
          onClick={() => setShowNewAppt(!showNewAppt)}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-lg hover:-translate-y-px transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Appointment
        </button>
      </div>

      {/* New Appointment Form */}
      {showNewAppt && (
        <div className="bg-bg2 border border-primary/30 rounded-xl p-5 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">Set New Appointment</h3>
          </div>
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

      {/* Appointment Cards */}
      <div className="space-y-3">
        {appointments.map((a) => {
          const starCount = getStarCount(a);
          const isExpanded = expandedAppt === a.id;
          return (
            <div key={a.id} className="bg-bg2 border border-border rounded-xl overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-bg3/30 transition-colors"
                onClick={() => setExpandedAppt(isExpanded ? null : a.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Date/Time Badge */}
                    <div className="bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/25 rounded-xl px-3 py-2.5 text-center min-w-[74px]">
                      <div className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">{new Date(a.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-2xl font-black text-primary leading-none my-0.5">{new Date(a.date + 'T12:00').getDate()}</div>
                      <div className="text-[10px] text-primary font-bold">{a.time}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{a.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" /> {a.address}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mail className="w-3 h-3" /> {a.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs">
                          <span className="text-asp-red font-bold">${a.highBill}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-asp-green font-bold">${a.lowBill}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground px-1.5 py-0.5 bg-bg3 rounded">{a.allElectric ? 'All Electric' : 'Gas + Electric'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < starCount ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                    {/* Status/Outcome */}
                    {a.outcome ? (
                      <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${outcomeColors[a.outcome]}`}>
                        {outcomeLabels[a.outcome]}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${
                        a.status === 'assigned' ? 'bg-asp-green/15 text-asp-green border-asp-green/30' : 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30'
                      }`}>
                        {a.status}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <div>Set: <span className="text-foreground font-bold">{a.setter}</span></div>
                      <div>Close: <span className="text-foreground font-bold">{a.closer || '—'}</span></div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in-up space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Photos Section */}
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Attachments</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Bill Photo: {a.billPhoto ? <span className="text-asp-green">Uploaded</span> : <span className="text-asp-red">Missing</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Meter Photo: {a.meterPhoto ? <span className="text-asp-green">Captured</span> : <span className="text-asp-red">Missing</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Survey Photos: {a.surveyPhotos.length > 0 ? <span className="text-asp-green">{a.surveyPhotos.length} uploaded</span> : <span className="text-muted-foreground">None</span>}</span>
                        </div>
                      </div>
                    </div>

                    {/* Disposition */}
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Disposition</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['closed', 'no_close', 'credit_fail', 'no_sit'].map(o => (
                          <button
                            key={o}
                            onClick={(e) => { e.stopPropagation(); handleDisposition(a.id, o); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                              a.outcome === o ? outcomeColors[o] : 'bg-bg4 border-border text-muted-foreground hover:border-border2'
                            }`}
                          >
                            {outcomeLabels[o]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assign Closer */}
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-2">Assign Closer</div>
                      <select
                        value={a.closer || ''}
                        onChange={(e) => handleAssignCloser(a.id, e.target.value)}
                        className="w-full px-2 py-1.5 bg-bg4 border border-border rounded-md text-xs text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Select closer...</option>
                        <option value="Jordan Mills">Jordan Mills</option>
                        <option value="Samantha Cole">Samantha Cole</option>
                        <option value="Caitlin Fox">Caitlin Fox</option>
                      </select>
                    </div>
                  </div>

                  {/* Convert to Project Button */}
                  {onConvertToProject && !a.outcome && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onConvertToProject(a); }}
                      className="w-full py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Convert to Project
                    </button>
                  )}

                  {/* Notes */}
                  {a.closerNotes && (
                    <div className="bg-bg3 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Closer Notes</div>
                      </div>
                      <p className="text-xs text-foreground">{a.closerNotes}</p>
                    </div>
                  )}

                  <div>
                    <textarea
                      placeholder="Add notes about this appointment..."
                      className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none h-16"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Month Calendar View */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">Calendar Overview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="px-2 py-1 bg-bg3 rounded text-xs text-muted-foreground hover:text-foreground transition-colors">←</button>
            <span className="text-sm font-bold text-foreground min-w-[140px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="px-2 py-1 bg-bg3 rounded text-xs text-muted-foreground hover:text-foreground transition-colors">→</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-asp-green" /> <span className="text-muted-foreground">Closed</span></div>
          <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-asp-blue" /> <span className="text-muted-foreground">No Close</span></div>
          <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-asp-red" /> <span className="text-muted-foreground">Credit Fail / No Sit</span></div>
          <div className="flex items-center gap-1.5 text-[10px]"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> <span className="text-muted-foreground">Upcoming</span></div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[10px] font-bold text-muted-foreground text-center py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, idx) => {
            if (day === null) return <div key={idx} className="min-h-[60px] bg-bg3/30 rounded" />;
            const dayAppts = getApptsForDay(day);
            const today = new Date();
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <div key={idx} className={`min-h-[60px] bg-bg3/50 rounded p-1 ${isToday ? 'ring-1 ring-primary' : ''}`}>
                <div className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayAppts.map(a => {
                    const dotColor = a.outcome === 'closed' ? 'bg-asp-green'
                      : a.outcome === 'no_close' ? 'bg-asp-blue'
                      : a.outcome === 'credit_fail' || a.outcome === 'no_sit' ? 'bg-asp-red'
                      : 'bg-primary';
                    return (
                      <div
                        key={a.id}
                        onClick={() => setExpandedAppt(expandedAppt === a.id ? null : a.id)}
                        className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        title={`${a.time} · ${a.name}${a.outcome ? ` — ${outcomeLabels[a.outcome]}` : ''}${a.closerNotes ? `\nNotes: ${a.closerNotes}` : ''}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                        <span className="text-[9px] text-foreground/70 truncate">{a.time.replace(' PM', 'p').replace(' AM', 'a')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-Rating Criteria */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-4 h-4 text-asp-yellow" />
          <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Auto-Rating Criteria (5 Star Set)</h4>
        </div>
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
