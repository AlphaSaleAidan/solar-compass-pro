import { useState } from 'react';
import { APPOINTMENTS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Plus, Star, Clock, MapPin, Phone, Mail, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Camera, FileText, MessageSquare, ArrowRight } from 'lucide-react';

interface CalendarTabProps {
  onConvertToProject?: (data: { name: string; email: string; phone: string; address: string }) => void;
}

const CalendarTab = ({ onConvertToProject }: CalendarTabProps) => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', highBill: '', lowBill: '', allElectric: 'yes', date: '', time: '' });
  const [appointments, setAppointments] = useState(isDemo ? APPOINTMENTS : []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt = {
      id: Date.now(),
      name: form.name,
      address: form.address,
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
      billOver250: Number(form.highBill) > 250,
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

  const setOutcome = (apptId: number, outcome: string) => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, outcome } : a));
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

  // Full month calendar — use current date with navigation
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const goToPrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, dateStr, appts: appointments.filter(a => a.date === dateStr) };
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground">Appointment Calendar</h2>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={goToPrevMonth} className="p-1 rounded hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-sm font-bold text-white/80 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button onClick={goToNextMonth} className="p-1 rounded hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={goToToday} className="ml-1 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 rounded hover:bg-primary/10 transition-colors">
              Today
            </button>
          </div>
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
                    <div className="bg-primary/10 border border-primary/25 rounded-lg px-3 py-2 text-center min-w-[70px]">
                      <div className="text-[10px] text-primary font-bold uppercase">{new Date(a.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-lg font-black text-primary">{new Date(a.date + 'T12:00').getDate()}</div>
                      <div className="text-[10px] text-primary font-bold">{a.time}</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{a.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" /> {a.address}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
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
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < starCount ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
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
                            onClick={(e) => { e.stopPropagation(); setOutcome(a.id, o); }}
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
                      <select className="w-full px-2 py-1.5 bg-bg4 border border-border rounded-md text-xs text-foreground outline-none focus:border-primary">
                        <option value="">Select closer...</option>
                        <option value="jordan">Jordan Mills</option>
                        <option value="sam">Samantha Cole</option>
                        <option value="caitlin">Caitlin Fox</option>
                      </select>
                    </div>
                  </div>

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

                  {/* Notes input */}
                  <textarea
                    placeholder="Add notes about this appointment..."
                    className="w-full px-3 py-2 bg-bg3 border border-border rounded-md text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none h-16"
                  />

                  {/* Convert to Project button */}
                  {!a.outcome && onConvertToProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onConvertToProject({ name: a.name, email: a.email, phone: a.phone, address: a.address });
                      }}
                      className="w-full py-2.5 bg-primary/10 border border-primary/25 rounded-lg text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Convert to Project
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Month Calendar View */}
      <div className="bg-bg2 border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-foreground">March 2026 Calendar</h3>
        </div>
        
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-[10px] text-muted-foreground font-bold text-center py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 bg-bg3/30 rounded-md" />
          ))}
          
          {monthDays.map(({ day, dateStr, appts: dayAppts }) => {
            const isToday = dateStr === '2026-03-28';
            return (
              <div
                key={day}
                className={`h-20 rounded-md p-1 overflow-hidden ${
                  isToday ? 'bg-primary/10 border border-primary/30' : 'bg-bg3/50 border border-transparent'
                }`}
              >
                <div className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map(a => {
                    const dotColor = a.outcome === 'closed' ? 'bg-asp-green'
                      : a.outcome === 'no_close' ? 'bg-asp-blue'
                      : a.outcome === 'credit_fail' || a.outcome === 'no_sit' ? 'bg-asp-red'
                      : 'bg-muted-foreground';
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-1 cursor-pointer hover:opacity-70"
                        onClick={() => setExpandedAppt(expandedAppt === a.id ? null : a.id)}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <span className="text-[8px] text-foreground truncate font-bold">{a.time}</span>
                      </div>
                    );
                  })}
                  {dayAppts.length > 2 && (
                    <div className="text-[7px] text-muted-foreground font-bold">+{dayAppts.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          {[
            { color: 'bg-asp-green', label: 'Closed' },
            { color: 'bg-asp-blue', label: 'No Close' },
            { color: 'bg-asp-red', label: 'Credit Fail / No Sit' },
            { color: 'bg-muted-foreground', label: 'Open' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-[9px] text-muted-foreground font-bold">{l.label}</span>
            </div>
          ))}
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
